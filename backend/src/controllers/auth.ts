import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(__dirname, '../../../.env') });
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_notifywork_2026_dev_env_hash';

export const registerShop = async (req: Request, res: Response) => {
  try {
    const { shopId, slug, shopName, phone, address, email, businessType, firebaseUid } = req.body;

    if (!shopName || !phone || !address || !email) {
      return res.status(400).json({ message: 'All required fields must be provided.' });
    }

    const docId = firebaseUid || req.body.uid || db.collection('shops').doc().id;
    const rawSlug = (slug || shopId || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9-_]/g, '-');
    const finalSlug = `${rawSlug}-${Math.floor(Math.random() * 100)}`;

    const newShopData = {
      shopId: docId,
      slug: finalSlug,
      shopName,
      ownerName: shopName,
      phone,
      address,
      email,
      businessType: businessType || 'Flour Mill',
      operatingHours: '9:00 AM - 8:00 PM',
      services: [
        { name: 'Wheat (Atta)', unit: 'kg', rate: 5 },
        { name: 'Rice (Chawal)', unit: 'kg', rate: 8 },
        { name: 'Chana (Gram)', unit: 'kg', rate: 10 },
        { name: 'Multi-Grain', unit: 'kg', rate: 12 }
      ],
      createdAt: FieldValue.serverTimestamp()
    };

    await db.collection('shops').doc(docId).set(newShopData, { merge: true });

    const token = jwt.sign(
      { id: docId, shopId: docId, slug: finalSlug, email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    return res.status(201).json({
      token,
      shop: { id: docId, _id: docId, ...newShopData, createdAt: new Date().toISOString() }
    });
  } catch (err: any) {
    console.error('Error during shop registration:', err);
    return res.status(500).json({ message: 'Internal server error during registration.' });
  }
};

export const loginShop = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required.' });
    }

    const snap = await db.collection('shops').where('email', '==', email).limit(1).get();
    if (snap.empty) {
      return res.status(400).json({ message: 'Shop profile not found.' });
    }

    const shopDoc = snap.docs[0];
    const data = shopDoc.data();

    const token = jwt.sign(
      { id: shopDoc.id, shopId: data.shopId || shopDoc.id, slug: data.slug || shopDoc.id, email: data.email },
      JWT_SECRET,
      { expiresIn: '30d' }
    );

    const createdAtVal = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

    return res.json({
      token,
      shop: { id: shopDoc.id, _id: shopDoc.id, ...data, createdAt: createdAtVal }
    });
  } catch (err: any) {
    console.error('Error during shop login:', err);
    return res.status(500).json({ message: 'Internal server error during login.' });
  }
};

export const googleAuthSync = async (req: Request, res: Response) => {
  try {
    const { email, displayName, firebaseUid } = req.body;
    if (!email || !firebaseUid) {
      return res.status(400).json({ message: 'Missing email or firebaseUid' });
    }

    let shopDoc = await db.collection('shops').doc(firebaseUid).get();
    if (!shopDoc.exists) {
      const slugName = (displayName || email.split('@')[0]).toLowerCase().replace(/[^a-z0-9]/g, '-');
      const newShop = {
        shopId: firebaseUid,
        slug: `${slugName}-${Math.floor(Math.random() * 100)}`,
        shopName: displayName ? `${displayName}'s Store` : 'My Store',
        ownerName: displayName || email.split('@')[0],
        email,
        phone: '+91 98765 43210',
        address: 'Main Business Market',
        businessType: 'Flour Mill',
        operatingHours: '9:00 AM - 8:00 PM',
        services: [
          { name: 'Wheat (Atta)', unit: 'kg', rate: 5 },
          { name: 'Rice (Chawal)', unit: 'kg', rate: 8 }
        ],
        createdAt: FieldValue.serverTimestamp()
      };
      await db.collection('shops').doc(firebaseUid).set(newShop, { merge: true });
      return res.json({ shop: { id: firebaseUid, _id: firebaseUid, ...newShop, createdAt: new Date().toISOString() } });
    }

    const data = shopDoc.data() as any;
    const createdAtVal = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

    return res.json({ shop: { id: shopDoc.id, _id: shopDoc.id, ...data, createdAt: createdAtVal } });
  } catch (err: any) {
    return res.status(500).json({ message: err.message });
  }
};

export const getCurrentShop = async (req: any, res: Response) => {
  try {
    const targetId = req.shop?.id || req.user?.uid;
    if (!targetId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let shopDoc = await db.collection('shops').doc(targetId).get();
    if (!shopDoc.exists) {
      const email = req.user?.email || req.shop?.email;
      if (email) {
        const snap = await db.collection('shops').where('email', '==', email).limit(1).get();
        if (!snap.empty) {
          shopDoc = snap.docs[0];
        }
      }
    }

    // Auto-provision brand-new Firebase user shop profile
    if (!shopDoc.exists) {
      const email = req.user?.email || req.shop?.email || 'owner@notifywork.com';
      const slugName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      const defaultShop = {
        shopId: targetId,
        slug: `${slugName}-${Math.floor(Math.random() * 100)}`,
        shopName: `${slugName.charAt(0).toUpperCase() + slugName.slice(1)} Shop`,
        ownerName: slugName,
        phone: '+91 98765 43210',
        address: 'Main Business Market',
        email: email,
        businessType: 'Flour Mill',
        operatingHours: '9:00 AM - 8:00 PM',
        services: [
          { name: 'Wheat (Atta)', unit: 'kg', rate: 5 },
          { name: 'Rice (Chawal)', unit: 'kg', rate: 8 }
        ],
        createdAt: FieldValue.serverTimestamp()
      };
      await db.collection('shops').doc(targetId).set(defaultShop, { merge: true });
      return res.json({ id: targetId, _id: targetId, ...defaultShop, createdAt: new Date().toISOString() });
    }

    const data = shopDoc.data() as any;
    delete data.passwordHash;
    const createdAtVal = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

    return res.json({ _id: shopDoc.id, id: shopDoc.id, ...data, createdAt: createdAtVal });
  } catch (err) {
    console.error('Error fetching current shop:', err);
    return res.status(500).json({ message: 'Internal server error fetching shop profile.' });
  }
};
