import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/db';

const router = Router();

export const PREMIUM_FEATURES = [
  { id: 'unlimited-pins', name: 'Unlimited pins', cost: 500, type: 'functional' as const, icon: '📍' },
  { id: 'custom-avatar', name: 'Custom avatar', cost: 200, type: 'cosmetic' as const, icon: '🎨' },
  { id: 'convoy-nameplate', name: 'Convoy nameplate', cost: 300, type: 'cosmetic' as const, icon: '🏷️' },
  { id: 'priority-audio', name: 'Priority audio', cost: 750, type: 'functional' as const, icon: '🎙️' },
  { id: 'larger-radius', name: 'Larger radius', cost: 600, type: 'functional' as const, icon: '📡' },
  { id: 'convoy-themes', name: 'Convoy themes', cost: 400, type: 'cosmetic' as const, icon: '🎨' },
];

export const TASK_DEFS = [
  {
    id: 'referral',
    type: 'referral' as const,
    description: 'Share your invite link. Earn 100 points when they join their first convoy.',
    pointsReward: 100,
    repeatable: false,
  },
  {
    id: 'watch-ad',
    type: 'watch-ad' as const,
    description: 'Support Locus and earn 10 points. Ads are 30 seconds.',
    pointsReward: 10,
    repeatable: true,
    cooldownHours: 1,
  },
];

// GET /api/tasks — returns tasks, points, redeemed features
router.get('/', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: {
        taskCompletions: true,
        premiumFeatures: true,
      },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const completionsMap = new Map(
      user.taskCompletions.map((c: { taskType: string; completedAt: Date }) => [c.taskType, c])
    );

    const tasks = TASK_DEFS.map((task) => {
      const completion = completionsMap.get(task.type) as { completedAt: Date } | undefined;
      return {
        ...task,
        completed: !!completion,
        completedAt: completion ? completion.completedAt.toISOString() : null,
      };
    });

    const redeemedFeatures = user.premiumFeatures.map(
      (pf: { featureId: string; redeemedAt: Date; expiresAt: Date | null }) => ({
        featureId: pf.featureId,
        redeemedAt: pf.redeemedAt.toISOString(),
        expiresAt: pf.expiresAt ? pf.expiresAt.toISOString() : null,
      })
    );

    res.json({
      points: user.points,
      tasks,
      premiumFeatures: PREMIUM_FEATURES.map((f) => ({
        ...f,
        redeemed: redeemedFeatures.some((r: { featureId: string }) => r.featureId === f.id),
      })),
      redeemedFeatures,
    });
  } catch (error: any) {
    console.error('[Tasks] Get tasks error:', error);
    res.status(500).json({ error: 'Failed to get tasks' });
  }
});

// POST /api/tasks/complete
router.post('/complete', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { taskType, metadata } = req.body;
    const taskDef = TASK_DEFS.find((t) => t.type === taskType);

    if (!taskDef) {
      res.status(400).json({ error: 'Invalid task type' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { taskCompletions: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    const existing = user.taskCompletions.find(
      (c: { taskType: string; completedAt: Date }) => c.taskType === taskType
    );

    if (existing) {
      // Check cooldown for repeatable tasks
      if (taskDef.repeatable && taskDef.cooldownHours) {
        const hoursSince = (Date.now() - new Date((existing as { completedAt: Date }).completedAt).getTime()) / 36e5;
        if (hoursSince < taskDef.cooldownHours) {
          res.status(429).json({ error: 'Task on cooldown', retryAfterHours: taskDef.cooldownHours - hoursSince });
          return;
        }
      } else {
        // Non-repeatable: return existing without mutating
        res.json({
          success: true,
          pointsEarned: 0,
          totalPoints: user.points,
          alreadyCompleted: true,
        });
        return;
      }
    }

    // For referral task, verify referral exists and is eligible
    if (taskType === 'referral') {
      const referral = await prisma.referral.findFirst({
        where: { referrerId: req.userId!, rewardedAt: null },
      });
      if (!referral) {
        res.status(400).json({ error: 'No eligible referral found' });
        return;
      }
      // Mark referral rewarded
      await prisma.referral.update({
        where: { id: referral.id },
        data: { rewardedAt: new Date() },
      });
    }

    // Atomically increment points and record completion
    const [updatedUser, completion] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId! },
        data: { points: { increment: taskDef.pointsReward } },
      }),
      prisma.taskCompletion.upsert({
        where: {
          userId_taskType: {
            userId: req.userId!,
            taskType,
          },
        },
        update: {
          pointsEarned: { increment: taskDef.pointsReward },
          completedAt: new Date(),
          metadata: metadata ? JSON.stringify(metadata) : undefined,
        },
        create: {
          userId: req.userId!,
          taskType,
          pointsEarned: taskDef.pointsReward,
          metadata: metadata ? JSON.stringify(metadata) : null,
        },
      }),
    ]);

    res.json({
      success: true,
      pointsEarned: taskDef.pointsReward,
      totalPoints: updatedUser.points,
      alreadyCompleted: false,
    });
  } catch (error: any) {
    console.error('[Tasks] Complete task error:', error);
    res.status(500).json({ error: 'Failed to complete task' });
  }
});

// POST /api/tasks/redeem
router.post('/redeem', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { featureId } = req.body;
    const feature = PREMIUM_FEATURES.find((f) => f.id === featureId);

    if (!feature) {
      res.status(400).json({ error: 'Invalid feature' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId! },
      include: { premiumFeatures: true },
    });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    if (user.points < feature.cost) {
      res.status(400).json({ error: 'Insufficient points', required: feature.cost, current: user.points });
      return;
    }

    const alreadyOwned = user.premiumFeatures.some(
      (pf: { featureId: string }) => pf.featureId === featureId
    );
    if (alreadyOwned) {
      res.status(400).json({ error: 'Feature already owned' });
      return;
    }

    // Atomically deduct points and grant feature
    const [updatedUser, premiumFeature] = await prisma.$transaction([
      prisma.user.update({
        where: { id: req.userId! },
        data: { points: { decrement: feature.cost } },
      }),
      prisma.userPremiumFeature.create({
        data: {
          userId: req.userId!,
          featureId,
        },
      }),
    ]);

    res.json({
      success: true,
      featureId,
      pointsSpent: feature.cost,
      remainingPoints: updatedUser.points,
    });
  } catch (error: any) {
    console.error('[Tasks] Redeem error:', error);
    res.status(500).json({ error: 'Failed to redeem feature' });
  }
});

export default router;
