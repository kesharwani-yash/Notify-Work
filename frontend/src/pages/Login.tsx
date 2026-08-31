import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Flame,
  Loader2,
  ShieldCheck,
  QrCode,
  Bell,
  ArrowRight,
  Sparkles,
  Receipt,
  Clock,
  ExternalLink,
  Store,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [loading, setLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleGoogleAuth = async () => {
    if (loading) return;
    setLoading(true);
    setErrorMessage(null);

    try {
      const user = await loginWithGoogle();
      if (user) {
        navigate('/dashboard');
      }
    } catch (err: any) {
      console.error('Google Auth execution failed:', err);
      if (err?.code === 'auth/popup-closed-by-user') {
        setErrorMessage('Sign-in cancelled. Please click below to choose your Google account.');
      } else if (err?.code === 'auth/popup-blocked') {
        setErrorMessage('Popup was blocked by your browser. Please allow popups for NotifyWork and retry.');
      } else if (err?.code === 'auth/unauthorized-domain') {
        setErrorMessage('This domain is not authorized in Firebase Authentication settings.');
      } else {
        setErrorMessage(
          err?.message || 'Failed to sign in with Google. Please try again.'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col md:grid md:grid-cols-2 relative overflow-hidden transition-colors duration-300">
      
      {/* Floating Theme Toggle (Top-Right) */}
      <div className="absolute top-5 right-5 z-50">
        <ThemeToggle />
      </div>

      {/* ─────────────────────────────────────────────────────────────
          LEFT SIDE: Branding, Tagline & High-Tech Flour Mill Features
          ───────────────────────────────────────────────────────────── */}
      <div className="relative hidden md:flex flex-col justify-between p-10 lg:p-14 bg-slate-900 text-white overflow-hidden">
        
        {/* Subtle Ambient Gradient Auras */}
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full bg-emerald-500/20 blur-[120px] pointer-events-none" />
        <div className="absolute top-1/2 -right-24 w-96 h-96 rounded-full bg-teal-500/15 blur-[140px] pointer-events-none" />
        <div className="absolute -bottom-24 left-1/3 w-80 h-80 rounded-full bg-indigo-500/15 blur-[120px] pointer-events-none" />
        
        {/* Subtle Background Pattern */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none" />

        {/* Top Header / Brand Logo */}
        <div className="relative z-10">
          <div className="inline-flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/30 text-white">
              <Flame className="w-6 h-6 fill-current" />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight text-white flex items-center gap-2">
                NotifyWork
                <span className="px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Flour Mill Pro
                </span>
              </span>
              <p className="text-xs text-slate-400 font-medium">Smart Queue & Automated Notification Cloud</p>
            </div>
          </div>
        </div>

        {/* Center: Tagline & Interactive Feature Badges */}
        <div className="relative z-10 my-auto py-10 space-y-8 max-w-xl">
          
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Next-Generation Mill Operations
            </div>

            <h1 className="text-3xl lg:text-4xl xl:text-5xl font-black text-white tracking-tight leading-[1.15]">
              Say goodbye to milling queues with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-teal-300 to-emerald-200">automated notifications.</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-md">
              Empower your grain & flour mill with contactless QR intake, live batch management, and real-time pickup alerts.
            </p>
          </div>

          {/* Interactive High-Tech Feature Badges */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            
            <motion.div
              whileHover={{ y: -2, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all space-y-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <QrCode className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">QR Order Tracking</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-8">Customers scan at counter to submit grains</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all space-y-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-teal-500/20 text-teal-400">
                  <Bell className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Real-time Order Updates</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-8">Instant SMS, Push & WhatsApp completion alerts</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all space-y-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-indigo-500/20 text-indigo-400">
                  <Receipt className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Automated Receipts</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-8">Live item rates & calculated digital slips</p>
            </motion.div>

            <motion.div
              whileHover={{ y: -2, backgroundColor: 'rgba(255, 255, 255, 0.08)' }}
              className="p-3.5 rounded-2xl bg-white/[0.04] border border-white/10 backdrop-blur-md transition-all space-y-1"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-xl bg-amber-500/20 text-amber-400">
                  <Clock className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-white">Live Queue Monitor</span>
              </div>
              <p className="text-[11px] text-slate-400 pl-8">Organize pending, milling & ready batches</p>
            </motion.div>

          </div>

          {/* Trust Banner */}
          <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>100% Cloud Synced</span>
            </div>
            <div className="flex items-center gap-1.5">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Zero Hardware Required</span>
            </div>
          </div>

        </div>

        {/* Bottom Footer Details */}
        <div className="relative z-10 text-xs text-slate-500 flex items-center justify-between">
          <span>Enterprise Grade Security</span>
          <span>© {new Date().getFullYear()} NotifyWork Inc.</span>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────
          RIGHT SIDE: Auth Form, Google Single Sign-On & Direct Links
          ───────────────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col justify-between p-6 sm:p-10 lg:p-16 relative">
        
        {/* Mobile Header Branding (Visible on mobile only) */}
        <div className="md:hidden flex items-center gap-3 pt-2 mb-6">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-white">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-lg font-black tracking-tight text-zinc-900 dark:text-zinc-100">NotifyWork</span>
            <span className="ml-2 px-1.5 py-0.5 text-[9px] font-extrabold uppercase rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              Business
            </span>
          </div>
        </div>

        {/* Center Container for Login Card */}
        <div className="my-auto max-w-md w-full mx-auto space-y-6">
          
          {/* Card Container with Glassmorphism */}
          <div className="bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md border border-gray-100 dark:border-zinc-800 shadow-xl rounded-3xl p-7 sm:p-9 space-y-6">
            
            {/* Header Content */}
            <div className="text-center space-y-2">
              <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-1 border border-emerald-500/20">
                <Store className="w-6 h-6" />
              </div>
              <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                Shop Owner Sign In
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mx-auto">
                Sign in with your Google account to manage your live queue, prices, and customer orders.
              </p>
            </div>

            {/* Error Banner with AnimatePresence */}
            <AnimatePresence mode="wait">
              {errorMessage && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                  id="auth-error-banner"
                  role="alert"
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2.5"
                >
                  <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                  <span className="flex-1 leading-relaxed">{errorMessage}</span>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Google Sign-In Action */}
            <div className="space-y-3.5">
              <button
                id="google-auth-btn"
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl p-4 text-zinc-800 dark:text-zinc-100 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 hover:scale-[1.01] active:scale-[0.99] transition-transform duration-200 shadow-md active:shadow-xs disabled:opacity-60 disabled:pointer-events-none cursor-pointer group"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                    <span>Signing in with Google…</span>
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5 flex-shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                      <path
                        fill="#4285F4"
                        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.34 24 12 24z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
                      />
                      <path
                        fill="#EA4335"
                        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
                      />
                    </svg>
                    <span className="tracking-tight">Sign in with Google</span>
                    <ArrowRight className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                <span>Single-Click Sign On • No password required</span>
              </div>
            </div>

            {/* Auto Workspace Note */}
            <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-2xl p-3.5 text-center">
              <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                ✨ First time? Your shop workspace & custom QR link are automatically created upon login.
              </p>
            </div>

          </div>

          {/* Quick Direct Navigation Links */}
          <div className="p-4 rounded-2xl bg-zinc-100/60 dark:bg-zinc-900/40 border border-zinc-200/50 dark:border-zinc-800/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
            <span className="font-medium text-[11px]">Looking for something else?</span>
            <div className="flex items-center gap-4 text-xs font-semibold">
              <Link
                to="/shop/demo/submit"
                className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 hover:underline transition-all"
              >
                <span>Public QR Form</span>
                <ExternalLink className="w-3 h-3" />
              </Link>
              <span className="text-zinc-300 dark:text-zinc-700">•</span>
              <a
                href="mailto:support@notifywork.com"
                className="inline-flex items-center gap-1 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
              >
                <HelpCircle className="w-3 h-3" />
                <span>Help & Support</span>
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Note */}
        <div className="text-center py-2 text-[11px] text-zinc-400 dark:text-zinc-500">
          Protected by Google Identity Services • End-to-End Encrypted
        </div>

      </div>

    </div>
  );
};

export default Login;
