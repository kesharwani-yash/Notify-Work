import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Inbox, CheckCircle2, PackageCheck, History, ChevronRight, Search, X, Loader2 } from 'lucide-react';

import { useSocket } from '../context/SocketContext';

interface Counts {
  pending: number;
  active: number;
  ready: number;
}

interface OrderSearchResult {
  _id: string;
  item: string;
  weight: number;
  status: 'Pending' | 'Accepted' | 'Ready' | 'Collected' | 'Rejected';
  createdAt: string;
  customerId: {
    _id: string;
    name: string;
    phone: string;
  };
}

export const DashboardHome: React.FC = () => {
  const { shop } = useAuth();
  const socket = useSocket();
  const navigate = useNavigate();

  const [counts, setCounts] = useState<Counts>({ pending: 0, active: 0, ready: 0 });
  const [loading, setLoading] = useState<boolean>(true);

  // Quick Customer Search State
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<OrderSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);

  const fetchAll = async () => {
    try {
      const [pendingData, activeData, readyData] = await Promise.all([
        api.get('/dashboard/pending'),
        api.get('/dashboard/orders'),
        api.get('/dashboard/ready'),
      ]);
      setCounts({
        pending: Array.isArray(pendingData) ? pendingData.length : 0,
        active: Array.isArray(activeData) ? activeData.length : 0,
        ready: Array.isArray(readyData) ? readyData.length : 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setCounts({ pending: 0, active: 0, ready: 0 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAll();
  }, []);

  useEffect(() => {
    if (!socket) return;
    if (shop?.id) socket.emit('join-shop', shop.id);
    if (shop?.shopId) socket.emit('join-shop', shop.shopId);
    if ((shop as any)?.slug) socket.emit('join-shop', (shop as any).slug);

    const handleNewOrder = () => {
      fetchAll();
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new_order', handleNewOrder);
    };
  }, [socket, shop]);

  // Debounced live search
  useEffect(() => {
    const query = searchQuery.trim();
    if (!query) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const timer = setTimeout(async () => {
      try {
        const data = await api.get(`/orders/search?q=${encodeURIComponent(query)}`);
        setSearchResults(data);
      } catch (err) {
        console.error('Failed to search orders:', err);
      } finally {
        setIsSearching(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSelectResult = (order: OrderSearchResult) => {
    setSearchQuery('');
    setSearchResults([]);

    switch (order.status) {
      case 'Pending':
        navigate(`/dashboard/pending?highlight=${order._id}`);
        break;
      case 'Accepted':
        navigate(`/dashboard/orders?highlight=${order._id}`);
        break;
      case 'Ready':
        navigate(`/dashboard/ready?highlight=${order._id}`);
        break;
      case 'Collected':
      case 'Rejected':
      default:
        navigate(`/dashboard/history?highlight=${order._id}`);
        break;
    }
  };

  const getStatusBadge = (status: OrderSearchResult['status']) => {
    switch (status) {
      case 'Pending':
        return {
          label: 'Pending Requests',
          badgeClass: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
        };
      case 'Accepted':
        return {
          label: 'Active Orders',
          badgeClass: 'bg-sky-500/10 text-sky-600 dark:text-sky-400 border-sky-500/20',
        };
      case 'Ready':
        return {
          label: 'Ready for Pickup',
          badgeClass: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
        };
      case 'Collected':
      case 'Rejected':
      default:
        return {
          label: 'Collection History',
          badgeClass: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
        };
    }
  };

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'GOOD MORNING' : hour < 17 ? 'GOOD AFTERNOON' : 'GOOD EVENING';

  const navRows = [
    {
      id: 'row-pending',
      label: 'Pending Requests',
      icon: Inbox,
      count: counts.pending,
      badgeColor: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
      route: '/dashboard/pending',
    },
    {
      id: 'row-orders',
      label: 'Active Orders',
      icon: CheckCircle2,
      count: counts.active,
      badgeColor: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
      route: '/dashboard/orders',
    },
    {
      id: 'row-ready',
      label: 'Ready for Pickup',
      icon: PackageCheck,
      count: counts.ready,
      badgeColor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
      route: '/dashboard/ready',
    },
    {
      id: 'row-history',
      label: 'Collection History',
      icon: History,
      count: null,
      badgeColor: 'bg-zinc-500/10 text-zinc-600 dark:text-zinc-400 border-zinc-500/20',
      route: '/dashboard/history',
    },
  ] as const;

  return (
    <div className="space-y-4 max-w-2xl">

      {/* Greeting & Shop Name */}
      <div>
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mb-1">
          {greeting}
        </p>
        <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
          {shop?.shopName ?? 'Dashboard'}
        </h1>
      </div>

      {/* KPI Metric Pills */}
      <div className="flex items-center gap-2 text-xs font-semibold text-zinc-500 dark:text-zinc-400 flex-wrap">
        {loading ? (
          <span className="text-zinc-400">Loading metrics…</span>
        ) : (
          <>
            <span className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 font-bold">
              {counts.pending} Pending
            </span>
            <span className="px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 font-bold">
              {counts.active} Active
            </span>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
              {counts.ready} Ready
            </span>
          </>
        )}
      </div>

      {/* Primary Styled Navigation Card List */}
      <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 rounded-3xl border border-zinc-200/60 dark:border-zinc-800/60 overflow-hidden shadow-xs transition-colors">
        {navRows.map((row, idx) => {
          const Icon = row.icon;
          const isLast = idx === navRows.length - 1;
          return (
            <button
              key={row.id}
              id={row.id}
              aria-label={`Go to ${row.label}`}
              onClick={() => navigate(row.route)}
              className={`w-full flex items-center justify-between px-5 py-4
                hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 active:scale-[0.99] transition-all cursor-pointer
                ${!isLast ? 'border-b border-zinc-100 dark:border-zinc-800/80' : ''}`}
            >
              {/* Left: Icon + Label */}
              <span className="flex items-center gap-3.5">
                <div className="p-2 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300">
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100 tracking-tight">{row.label}</span>
              </span>

              {/* Right: Count badge + Chevron */}
              <span className="flex items-center gap-2.5">
                {row.count !== null && (
                  <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${row.badgeColor}`}>
                    {loading ? '–' : row.count}
                  </span>
                )}
                <ChevronRight className="w-4 h-4 text-zinc-400" />
              </span>
            </button>
          );
        })}
      </div>

      {/* Quick Customer Search / Lookup Bar Widget */}
      <div className="relative space-y-2 pt-2">
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/60 border border-zinc-200/80 dark:border-zinc-800 focus-within:border-zinc-400 dark:focus-within:border-zinc-600 rounded-2xl px-4 py-3 shadow-xs flex items-center gap-3 transition-colors">
          <Search className="w-4 h-4 text-zinc-400 shrink-0" />
          <input
            id="order-quick-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by customer name, phone, item, or weight..."
            className="w-full bg-transparent text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none"
          />
          {isSearching ? (
            <Loader2 className="w-4 h-4 text-zinc-400 animate-spin shrink-0" />
          ) : searchQuery.length > 0 ? (
            <button
              onClick={() => setSearchQuery('')}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 p-0.5 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>

        {/* Live Results Dropdown Panel */}
        {searchQuery.trim().length > 0 && (
          <div className="backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl shadow-lg max-h-80 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800 animate-in z-30">
            {isSearching ? (
              <div className="p-4 text-center text-xs text-zinc-400 font-semibold flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin" /> Searching order records...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="p-4 text-center text-xs text-zinc-400 font-medium">
                No orders found matching "{searchQuery}"
              </div>
            ) : (
              searchResults.map((order) => {
                const badge = getStatusBadge(order.status);
                return (
                  <button
                    key={order._id}
                    onClick={() => handleSelectResult(order)}
                    className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors cursor-pointer"
                  >
                    <div>
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {order.customerId?.name || 'Unknown Customer'}
                      </p>
                      <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                        {order.customerId?.phone ? `${order.customerId.phone} • ` : ''}
                        <span className="font-semibold text-zinc-800 dark:text-zinc-200">{order.item}</span> ({order.weight} kg)
                      </p>
                    </div>

                    <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border shrink-0 ${badge.badgeClass}`}>
                      {badge.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>

    </div>
  );
};
