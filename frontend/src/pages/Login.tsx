import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Flame, Loader2, Sparkles, ShieldCheck, Zap, QrCode, Bell } from 'lucide-react';

export const Login: React.FC = () => {
  const { loginWithGoogle, authError, clearAuthError } = useAuth();
  const navigate = useNavigate();

  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Sync any auth errors from Firebase redirect or context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  const handleGoogleAuth = async () => {
    setError('');
    if (clearAuthError) clearAuthError();
    setLoading(true);
    try {
      const user = await loginWithGoogle();
      if (user) {
        navigate('/dashboard');
      }
      // If user is undefined, redirect is currently processing and page will navigate
    } catch (err: any) {
      if (err.code === 'auth/popup-closed-by-user') {
        setError('Sign-in cancelled. Please continue with Google to access your dashboard.');
      } else if (err.code === 'auth/popup-blocked') {
        setError('Popup was blocked by your browser. Redirecting to Google Sign-In...');
      } else if (err.code === 'auth/unauthorized-domain') {
        setError('This domain is not authorized in Firebase Console. Please add your domain to Authorized Domains in Firebase Authentication Settings.');
      } else if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your internet connection and try again.');
      } else if (err.code === 'auth/user-disabled') {
        setError('This user account has been disabled. Please contact support.');
      } else {
        setError(err.message || 'Google authentication failed. Please try again.');
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 gradient-bg flex flex-col items-center justify-center px-4 py-12 transition-colors relative">
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">

        {/* Branding Header */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-4">
            <Flame className="w-3.5 h-3.5 fill-current" /> NotifyWork for Businesses
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            Welcome to NotifyWork
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 max-w-sm mx-auto">
            Manage your shop, generate QR order links, and send instant WhatsApp notifications to customers.
          </p>
        </div>

        {/* Auth Card */}
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 rounded-3xl p-8 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xl transition-colors space-y-6">

          {/* Error banner */}
          {error && (
            <div
              id="auth-error-banner"
              role="alert"
              className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2"
            >
              <span className="mt-0.5">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Google Sign-in Button */}
          <div className="space-y-4">
            <button
              id="google-auth-btn"
              type="button"
              onClick={handleGoogleAuth}
              disabled={loading}
              className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-xl p-3.5 text-zinc-800 dark:text-zinc-100 font-semibold text-sm hover:bg-zinc-50 dark:hover:bg-zinc-700/60 transition-all shadow-sm active:scale-[0.99] disabled:opacity-60 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  <span>Connecting to Google…</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24">
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
                  <span>Continue with Google</span>
                </>
              )}
            </button>

            <div className="flex items-center gap-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500 justify-center">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Fast & secure single sign-on powered by Google</span>
            </div>
          </div>

          {/* Value Highlights */}
          <div className="pt-6 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
            <p className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 dark:text-zinc-500">
              What you get with NotifyWork
            </p>
            <div className="grid grid-cols-1 gap-2.5 text-xs text-zinc-600 dark:text-zinc-300">
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                  <QrCode className="w-3.5 h-3.5" />
                </div>
                <span>Instant QR code storefront & order submission</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                  <Bell className="w-3.5 h-3.5" />
                </div>
                <span>Automated WhatsApp completion notifications</span>
              </div>
              <div className="flex items-center gap-2.5">
                <div className="p-1 rounded-md bg-emerald-500/10 text-emerald-500">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span>Real-time live queue and business order tracking</span>
              </div>
            </div>
          </div>

        </div>

        {/* Footer Note */}
        <div className="text-center">
          <p className="text-[11px] text-zinc-400 dark:text-zinc-500 inline-flex items-center gap-1.5">
            <Sparkles className="w-3 h-3 text-amber-500" />
            No password required • Automatic shop workspace setup
          </p>
        </div>

      </div>
    </div>
  );
};
export default Login;
