export interface User {
  id: string;
  phone: string;
  displayName: string;
  avatar?: string;
  vehicleTag?: string;
  privacyMode: PrivacyMode;
  points: number;
  premium: boolean;
  pins: Pin[];
  createdAt: Date;
  updatedAt: Date;
}

export type PrivacyMode = 'open' | 'friends-only' | 'convoy-only' | 'invisible';

export interface PresenceUpdate {
  userId: string;
  latitude: number;
  longitude: number;
  speed: number;
  heading: number;
  privacyMode: PrivacyMode;
  mode: 'proximity' | 'convoy';
  convoyId?: string;
  displayName?: string;
  anonymousMode?: boolean;
  timestamp: number;
}

export interface ProximityRoom {
  id: string;
  centerLat: number;
  centerLng: number;
  radius: number;
  mode: 'driving' | 'walking' | 'event';
  participants: string[];
  livekitRoom: string;
  createdAt: number;
  updatedAt: number;
}

export interface Convoy {
  id: string;
  name: string;
  creatorId: string;
  accessLevel: 'open' | 'invite-only';
  inviteCode: string;
  members: string[];
  livekitRoom: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Pin {
  userId: string;
  targetUserId: string;
  pinnedAt: Date;
}

export interface BlockRecord {
  blockerId: string;
  blockedId: string;
  createdAt: Date;
}

export interface ReportRecord {
  reporterId: string;
  reportedId: string;
  reason?: string;
  createdAt: Date;
}

export interface Task {
  id: string;
  type: 'referral' | 'watch-ad';
  description: string;
  pointsReward: number;
  completions: TaskCompletion[];
}

export interface TaskCompletion {
  userId: string;
  completedAt: Date;
}

export interface PremiumFeature {
  id: string;
  name: string;
  description: string;
  pointCost: number;
  type: 'cosmetic' | 'functional';
}

export interface AudioState {
  userId: string;
  mode: 'proximity' | 'convoy';
  livekitRoom: string;
  muted: boolean;
  pushToTalk: boolean;
  volume: number;
  pinnedUsers: string[];
}

export interface ClientToServerEvents {
  'presence:update': (data: {
    latitude: number;
    longitude: number;
    speed: number;
    heading: number;
  }) => void;
  'mode:switch': (data: { mode: 'proximity' | 'convoy'; convoyId?: string }) => void;
  'convoy:create': (data: { name: string; accessLevel: 'open' | 'invite-only' }) => void;
  'convoy:join': (data: { inviteCode: string }) => void;
  'convoy:leave': () => void;
  'user:pin': (data: { targetUserId: string }) => void;
  'user:unpin': (data: { targetUserId: string }) => void;
  'user:mute': (data: { targetUserId: string }) => void;
  'user:unmute': (data: { targetUserId: string }) => void;
  'user:block': (data: { targetUserId: string }) => void;
  'user:report': (data: { targetUserId: string; reason?: string }) => void;
  'audio:push-to-talk': (data: { speaking: boolean }) => void;
  'audio:toggle-mic': (data: { muted: boolean }) => void;
  'video:start': () => void;
  'video:stop': () => void;
}

export interface ServerToClientEvents {
  'presence:neighbors': (data: PresenceUpdate[]) => void;
  'presence:update': (data: PresenceUpdate) => void;
  'presence:remove': (data: { userId: string }) => void;
  'convoy:created': (data: Convoy) => void;
  'convoy:joined': (data: { convoy: Convoy; members: PresenceUpdate[] }) => void;
  'convoy:member-joined': (data: PresenceUpdate) => void;
  'convoy:member-left': (data: { userId: string }) => void;
  'convoy:left': (data: { convoyId: string }) => void;
  'audio:token': (data: { room: string; token: string; serverUrl?: string; identity: string }) => void;
  'audio:speaking': (data: { userId: string; speaking: boolean }) => void;
  'audio:volume-update': (data: { userId: string; volume: number }) => void;
  'error': (data: { message: string; code: string }) => void;
  'video:participant-started': (data: { userId: string }) => void;
  'video:participant-stopped': (data: { userId: string }) => void;
  'invite:received': (data: {
    id: string;
    convoyId: string;
    convoyName: string;
    senderId: string;
    senderName: string;
  }) => void;
  'invite:responded': (data: {
    id: string;
    status: 'accepted' | 'declined';
    receiverId: string;
    receiverName: string;
  }) => void;
  'account:deleted': () => void;
  'friends:location': (data: {
    userId: string;
    displayName: string;
    latitude: number;
    longitude: number;
    heading: number;
  }) => void;
  'user:pinned-you': (data: {
    pinnedByUserId: string;
    pinnedByDisplayName: string;
  }) => void;
  'friend:added': (data: {
    friendId: string;
    displayName?: string;
  }) => void;
}

