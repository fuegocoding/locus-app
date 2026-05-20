import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { createServer } from 'http';
import { Server } from 'socket.io';
import authRoutes from './routes/auth';
import { setupSocketHandlers, addConnectedUser } from './socket';
import { verifyAuthToken } from './services/auth';
import { cleanupStaleRooms } from './services/proximity';
import type { ClientToServerEvents, ServerToClientEvents } from './types';

const app = express();
const httpServer = createServer(app);

const io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
  pingTimeout: 60000,
  pingInterval: 25000,
});

app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes
app.use('/api/auth', authRoutes);

// Serve Flutter web build (must be AFTER API routes)
const webDir = path.resolve(__dirname, '../../app/build/web');
if (fs.existsSync(webDir)) {
  app.use(express.static(webDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(webDir, 'index.html'));
  });
}

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

const PORT = parseInt(process.env.PORT || '3001', 10);

httpServer.listen(PORT, () => {
  console.log(`[Locus Server] Running on port ${PORT}`);
  console.log(`[Locus Server] Env: ${process.env.NODE_ENV || 'development'}`);
});

export { app, httpServer, io };
