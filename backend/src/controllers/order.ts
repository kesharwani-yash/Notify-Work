import { Request, Response } from 'express';
import { db } from '../config/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';
import { notificationService } from '../services/NotificationService';
import { wsService } from '../services/WebSocketService';
import { AuthRequest } from '../middleware/auth';

const formatOrder = (docSnap: any) => {
  const data = docSnap.data();
  const createdAtVal = data.timestamps?.createdAt?.toDate ? data.timestamps.createdAt.toDate().toISOString() : (data.createdAt || new Date().toISOString());
  const acceptedAtVal = data.timestamps?.acceptedAt?.toDate ? data.timestamps.acceptedAt.toDate().toISOString() : data.acceptedAt;
  const readyAtVal = data.timestamps?.readyAt?.toDate ? data.timestamps.readyAt.toDate().toISOString() : data.readyAt;
  const collectedAtVal = data.timestamps?.collectedAt?.toDate ? data.timestamps.collectedAt.toDate().toISOString() : data.collectedAt;

  return {
    _id: docSnap.id,
    id: docSnap.id,
    orderId: data.orderId || docSnap.id,
    ...data,
    item: data.itemDetails?.itemName || data.item || 'Grain',
    weight: data.itemDetails?.weight || data.weight || 0,
    createdAt: createdAtVal,
    acceptedAt: acceptedAtVal,
    readyAt: readyAtVal,
    collectedAt: collectedAtVal,
    customerId: data.customerData ? { _id: data.customerId, id: data.customerId, ...data.customerData } : data.customerId,
    shopId: data.shopData ? { _id: data.shopId, id: data.shopId, ...data.shopData } : data.shopId,
  };
};

// Create a new order (customer submission flow)
export const createOrder = async (req: Request, res: Response) => {
  try {
    const { shopIdSlug, name, phone, item, weight, remarks } = req.body;
    const rawIdentifier = (shopIdSlug || req.body.shopId || req.body.slug || req.params.shopId || '').trim();
    const cleanIdentifier = rawIdentifier.toLowerCase();

    if (!rawIdentifier || !name || !phone || !item || !weight) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    let shopDoc: any = null;

    // 1. Direct document ID query (case sensitive & as-is)
    const docById = await db.collection('shops').doc(rawIdentifier).get();
    if (docById.exists) {
      shopDoc = docById;
    } else {
      // 2. Query Firestore by slug field
      const slugSnap = await db.collection('shops')
        .where('slug', '==', cleanIdentifier)
        .limit(1)
        .get();

      if (!slugSnap.empty) {
        shopDoc = slugSnap.docs[0];
      } else {
        // 3. Query Firestore by shopId field
        const snapByShopId = await db.collection('shops').where('shopId', '==', rawIdentifier).limit(1).get();
        if (!snapByShopId.empty) {
          shopDoc = snapByShopId.docs[0];
        } else {
          const snapByShopIdLower = await db.collection('shops').where('shopId', '==', cleanIdentifier).limit(1).get();
          if (!snapByShopIdLower.empty) shopDoc = snapByShopIdLower.docs[0];
        }
      }
    }

    // 4. Substring / Case-insensitive match fallback across all shops
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

    // 5. Fallback provision for QR standees so orders never fail
    if (!shopDoc) {
      const formattedName = cleanIdentifier.replace(/-shop$/, '').replace(/[^a-z0-9]/g, ' ');
      const titleName = formattedName.charAt(0).toUpperCase() + formattedName.slice(1);
      const fallbackShop = {
        shopId: rawIdentifier,
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
      await db.collection('shops').doc(rawIdentifier).set(fallbackShop, { merge: true });
      shopDoc = await db.collection('shops').doc(rawIdentifier).get();
    }

    const shopData = shopDoc.data() || {};
    const cleanPhone = phone.trim().replace(/\s+/g, '');

    let customerId = '';
    const custSnap = await db.collection('customers').where('phone', '==', cleanPhone).limit(1).get();
    if (!custSnap.empty) {
      const existingCust = custSnap.docs[0];
      customerId = existingCust.id;
      await db.collection('customers').doc(customerId).update({ name: name.trim() });
    } else {
      const newCustRef = db.collection('customers').doc();
      customerId = newCustRef.id;
      await newCustRef.set({
        customerId: customerId,
        id: customerId,
        name: name.trim(),
        phone: cleanPhone,
        pushSubscriptions: [],
        createdAt: FieldValue.serverTimestamp()
      });
    }

    // Historical price snapshot calculations
    let ratePerUnit = 5;
    let unit = 'kg';
    if (shopData.services && Array.isArray(shopData.services)) {
      const match = shopData.services.find((s: any) => s.name?.toLowerCase() === item.trim().toLowerCase());
      if (match) {
        if (match.rate) ratePerUnit = parseFloat(match.rate);
        if (match.unit) unit = match.unit;
      }
    }
    const weightNum = parseFloat(weight);
    const totalPrice = parseFloat((weightNum * ratePerUnit).toFixed(2));

    const newOrderRef = db.collection('orders').doc();
    const orderId = newOrderRef.id;

    const orderPayload: any = {
      orderId: orderId,
      id: orderId,
      _id: orderId,
      status: 'Pending',
      shopId: shopDoc.id, // Primary Firebase Auth UID
      customerId,
      itemDetails: {
        itemName: item.trim(),
        weight: weightNum,
        unit,
        ratePerUnit,
        totalPrice
      },
      customerData: {
        name: name.trim(),
        phone: cleanPhone
      },
      shopData: {
        shopName: shopData.shopName || 'Shop',
        slug: shopData.slug || shopData.shopId || shopDoc.id,
        phone: shopData.phone || '',
        address: shopData.address || ''
      },
      timestamps: {
        createdAt: FieldValue.serverTimestamp()
      },
      remarks: remarks ? remarks.trim() : '',
      // Backward compatibility fields for legacy components
      item: item.trim(),
      weight: weightNum,
      createdAt: new Date().toISOString()
    };

    await newOrderRef.set(orderPayload);

    wsService.emitNewOrder(shopDoc.id, orderPayload);
    if (shopData?.slug && shopData.slug !== shopDoc.id) {
      wsService.emitNewOrder(shopData.slug, orderPayload);
    }

    return res.status(201).json({ ...orderPayload, createdAt: new Date().toISOString() });
  } catch (err: any) {
    console.error('Error creating order:', err);
    return res.status(500).json({ message: 'Failed to submit order. Please try again.' });
  }
};

// Fetch a single order (Customer view - read only)
export const getOrderById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const docSnap = await db.collection('orders').doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order details not found.' });
    }

    return res.json(formatOrder(docSnap));
  } catch (err) {
    console.error('Error fetching order by ID:', err);
    return res.status(500).json({ message: 'Error retrieving order details.' });
  }
};

