import express from 'express';
import { createServer } from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

import { connectDB } from './config/db';
import { wsService } from './services/WebSocketService';
import { notificationService } from './services/NotificationService';

import authRoutes from './routes/auth';
import shopRoutes from './routes/shop';
import orderRoutes from './routes/order';
import dashboardRoutes from './routes/dashboard';

// Load environmental variables
dotenv.config({ path: path.join(__dirname, '../../.env') });

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';

const app = express();
const httpServer = createServer(app);

// Initialize database
connectDB();

// Initialize real-time WebSockets
wsService.init(httpServer);

// Middleware
app.use(cors({
  origin: [FRONTEND_URL, 'http://localhost:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/shops', shopRoutes);
app.use('/api/shop', shopRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Public VAPID Public Key exchange endpoint
app.get('/api/vapid-public-key', (req, res) => {
  try {
    const key = notificationService.getVapidPublicKey();
    return res.json({ publicKey: key });
  } catch (err: any) {
    return res.status(500).json({ message: 'Failed to retrieve push settings.' });
  }
});

// Root check
app.get('/', (req, res) => {
  res.send('NotifyWork API Server is online.');
});

// Port mapping
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {});
