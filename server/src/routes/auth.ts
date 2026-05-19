import { Router, Request, Response } from 'express';
import { generateAuthToken, generateUserId } from '../services/auth';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getRedis } from '../services/redis';

const router = Router();

// Send verification code via Twilio
router.post('/verify/send', async (req: Request, res: Response): Promise<void> => {
  const { phone } = req.body;
  if (!phone) {
    res.status(400).json({ error: 'Phone number required' });
    return;
  }

  // In development, accept any code
  if (process.env.NODE_ENV === 'development') {
    const r = getRedis();
    await r.set(`verify:${phone}`, '123456', 'EX', 300);
    res.json({ success: true, message: 'Verification code sent (dev mode)' });
    return;
  }

  // TODO: Integrate Twilio Verify
  // const client = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  // await client.verify.v2.services(process.env.TWILIO_VERIFY_SERVICE_SID)
  //   .verifications.create({ to: phone, channel: 'sms' });

  res.json({ success: true });
});

// Verify code and return auth token
router.post('/verify/check', async (req: Request, res: Response): Promise<void> => {
  const { phone, code } = req.body;
  if (!phone || !code) {
    res.status(400).json({ error: 'Phone and code required' });
    return;
  }

  if (process.env.NODE_ENV === 'development') {
    const r = getRedis();
    const storedCode = await r.get(`verify:${phone}`);
    if (storedCode !== code) {
      res.status(400).json({ error: 'Invalid code' });
      return;
    }
    await r.del(`verify:${phone}`);
  }

  // Check if user exists, otherwise create
  const r = getRedis();
  let userId = await r.get(`phone:${phone}`);
  if (!userId) {
    userId = generateUserId();
    await r.set(`phone:${phone}`, userId);
    await r.hset('locus:users', userId, JSON.stringify({
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

  const token = generateAuthToken(userId, phone);
  res.json({ token, userId });
});

// Get current user profile
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const r = getRedis();
  const userData = await r.hget('locus:users', req.userId!);
  if (!userData) {
    res.status(404).json({ error: 'User not found' });
    return;
  }
  res.json(JSON.parse(userData));
});

// Update display name
router.patch('/me', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  const r = getRedis();
  const userData = await r.hget('locus:users', req.userId!);
  if (!userData) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  const user = JSON.parse(userData);
  const allowedFields = ['displayName', 'avatar', 'vehicleTag', 'privacyMode'];
  for (const field of allowedFields) {
    if (req.body[field] !== undefined) {
      user[field] = req.body[field];
    }
  }
  user.updatedAt = new Date().toISOString();

  await r.hset('locus:users', req.userId!, JSON.stringify(user));
  res.json(user);
});

// Get convoy by invite code
router.get('/convoy/:inviteCode', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
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
});

export default router;
