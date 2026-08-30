import { Router } from 'express';
import { getShopBySlug, getShopProfile, updateShopProfile } from '../controllers/shop';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Owner Protected Profile Routes (MUST be defined before /:shopId parameter route)
router.get('/profile', authenticateToken as any, getShopProfile as any);
router.put('/profile', authenticateToken as any, updateShopProfile as any);

// Public Shop Lookup Routes (unprotected for customer QR submission)
router.get('/slug/:shopId', getShopBySlug);
router.get('/:shopId', getShopBySlug);

export default router;
