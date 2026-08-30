import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { auth as firebaseAuth, db } from '../config/firebaseAdmin';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_notifywork_2026_dev_env_hash';

export interface AuthRequest extends Request {
  user?: any;
  shop?: {
    id: string;
    shopId: string;
    email: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = (req.headers['authorization'] || req.headers['Authorization']) as string | undefined;

  if (!authHeader) {
    return res.status(401).json({ message: 'Access token missing or invalid.' });
  }

  let token = authHeader;
  if (authHeader.startsWith('Bearer ')) {
    token = authHeader.substring(7).trim();
  }

  if (!token) {
    return res.status(401).json({ message: 'Access token missing or invalid.' });
  }

  // 1. Try Firebase Admin ID Token verification first
  try {
    const decodedToken = await firebaseAuth.verifyIdToken(token);
    req.user = decodedToken;
    req.shop = {
      id: decodedToken.uid,
      shopId: (decodedToken as any).shopId || decodedToken.uid,
      email: decodedToken.email || ''
    };

    // Populate shopId from Firestore if available
    try {
      const shopDoc = await db.collection('shops').doc(decodedToken.uid).get();
      if (shopDoc.exists) {
        const data = shopDoc.data();
        if (data?.shopId) {
          req.shop.shopId = data.shopId;
        }
      }
    } catch (e) {
      // Ignore lookup fallback errors
    }

    return next();
  } catch (firebaseErr) {
    // 2. Fallback to custom JWT verification for dev/test compatibility
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; shopId: string; email: string };
      req.shop = decoded;
      req.user = decoded;
      return next();
    } catch (jwtErr) {
      return res.status(403).json({ message: 'Token is invalid or expired.' });
    }
  }
};
