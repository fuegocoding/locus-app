import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import socialRoutes from './routes/social';
import { setupSocketHandlers, addConnectedUser } from './socket';
import { verifyAuthToken } from './services/auth';
import { cleanupStaleRooms } from './services/proximity';
import { getRedis, isRedisConnected } from './services/redis';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

const app = express();
const httpServer = createServer(app);

const isProd = process.env.NODE_ENV === 'production';

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false,
}));

// CORS
const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || ['*'];
app.use(cors({
  origin: isProd ? allowedOrigins : '*',
  methods: ['GET', 'POST', 'PATCH', 'OPTIONS'],
  credentials: true,
}));

// Trust proxy for rate limiting behind Railway's reverse proxy
app.set('trust proxy', 1);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/verify/', authLimiter);
app.use(generalLimiter);

app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      redis: 'unknown',
      livekit: 'unknown',
    },
  };

  try {
    await getRedis().ping();
    health.services.redis = 'connected';
  } catch {
    health.services.redis = 'disconnected';
    // Don't fail health check - Redis may not be configured yet
    health.status = 'ok';
  }

  res.status(200).json(health);
});

// Auth routes
app.use('/api/auth', authRoutes);

// Social routes
app.use('/api/social', socialRoutes);

// Serve Flutter web build (must be AFTER API routes)
const webDir = path.resolve(__dirname, '../../app/build/web');
if (fs.existsSync(webDir)) {
  app.use(express.static(webDir, {
    maxAge: isProd ? '1d' : 0,
    etag: true,
  }));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDir, 'index.html'));
  });
}

// Socket.io
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: isProd ? allowedOrigins : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  allowEIO3: true,
});

app.set('io', io);

// Socket.io auth middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) {
    return next(new Error('Authentication token required'));
  }
  try {
    const payload = verifyAuthToken(token);
    (socket as any).userId = payload.userId;
    (socket as any).phone = payload.phone;
    next();
  } catch {
    next(new Error('Invalid authentication token'));
  }
});

// Track connected users after auth
io.on('connection', (socket) => {
  const userId = (socket as any).userId;
  if (userId) {
    addConnectedUser(socket.id, {
      socketId: socket.id,
      userId,
      mode: 'proximity',
      latitude: 0,
      longitude: 0,
      speed: 0,
      heading: 0,
    });
    console.log(`[Socket] User ${userId} connected (${socket.id})`);
  }
});

// Setup all socket event handlers
setupSocketHandlers(io);

// Cleanup stale proximity rooms periodically
setInterval(() => {
  const deleted = cleanupStaleRooms();
  if (deleted.length > 0) {
    console.log(`[Proximity] Cleaned ${deleted.length} stale rooms`);
  }
}, 30000);

// Cleanup stale presence entries every 60 seconds
setInterval(async () => {
  if (!isRedisConnected()) return;
  try {
    const r = getRedis();
    const keys = await r.keys('locus:presence:*');
    let cleaned = 0;
    for (const key of keys) {
      const ttl = await r.ttl(key);
      if (ttl === -1) {
        await r.expire(key, 30);
        cleaned++;
      }
    }
    if (cleaned > 0) {
      console.log(`[Presence] Fixed ${cleaned} entries without TTL`);
    }
  } catch (err) {
    console.error('[Presence] Cleanup error:', err);
  }
}, 60000);

const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`[Locus Server] Running on port ${PORT}`);
  console.log(`[Locus Server] Env: ${process.env.NODE_ENV || 'development'}`);
  console.log(`[Locus Server] Health: http://localhost:${PORT}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('[Server] SIGTERM received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[Server] SIGINT received, shutting down gracefully');
  httpServer.close(() => {
    console.log('[Server] HTTP server closed');
    process.exit(0);
  });
});

export { app, httpServer, io };
