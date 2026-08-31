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

const allowedOrigins = [
  'https://notify-work.vercel.app',
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL?.replace(/\/$/, '')
].filter(Boolean) as string[];

const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps, curl, or Postman)
    if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
      callback(null, true);
    } else {
      callback(null, true); // Fallback to accept origin or configure strict check
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
};

const app = express();
const httpServer = createServer(app);

// Enable CORS pre-flight across all routes
app.use(cors(corsOptions));
app.options('*', cors(corsOptions) as any);

// Log active CORS configuration on startup
console.log('CORS initialized for origins:', allowedOrigins);

// Initialize database
connectDB();

// Initialize real-time WebSockets
wsService.init(httpServer);

// Body parser Middleware
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

// Root & Health check endpoints
app.get('/', (req, res) => {
  res.send('NotifyWork API Server is online.');
});

app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/api/ready', (req, res) => {
  res.status(200).json({ status: 'ready' });
});

// Port mapping
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`NotifyWork API Server running on port ${PORT}`);
  console.log('CORS initialized for origins:', allowedOrigins);
});
