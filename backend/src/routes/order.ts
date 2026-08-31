import { Router } from 'express';
import {
  createOrder,
  getOrderById,
  subscribeCustomerPush,
  acceptOrder,
  rejectOrder,
  editOrder,
  readyOrder,
  sendReminder,
  collectedOrder,
  searchOrders
} from '../controllers/order';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Owner search route (must be before /:id)
router.get('/search', authenticateToken as any, searchOrders as any);

// Public routes for customer flow (unprotected)
router.post('/', createOrder);
router.post('/public', createOrder);
router.post('/submit', createOrder);
router.get('/:id', getOrderById);
router.post('/:id/subscribe', subscribeCustomerPush);

// Owner protected routes - Order updates and state transitions
router.put('/:id', authenticateToken as any, editOrder as any);
router.patch('/:id', authenticateToken as any, editOrder as any);
router.put('/:id/edit', authenticateToken as any, editOrder as any);
router.patch('/:id/edit', authenticateToken as any, editOrder as any);
router.patch('/:id/accept', authenticateToken as any, acceptOrder as any);
router.patch('/:id/reject', authenticateToken as any, rejectOrder as any);
router.patch('/:id/ready', authenticateToken as any, readyOrder as any);
router.patch('/:id/reminder', authenticateToken as any, sendReminder as any);
router.patch('/:id/collected', authenticateToken as any, collectedOrder as any);

export default router;
