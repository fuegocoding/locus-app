/**
 * Typed fetch wrappers for Next.js API routes (which proxy to the backend).
 * All auth calls go through /api/auth/* — never directly to the backend from the client.
 */

const BASE = '/api'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...init?.headers,
    },
    credentials: 'include', // include httpOnly cookies
  })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: 'Unknown error' }))
    throw new ApiError(res.status, body.error || body.message || 'Request failed')
  }

  return res.json() as Promise<T>
}

export class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'ApiError'
  }
}

// ---------- Auth ----------

export const authApi = {
  sendCode: (phone: string) =>
    request<{ success: boolean }>('/auth/send-code', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }),

  verify: (phone: string, code: string) =>
    request<{ userId: string; displayName: string }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ phone, code }),
    }),

  me: () =>
    request<{ id: string; displayName: string; points: number; premium: boolean; privacyMode: string }>('/auth/me'),

  updateProfile: (data: { displayName?: string; privacyMode?: string; vehicleTag?: string }) =>
    request<{ displayName: string }>('/auth/me', {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', { method: 'POST' }),

  /** Returns the JWT for socket connection — reads httpOnly cookie server-side */
  getSocketToken: () =>
    request<{ token: string }>('/auth/session'),

  checkUsername: (username: string) =>
    request<{ available: boolean }>('/auth/check-username', {
      method: 'POST',
      body: JSON.stringify({ username }),
    }),
}

// ---------- Settings ----------

export interface UserSettings {
  speedUnit: 'auto' | 'kmh' | 'mph'
  pushToTalk: boolean
  anonymousMode: boolean
  privacyMode: string
}

export const settingsApi = {
  get: () => request<UserSettings>('/settings'),
  update: (data: Partial<UserSettings>) =>
    request<UserSettings>('/settings', { method: 'PATCH', body: JSON.stringify(data) }),
}

// ---------- Tasks ----------

export interface TaskItem {
  id: string
  type: 'referral' | 'watch-ad'
  description: string
  pointsReward: number
  repeatable: boolean
  cooldownHours?: number
  completed: boolean
  completedAt: string | null
}

export interface PremiumFeatureItem {
  id: string
  name: string
  cost: number
  type: 'cosmetic' | 'functional'
  icon: string
  redeemed: boolean
}

export interface TasksResponse {
  points: number
  tasks: TaskItem[]
  premiumFeatures: PremiumFeatureItem[]
  redeemedFeatures: { featureId: string; redeemedAt: string; expiresAt: string | null }[]
}

export interface TaskCompleteResult {
  success: boolean
  pointsEarned: number
  totalPoints: number
  alreadyCompleted: boolean
}

export interface RedeemResult {
  success: boolean
  featureId: string
  pointsSpent: number
  remainingPoints: number
}

export const tasksApi = {
  get: () => request<TasksResponse>('/tasks'),
  complete: (taskType: string, metadata?: Record<string, unknown>) =>
    request<TaskCompleteResult>('/tasks/complete', {
      method: 'POST',
      body: JSON.stringify({ taskType, metadata }),
    }),
  redeem: (featureId: string) =>
    request<RedeemResult>('/tasks/redeem', {
      method: 'POST',
      body: JSON.stringify({ featureId }),
    }),
}

// ---------- Convoy ----------

export const convoyApi = {
  getByCode: (code: string) =>
    request<{ id: string; name: string; memberCount: number }>(`/convoy/${code}`),
}
