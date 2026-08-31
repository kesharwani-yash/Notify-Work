import { Router } from 'express';
import {
  getPendingRequests,
  getActiveOrders,
  getReadyOrders,
  getHistoryOrders
} from '../controllers/dashboard';
import { authenticateToken } from '../middleware/auth';

const router = Router();
 
// Health-check & ready endpoint (returns { status: 'ready' } if unauthenticated, or ready orders if authenticated)
router.get('/ready', (req, res, next) => {
  const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;
  if (!authHeader) {
    return res.status(200).json({ status: 'ready' });
  }
  return (authenticateToken as any)(req, res, () => (getReadyOrders as any)(req, res));
});

router.use(authenticateToken as any);

router.get('/pending', getPendingRequests as any);
router.get('/orders', getActiveOrders as any);
router.get('/history', getHistoryOrders as any);

export default router;
