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
  methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
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

// Privacy policy & Terms of Service
app.get('/privacy', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Privacy Policy - Locus</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6;color:#ccc;background:#0d1117}h1,h2{color:#C4B5FD}a{color:#6C63FF}</style>
</head><body>
<h1>Privacy Policy</h1><p><em>Last updated: May 2026</em></p>
<h2>1. Information We Collect</h2>
<p><strong>Account Data:</strong> Phone number (via Twilio Verify), display name, avatar.</p>
<p><strong>Location Data:</strong> Real-time GPS coordinates while the app is in use (foreground or background).</p>
<p><strong>Audio Data:</strong> Real-time voice audio is transmitted via LiveKit Cloud when you join a proximity room or convoy. Audio is not recorded or stored.</p>
<p><strong>Device Data:</strong> Push notification token, device model, OS version.</p>
<h2>2. How We Use Information</h2>
<p>To provide proximity-based voice chat, convoy management, social features, and push notifications. Location data is shared only with other users in the same proximity area or convoy. We do not sell your data.</p>
<h2>3. Data Retention</h2>
<p>Location data is retained in memory only while you are active. Account data is retained until you delete your account. You can delete your account at any time from Settings.</p>
<h2>4. Third-Party Services</h2>
<p>Twilio (phone verification), LiveKit Cloud (audio), Railway (hosting), Redis (caching), PostgreSQL (database).</p>
<h2>5. Your Rights</h2>
<p>You may request data export, correction, or deletion by contacting us. Account deletion is self-service from the app.</p>
<h2>6. Contact</h2>
<p>locus@fuegocoding.com</p>
</body></html>`);
});

app.get('/terms', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Terms of Service - Locus</title>
<style>body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:720px;margin:40px auto;padding:0 20px;line-height:1.6;color:#ccc;background:#0d1117}h1,h2{color:#C4B5FD}a{color:#6C63FF}</style>
</head><body>
<h1>Terms of Service</h1><p><em>Last updated: May 2026</em></p>
<h2>1. Acceptance</h2>
<p>By using Locus you agree to these terms. If you do not agree, do not use the app.</p>
<h2>2. Eligibility</h2>
<p>You must be at least 13 years old. If you are between 13 and the age of majority in your jurisdiction, you must have parental consent.</p>
<h2>3. Conduct</h2>
<p>You agree not to harass, abuse, or spam other users. Voice chat must comply with all applicable laws. We reserve the right to block or remove users who violate these terms.</p>
<h2>4. Intellectual Property</h2>
<p>The Locus name, logo, and brand are our property. You may not copy or reproduce the app without permission.</p>
<h2>5. Limitation of Liability</h2>
<p>Locus is provided "as is" without warranties. We are not liable for damages arising from use of the app.</p>
<h2>6. Changes</h2>
<p>We may update these terms. Continued use after changes constitutes acceptance.</p>
<h2>7. Contact</h2>
<p>locus@fuegocoding.com</p>
</body></html>`);
});

