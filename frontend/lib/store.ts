import { create } from 'zustand'
import type { User, PresenceUpdate, Convoy } from '@/types'
import type { UserSettings, TasksResponse } from '@/lib/api'

interface AppState {
  // Auth
  user: User | null
  token: string | null
  isAuthenticated: boolean
  get hasProfile(): boolean

  // Mode
  mode: 'proximity' | 'convoy'
  currentConvoy: Convoy | null

  // Presence
  latitude: number
  longitude: number
  speed: number
  heading: number
  nearbyUsers: PresenceUpdate[]

  // Audio / Video
  micMuted: boolean
  pushToTalk: boolean
  videoEnabled: boolean
  volumes: Record<string, number>
  speaking: Record<string, boolean>
  remoteVideoEnabled: Record<string, boolean>

  // Settings
  settings: UserSettings | null

  // Tasks
  tasks: TasksResponse | null

  // UI
  error: string | null
  isLoading: boolean

  // Actions — auth
  setUser: (user: User | null) => void
  setToken: (token: string | null) => void
  clearAuth: () => void

  // Actions — mode
  setMode: (mode: 'proximity' | 'convoy') => void
  setCurrentConvoy: (convoy: Convoy | null) => void

  // Actions — presence
  setPosition: (lat: number, lng: number, speed: number, heading: number) => void
  setNearbyUsers: (users: PresenceUpdate[]) => void
  upsertNearbyUser: (user: PresenceUpdate) => void
  removeNearbyUser: (userId: string) => void

  // Actions — audio
  setMicMuted: (muted: boolean) => void
  setPushToTalk: (enabled: boolean) => void
  setVolume: (userId: string, volume: number) => void
  setSpeaking: (userId: string, speaking: boolean) => void

  // Actions — video
  setVideoEnabled: (enabled: boolean) => void
  setRemoteVideo: (userId: string, enabled: boolean) => void

  // Actions — settings
  setSettings: (settings: UserSettings | null) => void
  updateSettings: (settings: Partial<UserSettings>) => void

  // Actions — tasks
  setTasks: (tasks: TasksResponse | null) => void
  updatePoints: (points: number) => void

  // Actions — UI
  setError: (error: string | null) => void
  setLoading: (loading: boolean) => void
  clearError: () => void
}

export const useAppStore = create<AppState>((set, get) => ({
  // Auth
  user: null,
  token: null,
  isAuthenticated: false,
  get hasProfile() {
    const u = get().user
    return u !== null && !u.displayName.startsWith('User_')
  },

  // Mode
  mode: 'proximity',
  currentConvoy: null,

  // Presence
  latitude: 0,
  longitude: 0,
  speed: 0,
  heading: 0,
  nearbyUsers: [],

  // Audio / Video
  micMuted: false,
  pushToTalk: false,
  videoEnabled: false,
  volumes: {},
  speaking: {},
  remoteVideoEnabled: {},

  // Settings
  settings: null,

  // Tasks
  tasks: null,

  // UI
  error: null,
  isLoading: false,

  // Auth actions
  setUser: (user) => set({ user, isAuthenticated: user !== null }),
  setToken: (token) => set({ token }),
  clearAuth: () =>
    set({
      user: null,
      token: null,
      isAuthenticated: false,
      nearbyUsers: [],
      currentConvoy: null,
      mode: 'proximity',
    }),

  // Mode actions
  setMode: (mode) => set({ mode }),
  setCurrentConvoy: (convoy) => set({ currentConvoy: convoy }),

  // Presence actions
  setPosition: (latitude, longitude, speed, heading) =>
    set({ latitude, longitude, speed, heading }),
  setNearbyUsers: (users) => set({ nearbyUsers: users }),
  upsertNearbyUser: (user) =>
    set((state) => {
      const idx = state.nearbyUsers.findIndex((u) => u.userId === user.userId)
      if (idx >= 0) {
        const next = [...state.nearbyUsers]
        next[idx] = user
        return { nearbyUsers: next }
      }
      return { nearbyUsers: [...state.nearbyUsers, user] }
    }),
  removeNearbyUser: (userId) =>
    set((state) => ({ nearbyUsers: state.nearbyUsers.filter((u) => u.userId !== userId) })),

  // Audio actions
  setMicMuted: (micMuted) => set({ micMuted }),
  setPushToTalk: (pushToTalk) => set({ pushToTalk }),
  setVolume: (userId, volume) =>
    set((state) => ({ volumes: { ...state.volumes, [userId]: volume } })),
  setSpeaking: (userId, speaking) =>
    set((state) => ({ speaking: { ...state.speaking, [userId]: speaking } })),

  // Video actions
  setVideoEnabled: (videoEnabled) => set({ videoEnabled }),
  setRemoteVideo: (userId, enabled) =>
    set((state) => ({ remoteVideoEnabled: { ...state.remoteVideoEnabled, [userId]: enabled } })),

  // Settings actions
  setSettings: (settings) => set({ settings }),
  updateSettings: (patch) =>
    set((state) => ({
      settings: state.settings ? { ...state.settings, ...patch } : null,
    })),

  // Tasks actions
  setTasks: (tasks) => set({ tasks }),
  updatePoints: (points) =>
    set((state) => ({
      user: state.user ? { ...state.user, points } : null,
      tasks: state.tasks ? { ...state.tasks, points } : null,
    })),

  // UI actions
  setError: (error) => set({ error }),
  setLoading: (isLoading) => set({ isLoading }),
  clearError: () => set({ error: null }),
}))
