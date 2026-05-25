import { randomBytes } from 'crypto';

const MIN_RADIUS_KM = 0.5;
const MAX_RADIUS_KM = 5.0;
const DENSE_THRESHOLD = 10;
const SPARSE_THRESHOLD = 3;
const DEFAULT_RADIUS_KM = 2.0;
const HYSTERESIS_DWELL_MS = 3000;
const HYSTERESIS_LEAVE_MS = 5000;

interface NearbyUser {
  userId: string;
  latitude: number;
  longitude: number;
  distanceKm: number;
}

export function computeDynamicRadius(nearbyCount: number): number {
  if (nearbyCount >= DENSE_THRESHOLD) {
    return Math.max(MIN_RADIUS_KM, DEFAULT_RADIUS_KM * (DENSE_THRESHOLD / nearbyCount));
  }
  if (nearbyCount <= SPARSE_THRESHOLD) {
    return Math.min(MAX_RADIUS_KM, DEFAULT_RADIUS_KM * (SPARSE_THRESHOLD / Math.max(nearbyCount, 1)));
  }
  return DEFAULT_RADIUS_KM;
}

export function computeVolumeByDistance(
  distanceKm: number,
  maxRadiusKm: number,
  isPinned: boolean
): number {
  if (isPinned) return 1.0;

  if (distanceKm <= 0.05) return 1.0;
  if (distanceKm >= maxRadiusKm) return 0.0;

  const normalizedDist = distanceKm / maxRadiusKm;
  return Math.max(0.0, Math.min(1.0, 1.0 - Math.pow(normalizedDist, 1.5)));
}

export function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

interface ProximityRoomState {
  roomId: string;
  participants: Map<string, { joinedAt: number; latitude: number; longitude: number }>;
  centerLat: number;
  centerLng: number;
  radius: number;
}

const activeRooms = new Map<string, ProximityRoomState>();

export function assignProximityRoom(
  userId: string,
  latitude: number,
  longitude: number,
  radius: number
): { roomId: string; isNew: boolean } {
  for (const [roomId, room] of activeRooms) {
    const distToCenter = calculateDistance(latitude, longitude, room.centerLat, room.centerLng);
    if (distToCenter <= room.radius) {
      if (canJoin(room, userId)) {
        room.participants.set(userId, {
          joinedAt: Date.now(),
          latitude,
          longitude,
        });
        return { roomId, isNew: false };
      }
    }
  }

  const roomId = `proximity:${Date.now()}:${randomBytes(4).toString('hex')}`;
  const newRoom: ProximityRoomState = {
    roomId,
    participants: new Map([[userId, { joinedAt: Date.now(), latitude, longitude }]]),
    centerLat: latitude,
    centerLng: longitude,
    radius,
  };
  activeRooms.set(roomId, newRoom);
  return { roomId, isNew: true };
}

function canJoin(room: ProximityRoomState, userId: string): boolean {
  const participant = room.participants.get(userId);
  if (!participant) return true;
  return Date.now() - participant.joinedAt > HYSTERESIS_LEAVE_MS;
}

export function removeFromProximityRoom(userId: string, roomId: string): {
  shouldDelete: boolean;
  remainingParticipants: string[];
} {
  const room = activeRooms.get(roomId);
  if (!room) return { shouldDelete: true, remainingParticipants: [] };

  const participant = room.participants.get(userId);
  if (participant && Date.now() - participant.joinedAt < HYSTERESIS_DWELL_MS) {
    return { shouldDelete: false, remainingParticipants: Array.from(room.participants.keys()) };
  }

  room.participants.delete(userId);
  const remaining = Array.from(room.participants.keys());

  if (room.participants.size === 0) {
    activeRooms.delete(roomId);
    return { shouldDelete: true, remainingParticipants: [] };
  }

  return { shouldDelete: false, remainingParticipants: remaining };
}

export function cleanupStaleRooms(maxAgeMs: number = 60000): string[] {
  const deleted: string[] = [];
  const now = Date.now();
  for (const [roomId, room] of activeRooms) {
    let hasRecent = false;
    for (const p of room.participants.values()) {
      if (now - p.joinedAt < maxAgeMs) {
        hasRecent = true;
        break;
      }
    }
    if (!hasRecent) {
      activeRooms.delete(roomId);
      deleted.push(roomId);
    }
  }
  return deleted;
}
