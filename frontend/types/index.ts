// Mirrors server/src/types/index.ts — keep in sync

export type PrivacyMode = 'open' | 'friends-only' | 'convoy-only' | 'invisible'

export interface User {
  id: string
  phone: string
  displayName: string
  avatar?: string
  vehicleTag?: string
  privacyMode: PrivacyMode
  points: number
  premium: boolean
  pins: Pin[]
  createdAt: string
  updatedAt: string
}

export interface PresenceUpdate {
  userId: string
  latitude: number
  longitude: number
  speed: number
  heading: number
  privacyMode: PrivacyMode
  mode: 'proximity' | 'convoy'
  convoyId?: string
  timestamp: number
}

export interface Convoy {
  id: string
  name: string
  creatorId: string
  accessLevel: 'open' | 'invite-only'
  inviteCode: string
  members: string[]
  livekitRoom: string
  createdAt: string
  updatedAt: string
}

export interface Pin {
  userId: string
  targetUserId: string
  pinnedAt: string
}

export interface Task {
  id: string
  type: 'referral' | 'watch-ad'
  description: string
  pointsReward: number
  completions: TaskCompletion[]
}

export interface TaskCompletion {
  userId: string
  completedAt: string
}

export interface PremiumFeature {
  id: string
  name: string
  description: string
  pointCost: number
  type: 'cosmetic' | 'functional'
}

// Socket event types
export interface ClientToServerEvents {
  'presence:update': (data: { latitude: number; longitude: number; speed: number; heading: number }) => void
  'mode:switch': (data: { mode: 'proximity' | 'convoy'; convoyId?: string }) => void
  'convoy:create': (data: { name: string; accessLevel: 'open' | 'invite-only' }) => void
  'convoy:join': (data: { inviteCode: string }) => void
  'convoy:leave': () => void
  'user:pin': (data: { targetUserId: string }) => void
  'user:unpin': (data: { targetUserId: string }) => void
  'user:mute': (data: { targetUserId: string }) => void
  'user:block': (data: { targetUserId: string }) => void
  'user:report': (data: { targetUserId: string; reason?: string }) => void
  'audio:push-to-talk': (data: { speaking: boolean }) => void
  'audio:toggle-mic': (data: { muted: boolean }) => void
  'video:start': () => void
  'video:stop': () => void
}

export interface ServerToClientEvents {
  'presence:neighbors': (data: PresenceUpdate[]) => void
  'presence:update': (data: PresenceUpdate) => void
  'presence:remove': (data: { userId: string }) => void
  'convoy:created': (data: Convoy) => void
  'convoy:joined': (data: { convoy: Convoy; members: PresenceUpdate[] }) => void
  'convoy:member-joined': (data: PresenceUpdate) => void
  'convoy:member-left': (data: { userId: string }) => void
  'convoy:left': (data: { convoyId: string }) => void
  'audio:token': (data: { room: string; token: string; identity: string }) => void
  'audio:speaking': (data: { userId: string; speaking: boolean }) => void
  'audio:volume-update': (data: { userId: string; volume: number }) => void
  'video:participant-started': (data: { userId: string }) => void
  'video:participant-stopped': (data: { userId: string }) => void
  'error': (data: { message: string; code: string }) => void
}