// Subscribe customer browser push token
export const subscribeCustomerPush = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { subscription } = req.body;

    if (!subscription || !subscription.endpoint || !subscription.keys) {
      return res.status(400).json({ message: 'Invalid push subscription payload.' });
    }

    const orderDoc = await db.collection('orders').doc(id).get();
    if (!orderDoc.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const customerId = orderDoc.data()?.customerId;
    if (customerId) {
      const custRef = db.collection('customers').doc(customerId);
      const custSnap = await custRef.get();
      if (custSnap.exists) {
        const existingSubs: any[] = custSnap.data()?.pushSubscriptions || [];
        const exists = existingSubs.some(s => s.endpoint === subscription.endpoint);
        if (!exists) {
          await custRef.update({
            pushSubscriptions: [...existingSubs, subscription]
          });
        }
      }
    }

    return res.json({ message: 'Push subscription updated successfully.' });
  } catch (err) {
    console.error('Error subscribing customer push:', err);
    return res.status(500).json({ message: 'Failed to update push subscription.' });
  }
};

// Accept an order (Pending -> Accepted)
export const acceptOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderRef = db.collection('orders').doc(id);
    const docSnap = await orderRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const nowIso = new Date().toISOString();
    await orderRef.update({
      status: 'Accepted',
      'timestamps.acceptedAt': FieldValue.serverTimestamp(),
      acceptedAt: nowIso
    });

    const updatedSnap = await orderRef.get();
    const formatted = formatOrder(updatedSnap);

    wsService.emitOrderUpdate(id, formatted);

    return res.json({ message: 'Order accepted successfully.', order: formatted });
  } catch (err) {
    console.error('Error accepting order:', err);
    return res.status(500).json({ message: 'Failed to accept order.' });
  }
};

// Reject an order (Pending -> Rejected)
export const rejectOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderRef = db.collection('orders').doc(id);
    const docSnap = await orderRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    await orderRef.update({
      status: 'Rejected'
    });

    const updatedSnap = await orderRef.get();
    const formatted = formatOrder(updatedSnap);

    wsService.emitOrderUpdate(id, formatted);

    return res.json({ message: 'Order rejected successfully.', order: formatted });
  } catch (err) {
    console.error('Error rejecting order:', err);
    return res.status(500).json({ message: 'Failed to reject order.' });
  }
};

