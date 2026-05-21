import { Router, Request, Response } from 'express';
import { generateAuthToken, generateUserId } from '../services/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getRedis } from '../services/redis';

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

// Send verification code via Twilio
router.post('/verify/send', async (req: Request, res: Response): Promise<void> => {
  let phone = '';
  try {
    phone = (req.body.phone || '').trim();
    if (!phone) {
      res.status(400).json({ error: 'Phone number required' });
      return;
    }

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
    const phone = (req.body.phone || '').trim();
    const code = (req.body.code || '').trim();
    if (!phone || !code) {
      res.status(400).json({ error: 'Phone and code required' });
      return;
    }

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
    const redis = getRedis();
    let userId = await redis.get(`phone:${phone}`);
    const isNewUser = !userId;

    if (!userId) {
      userId = generateUserId();
      await redis.set(`phone:${phone}`, userId);
      await redis.hset('locus:users', userId, JSON.stringify({
        id: userId,
        phone,
        displayName: `User_${userId.slice(0, 6)}`,
        privacyMode: 'open',
        points: 0,
        premium: false,
        pins: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }));
    }

    const token = generateAuthToken(userId!, phone);
    res.json({
      token,
      userId,
      isNewUser,
    });
  } catch (error: any) {
    console.error('[Auth] Verify error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = getRedis();
    const userData = await r.hget('locus:users', req.userId!);
    if (!userData) {
      res.status(404).json({ error: 'User not found' });
      return;
    }
    res.json(JSON.parse(userData));
  } catch (error: any) {
    console.error('[Auth] Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

// Update display name
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = getRedis();
    const userData = await r.hget('locus:users', req.userId!);
    if (!userData) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const user = JSON.parse(userData);

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
      const existingId = await r.get(`locus:username:${newName.toLowerCase()}`);
      if (existingId && existingId !== req.userId!) {
        res.status(409).json({ error: 'Username already taken' });
        return;
      }
      if (user.displayName) {
        await r.del(`locus:username:${user.displayName.toLowerCase()}`);
      }
      await r.set(`locus:username:${newName.toLowerCase()}`, req.userId!);
      user.displayName = newName;
    }

    const allowedFields = ['avatar', 'vehicleTag', 'privacyMode'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        user[field] = req.body[field];
      }
    }
    user.updatedAt = new Date().toISOString();

    await r.hset('locus:users', req.userId!, JSON.stringify(user));
    res.json(user);
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
    const r = getRedis();
    const existing = await r.get(`locus:username:${username.trim().toLowerCase()}`);
    res.json({ available: !existing });
  } catch (error: any) {
    console.error('[Auth] Check username error:', error);
    res.status(500).json({ available: false, reason: 'Server error' });
  }
});

// Get convoy by invite code
router.get('/convoy/:inviteCode', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const r = getRedis();
    const convoyIds = await r.hkeys('locus:convoys');
    for (const id of convoyIds) {
      const convoyData = await r.hget('locus:convoys', id);
      if (convoyData) {
        const convoy = JSON.parse(convoyData);
        if (convoy.inviteCode === req.params.inviteCode) {
          res.json({ id: convoy.id, name: convoy.name, memberCount: convoy.members.length });
          return;
        }
      }
    }
    res.status(404).json({ error: 'Convoy not found' });
  } catch (error: any) {
    console.error('[Auth] Get convoy error:', error);
    res.status(500).json({ error: 'Failed to get convoy' });
  }
});

export default router;
