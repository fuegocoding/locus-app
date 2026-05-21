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
}

const connectedUsers = new Map<string, ConnectedUser>();

export function setupSocketHandlers(io: TypedServer): void {
  io.on('connection', (socket: TypedSocket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

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
        user.convoyId
      );

      if (user.mode === 'proximity') {
        await handleProximityUpdate(socket, user, io);
      } else if (user.mode === 'convoy' && user.convoyId) {
        await handleConvoyPresenceBroadcast(socket, user, io);
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

export function addConnectedUser(socketId: string, user: Omit<ConnectedUser, 'videoEnabled'>): void {
  connectedUsers.set(socketId, { ...user, videoEnabled: false });
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

    const token = await livekit.generateToken(roomId, user.userId);
    socket.emit('audio:token', {
      room: roomId,
      token,
      serverUrl: livekit.getLiveKitUrl(),
      identity: user.userId,
    });
  }

  socket.emit('presence:neighbors', nearbyUsers as any);
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

