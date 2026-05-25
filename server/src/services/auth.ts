import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { randomInt } from 'crypto';
import { JWT_SECRET } from '../config/env';

export interface TokenPayload {
  userId: string;
  phone: string;
}

export function generateAuthToken(userId: string, phone: string): string {
  return jwt.sign({ userId, phone }, JWT_SECRET, { expiresIn: '30d' });
}

export function verifyAuthToken(token: string): TokenPayload {
  const payload = jwt.verify(token, JWT_SECRET) as TokenPayload;
  return payload;
}

export function generateUserId(): string {
  return uuidv4();
}

export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(randomInt(0, chars.length));
  }
  return code;
}
