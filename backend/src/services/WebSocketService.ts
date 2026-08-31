import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';

class WebSocketService {
  private io: Server | null = null;

  init(server: HttpServer) {
    const allowedOrigins = [
      'https://notify-work.vercel.app',
      'http://localhost:5173',
      'http://localhost:3000',
      process.env.FRONTEND_URL?.replace(/\/$/, '')
    ].filter(Boolean) as string[];

    this.io = new Server(server, {
      cors: {
        origin: (origin: any, callback: any) => {
          if (!origin || allowedOrigins.includes(origin) || allowedOrigins.includes('*')) {
            callback(null, true);
          } else {
            callback(null, true);
          }
        },
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        credentials: true
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
      pingTimeout: 30000,
      pingInterval: 25000
    });

    this.io.on('connection', (socket: Socket) => {
      // Join order-specific room for real-time customer updates
      socket.on('join-order', (orderId: string) => {
        if (orderId) {
          socket.join(`order:${orderId}`);
          socket.join(orderId);
        }
      });

      socket.on('joinRoom', (orderId: string) => {
        if (orderId) {
          socket.join(`order:${orderId}`);
          socket.join(orderId);
        }
      });

      // Join shop-specific room for real-time owner updates (e.g. pending list)
      socket.on('join-shop', (shopId: string) => {
        if (shopId) {
          socket.join(`shop:${shopId}`);
          socket.join(shopId);
        }
      });

      socket.on('disconnect', () => {
        // Safe disconnect
      });
    });
  }

  // Notify a customer about their order updates
  emitOrderUpdate(orderId: string, orderData: any) {
    if (this.io && orderId) {
      const payload = typeof orderData === 'object' && orderData !== null
        ? { orderId, ...orderData }
        : { orderId, data: orderData };
      
      this.io.to(`order:${orderId}`).to(orderId).emit('order-update', payload);
      this.io.to(`order:${orderId}`).to(orderId).emit('orderUpdate', payload);
      this.io.emit('order-update', payload);
    }
  }

  // Notify owner dashboard about a new pending request (room target & global broadcast)
  emitNewOrder(shopId: string, orderData: any) {
    if (this.io) {
      const payload = typeof orderData === 'object' && orderData !== null
        ? { shopId, ...orderData }
        : { shopId, data: orderData };

      if (shopId) {
        this.io.to(`shop:${shopId}`).to(shopId).emit('new-order', payload);
        this.io.to(`shop:${shopId}`).to(shopId).emit('new_order', payload);
      }

      // Always broadcast to ALL connected owner sockets to guarantee zero missed updates
      this.io.emit('new-order', payload);
      this.io.emit('new_order', payload);
    }
  }
}

export const wsService = new WebSocketService();
