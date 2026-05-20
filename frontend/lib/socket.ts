import { io, Socket } from 'socket.io-client'
import type { ClientToServerEvents, ServerToClientEvents } from '@/types'
import { useAppStore } from './store'

type LocusSocket = Socket<ServerToClientEvents, ClientToServerEvents>

let _socket: LocusSocket | null = null

export function getSocket(): LocusSocket {
  if (!_socket) {
    _socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:3001', {
      transports: ['websocket'],
      autoConnect: false,
    })
    attachListeners(_socket)
  }
  return _socket
}

export async function connectSocket(token: string): Promise<void> {
  const s = getSocket()
  if (s.connected) return
  s.auth = { token }
  s.connect()
}

export function disconnectSocket(): void {
  if (_socket?.connected) _socket.disconnect()
  _socket = null
}

function attachListeners(s: LocusSocket): void {
  const store = useAppStore.getState

  s.on('presence:neighbors', (users) => {
    store().setNearbyUsers(users)
  })

  s.on('presence:update', (user) => {
    store().upsertNearbyUser(user)
  })

  s.on('presence:remove', ({ userId }) => {
    store().removeNearbyUser(userId)
  })

  s.on('audio:volume-update', ({ userId, volume }) => {
    store().setVolume(userId, volume)
  })

  s.on('audio:speaking', ({ userId, speaking }) => {
    store().setSpeaking(userId, speaking)
  })

  s.on('convoy:created', (convoy) => {
    store().setCurrentConvoy(convoy)
    store().setMode('convoy')
  })

  s.on('convoy:joined', ({ convoy }) => {
    store().setCurrentConvoy(convoy)
    store().setMode('convoy')
  })

  s.on('convoy:left', () => {
    store().setCurrentConvoy(null)
    store().setMode('proximity')
  })

  s.on('video:participant-started', ({ userId }) => {
    store().setRemoteVideo(userId, true)
  })

  s.on('video:participant-stopped', ({ userId }) => {
    store().setRemoteVideo(userId, false)
  })

  s.on('error', ({ message }) => {
    store().setError(message)
  })
}

// ---------- Typed emitters ----------

export const socketActions = {
  updatePresence: (lat: number, lng: number, speed: number, heading: number) =>
    _socket?.emit('presence:update', { latitude: lat, longitude: lng, speed, heading }),

  switchMode: (mode: 'proximity' | 'convoy', convoyId?: string) =>
    _socket?.emit('mode:switch', { mode, convoyId }),

  createConvoy: (name: string) =>
    _socket?.emit('convoy:create', { name, accessLevel: 'invite-only' }),

  joinConvoy: (inviteCode: string) =>
    _socket?.emit('convoy:join', { inviteCode }),

  leaveConvoy: () =>
    _socket?.emit('convoy:leave'),

  pinUser: (userId: string) =>
    _socket?.emit('user:pin', { targetUserId: userId }),

  unpinUser: (userId: string) =>
    _socket?.emit('user:unpin', { targetUserId: userId }),

  muteUser: (userId: string) =>
    _socket?.emit('user:mute', { targetUserId: userId }),

  blockUser: (userId: string) =>
    _socket?.emit('user:block', { targetUserId: userId }),

  reportUser: (userId: string, reason?: string) =>
    _socket?.emit('user:report', { targetUserId: userId, reason }),

  pushToTalk: (speaking: boolean) =>
    _socket?.emit('audio:push-to-talk', { speaking }),

  toggleMic: (muted: boolean) =>
    _socket?.emit('audio:toggle-mic', { muted }),

  startVideo: () =>
    _socket?.emit('video:start'),

  stopVideo: () =>
    _socket?.emit('video:stop'),
}
