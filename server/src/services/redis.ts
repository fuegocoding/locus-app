import Redis from 'ioredis';
import { prisma } from './db';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;
let redisConnected = false;
let errorLogged = false;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        if (times > 10) {
          if (!errorLogged) {
            console.error('[Redis] Max retries reached. Set REDIS_URL env var to connect.');
            errorLogged = true;
          }
          return null;
        }
        const delay = Math.min(times * 100, 3000);
        return delay;
      },
      lazyConnect: true,
    });

    redis.on('error', (err) => {
      if (!errorLogged) {
        console.error('[Redis] Connection error:', err.message);
        errorLogged = true;
      }
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
      redisConnected = true;
      errorLogged = false;
    });

    redis.on('reconnecting', () => {
      redisConnected = false;
    });
  }
  return redis;
}

export function isRedisConnected(): boolean {
  return redisConnected;
}

const PRESENCE_KEY = 'locus:presence';
const CONVOY_KEY = 'locus:convoys';
const BLOCK_KEY = 'locus:blocks';
const PIN_KEY = 'locus:pins';
const ROOM_KEY = 'locus:rooms';

export async function updatePresence(
  userId: string,
  latitude: number,
  longitude: number,
  speed: number,
  heading: number,
  privacyMode: string,
  mode: string,
  convoyId?: string,
  displayName?: string,
  anonymousMode?: boolean
): Promise<void> {
  const r = getRedis();
  const presence = JSON.stringify({
    userId,
    latitude,
    longitude,
    speed,
    heading,
    privacyMode,
    mode,
    convoyId,
    displayName,
    anonymousMode,
    timestamp: Date.now(),
  });

  const pipe = r.pipeline();
  pipe.hset(PRESENCE_KEY, userId, presence);
  pipe.geoadd('locus:locations', longitude, latitude, userId);
  pipe.expire(`${PRESENCE_KEY}:${userId}`, 30);
  await pipe.exec();
}

export async function removePresence(userId: string): Promise<void> {
  const r = getRedis();
  const pipe = r.pipeline();
  pipe.hdel(PRESENCE_KEY, userId);
  pipe.zrem('locus:locations', userId);
  pipe.del(`${PRESENCE_KEY}:${userId}`);
  await pipe.exec();
}

export async function getPresence(userId: string): Promise<PresenceUpdate | null> {
  const r = getRedis();
  const data = await r.hget(PRESENCE_KEY, userId);
  if (!data) return null;
  return JSON.parse(data);
}

export interface PresenceUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  privacyMode: string;
  mode: 'proximity' | 'convoy';
  convoyId?: string;
  timestamp: number;
  displayName?: string;
  anonymousMode?: boolean;
}

export async function getNearbyUsers(
  latitude: number,
  longitude: number,
  radiusKm: number,
  excludeUserIds: string[] = []
): Promise<PresenceUpdate[]> {
  const r = getRedis();
  const radiusMeters = radiusKm * 1000;

  const userIds = await r.geosearch(
    'locus:locations',
    'FROMLONLAT', longitude, latitude,
    'BYRADIUS', radiusMeters, 'm',
    'ASC'
  ) as unknown as string[];

  if (!userIds || userIds.length === 0) return [];

  const excludeSet = new Set(excludeUserIds);
  const filteredIds = (userIds as string[]).filter((id) => !excludeSet.has(id));

  if (filteredIds.length === 0) return [];

  const presences = await r.hmget(PRESENCE_KEY, ...filteredIds);
  return presences
    .filter(Boolean)
    .map((p) => JSON.parse(p!))
    .filter((p: PresenceUpdate) => p.privacyMode !== 'invisible' && p.privacyMode !== 'convoy-only');
}

export async function isBlocked(blockerId: string, blockedId: string): Promise<boolean> {
  const count = await prisma.block.count({
    where: {
      userId: blockerId,
      targetUserId: blockedId
    }
  });
  return count > 0;
}

export async function addBlock(blockerId: string, blockedId: string): Promise<void> {
  const exists = await prisma.block.findUnique({
    where: {
      userId_targetUserId: {
        userId: blockerId,
        targetUserId: blockedId
      }
    }
  });
  if (!exists) {
    await prisma.block.create({
      data: {
        userId: blockerId,
        targetUserId: blockedId
      }
    });
  }
}

