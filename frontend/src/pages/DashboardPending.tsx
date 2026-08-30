import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { db } from '../config/firebase';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { Inbox, Edit3, Check, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderType {
  _id: string;
  item: string;
  weight: number;
  remarks?: string;
  createdAt: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
  };
}

export const DashboardPending: React.FC = () => {
  const { fetchCounts } = useOutletContext<{ fetchCounts: () => void }>();
  const { shop } = useAuth();
  const location = useLocation();
  const highlightId = new URLSearchParams(location.search).get('highlight');

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  // Edit Modal State
  const [editingOrder, setEditingOrder] = useState<OrderType | null>(null);
  const [editName, setEditName] = useState<string>('');
  const [editPhone, setEditPhone] = useState<string>('');
  const [editItem, setEditItem] = useState<string>('');
  const [editWeight, setEditWeight] = useState<string>('');
  const [editRemarks, setEditRemarks] = useState<string>('');
  const [savingEdit, setSavingEdit] = useState<boolean>(false);

  const socket = useSocket();

  const fetchPending = async (showSpinner = true) => {
    try {
      if (showSpinner) setLoading(true);
      const data = await api.get('/dashboard/pending');
      setOrders(data);
    } catch (err) {
      console.error('Error fetching pending orders:', err);
    } finally {
      if (showSpinner) setLoading(false);
    }
  };

  useEffect(() => {
    if (!socket) return;

    if (shop?.id) socket.emit('join-shop', shop.id);
    if (shop?.shopId) socket.emit('join-shop', shop.shopId);
    if ((shop as any)?.slug) socket.emit('join-shop', (shop as any).slug);

    const handleNewOrder = (incomingOrder: any) => {
      const orderId = incomingOrder._id || incomingOrder.id || incomingOrder.orderId;
      if (orderId) {
        const formatted: OrderType = {
          _id: orderId,
          item: incomingOrder.itemDetails?.itemName || incomingOrder.item || 'Grain',
          weight: incomingOrder.itemDetails?.weight || incomingOrder.weight || 0,
          remarks: incomingOrder.remarks || '',
          createdAt: incomingOrder.createdAt || new Date().toISOString(),
          customerId: {
            _id: incomingOrder.customerId?._id || incomingOrder.customerId || 'c_1',
            name: incomingOrder.customerData?.name || incomingOrder.customerName || incomingOrder.customerId?.name || 'Customer',
            phone: incomingOrder.customerData?.phone || incomingOrder.customerPhone || incomingOrder.customerId?.phone || ''
          }
        };

        setOrders(prev => {
          if (prev.some(o => o._id === orderId)) return prev;
          return [formatted, ...prev];
        });
      }

      // Silent background fetch to guarantee 100% data sync
      fetchPending(false);
      if (fetchCounts) fetchCounts();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new_order', handleNewOrder);
    };
  }, [socket, shop?.id, shop?.shopId, (shop as any)?.slug]);

  useEffect(() => {
    fetchPending(true);

    const ownerIdentifiers = [shop?.id, shop?.shopId, (shop as any)?.slug].filter(Boolean);
    let unsub: Unsubscribe | undefined;

    try {
      const q = query(
        collection(db, 'orders'),
        where('status', '==', 'Pending')
      );
      unsub = onSnapshot(q, (snapshot) => {
        const liveOrders: OrderType[] = snapshot.docs
          .filter(doc => {
            const d = doc.data();
            return ownerIdentifiers.length === 0 || ownerIdentifiers.includes(d.shopId) || ownerIdentifiers.includes(d.shopSlug) || ownerIdentifiers.includes(d.shopData?.slug) || ownerIdentifiers.includes(d.shopData?.shopId);
          })
          .map(doc => {
            const d = doc.data();
            return {
              _id: doc.id,
              item: d.itemDetails?.itemName || d.item || 'Grain',
              weight: d.itemDetails?.weight || d.weight || 0,
              remarks: d.remarks || '',
              createdAt: d.timestamps?.createdAt?.toDate ? d.timestamps.createdAt.toDate().toISOString() : (d.createdAt || new Date().toISOString()),
              customerId: {
                _id: d.customerId?._id || d.customerId || 'c_1',
                name: d.customerData?.name || d.customerName || d.customerId?.name || 'Customer',
                phone: d.customerData?.phone || d.customerPhone || d.customerId?.phone || ''
              }
            };
          });
        if (liveOrders.length > 0) {
          setOrders(liveOrders);
          setLoading(false);
        }
      }, () => {
        // Fallback gracefully without uncaught exception in browser console
      });
    } catch {
      // Fallback
    }

    return () => {
      if (unsub) unsub();
    };
  }, [shop?.id, shop?.shopId, (shop as any)?.slug]);

  useEffect(() => {
    if (highlightId && !loading) {
      const el = document.getElementById(`order-card-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, loading, orders]);

  const handleAccept = async (id: string) => {
    try {
      setActioningId(id);
      await api.patch(`/orders/${id}/accept`);
      setOrders(prev => prev.filter(o => o._id !== id));
      if (fetchCounts) fetchCounts();
    } catch (err) {
      console.error(err);
      alert('Failed to accept order.');
    } finally {
      setActioningId(null);
    }
  };

  const handleReject = async (id: string) => {
    if (!confirm('Are you sure you want to reject this request?')) return;
    try {
      setActioningId(id);
      await api.patch(`/orders/${id}/reject`);
      setOrders(prev => prev.filter(o => o._id !== id));
      if (fetchCounts) fetchCounts();
    } catch (err) {
      console.error(err);
      alert('Failed to reject order.');
    } finally {
      setActioningId(null);
    }
  };

  const handleOpenEdit = (order: OrderType) => {
    setEditingOrder(order);
    setEditName(order.customerId.name || '');
    setEditPhone(order.customerId.phone || '');
    setEditItem(order.item || '');
    setEditWeight(order.weight.toString() || '');
    setEditRemarks(order.remarks || '');
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingOrder) return;

    try {
      setSavingEdit(true);
      await api.put(`/orders/${editingOrder._id}`, {
        name: editName,
        phone: editPhone,
        item: editItem,
        weight: parseFloat(editWeight),
        remarks: editRemarks,
      });

      setOrders(prev =>
        prev.map(o =>
          o._id === editingOrder._id
            ? {
                ...o,
                item: editItem,
                weight: parseFloat(editWeight),
                remarks: editRemarks,
                customerId: {
                  ...o.customerId,
                  name: editName,
                  phone: editPhone,
                },
              }
            : o
        )
      );

      setEditingOrder(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || 'Failed to update order details');
    } finally {
      setSavingEdit(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back breadcrumb */}
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back to Dashboard
      </Link>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-200 dark:border-zinc-800/80 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 tracking-tight flex items-center gap-2">
              <Inbox className="w-5 h-5 text-amber-500" /> Pending Requests
            </h1>
            <span className="px-2.5 py-0.5 text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-full border border-amber-500/20">
              {orders.length} waiting
            </span>
          </div>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
            Incoming customer requests waiting for approval.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mb-3" />
          <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">Loading pending requests...</p>
        </div>
      ) : orders.length === 0 ? (
        /* Empty state */
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-zinc-50/50 dark:bg-zinc-900/30 border border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl text-center">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-500 flex items-center justify-center mb-3">
            <Inbox className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">No pending requests</h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-sm">
            All caught up! Customer requests will appear here in real-time as soon as they submit via QR code.
          </p>
        </div>
      ) : (
        /* Orders Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {orders.map((order) => {
              const isHighlighted = highlightId === order._id;
              return (
                <motion.div
                  key={order._id}
                  id={`order-card-${order._id}`}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`relative flex flex-col justify-between p-5 rounded-2xl bg-white dark:bg-zinc-900 border transition-all duration-200 shadow-xs ${
                    isHighlighted
                      ? 'border-amber-500 ring-2 ring-amber-500/20 dark:ring-amber-500/30'
                      : 'border-zinc-200/80 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div className="space-y-3">
                    {/* Top Row: Customer Info */}
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-1.5">
                          {order.customerId?.name || 'Customer'}
                        </h3>
                        <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400">
                          {order.customerId?.phone || 'No phone'}
                        </p>
                      </div>
                      <span className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 whitespace-nowrap">
                        {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Order Item Details */}
                    <div className="p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl space-y-1 border border-zinc-100 dark:border-zinc-800/80">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-zinc-700 dark:text-zinc-300">{order.item}</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">{order.weight} kg</span>
                      </div>
                      {order.remarks && (
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
                          "{order.remarks}"
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mt-4 pt-3 border-t border-zinc-100 dark:border-zinc-800/80 flex items-center justify-between gap-2">
                    <button
                      onClick={() => handleOpenEdit(order)}
                      disabled={actioningId === order._id}
                      className="p-2 text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl transition-colors cursor-pointer"
                      title="Edit Details"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleReject(order._id)}
                        disabled={actioningId === order._id}
                        className="px-3 py-1.5 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors cursor-pointer border border-rose-200 dark:border-rose-900/40"
                      >
                        Reject
                      </button>

                      <button
                        onClick={() => handleAccept(order._id)}
                        disabled={actioningId === order._id}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 text-white hover:bg-emerald-500 text-xs font-bold rounded-xl transition-all shadow-xs cursor-pointer disabled:opacity-50"
                      >
                        {actioningId === order._id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Check className="w-3.5 h-3.5" /> Accept
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}

      {/* Edit Modal */}
      <AnimatePresence>
        {editingOrder && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/50 backdrop-blur-xs">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-md bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl shadow-2xl p-6 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3">
                <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Edit Order Request</h3>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="p-1 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleSaveEdit} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={e => setEditName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Customer Phone
                  </label>
                  <input
                    type="text"
                    value={editPhone}
                    onChange={e => setEditPhone(e.target.value)}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={editItem}
                      onChange={e => setEditItem(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                      Weight (kg)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      value={editWeight}
                      onChange={e => setEditWeight(e.target.value)}
                      className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-zinc-500 dark:text-zinc-400 uppercase tracking-wider mb-1">
                    Remarks / Notes
                  </label>
                  <textarea
                    value={editRemarks}
                    onChange={e => setEditRemarks(e.target.value)}
                    rows={2}
                    className="w-full px-3.5 py-2 bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl text-xs text-zinc-900 dark:text-zinc-100 font-semibold focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="pt-2 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setEditingOrder(null)}
                    className="px-4 py-2 text-xs font-semibold text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={savingEdit}
                    className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs inline-flex items-center gap-1.5"
                  >
                    {savingEdit && <Loader2 className="w-3.5 h-3.5 animate-spin" />} Save Changes
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
