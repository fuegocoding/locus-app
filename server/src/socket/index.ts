import { Server, Socket } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { verifyAuthToken } from '../services/auth';
import * as redis from '../services/redis';
import * as livekit from '../services/livekit';
import * as proximity from '../services/proximity';
import { generateInviteCode } from '../services/auth';
import type { ClientToServerEvents, ServerToClientEvents } from '../types';
import { prisma } from '../services/db';

type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents>;
type TypedServer = Server<ClientToServerEvents, ServerToClientEvents>;

interface ConnectedUser {
  socketId: string;
  userId: string;
  mode: 'proximity' | 'convoy';
  convoyId?: string;
  proximityRoomId?: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  videoEnabled: boolean;
  displayName: string;
  anonymousMode: boolean;
}

const connectedUsers = new Map<string, ConnectedUser>();

const adjectives = ['Silent', 'Swift', 'Quiet', 'Shadowy', 'Stealthy', 'Hidden', 'Mysterious', 'Cunning', 'Wild', 'Lone', 'Frosty', 'Rusty', 'Golden', 'Silver', 'Iron'];
const animals = ['Badger', 'Falcon', 'Coyote', 'Fox', 'Wolf', 'Panther', 'Eagle', 'Hawk', 'Otter', 'Raccoon', 'Owl', 'Bear', 'Deer', 'Lynx', 'Puma'];

export function getAnonymousName(userId: string): string {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const adjIndex = Math.abs(hash) % adjectives.length;
  const animIndex = Math.abs(hash + 13) % animals.length;
  return `${adjectives[adjIndex]} ${animals[animIndex]}`;
}