export async function addPin(userId: string, targetUserId: string): Promise<void> {
  const exists = await prisma.pin.findUnique({
    where: {
      userId_targetUserId: {
        userId,
        targetUserId
      }
    }
  });
  if (!exists) {
    await prisma.pin.create({
      data: {
        userId,
        targetUserId
      }
    });
  }
}

export async function removePin(userId: string, targetUserId: string): Promise<void> {
  try {
    await prisma.pin.delete({
      where: {
        userId_targetUserId: {
          userId,
          targetUserId
        }
      }
    });
  } catch (e) {
    // Ignore if not found
  }
}

export async function getPins(userId: string): Promise<string[]> {
  const pins = await prisma.pin.findMany({
    where: { userId },
    select: { targetUserId: true }
  });
  return pins.map(p => p.targetUserId);
}

export async function getPinCount(userId: string): Promise<number> {
  return prisma.pin.count({
    where: { userId }
  });
}

export async function createConvoy(convoyId: string, convoyData: any): Promise<void> {
  const existing = await prisma.convoy.findUnique({
    where: { id: convoyId },
    include: { memberships: true }
  });

  if (existing) {
    const existingMemberIds = new Set(existing.memberships.map(m => m.userId));
    const newMembers = convoyData.members || [];
    
    for (const memberId of newMembers) {
      if (!existingMemberIds.has(memberId)) {
        await prisma.convoyMembership.create({
          data: {
            convoyId,
            userId: memberId
          }
        });
      }
    }
    
    const newMembersSet = new Set(newMembers);
    for (const memberId of existingMemberIds) {
      if (!newMembersSet.has(memberId)) {
        await prisma.convoyMembership.delete({
          where: {
            convoyId_userId: {
              convoyId,
              userId: memberId
            }
          }
        });
      }
    }

    await prisma.convoy.update({
      where: { id: convoyId },
      data: {
        name: convoyData.name,
        accessLevel: convoyData.accessLevel,
        livekitRoom: convoyData.livekitRoom,
      }
    });
  } else {
    await prisma.convoy.create({
      data: {
        id: convoyId,
        name: convoyData.name,
        creatorId: convoyData.creatorId,
        accessLevel: convoyData.accessLevel,
        inviteCode: convoyData.inviteCode,
        livekitRoom: convoyData.livekitRoom,
        memberships: {
          create: (convoyData.members || []).map((userId: string) => ({
            userId
          }))
        }
      }
    });
  }
}

export async function getConvoy(convoyId: string): Promise<object | null> {
  const convoy = await prisma.convoy.findUnique({
    where: { id: convoyId },
    include: { memberships: true }
  });
  if (!convoy) return null;
  return {
    id: convoy.id,
    name: convoy.name,
    creatorId: convoy.creatorId,
    accessLevel: convoy.accessLevel,
    inviteCode: convoy.inviteCode,
    livekitRoom: convoy.livekitRoom,
    members: convoy.memberships.map(m => m.userId),
    createdAt: convoy.createdAt,
    updatedAt: convoy.updatedAt,
  };
}

export async function getConvoyMembers(convoyId: string): Promise<PresenceUpdate[]> {
  const r = getRedis();
  const allPresences = await r.hvals(PRESENCE_KEY);
  return allPresences
    .map((p: string) => JSON.parse(p))
    .filter((p: PresenceUpdate) => p.convoyId === convoyId);
}

export async function deleteConvoy(convoyId: string): Promise<void> {
  try {
    await prisma.convoy.delete({
      where: { id: convoyId }
    });
  } catch (e) {
    // Ignore if not found
  }
}

export async function createRoom(roomId: string, roomData: object): Promise<void> {
  const r = getRedis();
  await r.hset(ROOM_KEY, roomId, JSON.stringify(roomData));
}

export async function getRoom(roomId: string): Promise<object | null> {
  const r = getRedis();
  const data = await r.hget(ROOM_KEY, roomId);
  if (!data) return null;
  return JSON.parse(data);
}

export async function updateRoom(roomId: string, roomData: object): Promise<void> {
  const r = getRedis();
  await r.hset(ROOM_KEY, roomId, JSON.stringify(roomData));
}

export async function deleteRoom(roomId: string): Promise<void> {
  const r = getRedis();
  await r.hdel(ROOM_KEY, roomId);
}

export async function disconnect(): Promise<void> {
  if (redis) {
    await redis.quit();
    redis = null;
  }
}
