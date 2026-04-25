import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import path from 'path';
import { prisma } from './lib/prisma';
import { createServer } from 'http';
import { Server } from 'socket.io';
import apiRoutes from './routes/api';

const app = express();
const httpServer = createServer(app);
const FRONTEND_URL = process.env.FRONTEND_URL || '*';

const io = new Server(httpServer, {
  cors: {
    origin: FRONTEND_URL,
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3001;

app.use(cors({ origin: FRONTEND_URL }));
app.use(express.json());

// API Routes
app.use('/api', apiRoutes);

// Serve frontend static files
const distPath = path.join(__dirname, '../../MenuApp-Frontend/dist');
app.use(express.static(distPath));

// SPA fallback — all non-API routes return index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('Client disconnected');
  });
});

// Start server
httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

export { io, prisma };