export function setupSocketHandlers(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    // Fetch initial profile details from DB
    const userId = (socket as any).userId;
    if (userId) {
      prisma.user.findUnique({
        where: { id: userId },
        select: { displayName: true, anonymousMode: true }
      }).then((dbUser) => {
        const user = connectedUsers.get(socket.id);
        if (user) {
          user.displayName = dbUser?.displayName || `User_${userId.slice(0, 6)}`;
          user.anonymousMode = dbUser?.anonymousMode ?? false;
        }
      }).catch((err) => {
        console.error('[Socket] Error fetching user profile on connect:', err);
      });
    }

    socket.on('disconnect', async () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);
      const user = connectedUsers.get(socket.id);
      if (user) {
        await handleDisconnect(socket, user, io);
        connectedUsers.delete(socket.id);
      }
    });

    socket.on('presence:update', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) {
        socket.emit('error', { message: 'Not authenticated', code: 'AUTH_REQUIRED' });
        return;
      }

      user.latitude = data.latitude;
      user.longitude = data.longitude;
      user.speed = data.speed;
      user.heading = data.heading;

      await redis.updatePresence(
        user.userId,
        data.latitude,
        data.longitude,
        data.speed,
        data.heading,
        'open',
        user.mode,
        user.convoyId,
        user.displayName,
        user.anonymousMode
      );

      if (user.mode === 'proximity') {
        await handleProximityUpdate(socket, user, io);
      } else if (user.mode === 'convoy' && user.convoyId) {
        await handleConvoyPresenceBroadcast(socket, user, io);
      }

      // Broadcast location to online mutual friends
      try {
        const friendRecords = await prisma.$queryRaw<Array<{ id: string }>>`
          SELECT u.id FROM "User" u
          WHERE EXISTS (
            SELECT 1 FROM "Follow" f1
            WHERE f1."followerId" = ${user.userId} AND f1."followingId" = u.id
          )
          AND EXISTS (
            SELECT 1 FROM "Follow" f2
            WHERE f2."followerId" = u.id AND f2."followingId" = ${user.userId}
          )
        `;
        const friendIds = new Set(friendRecords.map(f => f.id));
        for (const [sid, cu] of connectedUsers) {
          if (friendIds.has(cu.userId)) {
            io.to(sid).emit('friends:location', {
              userId: user.userId,
              displayName: user.anonymousMode ? getAnonymousName(user.userId) : (user.displayName || `User_${user.userId.slice(0, 6)}`),
              latitude: user.latitude,
              longitude: user.longitude,
              heading: user.heading,
            });
          }
        }
      } catch (err) {
        // Friend presence broadcast error — non-critical
      }
    });

    socket.on('mode:switch', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      if (data.mode === 'convoy' && data.convoyId) {
        if (user.proximityRoomId) {
          const result = proximity.removeFromProximityRoom(user.userId, user.proximityRoomId);
          if (result.shouldDelete) {
            await redis.deleteRoom(user.proximityRoomId);
          }
          user.proximityRoomId = undefined;
        }
        user.mode = 'convoy';
        user.convoyId = data.convoyId;

        const token = await livekit.generateToken(data.convoyId, user.userId);
        socket.emit('audio:token', {
          room: data.convoyId,
          token,
          serverUrl: livekit.getLiveKitUrl(),
          identity: user.userId,
        });

        const convoy = await redis.getConvoy(data.convoyId);
        const members = await redis.getConvoyMembers(data.convoyId);
        if (convoy) {
          socket.emit('convoy:joined', { convoy: convoy as any, members: members as any });
        }
      } else if (data.mode === 'proximity') {
        user.mode = 'proximity';
        user.convoyId = undefined;

        await handleProximityUpdate(socket, user, io);
      }
    });

    socket.on('convoy:create', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      const convoyId = uuidv4();
      const inviteCode = generateInviteCode();
      const livekitRoom = `convoy:${convoyId}`;
      const convoy = {
        id: convoyId,
        name: data.name,
        creatorId: user.userId,
        accessLevel: data.accessLevel,
        inviteCode,
        members: [user.userId],
        livekitRoom,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await redis.createConvoy(convoyId, convoy);

      user.mode = 'convoy';
      user.convoyId = convoyId;

      await redis.updatePresence(
        user.userId, user.latitude, user.longitude,
        user.speed, user.heading, 'open', 'convoy', convoyId
      );

      const token = await livekit.generateToken(livekitRoom, user.userId);
      socket.emit('convoy:created', convoy);
      socket.emit('audio:token', {
        room: livekitRoom,
        token,
        serverUrl: livekit.getLiveKitUrl(),
        identity: user.userId,
      });
    });

    socket.on('convoy:join', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      const foundConvoy = await prisma.convoy.findUnique({
        where: { inviteCode: data.inviteCode },
        include: { memberships: true }
      });

      if (!foundConvoy) {
        socket.emit('error', { message: 'Invalid invite code', code: 'INVALID_INVITE' });
        return;
      }

      const isAlreadyMember = foundConvoy.memberships.some(m => m.userId === user.userId);
      if (!isAlreadyMember) {
        await prisma.convoyMembership.create({
          data: {
            convoyId: foundConvoy.id,
            userId: user.userId
          }
        });
      }

      const updatedConvoy = await redis.getConvoy(foundConvoy.id);

      user.mode = 'convoy';
      user.convoyId = foundConvoy.id;

      await redis.updatePresence(
        user.userId, user.latitude, user.longitude,
        user.speed, user.heading, 'open', 'convoy', foundConvoy.id
      );

      const token = await livekit.generateToken(foundConvoy.livekitRoom, user.userId);
      socket.emit('convoy:joined', {
        convoy: updatedConvoy as any,
        members: await redis.getConvoyMembers(foundConvoy.id) as any,
      });
      socket.emit('audio:token', {
        room: foundConvoy.livekitRoom,
        token,
        serverUrl: livekit.getLiveKitUrl(),
        identity: user.userId,
      });

      // Broadcast to convoy members
      for (const [sid, cu] of connectedUsers) {
        if (cu.convoyId === foundConvoy.id && cu.userId !== user.userId) {
          io.to(sid).emit('convoy:member-joined', {
            userId: user.userId,
            latitude: user.latitude,
            longitude: user.longitude,
            speed: user.speed,
            heading: user.heading,
            privacyMode: 'open',
            mode: 'convoy',
            convoyId: foundConvoy.id,
            timestamp: Date.now(),
          });
        }
      }
    });

    socket.on('convoy:leave', async () => {
      const user = connectedUsers.get(socket.id);
      if (!user || !user.convoyId) return;

      await redis.updatePresence(
        user.userId, user.latitude, user.longitude,
        user.speed, user.heading, 'open', 'proximity'
      );

      const convoyId = user.convoyId;
      user.mode = 'proximity';
      user.convoyId = undefined;

      socket.emit('convoy:left', { convoyId });

      for (const [sid, cu] of connectedUsers) {
        if (cu.convoyId === convoyId && cu.userId !== user.userId) {
          io.to(sid).emit('convoy:member-left', { userId: user.userId });
        }
      }

      await handleProximityUpdate(socket, user, io);
    });

    socket.on('user:pin', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;

      const pinCount = await redis.getPinCount(user.userId);
      if (pinCount >= 3) {
        socket.emit('error', { message: 'Pin limit reached (3 free, unlimited premium)', code: 'PIN_LIMIT' });
        return;
      }

      await redis.addPin(user.userId, data.targetUserId);

      // Notify the target user they were pinned
      const targetSocketEntry = [...connectedUsers.entries()]
        .find(([, cu]) => cu.userId === data.targetUserId);
      if (targetSocketEntry) {
        const [targetSocketId] = targetSocketEntry;
        io.to(targetSocketId).emit('user:pinned-you', {
          pinnedByUserId: user.userId,
          pinnedByDisplayName: user.anonymousMode ? getAnonymousName(user.userId) : (user.displayName || `User_${user.userId.slice(0, 6)}`),
        });
      }

      // Check if target user has pinned user back
      const reciprocalPin = await prisma.pin.findUnique({
        where: {
          userId_targetUserId: {
            userId: data.targetUserId,
            targetUserId: user.userId
          }
        }
      });

      if (reciprocalPin) {
        // Create mutual follow records
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: user.userId, followingId: data.targetUserId } },
          create: { followerId: user.userId, followingId: data.targetUserId },
          update: {}
        });
        await prisma.follow.upsert({
          where: { followerId_followingId: { followerId: data.targetUserId, followingId: user.userId } },
          create: { followerId: data.targetUserId, followingId: user.userId },
          update: {}
        });

        // Notify both clients of the new mutual friend
        socket.emit('friend:added', {
          friendId: data.targetUserId,
          displayName: reciprocalPin ? (await prisma.user.findUnique({ where: { id: data.targetUserId } }))?.displayName : undefined
        });

        if (targetSocketEntry) {
          const [targetSocketId] = targetSocketEntry;
          io.to(targetSocketId).emit('friend:added', {
            friendId: user.userId,
            displayName: user.displayName
          });
        }
      }
    });

    socket.on('user:unpin', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      await redis.removePin(user.userId, data.targetUserId);
    });

    socket.on('user:mute', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      const targetSocket = [...connectedUsers.entries()]
        .find(([, cu]) => cu.userId === data.targetUserId);
      if (targetSocket) {
        // Mute is client-side, we just track it for server awareness
      }
    });

    socket.on('user:block', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      await redis.addBlock(user.userId, data.targetUserId);
    });

    socket.on('user:report', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      console.log(`[Report] ${user.userId} reported ${data.targetUserId}: ${data.reason || 'no reason'}`);
    });

    socket.on('audio:push-to-talk', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      io.emit('audio:speaking', { userId: user.userId, speaking: data.speaking });
    });

    socket.on('audio:toggle-mic', async (data) => {
      const user = connectedUsers.get(socket.id);
      if (!user) return;
      io.emit('audio:speaking', { userId: user.userId, speaking: !data.muted });
    });

    socket.on('video:start', async () => {
      const user = connectedUsers.get(socket.id);
      if (!user || user.mode !== 'convoy' || !user.convoyId) return;
      user.videoEnabled = true;
      for (const [sid, cu] of connectedUsers) {
        if (cu.convoyId === user.convoyId && cu.userId !== user.userId) {
          io.to(sid).emit('video:participant-started', { userId: user.userId });
        }
      }
    });

    socket.on('video:stop', async () => {
      const user = connectedUsers.get(socket.id);
      if (!user || !user.convoyId) return;
      user.videoEnabled = false;
      for (const [sid, cu] of connectedUsers) {
        if (cu.convoyId === user.convoyId && cu.userId !== user.userId) {
          io.to(sid).emit('video:participant-stopped', { userId: user.userId });
        }
      }
    });
  });
}

