import { Router, Response } from 'express';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { prisma } from '../services/db';
import { sendPushNotification } from '../services/notification';
import { getSocketIdByUserId, isUserOnline } from '../socket';

const router = Router();

// Search users by display name (for following)
router.get('/search', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const query = (req.query.query || '').toString().trim();
    if (query.length < 2) {
      res.json([]);
      return;
    }

    const users = await prisma.user.findMany({
      where: {
        displayName: {
          contains: query,
          mode: 'insensitive',
        },
        id: {
          not: req.userId!,
        },
      },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        vehicleTag: true,
      },
      take: 20,
    });

    // Check follow status for each user
    const formattedUsers = await Promise.all(
      users.map(async (u) => {
        const isFollowing = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: req.userId!,
              followingId: u.id,
            },
          },
        });

        const isFollowedBy = await prisma.follow.findUnique({
          where: {
            followerId_followingId: {
              followerId: u.id,
              followingId: req.userId!,
            },
          },
        });

        return {
          ...u,
          isFollowing: !!isFollowing,
          isFriend: !!isFollowing && !!isFollowedBy,
        };
      })
    );

    res.json(formattedUsers);
  } catch (error: any) {
    console.error('[Social] Search users error:', error);
    res.status(500).json({ error: 'Failed to search users' });
  }
});

// Follow a user
router.post('/follow', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.userId!;

    if (!targetUserId) {
      res.status(400).json({ error: 'Target user ID required' });
      return;
    }

    if (targetUserId === currentUserId) {
      res.status(400).json({ error: 'You cannot follow yourself' });
      return;
    }

    // Check if target user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });
    if (!targetUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Check if already following
    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      res.status(400).json({ error: 'You are already following this user' });
      return;
    }

    // Create follow relationship
    await prisma.follow.create({
      data: {
        followerId: currentUserId,
        followingId: targetUserId,
      },
    });

    // Check if it's a mutual friend relationship now
    const mutualFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: targetUserId,
          followingId: currentUserId,
        },
      },
    });

    // Send push notification to target user
    const currentUser = await prisma.user.findUnique({ where: { id: currentUserId } });
    if (currentUser) {
      const msg = mutualFollow
        ? `${currentUser.displayName} followed you back! You are now friends.`
        : `${currentUser.displayName} started following you.`;
      await sendPushNotification(targetUserId, 'New Follower', msg, {
        type: 'follow',
        userId: currentUserId,
      });
    }

    res.json({ success: true, isFriend: !!mutualFollow });
  } catch (error: any) {
    console.error('[Social] Follow error:', error);
    res.status(500).json({ error: 'Failed to follow user' });
  }
});

// Unfollow a user
router.post('/unfollow', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { targetUserId } = req.body;
    const currentUserId = req.userId!;

    if (!targetUserId) {
      res.status(400).json({ error: 'Target user ID required' });
      return;
    }

    // Delete follow relationship
    const follow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    if (!follow) {
      res.status(400).json({ error: 'You are not following this user' });
      return;
    }

    await prisma.follow.delete({
      where: {
        followerId_followingId: {
          followerId: currentUserId,
          followingId: targetUserId,
        },
      },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Social] Unfollow error:', error);
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

// Get friends (mutual followers)
router.get('/friends', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;

    // Query for mutual followers
    const friends = await prisma.user.findMany({
      where: {
        followers: {
          some: { followerId: currentUserId },
        },
        following: {
          some: { followingId: currentUserId },
        },
      },
      select: {
        id: true,
        displayName: true,
        avatar: true,
        vehicleTag: true,
      },
    });

    // Add online status
    const friendsWithStatus = friends.map((f) => ({
      ...f,
      isOnline: isUserOnline(f.id),
    }));

    res.json(friendsWithStatus);
  } catch (error: any) {
    console.error('[Social] Get friends error:', error);
    res.status(500).json({ error: 'Failed to fetch friends' });
  }
});

// Get users I am following
router.get('/following', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const following = await prisma.follow.findMany({
      where: { followerId: currentUserId },
      include: {
        following: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            vehicleTag: true,
          },
        },
      },
    });

    const followingUsers = following.map((f) => f.following);
    res.json(followingUsers);
  } catch (error: any) {
    console.error('[Social] Get following error:', error);
    res.status(500).json({ error: 'Failed to fetch following users' });
  }
});

// Get users following me
router.get('/followers', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const followers = await prisma.follow.findMany({
      where: { followingId: currentUserId },
      include: {
        follower: {
          select: {
            id: true,
            displayName: true,
            avatar: true,
            vehicleTag: true,
          },
        },
      },
    });

    const followerUsers = followers.map((f) => f.follower);
    res.json(followerUsers);
  } catch (error: any) {
    console.error('[Social] Get followers error:', error);
    res.status(500).json({ error: 'Failed to fetch followers' });
  }
});

// Register device notification token
router.post('/device-token', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { token } = req.body;
    const currentUserId = req.userId!;

    if (!token) {
      res.status(400).json({ error: 'Token required' });
      return;
    }

    await prisma.deviceToken.upsert({
      where: { token },
      update: { userId: currentUserId },
      create: { token, userId: currentUserId },
    });

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Social] Register device token error:', error);
    res.status(500).json({ error: 'Failed to register device token' });
  }
});

