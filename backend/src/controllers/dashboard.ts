import { Response } from 'express';
import { db } from '../config/firebaseAdmin';
import { AuthRequest } from '../middleware/auth';

const formatOrderDoc = (docSnap: any) => {
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

const getOwnerShopIdentifiers = (req: AuthRequest): string[] => {
  return [
    req.shop?.id,
    req.shop?.shopId,
    (req.shop as any)?.slug,
    req.user?.uid,
    req.user?.email
  ].filter((id): id is string => Boolean(id));
};

// 1. Pending Requests (waiting for approval)
export const getPendingRequests = async (req: AuthRequest, res: Response) => {
  try {
    const ownerIds = getOwnerShopIdentifiers(req);
    const snap = await db.collection('orders').get();

    const orders = snap.docs
      .filter((doc: any) => {
        const data = doc.data();
        const matchStatus = data.status === 'Pending';
        const matchShop = ownerIds.length === 0 || ownerIds.includes(data.shopId) || ownerIds.includes(data.shopSlug) || ownerIds.includes(data.shopData?.slug) || ownerIds.includes(data.shopData?.shopId);
        return matchStatus && matchShop;
      })
      .map(formatOrderDoc)
      .sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return res.json(orders);
  } catch (err) {
    console.error('Error fetching pending orders:', err);
    return res.json([]);
  }
};

// 2. Active Orders (accepted, currently processing)
export const getActiveOrders = async (req: AuthRequest, res: Response) => {
  try {
    const ownerIds = getOwnerShopIdentifiers(req);
    const snap = await db.collection('orders').get();

    const orders = snap.docs
      .filter((doc: any) => {
        const data = doc.data();
        const matchStatus = data.status === 'Accepted';
        const matchShop = ownerIds.length === 0 || ownerIds.includes(data.shopId) || ownerIds.includes(data.shopSlug) || ownerIds.includes(data.shopData?.slug) || ownerIds.includes(data.shopData?.shopId);
        return matchStatus && matchShop;
      })
      .map(formatOrderDoc)
      .sort((a: any, b: any) => new Date(a.acceptedAt || a.createdAt).getTime() - new Date(b.acceptedAt || b.createdAt).getTime());

    return res.json(orders);
  } catch (err) {
    console.error('Error fetching active orders:', err);
    return res.json([]);
  }
};

// 3. Ready Orders (completed, waiting for pickup)
export const getReadyOrders = async (req: AuthRequest, res: Response) => {
  try {
    const ownerIds = getOwnerShopIdentifiers(req);
    const snap = await db.collection('orders').get();

    const orders = snap.docs
      .filter((doc: any) => {
        const data = doc.data();
        const matchStatus = data.status === 'Ready';
        const matchShop = ownerIds.length === 0 || ownerIds.includes(data.shopId) || ownerIds.includes(data.shopSlug) || ownerIds.includes(data.shopData?.slug) || ownerIds.includes(data.shopData?.shopId);
        return matchStatus && matchShop;
      })
      .map(formatOrderDoc)
      .sort((a: any, b: any) => new Date(a.readyAt || a.createdAt).getTime() - new Date(b.readyAt || b.createdAt).getTime());

    return res.json(orders);
  } catch (err) {
    console.error('Error fetching ready orders:', err);
    return res.json([]);
  }
};

// 4. History (collected orders)
export const getHistoryOrders = async (req: AuthRequest, res: Response) => {
  try {
    const ownerIds = getOwnerShopIdentifiers(req);
    const { date, startDate, endDate } = req.query;

    const snap = await db.collection('orders').get();

    let orders = snap.docs
      .filter((doc: any) => {
        const data = doc.data();
        const matchStatus = data.status === 'Collected';
        const matchShop = ownerIds.length === 0 || ownerIds.includes(data.shopId) || ownerIds.includes(data.shopSlug) || ownerIds.includes(data.shopData?.slug) || ownerIds.includes(data.shopData?.shopId);
        return matchStatus && matchShop;
      })
      .map(formatOrderDoc);

    // Apply date filtering in memory
    if (date) {
      const targetDate = new Date(date as string);
      const start = new Date(targetDate.setHours(0, 0, 0, 0)).getTime();
      const end = new Date(targetDate.setHours(23, 59, 59, 999)).getTime();
      orders = orders.filter((o: any) => {
        const time = new Date(o.collectedAt || o.createdAt).getTime();
        return time >= start && time <= end;
      });
    } else if (startDate || endDate) {
      orders = orders.filter((o: any) => {
        const time = new Date(o.collectedAt || o.createdAt).getTime();
        if (startDate && time < new Date(startDate as string).getTime()) return false;
        if (endDate) {
          const end = new Date(endDate as string);
          end.setHours(23, 59, 59, 999);
          if (time > end.getTime()) return false;
        }
        return true;
      });
    }

    orders.sort((a: any, b: any) => new Date(b.collectedAt || b.createdAt).getTime() - new Date(a.collectedAt || a.createdAt).getTime());

    return res.json(orders);
  } catch (err) {
    console.error('Error fetching history:', err);
    return res.json([]);
  }
};