export function addConnectedUser(
  socketId: string,
  user: Omit<ConnectedUser, 'videoEnabled' | 'displayName' | 'anonymousMode'> & { displayName?: string; anonymousMode?: boolean }
): void {
  connectedUsers.set(socketId, {
    ...user,
    displayName: user.displayName || `User_${user.userId.slice(0, 6)}`,
    anonymousMode: user.anonymousMode || false,
    videoEnabled: false,
  });
}

export function updateConnectedUserDetails(
  userId: string,
  displayName: string,
  anonymousMode: boolean
): void {
  for (const user of connectedUsers.values()) {
    if (user.userId === userId) {
      user.displayName = displayName;
      user.anonymousMode = anonymousMode;
    }
  }
}

async function handleProximityUpdate(
  socket: TypedSocket,
  user: ConnectedUser,
  io: TypedServer
): Promise<void> {
  const radius = proximity.computeDynamicRadius(0);
  const nearbyUsers = await redis.getNearbyUsers(user.latitude, user.longitude, radius, [user.userId]);
  const pinnedUsers = await redis.getPins(user.userId);

  const { roomId, isNew } = proximity.assignProximityRoom(
    user.userId,
    user.latitude,
    user.longitude,
    radius
  );

  // Calculate volume levels based on distance
  const volumeUpdates: Array<{ userId: string; volume: number }> = [];
  for (const nearby of nearbyUsers) {
    const distance = proximity.calculateDistance(
      user.latitude, user.longitude,
      nearby.latitude, nearby.longitude
    );
    const isPinned = pinnedUsers.includes(nearby.userId);
    const volume = proximity.computeVolumeByDistance(distance, radius, isPinned);
    volumeUpdates.push({ userId: nearby.userId, volume });
  }

  const oldRoomId = user.proximityRoomId;

  if (user.proximityRoomId && user.proximityRoomId !== roomId) {
    proximity.removeFromProximityRoom(user.userId, user.proximityRoomId);
  }

  user.proximityRoomId = roomId;

  if (isNew) {
    await redis.createRoom(roomId, {
      centerLat: user.latitude,
      centerLng: user.longitude,
      radius,
      participants: [user.userId],
      createdAt: Date.now(),
    });
  }

  if (oldRoomId !== roomId) {
    const token = await livekit.generateToken(roomId, user.userId);
    socket.emit('audio:token', {
      room: roomId,
      token,
      serverUrl: livekit.getLiveKitUrl(),
      identity: user.userId,
    });
  }

  const mappedNearbyUsers = nearbyUsers.map(u => {
    return {
      ...u,
      displayName: u.anonymousMode ? getAnonymousName(u.userId) : (u.displayName || `User_${u.userId.slice(0, 6)}`),
    };
  });

  socket.emit('presence:neighbors', mappedNearbyUsers as any);
  for (const v of volumeUpdates) {
    socket.emit('audio:volume-update', v);
  }
}