// Create/Send convoy invitation
router.post('/convoy/invite', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { convoyId, receiverId } = req.body;
    const currentUserId = req.userId!;

    if (!convoyId || !receiverId) {
      res.status(400).json({ error: 'convoyId and receiverId are required' });
      return;
    }

    // Verify convoy exists and current user is creator or member
    const convoy = await prisma.convoy.findUnique({
      where: { id: convoyId },
      include: { memberships: true },
    });

    if (!convoy) {
      res.status(404).json({ error: 'Convoy not found' });
      return;
    }

    const isMember = convoy.memberships.some((m) => m.userId === currentUserId);
    if (!isMember && convoy.creatorId !== currentUserId) {
      res.status(403).json({ error: 'You are not a member of this convoy' });
      return;
    }

    // Check if receiver is already a member
    const isReceiverAlreadyMember = convoy.memberships.some((m) => m.userId === receiverId);
    if (isReceiverAlreadyMember) {
      res.status(400).json({ error: 'User is already a member of this convoy' });
      return;
    }

    // Check if an invitation is already pending
    const existingInvite = await prisma.convoyInvite.findFirst({
      where: {
        convoyId,
        receiverId,
        status: 'pending',
      },
    });

    if (existingInvite) {
      res.status(400).json({ error: 'An invitation is already pending for this user' });
      return;
    }

    // Create the invite in DB
    const invite = await prisma.convoyInvite.create({
      data: {
        convoyId,
        senderId: currentUserId,
        receiverId,
        status: 'pending',
      },
    });

    const senderUser = await prisma.user.findUnique({ where: { id: currentUserId } });

    // Emit Socket.io event if receiver is currently online
    const receiverSocketId = getSocketIdByUserId(receiverId);
    if (receiverSocketId) {
      // Access the IO server from express app (or import it from index.ts)
      const io = req.app.get('io');
      if (io) {
        io.to(receiverSocketId).emit('invite:received', {
          id: invite.id,
          convoyId: convoy.id,
          convoyName: convoy.name,
          senderId: currentUserId,
          senderName: senderUser?.displayName || 'A friend',
        });
      }
    }

    // Trigger push notification (either real FCM or mock logs)
    await sendPushNotification(
      receiverId,
      'Convoy Invitation',
      `${senderUser?.displayName || 'A friend'} invited you to join the convoy "${convoy.name}".`,
      {
        type: 'convoy_invite',
        inviteId: invite.id,
        convoyId: convoy.id,
      }
    );

    res.json({ success: true, inviteId: invite.id });
  } catch (error: any) {
    console.error('[Social] Send invite error:', error);
    res.status(500).json({ error: 'Failed to send invite' });
  }
});

// Fetch pending convoy invites
router.get('/convoy/invites', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const currentUserId = req.userId!;
    const invites = await prisma.convoyInvite.findMany({
      where: {
        receiverId: currentUserId,
        status: 'pending',
      },
      include: {
        convoy: {
          select: {
            name: true,
          },
        },
        sender: {
          select: {
            displayName: true,
          },
        },
      },
    });

    const formattedInvites = invites.map((invite) => ({
      id: invite.id,
      convoyId: invite.convoyId,
      convoyName: invite.convoy.name,
      senderId: invite.senderId,
      senderName: invite.sender.displayName,
      createdAt: invite.createdAt,
    }));

    res.json(formattedInvites);
  } catch (error: any) {
    console.error('[Social] Get invites error:', error);
    res.status(500).json({ error: 'Failed to fetch invitations' });
  }
});

// Respond to convoy invite
router.post('/convoy/invite/:inviteId/respond', authMiddleware, async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { inviteId } = req.params;
    const { status } = req.body; // 'accepted' or 'declined'
    const currentUserId = req.userId!;

    if (status !== 'accepted' && status !== 'declined') {
      res.status(400).json({ error: "Status must be 'accepted' or 'declined'" });
      return;
    }

    // Verify invite exists and belongs to current user
    const invite = await prisma.convoyInvite.findUnique({
      where: { id: inviteId },
    });

    if (!invite || invite.receiverId !== currentUserId) {
      res.status(404).json({ error: 'Invitation not found' });
      return;
    }

    if (invite.status !== 'pending') {
      res.status(400).json({ error: 'This invitation has already been processed' });
      return;
    }

    // Update invite status
    await prisma.convoyInvite.update({
      where: { id: inviteId },
      data: { status },
    });

    const receiverUser = await prisma.user.findUnique({ where: { id: currentUserId } });

    // Send response via Socket.io to the sender if they are online
    const senderSocketId = getSocketIdByUserId(invite.senderId);
    if (senderSocketId) {
      const io = req.app.get('io');
      if (io) {
        io.to(senderSocketId).emit('invite:responded', {
          id: invite.id,
          status,
          receiverId: currentUserId,
          receiverName: receiverUser?.displayName || 'Friend',
        });
      }
    }

    if (status === 'accepted') {
      // Add user to the convoy memberships
      await prisma.convoyMembership.upsert({
        where: {
          convoyId_userId: {
            convoyId: invite.convoyId,
            userId: currentUserId,
          },
        },
        update: {},
        create: {
          convoyId: invite.convoyId,
          userId: currentUserId,
        },
      });

      // Send push notification back to the sender
      await sendPushNotification(
        invite.senderId,
        'Invitation Accepted',
        `${receiverUser?.displayName || 'Friend'} joined your convoy!`,
        {
          type: 'convoy_invite_accepted',
          convoyId: invite.convoyId,
          receiverId: currentUserId,
        }
      );
    }

    res.json({ success: true });
  } catch (error: any) {
    console.error('[Social] Respond to invite error:', error);
    res.status(500).json({ error: 'Failed to respond to invitation' });
  }
});

export default router;
