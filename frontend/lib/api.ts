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

// ---------- Convoy ----------

export const convoyApi = {
  getByCode: (code: string) =>
    request<{ id: string; name: string; memberCount: number }>(`/convoy/${code}`),
}
