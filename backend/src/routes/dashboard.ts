import { Router } from 'express';
import {
  getPendingRequests,
  getActiveOrders,
  getReadyOrders,
  getHistoryOrders
} from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.use(authenticateToken as any);

router.get('/pending', getPendingRequests as any);
router.get('/orders', getActiveOrders as any);
router.get('/ready', getReadyOrders as any);
router.get('/history', getHistoryOrders as any);

export default router;
