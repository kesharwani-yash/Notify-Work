import { Router } from 'express';
import { registerShop, loginShop, getCurrentShop, googleAuthSync } from '../controllers/auth';
import { authenticateToken } from '../middleware/auth';

const router = Router();

router.post('/register', registerShop);
router.post('/login', loginShop);
router.post('/google', googleAuthSync);
router.get('/me', authenticateToken as any, getCurrentShop);

export default router;
