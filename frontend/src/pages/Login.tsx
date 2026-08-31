import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import {
  Flame,
  Loader2,
  ShieldCheck,
  Zap,
  QrCode,
  Bell,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Smartphone,
  Layers
} from 'lucide-react';
import { motion } from 'framer-motion';

export const Login: React.FC = () => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);
    try {
      await loginWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please click below to sign in with your Google account.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Please allow popups for NotifyWork and retry.');
      } else {
        setError(err.message || 'Google authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 flex flex-col justify-between selection:bg-emerald-500 selection:text-white transition-colors duration-300 relative overflow-hidden">
      
      {/* Dynamic Background Mesh Gradients */}
      <div className="absolute top-[-15%] left-[-10%] w-[500px] h-[500px] rounded-full bg-emerald-500/15 dark:bg-emerald-500/10 blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[550px] h-[550px] rounded-full bg-indigo-500/15 dark:bg-indigo-500/10 blur-[140px] pointer-events-none -z-10" />

      {/* Top Navbar */}
      <header className="w-full max-w-7xl mx-auto px-6 py-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white">
            <Flame className="w-5 h-5 fill-current" />
          </div>
          <div>
            <span className="text-base font-black tracking-tight text-zinc-900 dark:text-zinc-100">NotifyWork</span>
            <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-extrabold uppercase tracking-wider rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              Business Suite
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 z-10">
        <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Hero Pitch (5 cols on Desktop) */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
            className="lg:col-span-6 space-y-6 text-center lg:text-left"
          >
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs">
              <Sparkles className="w-3.5 h-3.5" /> Next-Gen Order & Queue System
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight leading-[1.15]">
              Streamline customer orders with <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-teal-500 to-emerald-400">instant notifications.</span>
            </h1>

            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
              Place QR codes at your counter, eliminate long waiting queues, and automatically alert customers when their orders are ready.
            </p>

            {/* Feature Bullet Points */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 text-left">
              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-xs">
                <div className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5">
                  <QrCode className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">QR Code Ordering</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Zero apps required for customers</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-xs">
                <div className="p-1.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 mt-0.5">
                  <Bell className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">1-Click Alerts</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Instant web & push messages</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-xs">
                <div className="p-1.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mt-0.5">
                  <Zap className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Live Dashboard</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Track pending & completed jobs</p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-2xl bg-white/50 dark:bg-zinc-900/50 border border-zinc-200/50 dark:border-zinc-800/60 backdrop-blur-xs">
                <div className="p-1.5 rounded-xl bg-teal-500/10 text-teal-600 dark:text-teal-400 mt-0.5">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h2 className="text-xs font-bold text-zinc-900 dark:text-zinc-100">Mobile Ready</h2>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">Works on phone, tablet & PC</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right Login Card (6 cols on Desktop) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="lg:col-span-6 max-w-md w-full mx-auto"
          >
            <div className="relative rounded-3xl backdrop-blur-xl bg-white/80 dark:bg-zinc-900/80 border border-zinc-200/80 dark:border-zinc-800 shadow-2xl p-7 sm:p-9 space-y-6">
              
              {/* Card Header */}
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center p-3 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 text-emerald-600 dark:text-emerald-400 mb-1 border border-emerald-500/20">
                  <Layers className="w-6 h-6" />
                </div>
                <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
                  Shop Owner Portal
                </h2>
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  Sign in with Google to access your store orders, live queue, and QR code manager.
                </p>
              </div>

              {/* Error Banner */}
              {error && (
                <div
                  id="auth-error-banner"
                  role="alert"
                  className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2.5 animate-in fade-in"
                >
                  <span className="text-sm mt-[-1px]">⚠️</span>
                  <span className="flex-1 leading-relaxed">{error}</span>
                </div>
              )}

              {/* Google Sign-in CTA */}
              <div className="space-y-3.5">
                <motion.button
                  whileHover={{ scale: loading ? 1 : 1.01 }}
                  whileTap={{ scale: loading ? 1 : 0.98 }}
                  id="google-auth-btn"
                  type="button"
                  onClick={handleGoogleAuth}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3.5 bg-white dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700/80 hover:border-emerald-500/50 dark:hover:border-emerald-500/50 rounded-2xl p-4 text-zinc-800 dark:text-zinc-100 font-bold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/50 transition-all shadow-md active:shadow-xs disabled:opacity-60 cursor-pointer group"
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
                      <span className="tracking-tight">Continue with Google</span>
                      <ArrowRight className="w-4 h-4 ml-auto text-zinc-400 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition-all" />
                    </>
                  )}
                </motion.button>

                <div className="flex items-center justify-center gap-1.5 text-[11px] text-zinc-400 dark:text-zinc-500 font-medium">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Single-Click Sign On • No Passwords Needed</span>
                </div>
              </div>

              {/* Quick Perks Checklist */}
              <div className="pt-5 border-t border-zinc-100 dark:border-zinc-800 space-y-2.5">
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Automatic custom QR storefront generation</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Instant customer status tracking screen</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-zinc-600 dark:text-zinc-300">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                  <span>Multi-item rates and customizable catalog</span>
                </div>
              </div>

              {/* Status Note */}
              <div className="bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 rounded-xl p-3 text-center">
                <p className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                  ✨ First time? Your shop workspace is configured automatically upon login.
                </p>
              </div>

            </div>
          </motion.div>

        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-7xl mx-auto px-6 py-6 text-center text-xs text-zinc-400 dark:text-zinc-500 z-10">
        <p>© {new Date().getFullYear()} NotifyWork Inc. • Real-time Business Order & Notification Infrastructure</p>
      </footer>

    </div>
  );
};

export default Login;
