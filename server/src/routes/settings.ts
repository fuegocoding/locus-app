import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/db';
import { getSocketIdByUserId } from '../socket';

const router = Router();

const ALLOWED_SPEED_UNITS = ['auto', 'kmh', 'mph'] as const;
type SpeedUnit = (typeof ALLOWED_SPEED_UNITS)[number];

// Get current user settings
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { settings: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Ensure settings row exists
    if (!user.settings) {
      const settings = await prisma.userSettings.create({
        data: {
          userId: user.id,
          speedUnit: 'auto',
          pushToTalk: false,
          anonymousMode: user.anonymousMode ?? false,
        },
      });
      res.json({
        speedUnit: settings.speedUnit,
        pushToTalk: settings.pushToTalk,
        anonymousMode: settings.anonymousMode,
        privacyMode: user.privacyMode,
      });
      return;
    }

    res.json({
      speedUnit: user.settings.speedUnit,
      pushToTalk: user.settings.pushToTalk,
      anonymousMode: user.settings.anonymousMode,
      privacyMode: user.privacyMode,
    });
  } catch (error: any) {
    console.error('[Settings] Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

// Update user settings
router.patch('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { settings: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const updateData: any = {};
    const userUpdateData: any = {};

    if (req.body.speedUnit !== undefined) {
      const unit = req.body.speedUnit as SpeedUnit;
      if (!ALLOWED_SPEED_UNITS.includes(unit)) {
        res.status(400).json({ error: 'Invalid speed unit' });
        return;
      }
      updateData.speedUnit = unit;
    }

    if (req.body.pushToTalk !== undefined) {
      updateData.pushToTalk = Boolean(req.body.pushToTalk);
    }

    if (req.body.anonymousMode !== undefined) {
      updateData.anonymousMode = Boolean(req.body.anonymousMode);
      userUpdateData.anonymousMode = Boolean(req.body.anonymousMode);
    }

    if (req.body.privacyMode !== undefined) {
      const allowedPrivacy = ['open', 'friends-only', 'convoy-only', 'invisible'];
      if (!allowedPrivacy.includes(req.body.privacyMode)) {
        res.status(400).json({ error: 'Invalid privacy mode' });
        return;
      }
      userUpdateData.privacyMode = req.body.privacyMode;
    }

    // Update or create settings row
    const updatedSettings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: updateData,
      create: {
        userId: user.id,
        speedUnit: updateData.speedUnit ?? 'auto',
        pushToTalk: updateData.pushToTalk ?? false,
        anonymousMode: updateData.anonymousMode ?? user.anonymousMode ?? false,
      },
    });

    // Also update User table fields if needed
    if (Object.keys(userUpdateData).length > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: userUpdateData,
      });
    }

    // Sync anonymous mode to socket if changed
    if (updateData.anonymousMode !== undefined) {
      try {
        const { updateConnectedUserDetails } = require('../socket');
        updateConnectedUserDetails(user.id, user.displayName, updatedSettings.anonymousMode);
      } catch {
        // Non-critical socket sync fail
      }
    }

    res.json({
      speedUnit: updatedSettings.speedUnit,
      pushToTalk: updatedSettings.pushToTalk,
      anonymousMode: updatedSettings.anonymousMode,
      privacyMode: req.body.privacyMode ?? user.privacyMode,
    });
  } catch (error: any) {
    console.error('[Settings] Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

export default router;
