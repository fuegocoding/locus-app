/**
 * Centralized, validated environment configuration.
 * The server refuses to start if required secrets are missing.
 */

function requireEnv(key: string): string {
  const value = process.env[key];
  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

export const JWT_SECRET = requireEnv('JWT_SECRET');

export const PORT = parseInt(process.env.PORT || '3001', 10);

export const NODE_ENV = process.env.NODE_ENV || 'development';
export const isProd = NODE_ENV === 'production';

export const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || [];

export const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

export const LIVEKIT_URL = process.env.LIVEKIT_URL || 'ws://localhost:7880';
export const LIVEKIT_API_KEY = process.env.LIVEKIT_API_KEY || 'devkey';
export const LIVEKIT_API_SECRET = process.env.LIVEKIT_API_SECRET || 'secret';

export const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
export const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
export const TWILIO_VERIFY_SERVICE_SID = process.env.TWILIO_VERIFY_SERVICE_SID;

export const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
export const FIREBASE_CLIENT_EMAIL = process.env.FIREBASE_CLIENT_EMAIL;
export const FIREBASE_PRIVATE_KEY = process.env.FIREBASE_PRIVATE_KEY;
