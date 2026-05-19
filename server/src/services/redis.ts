import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

let redis: Redis | null = null;

export function getRedis(): Redis {
  if (!redis) {
    redis = new Redis(REDIS_URL, {
      maxRetriesPerRequest: 3,
      retryStrategy(times) {
        const delay = Math.min(times * 50, 2000);
        return delay;
      },
      lazyConnect: false,
    });

    redis.on('error', (err) => {
      console.error('[Redis] Connection error:', err.message);
    });

    redis.on('connect', () => {
      console.log('[Redis] Connected');
    });
  }
  return redis;
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
  convoyId?: string
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

interface PresenceUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  privacyMode: string;
  mode: 'proximity' | 'convoy';
  convoyId?: string;
  timestamp: number;
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
  const r = getRedis();
  return (await r.sismember(`${BLOCK_KEY}:${blockerId}`, blockedId)) === 1;
}

export async function addBlock(blockerId: string, blockedId: string): Promise<void> {
  const r = getRedis();
  await r.sadd(`${BLOCK_KEY}:${blockerId}`, blockedId);
}

export async function addPin(userId: string, targetUserId: string): Promise<void> {
  const r = getRedis();
  await r.sadd(`${PIN_KEY}:${userId}`, targetUserId);
}

export async function removePin(userId: string, targetUserId: string): Promise<void> {
  const r = getRedis();
  await r.srem(`${PIN_KEY}:${userId}`, targetUserId);
}

export async function getPins(userId: string): Promise<string[]> {
  const r = getRedis();
  return r.smembers(`${PIN_KEY}:${userId}`);
}

export async function getPinCount(userId: string): Promise<number> {
  const r = getRedis();
  return r.scard(`${PIN_KEY}:${userId}`);
}

export async function createConvoy(convoyId: string, convoyData: object): Promise<void> {
  const r = getRedis();
  await r.hset(CONVOY_KEY, convoyId, JSON.stringify(convoyData));
}

export async function getConvoy(convoyId: string): Promise<object | null> {
  const r = getRedis();
  const data = await r.hget(CONVOY_KEY, convoyId);
  if (!data) return null;
  return JSON.parse(data);
}

export async function getConvoyMembers(convoyId: string): Promise<PresenceUpdate[]> {
  const r = getRedis();
  const allPresences = await r.hvals(PRESENCE_KEY);
  return allPresences
    .map((p: string) => JSON.parse(p))
    .filter((p: PresenceUpdate) => p.convoyId === convoyId);
}

export async function deleteConvoy(convoyId: string): Promise<void> {
  const r = getRedis();
  await r.hdel(CONVOY_KEY, convoyId);
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
