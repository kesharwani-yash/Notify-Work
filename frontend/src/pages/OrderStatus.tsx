import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../services/api';
import { useSocket } from '../context/SocketContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { playNotificationChime } from '../services/sound';
import {
  Loader2,
  ShieldCheck,
  Clock,
  Check,
  XCircle,
  Flame,
  Sparkles
} from 'lucide-react';
import { motion } from 'framer-motion';

interface OrderType {
  _id: string;
  item: string;
  weight: number;
  remarks?: string;
  status: 'Pending' | 'Accepted' | 'Ready' | 'Collected' | 'Rejected';
  createdAt: string;
  acceptedAt?: string;
  readyAt?: string;
  collectedAt?: string;
  shopId: {
    shopId: string;
    shopName: string;
    phone: string;
    address: string;
  };
  customerId: {
    name: string;
    phone: string;
  };
}

export const OrderStatus: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const socket = useSocket();

  const [order, setOrder] = useState<OrderType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const data = await api.get(`/orders/${orderId}`);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch order details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  // Set up WebSocket listener for real-time live status updates across all transitions
  useEffect(() => {
    if (!socket || !orderId) return;

    socket.emit('join-order', orderId);
    socket.emit('joinRoom', orderId);

    const handleOrderUpdate = (incomingData: any) => {
      if (!incomingData) return;

      setOrder((prevOrder) => {
        if (!prevOrder) return prevOrder;

        const newOrderData = incomingData.order ? incomingData.order : incomingData;
        const incomingStatus = incomingData.status || incomingData.order?.status || prevOrder.status;

        return {
          ...prevOrder,
          ...newOrderData,
          status: incomingStatus,
          shopId: (newOrderData.shopId && typeof newOrderData.shopId === 'object') ? newOrderData.shopId : prevOrder.shopId,
          customerId: (newOrderData.customerId && typeof newOrderData.customerId === 'object') ? newOrderData.customerId : prevOrder.customerId,
        };
      });

      const newStatus = incomingData.status || incomingData.order?.status || incomingData.orderStatus;
      if (newStatus === 'Ready' || newStatus === 'ready') {
        playNotificationChime('ready');
      }
    };

    socket.on('order-update', handleOrderUpdate);
    socket.on('orderUpdate', handleOrderUpdate);

    return () => {
      socket.off('order-update', handleOrderUpdate);
      socket.off('orderUpdate', handleOrderUpdate);
    };
  }, [socket, orderId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 transition-colors">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mx-auto mb-3" />
          <p className="text-zinc-500 dark:text-zinc-400 text-xs font-medium tracking-tight">Connecting to status board...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 px-4 transition-colors">
        <div className="max-w-md w-full backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 rounded-3xl p-8 border border-zinc-200/80 dark:border-zinc-800 shadow-premium text-center">
          <div className="bg-rose-500/10 text-rose-500 rounded-2xl h-12 w-12 flex items-center justify-center mx-auto mb-4 border border-rose-500/20">
            <XCircle className="h-6 w-6" />
          </div>
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2 tracking-tight">Order Not Found</h2>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mb-6 leading-relaxed">
            {error || 'The requested order details could not be found. Please verify your tracking link.'}
          </p>
          <button
            onClick={() => window.location.reload()}
            className="w-full px-6 py-3 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
          >
            Retry Connection
          </button>
        </div>
      </div>
    );
  }

  const currentStatusLower = order.status?.toLowerCase() || '';

  const getStatusBadge = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
            </span>
            Pending Approval
          </span>
        );
      case 'accepted':
      case 'processing':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
            </span>
            Processing
          </span>
        );
      case 'ready':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            Ready for Pickup
          </span>
        );
      case 'collected':
      case 'completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            <Check className="w-3.5 h-3.5" />
            Collected
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
            <XCircle className="w-3.5 h-3.5" />
            Declined
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border border-zinc-500/20">
            {status}
          </span>
        );
    }
  };

  const isReady = currentStatusLower === 'ready';
  const isCollected = currentStatusLower === 'collected' || currentStatusLower === 'completed';

  // Stepper lifecycle definitions
  const steps = [
    {
      id: 'submitted',
      label: 'Submitted',
      sublabel: order.createdAt ? new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Order placed',
      isCompleted: true,
      isActive: currentStatusLower === 'pending',
    },
    {
      id: 'accepted',
      label: 'Accepted',
      sublabel: order.acceptedAt ? new Date(order.acceptedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Owner review',
      isCompleted: !!order.acceptedAt || ['accepted', 'processing', 'ready', 'collected', 'completed'].includes(currentStatusLower),
      isActive: false,
    },
    {
      id: 'processing',
      label: 'Processing',
      sublabel: 'Work in progress',
      isCompleted: !!order.acceptedAt || ['accepted', 'processing', 'ready', 'collected', 'completed'].includes(currentStatusLower),
      isActive: currentStatusLower === 'accepted' || currentStatusLower === 'processing',
    },
    {
      id: 'ready',
      label: 'Ready for Pickup',
      sublabel: order.readyAt ? new Date(order.readyAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Store collection',
      isCompleted: !!order.readyAt || ['ready', 'collected', 'completed'].includes(currentStatusLower),
      isActive: currentStatusLower === 'ready',
    },
    {
      id: 'collected',
      label: 'Collected',
      sublabel: order.collectedAt ? new Date(order.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Complete',
      isCompleted: !!order.collectedAt || ['collected', 'completed'].includes(currentStatusLower),
      isActive: currentStatusLower === 'collected' || currentStatusLower === 'completed',
    },
  ];

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 gradient-bg flex flex-col justify-between transition-colors">
      
      {/* Top Header Bar */}
      <header className="sticky top-0 z-40 backdrop-blur-md bg-white/75 dark:bg-zinc-900/75 border-b border-zinc-200/80 dark:border-zinc-800/80 px-6 py-3.5 flex items-center justify-between shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 bg-emerald-500/10 border border-emerald-500/20 rounded-lg flex items-center justify-center text-emerald-600 dark:text-emerald-400 font-bold text-xs">
            <Flame className="w-4 h-4" />
          </div>
          <div>
            <span className="font-extrabold text-xs tracking-tight text-zinc-900 dark:text-zinc-100 block leading-none">
              {order.shopId?.shopName || 'NotifyWork'}
            </span>
            <span className="text-[10px] text-zinc-400 font-medium block mt-0.5">Live Tracker</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Theme Toggle */}
          <ThemeToggle />
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-xl w-full mx-auto px-4 py-8 space-y-6 flex-1">

        {/* Active Ready Banner */}
        {isReady && (
          <motion.div
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 p-5 rounded-3xl backdrop-blur-md shadow-sm flex items-start gap-4"
          >
            <div className="bg-emerald-500 text-white p-2.5 rounded-2xl shrink-0 mt-0.5 shadow-sm">
              <Check className="w-5 h-5 stroke-[3px]" />
            </div>
            <div>
              <h3 className="font-extrabold text-base tracking-tight leading-tight">Your Order is Ready for Pickup! 🟢</h3>
              <p className="text-xs text-emerald-800 dark:text-emerald-200 mt-1.5 leading-relaxed">
                Please collect your item from <strong>{order.shopId?.shopName}</strong>. Show order identifier <strong>#{order._id.slice(-6).toUpperCase()}</strong> at counter.
              </p>
            </div>
          </motion.div>
        )}

        {isCollected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="backdrop-blur-md bg-zinc-900/95 text-white p-5 rounded-3xl border border-zinc-800 shadow-md flex items-start gap-4"
          >
            <div className="bg-emerald-500/20 text-emerald-400 p-2.5 rounded-2xl shrink-0 mt-0.5 border border-emerald-500/30">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm tracking-tight leading-tight">Order Collected</h3>
              <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                This order has been completed and collected. Thank you for your business!
              </p>
            </div>
          </motion.div>
        )}

        {/* Order Details Frosted Glass Card */}
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl shadow-xs overflow-hidden transition-colors">
          {/* Card Header */}
          <div className="p-6 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/30 flex justify-between items-start gap-4">
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                Store
              </span>
              <h2 className="font-bold text-zinc-900 dark:text-zinc-100 text-base leading-snug tracking-tight">
                {order.shopId?.shopName}
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">{order.shopId?.address}</p>
            </div>
            <div>
              {getStatusBadge(order.status)}
            </div>
          </div>

          {/* Card Body Grid */}
          <div className="p-6 space-y-5">
            <div className="grid grid-cols-2 gap-4 pb-5 border-b border-zinc-100 dark:border-zinc-800/80">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  Customer
                </span>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{order.customerId?.name}</p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{order.customerId?.phone}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  Order ID
                </span>
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 font-mono tracking-tight uppercase">
                  #{order._id.slice(-8)}
                </p>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} • {new Date(order.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  Item Description
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{order.item}</p>
              </div>
              <div>
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  Weight
                </span>
                <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{order.weight} kg</p>
              </div>
            </div>

            {order.remarks && (
              <div className="pt-1">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block mb-1">
                  Customer Remarks
                </span>
                <p className="text-xs text-zinc-600 dark:text-zinc-300 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/60 dark:border-zinc-800 rounded-xl p-3 italic leading-relaxed">
                  "{order.remarks}"
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ELEGANT STEPPER PROGRESS BAR OVERHAUL */}
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-xs transition-colors">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-xs uppercase tracking-wider text-zinc-400 dark:text-zinc-500 flex items-center gap-2">
              <Clock className="w-3.5 h-3.5" /> Order Progress Tracker
            </h3>
            <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Live Sync
            </span>
          </div>

          {/* Stepper Timeline List */}
          <div className="relative pl-6 space-y-6 border-l border-zinc-200 dark:border-zinc-800 ml-2">
            {steps.map((step) => (
              <div key={step.id} className="relative">
                {/* Step Circle Indicator */}
                <div
                  className={`absolute -left-[31px] top-0.5 rounded-full p-1 border-2 transition-all duration-300 ${
                    step.isCompleted
                      ? 'bg-emerald-500 text-white border-emerald-500 shadow-xs'
                      : step.isActive
                      ? 'bg-blue-500 text-white border-blue-500 shadow-xs'
                      : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 border-zinc-200 dark:border-zinc-700'
                  }`}
                >
                  {step.isCompleted ? (
                    <Check className="w-3.5 h-3.5 stroke-[3px]" />
                  ) : step.isActive ? (
                    <span className="relative flex h-3.5 w-3.5 items-center justify-center">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                    </span>
                  ) : (
                    <div className="w-3.5 h-3.5 rounded-full" />
                  )}
                </div>

                {/* Step Content */}
                <div className="flex items-baseline justify-between gap-2">
                  <div>
                    <h4
                      className={`text-xs font-bold tracking-tight transition-colors ${
                        step.isCompleted || step.isActive
                          ? 'text-zinc-900 dark:text-zinc-100'
                          : 'text-zinc-400 dark:text-zinc-600'
                      }`}
                    >
                      {step.label}
                      {step.isActive && (
                        <span className="ml-2 inline-flex items-center gap-1 text-[10px] font-semibold text-blue-600 dark:text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">
                          Active Step
                        </span>
                      )}
                    </h4>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {step.sublabel}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>


      </main>

      {/* Footer Branding */}
      <footer className="py-6 text-center text-[11px] text-zinc-400 dark:text-zinc-600 border-t border-zinc-200/60 dark:border-zinc-900">
        Powered by <strong className="text-zinc-700 dark:text-zinc-400">NotifyWork</strong> • Real-time Business Order Management
      </footer>
    </div>
  );
};
