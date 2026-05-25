/**
 * Centralized, validated environment configuration for the frontend.
 * Refuses to build/start if required secrets are missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key]
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value
}

export const JWT_SECRET = new TextEncoder().encode(requireEnv('JWT_SECRET'))

export const NODE_ENV = process.env.NODE_ENV || 'development'
export const isProd = NODE_ENV === 'production'
