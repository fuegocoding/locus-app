import { Router, Request, Response } from 'express';
import { generateAuthToken, generateUserId } from '../services/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getRedis } from '../services/redis';
import { prisma } from '../services/db';
import { getSocketIdByUserId } from '../socket';

const router = Router();

const isProd = process.env.NODE_ENV === 'production';

// Get Twilio client in production
function getTwilioClient() {
  if (!process.env.TWILIO_ACCOUNT_SID || !process.env.TWILIO_AUTH_TOKEN) {
    throw new Error('Twilio credentials not configured');
  }
  const twilio = require('twilio');
  return twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
}

function normalizePhoneNumber(phone: string): string {
  let cleaned = phone.trim().replace(/(?!^\+)\D/g, '');
  if (!cleaned.startsWith('+')) {
    if (cleaned.length === 10) {
      cleaned = '+1' + cleaned;
    } else {
      cleaned = '+' + cleaned;
    }
  }
  return cleaned;
}

// Send verification code via Twilio
router.post('/verify/send', async (req: Request, res: Response): Promise<void> => {
  let phone = '';
  try {
    const rawPhone = (req.body.phone || '').trim();
    if (!rawPhone) {
      res.status(400).json({ error: 'Phone number required' });
      return;
    }
    phone = normalizePhoneNumber(rawPhone);

    if (!isProd) {
      // Development mode: accept any phone, use fixed code
      const r = getRedis();
      await r.set(`verify:${phone}`, '123456', 'EX', 300);
      console.log(`[Auth] Dev mode: verification code for ${phone} is 123456`);
      res.json({ success: true, message: 'Verification code sent (dev mode: use 123456)' });
      return;
    }

    // Production: use Twilio Verify
    const client = getTwilioClient();
    const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
    if (!serviceSid) {
      res.status(500).json({ error: 'Twilio Verify service not configured' });
      return;
    }

    await client.verify.v2.services(serviceSid)
      .verifications
      .create({ to: phone, channel: 'sms' });

    res.json({ success: true, message: 'Verification code sent' });
  } catch (error: any) {
    console.error('[Auth] Send verification error:', error);
    // Fallback to dev mode if Twilio fails
    try {
      const r = getRedis();
      await r.set(`verify:${phone}`, '123456', 'EX', 300);
      console.log(`[Auth] Fallback: verification code for ${phone} is 123456`);
      res.json({ success: true, message: 'Verification code sent (fallback: use 123456)' });
    } catch (fallbackError) {
      console.error('[Auth] Fallback also failed:', fallbackError);
      res.status(500).json({ error: 'Failed to send verification code' });
    }
  }
});