// Landing page (root)
app.get('/', (_req, res) => {
  res.send(`<!DOCTYPE html>
<html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Locus — Proximity Voice Chat &amp; Convoy App</title>
<meta name="description" content="Locus connects you with nearby drivers through real-time voice chat. Find friends, join convoys, and explore together.">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#0d1117;color:#e6edf3;overflow-x:hidden}
.hero{min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:2rem;position:relative}
.hero::before{content:'';position:absolute;top:0;left:0;right:0;bottom:0;background:radial-gradient(ellipse at 50% 0%,rgba(108,99,255,0.08) 0%,transparent 70%);pointer-events:none}
.hero h1{font-size:clamp(3rem,8vw,5rem);font-weight:900;letter-spacing:-0.03em;background:linear-gradient(135deg,#C4B5FD,#6C63FF);-webkit-background-clip:text;-webkit-text-fill-color:transparent;margin-bottom:0.5rem;line-height:1.1}
.hero p{font-size:clamp(1rem,2.5vw,1.3rem);color:#8b949e;max-width:560px;margin-bottom:2.5rem;line-height:1.6}
.hero .badge{display:inline-flex;align-items:center;gap:6px;background:rgba(108,99,255,0.12);border:1px solid rgba(108,99,255,0.25);border-radius:100px;padding:6px 16px;font-size:0.85rem;color:#C4B5FD;margin-bottom:1.5rem}
.cta-group{display:flex;gap:1rem;flex-wrap:wrap;justify-content:center}
.cta{display:inline-flex;align-items:center;gap:8px;padding:14px 32px;border-radius:12px;font-size:1rem;font-weight:600;text-decoration:none;transition:all 0.2s}
.cta.primary{background:#6C63FF;color:#fff}
.cta.primary:hover{background:#5a52e0;transform:translateY(-1px)}
.cta.secondary{background:rgba(255,255,255,0.06);color:#e6edf3;border:1px solid rgba(255,255,255,0.1)}
.cta.secondary:hover{background:rgba(255,255,255,0.1)}
.features{padding:6rem 2rem;max-width:960px;margin:0 auto}
.features h2{font-size:2rem;font-weight:700;margin-bottom:3rem;text-align:center}
.feature-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:1.5rem}
.feature-card{background:rgba(255,255,255,0.03);border:1px solid rgba(255,255,255,0.06);border-radius:16px;padding:1.5rem;transition:border-color 0.2s}
.feature-card:hover{border-color:rgba(108,99,255,0.3)}
.feature-card .icon{width:40px;height:40px;background:rgba(108,99,255,0.12);border-radius:10px;display:flex;align-items:center;justify-content:center;margin-bottom:1rem;font-size:1.2rem}
.feature-card h3{font-size:1.1rem;font-weight:600;margin-bottom:0.5rem}
.feature-card p{font-size:0.9rem;color:#8b949e;line-height:1.5}
.footer{padding:3rem 2rem;text-align:center;border-top:1px solid rgba(255,255,255,0.06)}
.footer a{color:#8b949e;text-decoration:none;margin:0 12px;font-size:0.85rem}
.footer a:hover{color:#C4B5FD}
</style>
</head><body>
<section class="hero">
  <div class="badge">&#9889; Real-time proximity voice</div>
  <h1>Locus</h1>
  <p>Connect with nearby drivers through real-time voice chat. See who&rsquo;s around, create convoys, and explore together &mdash; all from your phone.</p>
  <div class="cta-group">
    <a class="cta primary" href="/app">Launch Web App</a>
    <a class="cta secondary" href="#">Download for iOS</a>
    <a class="cta secondary" href="#">Download for Android</a>
  </div>
</section>
<section class="features">
  <h2>Why Locus?</h2>
  <div class="feature-grid">
    <div class="feature-card">
      <div class="icon">&#128226;</div>
      <h3>Radar Nearby</h3>
      <p>See other drivers on the map in real time. Tap to chat or pin them for later.</p>
    </div>
    <div class="feature-card">
      <div class="icon">&#128664;</div>
      <h3>Convoys</h3>
      <p>Create or join a convoy with a shareable code. Voice chat with the whole group.</p>
    </div>
    <div class="feature-card">
      <div class="icon">&#128101;</div>
      <h3>Friends</h3>
      <p>Follow other drivers, become mutual friends, and see them on the map.</p>
    </div>
    <div class="feature-card">
      <div class="icon">&#128274;</div>
      <h3>Privacy First</h3>
      <p>Choose your visibility: open, friends-only, or invisible. Full account deletion available.</p>
    </div>
    <div class="feature-card">
      <div class="icon">&#127918;</div>
      <h3>Earn Points</h3>
      <p>Complete tasks, refer friends, and unlock premium cosmetics and features.</p>
    </div>
    <div class="feature-card">
      <div class="icon">&#128640;</div>
      <h3>Always Improving</h3>
      <p>New features ship regularly. Join the community and shape the roadmap.</p>
    </div>
  </div>
</section>
<footer class="footer">
  <a href="/privacy">Privacy</a>
  <a href="/terms">Terms</a>
  <a href="/health">Status</a>
  <p style="margin-top:1rem;font-size:0.75rem;color:#484f58">&copy; 2026 Locus by Fuego Coding</p>
</footer>
</body></html>`);
});

// Serve Flutter web build at /app
const webDir = path.resolve(__dirname, '../../app/build/web');
if (fs.existsSync(webDir)) {
  app.use('/app', express.static(webDir, {
    maxAge: isProd ? '1d' : 0,
    etag: true,
  }));
  app.get('/app/*', (_req, res) => {
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
