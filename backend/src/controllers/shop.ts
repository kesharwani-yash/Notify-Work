import { Request, Response } from 'express';
import { db } from '../config/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { AuthRequest } from '../middleware/auth';

export const getShopBySlug = async (req: Request, res: Response) => {
  try {
    const rawIdentifier = (req.params.shopId || req.params.slug || req.params.identifier || '').trim();
    if (!rawIdentifier) {
      return res.status(400).json({ message: 'Shop identifier required.' });
    }

    const cleanIdentifier = rawIdentifier.toLowerCase();

    // 1. Query Firestore by slug field
    let snap = await db.collection('shops')
      .where('slug', '==', cleanIdentifier)
      .limit(1)
      .get();
    
    let shopDoc: any = null;
    if (!snap.empty) {
      shopDoc = snap.docs[0];
    } else {
      // 2. Query Firestore by shopId document ID or field
      const docById = await db.collection('shops').doc(rawIdentifier).get();
      if (docById.exists) {
        shopDoc = docById;
      } else {
        const snapById = await db.collection('shops').where('shopId', '==', rawIdentifier).limit(1).get();
        if (!snapById.empty) shopDoc = snapById.docs[0];
      }
    }

    // 3. Substring match fallback
    if (!shopDoc) {
      const allShopsSnap = await db.collection('shops').get();
      for (const d of allShopsSnap.docs) {
        const data = d.data();
        if (
          d.id.toLowerCase() === cleanIdentifier ||
          data.slug?.toLowerCase() === cleanIdentifier ||
          data.shopId?.toLowerCase() === cleanIdentifier
        ) {
          shopDoc = d;
          break;
        }
      }
    }

    // 4. Fallback provision for QR standees
    if (!shopDoc) {
      const formattedName = cleanIdentifier.replace(/-shop$/, '').replace(/[^a-z0-9]/g, ' ');
      const titleName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
      const fallbackShop = {
        shopId: cleanIdentifier,
        slug: cleanIdentifier,
        shopName: `${titleName} Mill & Store`,
        ownerName: titleName,
        email: `${cleanIdentifier}@notifywork.com`,
        phone: '+91 98765 43210',
        businessType: 'Flour Mill',
        address: 'Main Market',
        operatingHours: '9:00 AM - 8:00 PM',
        services: [
          { name: 'Wheat (Atta)', unit: 'kg', rate: 5 },
          { name: 'Rice (Chawal)', unit: 'kg', rate: 8 }
        ],
        createdAt: FieldValue.serverTimestamp()
      };
      await db.collection('shops').doc(cleanIdentifier).set(fallbackShop, { merge: true });
      return res.json({ _id: cleanIdentifier, id: cleanIdentifier, ...fallbackShop });
    }

    const data = shopDoc.data() as any;
    delete data.passwordHash;

    const createdAtVal = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

    return res.json({
      _id: shopDoc.id,
      id: shopDoc.id,
      ...data,
      shopId: data.shopId || shopDoc.id,
      slug: data.slug || data.shopId || shopDoc.id,
      createdAt: createdAtVal
    });
  } catch (err) {
    console.error('Error fetching shop by slug:', err);
    return res.status(500).json({ message: 'Error fetching shop details.' });
  }
};

export const getShopProfile = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.shop?.id || req.user?.uid;
    if (!targetId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let shopDoc = await db.collection('shops').doc(targetId).get();
    if (!shopDoc.exists && req.user?.email) {
      const snap = await db.collection('shops').where('email', '==', req.user.email).limit(1).get();
      if (!snap.empty) shopDoc = snap.docs[0];
    }

    // Auto-create default shop profile document if it does not exist yet
    if (!shopDoc.exists) {
      const email = req.user?.email || req.shop?.email || 'owner@notifywork.com';
      const slugName = email.split('@')[0].toLowerCase().replace(/[^a-z0-9]/g, '-');
      const defaultShop = {
        shopId: targetId,
        slug: `${slugName}-${Math.floor(Math.random() * 100)}`,
        shopName: `${slugName.charAt(0).toUpperCase() + slugName.slice(1)} Shop`,
        ownerName: slugName,
        email: email,
        phone: '+91 98765 43210',
        businessType: 'Flour Mill',
        address: 'Main Business Market',
        operatingHours: '9:00 AM - 8:00 PM',
        services: [
          { name: 'Wheat (Atta)', unit: 'kg', rate: 5 },
          { name: 'Rice (Chawal)', unit: 'kg', rate: 8 }
        ],
        createdAt: FieldValue.serverTimestamp()
      };
      await db.collection('shops').doc(targetId).set(defaultShop, { merge: true });
      return res.json({ _id: targetId, id: targetId, ...defaultShop });
    }

    const data = shopDoc.data() as any;
    delete data.passwordHash;

    const createdAtVal = data.createdAt?.toDate ? data.createdAt.toDate().toISOString() : data.createdAt;

    return res.json({
      _id: shopDoc.id,
      id: shopDoc.id,
      ...data,
      shopId: data.shopId || shopDoc.id,
      slug: data.slug || data.shopId || shopDoc.id,
      createdAt: createdAtVal
    });
  } catch (err) {
    console.error('Error fetching shop profile:', err);
    return res.status(500).json({ message: 'Error fetching shop profile.' });
  }
};

export const updateShopProfile = async (req: AuthRequest, res: Response) => {
  try {
    const targetId = req.shop?.id || req.user?.uid;
    if (!targetId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let docRef = db.collection('shops').doc(targetId);
    let shopDoc = await docRef.get();

    if (!shopDoc.exists && req.shop?.email) {
      const snap = await db.collection('shops').where('email', '==', req.shop.email).limit(1).get();
      if (!snap.empty) {
        docRef = snap.docs[0].ref;
        shopDoc = snap.docs[0];
      }
    }

    const {
      shopName,
      ownerName,
      phone,
      address,
      operatingHours,
      businessType,
      services,
      slug
    } = req.body;

    const updateFields: any = {};
    if (shopName !== undefined) updateFields.shopName = shopName;
    if (ownerName !== undefined) updateFields.ownerName = ownerName;
    if (phone !== undefined) updateFields.phone = phone;
    if (address !== undefined) updateFields.address = address;
    if (operatingHours !== undefined) updateFields.operatingHours = operatingHours;
    if (businessType !== undefined) updateFields.businessType = businessType;
    if (services !== undefined) updateFields.services = services;
    if (slug !== undefined) updateFields.slug = slug.toLowerCase().replace(/[^a-z0-9-_]/g, '-');

    await docRef.set(updateFields, { merge: true });

    const updatedSnap = await docRef.get();
    const updatedData = updatedSnap.data() as any;
    delete updatedData?.passwordHash;

    const createdAtVal = updatedData.createdAt?.toDate ? updatedData.createdAt.toDate().toISOString() : updatedData.createdAt;

    return res.json({
      message: 'Shop profile updated successfully.',
      shop: {
        _id: docRef.id,
        id: docRef.id,
        ...updatedData,
        shopId: updatedData.shopId || docRef.id,
        slug: updatedData.slug || updatedData.shopId || docRef.id,
        createdAt: createdAtVal
      }
    });
  } catch (err: any) {
    console.error('Error updating shop profile:', err);
    return res.status(500).json({ message: err.message || 'Error updating shop profile.' });
  }
};
