import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { api } from '../services/api';
import { Calendar, Inbox, Loader2, RefreshCw, BarChart2 } from 'lucide-react';

interface OrderType {
  _id: string;
  item: string;
  weight: number;
  collectedAt?: string;
  customerId: {
    name: string;
    phone: string;
  };
}

export const DashboardHistory: React.FC = () => {
  const location = useLocation();
  const highlightId = new URLSearchParams(location.search).get('highlight');

  const [orders, setOrders] = useState<OrderType[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  
  const getTodayString = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  const [startDate, setStartDate] = useState<string>(getTodayString());
  const [endDate, setEndDate] = useState<string>(getTodayString());

  const fetchHistory = async (applyFilter = true) => {
    try {
      setLoading(true);
      let query = '';
      if (applyFilter && (startDate || endDate)) {
        query = `?startDate=${startDate}&endDate=${endDate}`;
      }
      const data = await api.get(`/dashboard/history${query}`);
      setOrders(data);
    } catch (err) {
      console.error('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (highlightId && !loading) {
      const el = document.getElementById(`order-row-${highlightId}`);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [highlightId, loading, orders]);

  const handleApplyFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchHistory(true);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setLoading(true);
    api.get('/dashboard/history')
      .then(data => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const totalWeight = orders.reduce((sum, o) => sum + o.weight, 0);
  const totalOrders = orders.length;

  return (
    <div className="space-y-6 max-w-5xl">
      {/* View Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 transition-colors group mb-2"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Dashboard
          </Link>
          <h1 className="text-2xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">Collection History</h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">Log of completed pick-ups. Filter by date to review business volume.</p>
        </div>
      </div>

      {/* Date Filters Form */}
      <form onSubmit={handleApplyFilter} className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl p-6 shadow-xs grid grid-cols-1 md:grid-cols-3 items-end gap-4">
        <div>
          <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            Start Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
            />
          </div>
        </div>

        <div>
          <label className="block text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
            End Date
          </label>
          <div className="relative">
            <Calendar className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            disabled={loading}
            className="flex-1 py-2.5 bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 text-white dark:text-zinc-900 font-bold text-xs rounded-xl shadow-xs transition-all cursor-pointer inline-flex items-center justify-center gap-1.5 active:scale-[0.98]"
          >
            Apply Filter
          </button>
          <button
            type="button"
            onClick={handleClearFilter}
            disabled={loading}
            className="py-2.5 px-4 bg-zinc-100 dark:bg-zinc-800 border border-zinc-200/80 dark:border-zinc-700/80 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-700 dark:text-zinc-300 font-bold text-xs rounded-xl transition-all cursor-pointer inline-flex items-center justify-center active:scale-[0.98]"
          >
            Clear
          </button>
        </div>
      </form>

      {/* Analytics Summary Banner */}
      {!loading && orders.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500 border border-emerald-500/20">
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Total Orders</span>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 tracking-tight">{totalOrders} Collected</p>
            </div>
          </div>

          <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
            <div className="bg-emerald-500/10 p-2 rounded-xl text-emerald-500 border border-emerald-500/20">
              <RefreshCw className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider block">Total Weight</span>
              <p className="text-lg font-extrabold text-zinc-900 dark:text-zinc-100 mt-0.5 tracking-tight">{totalWeight.toFixed(1)} kg</p>
            </div>
          </div>
        </div>
      )}

      {/* History table list */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-emerald-500 mb-2" />
          <span className="text-xs text-zinc-400 font-bold uppercase tracking-wider">Loading history logs...</span>
        </div>
      ) : orders.length === 0 ? (
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-dashed border-zinc-200/80 dark:border-zinc-800 rounded-3xl p-16 text-center shadow-xs">
          <div className="bg-zinc-100 dark:bg-zinc-800 rounded-2xl h-12 w-12 flex items-center justify-center mx-auto mb-4 border border-zinc-200/60 dark:border-zinc-700">
            <Inbox className="h-6 w-6 text-zinc-400" />
          </div>
          <h3 className="font-bold text-zinc-900 dark:text-zinc-100 text-sm">No pickup history</h3>
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs mx-auto">No matching collected orders found for the selected date range.</p>
        </div>
      ) : (
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 border border-zinc-200/60 dark:border-zinc-800/60 rounded-3xl overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50 dark:bg-zinc-800/30 border-b border-zinc-100 dark:border-zinc-800">
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Customer</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Item Details</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Weight</th>
                  <th className="px-6 py-3.5 text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Collected Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {orders.map(order => {
                  const isHighlighted = order._id === highlightId;
                  return (
                    <tr
                      key={order._id}
                      id={`order-row-${order._id}`}
                      className={`transition-colors ${
                        isHighlighted
                          ? 'bg-emerald-500/10 dark:bg-emerald-500/20 font-semibold'
                          : 'hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60'
                      }`}
                    >
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{order.customerId?.name || (order as any).customerData?.name || 'Customer'}</p>
                        <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">{order.customerId?.phone || (order as any).customerData?.phone || ''}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{order.item}</p>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{order.weight} kg</p>
                      </td>
                      <td className="px-6 py-4 text-xs">
                        <p className="font-bold text-zinc-800 dark:text-zinc-200">
                          {order.collectedAt ? new Date(order.collectedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                        </p>
                        <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-0.5">
                          {order.collectedAt ? new Date(order.collectedAt).toLocaleDateString() : ''}
                        </p>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
