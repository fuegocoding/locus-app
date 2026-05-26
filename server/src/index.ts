import dotenv from 'dotenv';
dotenv.config();

// Validate required env vars early — this will throw if JWT_SECRET is missing
import './config/env';

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import socialRoutes from './routes/social';
import settingsRoutes from './routes/settings';
import taskRoutes from './routes/tasks';
import { setupSocketHandlers, addConnectedUser } from './socket';
import { verifyAuthToken } from './services/auth';
import { cleanupStaleRooms } from './services/proximity';
import { getRedis, isRedisConnected } from './services/redis';
import { disconnectDb } from './services/db';
import { isProd, ALLOWED_ORIGINS } from './config/env';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

const app = express();
const httpServer = createServer(app);

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "blob:", "https://*.basemaps.cartocdn.com"],
      connectSrc: ["'self'", "ws:", "wss:", "https://*.livekit.cloud"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS
app.use(cors({
  origin: isProd ? ALLOWED_ORIGINS : '*',
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Trust proxy for rate limiting behind Railway's reverse proxy
app.set('trust proxy', 1);

// Rate limiting
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 100 : 1000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const socialLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 1000 : 10000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: isProd ? 2000 : 20000,
  message: { error: 'Too many requests, please try again later' },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/auth/verify/', authLimiter);
app.use('/api/social', socialLimiter);
app.use(generalLimiter);

app.use(express.json({ limit: '1mb' }));

// Serve static files (APK downloads, etc.)
import path from 'path';
app.use(express.static(path.join(__dirname, '..', 'public')));

// Direct download endpoint (also works via /download)
app.get('/download', (_req, res) => {
  const apkPath = path.join(__dirname, '..', 'public', 'app-release.apk');
  res.download(apkPath, 'locus.apk');
});

// Health check
app.get('/health', async (_req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    services: {
      redis: false,
      livekit: false,
    },
  };

  try {
    await getRedis().ping();
    health.services.redis = true;
  } catch {
    health.services.redis = false;
  }

  res.status(200).json(health);
});

// Auth routes
app.use('/api/auth', authRoutes);

// Social routes
app.use('/api/social', socialRoutes);

// Settings routes
app.use('/api/settings', settingsRoutes);

// Tasks routes
app.use('/api/tasks', taskRoutes);

// API Status root route
app.get('/', (_req, res) => {
  res.status(200).json({ status: 'ok', service: 'locus-backend' });
});

// Socket.io
const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: isProd ? ALLOWED_ORIGINS : '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  pingTimeout: 60000,
  pingInterval: 25000,
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 1e6,
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
  console.log(`[Locus Server] Health: http://localhost:${PORT}/health`);
});

async function shutdown(signal: string) {
  console.log(`[Server] ${signal} received, shutting down gracefully`);
  httpServer.close(async () => {
    console.log('[Server] HTTP server closed');
    try {
      await disconnectDb();
      console.log('[Server] Prisma disconnected');
    } catch (err) {
      console.error('[Server] Prisma disconnect error:', err);
    }
    process.exit(0);
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

export { app, httpServer, io };
