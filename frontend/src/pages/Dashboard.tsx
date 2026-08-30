import React, { useEffect, useRef, useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { api } from '../services/api';
import { playNotificationChime } from '../services/sound';
import {
  Inbox,
  Briefcase,
  CheckCircle,
  History,
  LogOut,
  QrCode,
  Flame,
  User,
  ExternalLink,
  ChevronRight,
  Bell,
  X,
} from 'lucide-react';

export const DashboardLayout: React.FC = () => {
  const { shop, logout } = useAuth();
  const socket = useSocket();
  const location = useLocation();
  const navigate = useNavigate();

  const [showQR, setShowQR] = useState<boolean>(false);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);
  const [counts, setCounts] = useState<{ pending: number; active: number; ready: number }>({
    pending: 0,
    active: 0,
    ready: 0,
  });
  const [notificationAlert, setNotificationAlert] = useState<string | null>(null);

  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    if (isProfileOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isProfileOpen]);

  const fetchCounts = async () => {
    try {
      const pendingData = await api.get('/dashboard/pending');
      const activeData = await api.get('/dashboard/orders');
      const readyData = await api.get('/dashboard/ready');

      setCounts({
        pending: Array.isArray(pendingData) ? pendingData.length : 0,
        active: Array.isArray(activeData) ? activeData.length : 0,
        ready: Array.isArray(readyData) ? readyData.length : 0,
      });
    } catch (err) {
      console.error('Failed to load dashboard metrics', err);
      setCounts({ pending: 0, active: 0, ready: 0 });
    }
  };

  useEffect(() => {
    fetchCounts();
  }, [location.pathname]);

  useEffect(() => {
    if (!socket || !shop) return;

    if (shop.id) socket.emit('join-shop', shop.id);
    if (shop.shopId) socket.emit('join-shop', shop.shopId);
    if ((shop as any).slug) socket.emit('join-shop', (shop as any).slug);

    const handleNewOrder = (newOrder: any) => {
      fetchCounts();
      const customerName = newOrder.customerData?.name || newOrder.customerId?.name || newOrder.customerName || 'Customer';
      const itemName = newOrder.itemDetails?.itemName || newOrder.item || 'Grain';
      setNotificationAlert(`New order submitted by ${customerName} for ${itemName}!`);

      playNotificationChime('order');
    };

    socket.on('new-order', handleNewOrder);
    socket.on('new_order', handleNewOrder);

    return () => {
      socket.off('new-order', handleNewOrder);
      socket.off('new_order', handleNewOrder);
    };
  }, [socket, shop]);

  const activeLinkClass = 'bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 shadow-xs font-bold';
  const inactiveLinkClass = 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100/80 dark:hover:bg-zinc-800/80 hover:text-zinc-900 dark:hover:text-zinc-100 font-semibold';

  const isLaunchpad = location.pathname === '/dashboard' || location.pathname === '/dashboard/';
  const customerSubmissionUrl = `${window.location.origin}/shop/${shop?.shopId}/submit`;
  const shopInitial = shop?.shopName?.charAt(0)?.toUpperCase() ?? 'S';

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:flex-row relative transition-colors">

      {/* Real-time Order Alert Toast */}
      {notificationAlert && (
        <div className="fixed bottom-6 right-6 z-[60] max-w-md w-full backdrop-blur-md bg-zinc-900/90 dark:bg-zinc-900/90 text-white rounded-2xl p-4 shadow-xl flex items-start gap-3 border border-zinc-800 animate-bounce">
          <div className="bg-emerald-500/20 p-2 rounded-xl text-emerald-400 mt-0.5 border border-emerald-500/30">
            <Bell className="w-5 h-5 animate-swing" />
          </div>
          <div className="flex-1">
            <h4 className="text-xs font-bold text-zinc-200">Real-time Order Alert</h4>
            <p className="text-xs text-zinc-400 mt-1 leading-relaxed">{notificationAlert}</p>
            <button
              onClick={() => {
                setNotificationAlert(null);
                navigate('/dashboard/pending');
              }}
              className="mt-2 text-[11px] font-bold text-emerald-400 hover:underline inline-flex items-center gap-1 cursor-pointer"
            >
              Open Pending View <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <button onClick={() => setNotificationAlert(null)} className="text-zinc-500 hover:text-zinc-300">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* STICKY TOP APPLICATION BAR / SIDEBAR (Elevated stacking context) */}
      <aside
        className={`backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 border-b md:border-b-0 border-zinc-200/80 dark:border-zinc-800/80 shrink-0 flex flex-col justify-between transition-colors relative z-40 ${
          isLaunchpad
            ? 'w-full md:w-64 md:border-r px-6 py-4'
            : 'w-full md:w-64 md:border-r px-6 py-4 md:py-6'
        }`}
      >
        <div>

          {/* Logo Brand + Profile & Theme Toggle */}
          <div className="flex items-center justify-between px-1">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <div className="h-7 w-7 bg-emerald-500 rounded-xl flex items-center justify-center text-white shadow-xs">
                <Flame className="w-4 h-4 fill-current" />
              </div>
              <span className="font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight text-base">NotifyWork</span>
            </div>

            <div className="flex items-center gap-2">
              {/* Theme Toggle */}
              <ThemeToggle />

              {/* Profile Badge (Elevated z-50 dropdown wrapper) */}
              <div className="relative z-50" ref={profileRef}>
                <button
                  id="profile-badge-btn"
                  aria-label="Open profile menu"
                  aria-haspopup="true"
                  aria-expanded={isProfileOpen}
                  onClick={() => setIsProfileOpen((prev) => !prev)}
                  className="h-8 w-8 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-full flex items-center justify-center font-bold text-xs shadow-xs hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-95 transition-all select-none cursor-pointer"
                >
                  {shopInitial}
                </button>

                {/* Dropdown Menu */}
                {isProfileOpen && (
                  <div
                    role="menu"
                    aria-orientation="vertical"
                    className="absolute right-0 mt-2 w-56 backdrop-blur-md bg-white/95 dark:bg-zinc-900/95 border border-zinc-200 dark:border-zinc-800 rounded-2xl shadow-xl z-50 overflow-hidden animate-in"
                  >
                    <div className="px-4 py-3 border-b border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/30">
                      <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100 truncate">{shop?.shopName}</p>
                      <p className="text-[10px] text-zinc-400 capitalize mt-0.5">{shop?.businessType}</p>
                    </div>

                    <div className="py-1">
                      <button
                        role="menuitem"
                        id="dropdown-profile"
                        onClick={() => {
                          setIsProfileOpen(false);
                          navigate('/dashboard/profile');
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
                      >
                        <div className="h-6 w-6 bg-zinc-100 dark:bg-zinc-800 rounded-lg flex items-center justify-center shrink-0">
                          <User className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">Profile</p>
                          <p className="text-[10px] text-zinc-400">View shop details</p>
                        </div>
                      </button>

                      <button
                        role="menuitem"
                        id="dropdown-qrcode"
                        onClick={() => {
                          setIsProfileOpen(false);
                          setShowQR(true);
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100/60 dark:hover:bg-zinc-800/60 transition-colors text-left cursor-pointer"
                      >
                        <div className="h-6 w-6 bg-emerald-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <QrCode className="w-3.5 h-3.5 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">QR Code</p>
                          <p className="text-[10px] text-zinc-400">Share your shop link</p>
                        </div>
                      </button>

                      <div className="h-px bg-zinc-100 dark:bg-zinc-800 mx-3 my-1" />

                      <button
                        role="menuitem"
                        id="dropdown-logout"
                        onClick={() => {
                          setIsProfileOpen(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-4 py-2.5 text-xs font-medium text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
                      >
                        <div className="h-6 w-6 bg-rose-500/10 rounded-lg flex items-center justify-center shrink-0">
                          <LogOut className="w-3.5 h-3.5 text-rose-500" />
                        </div>
                        <div>
                          <p className="text-xs font-semibold text-rose-600 dark:text-rose-400">Logout</p>
                          <p className="text-[10px] text-rose-400">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar Nav Links — visible ONLY on sub-pages (e.g. /dashboard/pending) for quick desktop tab navigation */}
          {!isLaunchpad && (
            <nav className="space-y-1 mt-6 hidden md:block">
              <Link
                to="/dashboard/pending"
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] ${
                  location.pathname === '/dashboard/pending' ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Inbox className="w-4 h-4" /> Pending Requests
                </span>
                {counts.pending > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      location.pathname === '/dashboard/pending'
                        ? 'bg-amber-500 text-white'
                        : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20'
                    }`}
                  >
                    {counts.pending}
                  </span>
                )}
              </Link>

              <Link
                to="/dashboard/orders"
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] ${
                  location.pathname === '/dashboard/orders' ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Briefcase className="w-4 h-4" /> Active Orders
                </span>
                {counts.active > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      location.pathname === '/dashboard/orders'
                        ? 'bg-blue-500 text-white'
                        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                    }`}
                  >
                    {counts.active}
                  </span>
                )}
              </Link>

              <Link
                to="/dashboard/ready"
                className={`flex items-center justify-between px-4 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] ${
                  location.pathname === '/dashboard/ready' ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <CheckCircle className="w-4 h-4" /> Ready for Pickup
                </span>
                {counts.ready > 0 && (
                  <span
                    className={`px-2 py-0.5 text-[10px] font-bold rounded-full ${
                      location.pathname === '/dashboard/ready'
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                    }`}
                  >
                    {counts.ready}
                  </span>
                )}
              </Link>

              <Link
                to="/dashboard/history"
                className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs transition-all active:scale-[0.98] ${
                  location.pathname === '/dashboard/history' ? activeLinkClass : inactiveLinkClass
                }`}
              >
                <History className="w-4 h-4" /> Collection History
              </Link>
            </nav>
          )}
        </div>
      </aside>

      {/* MAIN CONTENT OUTLET */}
      <main className="flex-1 min-w-0 px-6 py-4 md:px-10 md:py-6 overflow-y-auto">
        <Outlet context={{ fetchCounts }} />
      </main>

      {/* QR MODAL VIEW */}
      {showQR && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-950/60 backdrop-blur-sm p-4">
          <div className="backdrop-blur-md bg-white/90 dark:bg-zinc-900/90 rounded-3xl p-8 max-w-sm w-full border border-zinc-200 dark:border-zinc-800 shadow-premium relative text-center">

            <button
              onClick={() => setShowQR(false)}
              className="absolute right-6 top-6 p-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="inline-flex p-3 bg-emerald-500/10 rounded-2xl text-emerald-500 mb-4 border border-emerald-500/20">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-zinc-900 dark:text-zinc-100 text-lg leading-tight tracking-tight">Customer QR Code</h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Display this QR inside your shop. Customers scan this to submit their work orders.
            </p>

            <div className="bg-white p-4 border border-zinc-200 dark:border-zinc-700 rounded-2xl inline-block mt-6">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(
                  customerSubmissionUrl
                )}`}
                alt="Shop QR Code"
                className="w-44 h-44"
              />
            </div>

            <div className="mt-6 flex flex-col gap-2">
              <a
                href={customerSubmissionUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-900 rounded-xl text-xs font-bold transition-all hover:bg-zinc-800 dark:hover:bg-zinc-200 active:scale-[0.98]"
              >
                Open Submission Page <ExternalLink className="w-3.5 h-3.5" />
              </a>
              <p className="text-[10px] text-zinc-400 dark:text-zinc-500 truncate">URL: {customerSubmissionUrl}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