// Edit an order details
export const editOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    if (!id || id === 'undefined' || id === 'null') {
      return res.status(400).json({ message: 'Order ID is required.' });
    }
    const { name, phone, item, weight, remarks, status } = req.body;

    const orderRef = db.collection('orders').doc(id);
    const docSnap = await orderRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const updateFields: any = {};
    if (item !== undefined) {
      updateFields.item = item;
      updateFields['itemDetails.itemName'] = item;
    }
    if (weight !== undefined) {
      const w = parseFloat(weight);
      updateFields.weight = w;
      updateFields['itemDetails.weight'] = w;
      const rate = docSnap.data()?.itemDetails?.ratePerUnit || 5;
      updateFields['itemDetails.totalPrice'] = parseFloat((w * rate).toFixed(2));
    }
    if (remarks !== undefined) updateFields.remarks = remarks;
    if (name !== undefined) updateFields['customerData.name'] = name;
    if (phone !== undefined) updateFields['customerData.phone'] = phone;
    if (status !== undefined) updateFields.status = status;

    await orderRef.update(updateFields);

    const updatedSnap = await orderRef.get();
    const formatted = formatOrder(updatedSnap);

    wsService.emitOrderUpdate(id, formatted);

    return res.status(200).json({ message: 'Order updated successfully.', order: formatted });
  } catch (err) {
    console.error('Error editing order:', err);
    return res.status(500).json({ message: 'Failed to update order details.' });
  }
};

// Mark order as Ready (Accepted -> Ready)
export const readyOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderRef = db.collection('orders').doc(id);
    const docSnap = await orderRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const nowIso = new Date().toISOString();
    await orderRef.update({
      status: 'Ready',
      'timestamps.readyAt': FieldValue.serverTimestamp(),
      readyAt: nowIso
    });

    const updatedSnap = await orderRef.get();
    const formatted = formatOrder(updatedSnap);

    wsService.emitOrderUpdate(id, formatted);

    // Send automated notification
    try {
      await notificationService.notifyReady(formatted as any, (formatted as any).shopData, (formatted as any).customerData);
    } catch (notifErr) {
      console.warn('Notification delivery failed:', notifErr);
    }

    return res.json({ message: 'Order marked as Ready.', order: formatted });
  } catch (err) {
    console.error('Error marking order as ready:', err);
    return res.status(500).json({ message: 'Failed to update order to Ready.' });
  }
};

// Send manual reminder notification
export const sendReminder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docSnap = await db.collection('orders').doc(id).get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const formatted = formatOrder(docSnap);

    await notificationService.notifyReminder(formatted as any, (formatted as any).shopData, (formatted as any).customerData);
    const lastReminderSentAt = new Date().toISOString();
    await db.collection('orders').doc(id).update({
      lastReminderSentAt
    });

    const updatedSnap = await db.collection('orders').doc(id).get();
    const updatedFormatted = formatOrder(updatedSnap);

    return res.json({ message: 'Reminder sent successfully.', order: updatedFormatted });
  } catch (err) {
    console.error('Error sending reminder:', err);
    return res.status(500).json({ message: 'Failed to send reminder notification.' });
  }
};

// Mark order as Collected (Ready -> Collected)
export const collectedOrder = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const orderRef = db.collection('orders').doc(id);
    const docSnap = await orderRef.get();

    if (!docSnap.exists) {
      return res.status(404).json({ message: 'Order not found.' });
    }

    const nowIso = new Date().toISOString();
    await orderRef.update({
      status: 'Collected',
      'timestamps.collectedAt': FieldValue.serverTimestamp(),
      collectedAt: nowIso
    });

    const updatedSnap = await orderRef.get();
    const formatted = formatOrder(updatedSnap);

    wsService.emitOrderUpdate(id, formatted);

    return res.json({ message: 'Order marked as Collected.', order: formatted });
  } catch (err) {
    console.error('Error marking order as collected:', err);
    return res.status(500).json({ message: 'Failed to complete order.' });
  }
};

// Search orders (Owner multi-attribute search)
export const searchOrders = async (req: AuthRequest, res: Response) => {
  try {
    const shopId = req.shop?.id || req.user?.uid;
    const queryStr = (req.query.q as string || '').trim().toLowerCase();

    if (!queryStr) {
      return res.json([]);
    }

    const snap = await db.collection('orders')
      .where('shopId', '==', shopId)
      .get();

    const results = snap.docs
      .map(formatOrder)
      .filter((order: any) => {
        const name = (order.customerData?.name || order.customerId?.name || '').toLowerCase();
        const phone = (order.customerData?.phone || order.customerId?.phone || '').toLowerCase();
        const item = (order.itemDetails?.itemName || order.item || '').toLowerCase();
        const weight = (order.itemDetails?.weight || order.weight || '').toString();

        return (
          name.includes(queryStr) ||
          phone.includes(queryStr) ||
          item.includes(queryStr) ||
          weight.includes(queryStr)
        );
      });

    return res.json(results);
  } catch (err) {
    console.error('Error searching orders:', err);
    return res.status(500).json({ message: 'Failed to search orders.' });
  }
};
