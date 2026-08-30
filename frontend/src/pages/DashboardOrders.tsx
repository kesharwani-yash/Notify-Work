import React, { useEffect, useState } from 'react';
import { useOutletContext, Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Inbox, Flame, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface OrderType {
  _id: string;
  item: string;
  weight: number;
  remarks?: string;
  acceptedAt?: string;
  customerId: {
    name: string;
    phone: string;
  };
}

export const DashboardOrders: React.FC = () => {
  const { fetchCounts } = useOutletContext<{ fetchCounts: () => void }>();
  const location = useLocation();
  const highlightId = new URLSearchParams(location.search).get('highlight');

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [actioningId, setActioningId] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await api.get('/dashboard/orders');
      setOrders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    if (highlightId && !loading) {
      const el = document.getElementById(`order-card-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, loading, orders]);

  const handleMarkReady = async (id: string) => {
    try {
      setActioningId(id);
      await api.patch(`/orders/${id}/ready`);
      setOrders(prev => prev.filter(o => o._id !== id));
      fetchCounts();
    } catch (err) {
      console.error(err);
      alert('Failed to update order status.');
    } finally {
      setActioningId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
        <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading Active Orders...</span>
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
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Active Orders</h1>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Currently processing. Click “MARK READY” when finished to notify customer in real-time.</p>
      </div>

      {orders.length === 0 ? (
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-xs">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl h-12 w-12 flex items-center justify-center mx-auto mb-4 border border-zinc-200/60 dark:border-zinc-700">
            <Inbox className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">No active orders</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">All accepted work is completed. Go to pending requests to approve new orders.</p>
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
                      ? 'ring-2 ring-sky-500 dark:ring-sky-400 border-sky-500/50 shadow-md scale-[1.01]'
                      : 'border-zinc-200/60 dark:border-zinc-800/60 hover:border-zinc-300 dark:hover:border-zinc-700'
                  }`}
                >
                  <div>
                    {/* Card Header */}
                    <div className="flex justify-between items-start border-b border-zinc-100 dark:border-zinc-800/80 pb-4 mb-4">
                      <div>
                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug tracking-tight">{order.customerId?.name || (order as any).customerData?.name || 'Customer'}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{order.customerId?.phone || (order as any).customerData?.phone || ''}</p>
                      </div>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/10 border border-blue-500/20 rounded-full px-2.5 py-1">
                        Accepted {order.acceptedAt ? new Date(order.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                      </span>
                    </div>

                    {/* Details */}
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

                    {order.remarks && (
                      <div className="bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-3 mb-5">
                        <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">Remarks</span>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 italic">"{order.remarks}"</p>
                      </div>
                    )}
                  </div>

                  {/* Big Action Button */}
                  <div className="border-t border-zinc-100 dark:border-zinc-800/80 pt-4 mt-auto">
                    <button
                      onClick={() => handleMarkReady(order._id)}
                      disabled={actioningId === order._id}
                      className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition-all shadow-xs active:scale-[0.98] cursor-pointer"
                    >
                      {actioningId === order._id ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" /> Notifying Customer...
                        </>
                      ) : (
                        <>
                          <Flame className="w-4 h-4 fill-current" /> MARK READY FOR PICKUP
                        </>
                      )}
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
