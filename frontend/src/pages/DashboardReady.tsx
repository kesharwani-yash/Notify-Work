import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Inbox, BellRing, Check, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderType {
  _id: string;
  item: string;
  weight: number;
  readyAt?: string;
  lastReminderSentAt?: string;
  customerId: {
    name: string;
    phone: string;
  };
}

export const DashboardReady: React.FC = () => {
  const { fetchCounts } = useOutletContext<{ fetchCounts: () => void }>();
  const location = useLocation();
  const highlightId = new URLSearchParams(location.search).get('highlight');

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [remindingId, setRemindingId] = useState<string | null>(null);
  const [collectingId, setCollectingId] = useState<string | null>(null);

  const fetchReady = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/ready');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReady();
  }, []);

  useEffect(() => {
    if (highlightId && !loading) {
      const el = document.getElementById(`order-card-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, loading, orders]);

  const handleReminder = async (id: string) => {
    try {
      setRemindingId(id);
      const res = await api.patch<{ message: string; order?: OrderType }>(`/orders/${id}/reminder`);
      const updatedOrder = res?.order;
      if (updatedOrder && updatedOrder._id) {
        setOrders(prev => prev.map(o => o._id === id ? updatedOrder : o));
      } else {
        setOrders(prev => prev.map(o => o._id === id ? { ...o, lastReminderSentAt: new Date().toISOString() } : o));
      }
      alert('Reminder notification sent successfully.');
    } catch (err) {
      console.error(err);
      alert('Failed to send reminder.');
    } finally {
      setRemindingId(null);
    }
  };

  const handleCollected = async (id: string) => {
    try {
      setCollectingId(id);
      await api.patch(`/orders/${id}/collected`);
      setOrders(prev => prev.filter(o => o._id !== id));
      fetchCounts();
    } catch (err) {
      console.error(err);
      alert('Failed to mark order as collected.');
    } finally {
      setCollectingId(null);
    }
  };

  const getWaitingTimeString = (readyAtStr?: string) => {
    if (!readyAtStr) return '';
    const diffMs = Date.now() - new Date(readyAtStr).getTime();
    const diffMin = Math.floor(diffMs / 60000);
    
    if (diffMin < 60) {
      return `${diffMin}m ago`;
    }
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) {
      return `${diffHr}h ${diffMin % 60}m ago`;
    }
    return `${Math.floor(diffHr / 24)} days ago`;
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Ready Orders...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
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

      {/* View Header */}
      <div>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Ready for Pickup</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Waiting for collection. Send reminder alerts or archive when collected.</p>
      </div>

      {orders.length === 0 ? (
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-xs">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl h-12 w-12 flex items-center justify-center mx-auto mb-4 border border-zinc-200/60 dark:border-zinc-700">
            <Inbox className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">No items ready</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">No orders are waiting for pickup right now.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <AnimatePresence mode="popLayout">
            {orders.map(order => {
              const isHighlighted = order._id === highlightId;
              return (
                <motion.div
                  key={order._id}
                  id={`order-card-${order._id}`}
                  layout
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className={`backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border rounded-3xl p-6 shadow-xs transition-all flex flex-col justify-between ${
                    isHighlighted
                      ? 'ring-2 ring-emerald-500 dark:ring-emerald-400 border-emerald-500/50 shadow-md scale-[1.01]'
                      : 'border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Header info */}
                    <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800/80 pb-4 mb-4">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug tracking-tight">{order.customerId?.name || (order as any).customerData?.name || 'Customer'}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{order.customerId?.phone || (order as any).customerData?.phone || ''}</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Ready
                        </span>
                        <p className="text-[10px] text-zinc-400 font-medium mt-1">
                          {getWaitingTimeString(order.readyAt)}
                        </p>
                      </div>
                    </div>

                    {/* Order stats */}
                    <div className="grid grid-cols-2 gap-4 mb-5">
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Item Left</span>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tracking-tight">{order.item}</p>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Weight</span>
                        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5 tracking-tight">{order.weight} kg</p>
                      </div>
                    </div>

                    {order.lastReminderSentAt && (
                      <p className="text-[10px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-xl px-3 py-2 mb-5 inline-block">
                        🔔 Last reminder sent {new Date(order.lastReminderSentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({new Date(order.lastReminderSentAt).toLocaleDateString()})
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-auto">
                    <button
                      onClick={() => handleCollected(order._id)}
                      disabled={collectingId === order._id || remindingId === order._id}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-50 text-white dark:text-zinc-900 font-bold text-xs rounded-xl transition-all cursor-pointer shadow-xs active:scale-[0.98]"
                    >
                      {collectingId === order._id ? 'Saving...' : (
                        <>
                          <Check className="w-3.5 h-3.5 stroke-[3px]" /> Mark Collected
                        </>
                      )}
                    </button>

                    <button
                      onClick={() => handleReminder(order._id)}
                      disabled={collectingId === order._id || remindingId === order._id}
                      className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 font-semibold text-xs rounded-xl transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <BellRing className="w-3.5 h-3.5" /> {remindingId === order._id ? 'Reminding...' : 'Send Reminder'}
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};