// Verify code and return auth token
router.post('/verify/check', async (req: Request, res: Response): Promise<void> => {
  try {
    const rawPhone = (req.body.phone || '').trim();
    const code = (req.body.code || '').trim();
    const referralUsername = (req.body.referralUsername || '').trim();
    if (!rawPhone || !code) {
      res.status(400).json({ error: 'Phone and code required' });
      return;
    }
    const phone = normalizePhoneNumber(rawPhone);

    // First check Redis (handles dev mode and Twilio fallback)
    const redisCheck = getRedis();
    const storedCode = await redisCheck.get(`verify:${phone}`);
    if (storedCode === code) {
      await redisCheck.del(`verify:${phone}`);
    } else if (!isProd) {
      // Dev mode: no valid Redis code
      res.status(400).json({ error: 'Invalid code' });
      return;
    } else {
      // Production: try Twilio Verify
      try {
        const client = getTwilioClient();
        const serviceSid = process.env.TWILIO_VERIFY_SERVICE_SID;
        if (serviceSid) {
          const verificationCheck = await client.verify.v2.services(serviceSid)
            .verificationChecks
            .create({ to: phone, code });
          if (verificationCheck.status !== 'approved') {
            res.status(400).json({ error: 'Invalid verification code' });
            return;
          }
        } else {
          res.status(400).json({ error: 'Invalid code' });
          return;
        }
      } catch (twilioError) {
        console.error('[Auth] Twilio verification failed:', twilioError);
        res.status(400).json({ error: 'Invalid verification code' });
        return;
      }
    }

    // Check if user exists, otherwise create
    let user = await prisma.user.findUnique({
      where: { phone }
    });
    const isNewUser = !user;

    if (!user) {
      const generatedId = generateUserId();
      user = await prisma.user.create({
        data: {
          id: generatedId,
          phone,
          displayName: `User_${generatedId.slice(0, 6)}`,
          privacyMode: 'open',
          points: 0,
          premium: false,
        }
      });
    }
    const userId = user.id;

    // Handle referral tracking for new users
    let referredBy: string | null = null;
    if (isNewUser && referralUsername) {
      try {
        const referrer = await prisma.user.findFirst({
          where: {
            displayName: {
              equals: referralUsername,
              mode: 'insensitive'
            }
          }
        });
        if (referrer && referrer.id !== userId) {
          const existingReferral = await prisma.referral.findUnique({
            where: { refereeId: userId }
          });
          if (!existingReferral) {
            await prisma.referral.create({
              data: {
                referrerId: referrer.id,
                refereeId: userId,
              }
            });
            referredBy = referrer.displayName;
            console.log(`[Referral] ${userId} was referred by ${referrer.displayName}`);
          }
        }
      } catch (err) {
        console.error('[Referral] Failed to create referral:', err);
      }
    }

    const token = generateAuthToken(userId!, phone);
    res.json({
      token,
      userId,
      isNewUser,
      ...(referredBy ? { referredBy } : {}),
    });
  } catch (error: any) {
    console.error('[Auth] Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        pins: true,
      }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json({
      ...user,
      pins: user.pins.map(p => p.targetUserId),
    });
  } catch (error: any) {
    console.error('[Auth] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update display name
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { pins: true }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const dataToUpdate: any = {};

    if (req.body.displayName) {
      const newName = req.body.displayName.trim();
      if (newName.length < 2 || newName.length > 30) {
        res.status(400).json({ error: 'Display name must be 2-30 characters' });
        return;
      }
      // Only alphanumeric and underscores
      if (!/^[a-zA-Z0-9_]+$/.test(newName)) {
        res.status(400).json({ error: 'Display name can only contain letters, numbers, and underscores' });
        return;
      }
      const existingUser = await prisma.user.findFirst({
        where: {
          displayName: {
            equals: newName,
            mode: 'insensitive'
          }
        }
      });
      if (existingUser && existingUser.id !== req.userId!) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      dataToUpdate.displayName = newName;
    }

    const allowedFields = ['avatar', 'vehicleTag', 'privacyMode', 'anonymousMode'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        dataToUpdate[field] = req.body[field];
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.userId! },
      data: dataToUpdate,
      include: { pins: true }
    });

    // Update in-memory socket details
    try {
      const { updateConnectedUserDetails } = require('../socket');
      updateConnectedUserDetails(
        updatedUser.id,
        updatedUser.displayName,
        updatedUser.anonymousMode
      );
    } catch (err) {
      // Non-critical socket sync fail
    }

    res.json({
      ...updatedUser,
      pins: updatedUser.pins.map(p => p.targetUserId),
    });
  } catch (error: any) {
    console.error('[Auth] Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Check username availability
router.post('/check-username', async (req: Request, res: Response): Promise<void> => {
  try {
    const { username } = req.body;
    if (!username || username.trim().length < 2) {
      res.json({ available: false, reason: 'Username must be at least 2 characters' });
      return;
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username.trim())) {
      res.json({ available: false, reason: 'Username can only contain letters, numbers, and underscores' });
      return;
    }
    const existing = await prisma.user.findFirst({
      where: {
        displayName: {
          equals: username.trim(),
          mode: 'insensitive'
        }
      }
    });
    res.json({ available: !existing });
  } catch (error: any) {
    console.error('[Auth] Check username error:', error);
    res.status(500).json({ available: false, reason: 'Server error' });
  }
});

// Get convoy by invite code
router.get('/convoy/:inviteCode', async (req: Request, res: Response): Promise<void> => {
  try {
    const convoy = await prisma.convoy.findUnique({
      where: { inviteCode: req.params.inviteCode },
      include: {
        memberships: true
      }
    });
    if (!convoy) {
      res.status(404).json({ error: 'Convoy not found' });
      return;
    }
    res.json({ id: convoy.id, name: convoy.name, memberCount: convoy.memberships.length });
  } catch (error: any) {
    console.error('[Auth] Get convoy error:', error);
    res.status(500).json({ error: 'Failed to get convoy' });
  }
});

// Get public profile by username
router.get('/user/public/:username', async (req: Request, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findFirst({
      where: {
        displayName: {
          equals: req.params.username,
          mode: 'insensitive'
        }
      },
      select: {
        id: true,
        displayName: true,
        points: true,
        premium: true,
        createdAt: true
      }
    });
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(user);
  } catch (error: any) {
    console.error('[Auth] Get public user error:', error);
    res.status(500).json({ error: 'Failed to get user' });
  }
});


// Delete user account
router.delete('/account', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId!;

    // Delete convoys the user created (no cascade on Convoy.creatorId)
    await prisma.convoy.deleteMany({ where: { creatorId: userId } });

    // Delete user — cascade handles Follow, DeviceToken, Pin, Block,
    // ConvoyMembership, ConvoyInvite, TaskCompletion
    await prisma.user.delete({ where: { id: userId } });

    // Remove Redis presence data
    const r = getRedis();
    await r.del(`presence:${userId}`);

    // Force-disconnect any live socket
    const io = req.app.get('io') as any;
    const socketId = getSocketIdByUserId(userId);
    if (socketId) {
      io.to(socketId).emit('account:deleted');
      const sock = io.sockets.sockets.get(socketId);
      if (sock) sock.disconnect(true);
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Auth] Delete account error:', error);
    res.status(500).json({ error: 'Failed to delete account' });
  }
});

export default router;