async function handleConvoyPresenceBroadcast(
  socket: TypedSocket,
  user: ConnectedUser,
  io: TypedServer
): Promise<void> {
  const members = await redis.getConvoyMembers(user.convoyId!);
  for (const [sid, cu] of connectedUsers) {
    if (cu.convoyId === user.convoyId && cu.userId !== user.userId) {
      io.to(sid).emit('presence:update', {
        userId: user.userId,
        latitude: user.latitude,
        longitude: user.longitude,
        speed: user.speed,
        heading: user.heading,
        privacyMode: 'open',
        mode: 'convoy',
        convoyId: user.convoyId,
        timestamp: Date.now(),
      });
    }
  }
}

async function handleDisconnect(
  socket: TypedSocket,
  user: ConnectedUser,
  io: TypedServer
): Promise<void> {
  await redis.removePresence(user.userId);

  if (user.proximityRoomId) {
    const result = proximity.removeFromProximityRoom(user.userId, user.proximityRoomId);
    if (result.shouldDelete) {
      await redis.deleteRoom(user.proximityRoomId);
    }

    for (const participantId of result.remainingParticipants) {
      for (const [sid, cu] of connectedUsers) {
        if (cu.userId === participantId) {
          io.to(sid).emit('presence:remove', { userId: user.userId });
        }
      }
    }
  }

  if (user.convoyId) {
    for (const [sid, cu] of connectedUsers) {
      if (cu.convoyId === user.convoyId && cu.userId !== user.userId) {
        io.to(sid).emit('presence:remove', { userId: user.userId });
        io.to(sid).emit('convoy:member-left', { userId: user.userId });
      }
    }
  }
}

export function isUserOnline(userId: string): boolean {
  for (const user of connectedUsers.values()) {
    if (user.userId === userId) return true;
  }
  return false;
}

export function getSocketIdByUserId(userId: string): string | undefined {
  for (const [sid, user] of connectedUsers.entries()) {
    if (user.userId === userId) return sid;
  }
  return undefined;
}

