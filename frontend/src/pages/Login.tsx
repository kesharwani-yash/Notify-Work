import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/ThemeToggle';
import { Flame, Loader2, ArrowRight, Store, Mail, Lock, Phone, MapPin, Tag } from 'lucide-react';

export const Login: React.FC = () => {
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isRegister, setIsRegister] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  // Shared fields
  const [email, setEmail]       = useState<string>('');
  const [password, setPassword] = useState<string>('');

  // Register-only fields
  const [shopName,     setShopName]     = useState<string>('');
  const [shopId,       setShopId]       = useState<string>('');
  const [phone,        setPhone]        = useState<string>('');
  const [address,      setAddress]      = useState<string>('');
  const businessType = 'Flour Mill';

  /** Auto-generate slug from shop name */
  const handleSlugify = (name?: string) => {
    setShopId(
      (name || '')
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
    );
  };

  /** Typing in any field instantly clears the error banner */
  const clearError = () => { if (error) setError(''); };

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isRegister) {
      if (!shopName.trim() || !shopId.trim() || !phone.trim() || !address.trim() || !email.trim() || !password.trim()) {
        setError('All fields are required for registration.');
        return;
      }
    } else {
      if (!email.trim() || !password.trim()) {
        setError('Please enter your email and password.');
        return;
      }
    }

    setLoading(true);
    try {
      if (isRegister) {
        await register({
          shopId:       shopId.trim(),
          shopName:     shopName.trim(),
          phone:        phone.trim(),
          address:      address.trim(),
          email:        email.trim(),
          password:     password.trim(),
          businessType,
        });
      } else {
        await login(email.trim(), password);
      }
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Authentication failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleMode = () => {
    setIsRegister((prev) => !prev);
    setError('');
  };

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 gradient-bg flex flex-col items-center justify-center px-4 py-12 transition-colors relative">
      
      {/* Theme Toggle Top Right */}
      <div className="absolute top-6 right-6 z-20">
        <ThemeToggle />
      </div>

      <div className="max-w-md w-full space-y-8">

        {/* Branding */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold text-xs mb-4">
            <Flame className="w-3.5 h-3.5 fill-current" /> NotifyWork for Businesses
          </div>
          <h1 className="text-3xl font-extrabold text-zinc-900 dark:text-zinc-100 tracking-tight">
            {isRegister ? 'Create Shop Account' : 'Welcome Back'}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
            {isRegister
              ? 'Register your shop and set up your QR notifications.'
              : 'Access your owner dashboard and manage active orders.'}
          </p>
        </div>

        {/* Form Card */}
        <div className="backdrop-blur-md bg-white/70 dark:bg-zinc-900/70 rounded-3xl p-8 border border-zinc-200/60 dark:border-zinc-800/60 shadow-xs transition-colors">

          {/* Error banner */}
          {error && (
            <div
              id="auth-error-banner"
              role="alert"
              className="mb-6 p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400 text-xs font-medium flex items-start gap-2"
            >
              <span className="mt-0.5">⚠</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="space-y-4">

            {/* ── Register-only fields ── */}
            {isRegister && (
              <>
                {/* Shop Name */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Shop Name
                  </label>
                  <div className="relative">
                    <Store className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="reg-shopname"
                      type="text"
                      placeholder="e.g. Sharma Flour Mill"
                      value={shopName}
                      onChange={(e) => {
                        setShopName(e.target.value);
                        handleSlugify(e.target.value);
                        clearError();
                      }}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Slug */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Custom Shop URL Slug
                  </label>
                  <div className="relative">
                    <span className="absolute left-4 top-3.5 text-xs font-semibold text-zinc-400">/shop/</span>
                    <input
                      id="reg-shopid"
                      type="text"
                      value={shopId}
                      onChange={(e) => {
                        setShopId(e.target.value.toLowerCase().replace(/\s+/g, '-'));
                        clearError();
                      }}
                      className="w-full pl-16 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      required
                    />
                  </div>
                  <p className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1">This will be your custom QR code scanner path.</p>
                </div>

                {/* Business Type */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Business Type
                  </label>
                  <div className="relative">
                    <Tag className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="reg-business"
                      type="text"
                      value="Flour Mill"
                      disabled
                      readOnly
                      className="w-full pl-11 pr-4 py-3 bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-200/50 dark:border-zinc-800 rounded-xl text-xs font-semibold text-zinc-500 dark:text-zinc-400 cursor-not-allowed"
                    />
                  </div>
                </div>

                {/* Phone */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Business Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="reg-phone"
                      type="tel"
                      placeholder="e.g. +91 9876543210"
                      value={phone}
                      onChange={(e) => { setPhone(e.target.value); clearError(); }}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      required
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                    <input
                      id="reg-address"
                      type="text"
                      placeholder="e.g. 12, Main Bazar Road"
                      value={address}
                      onChange={(e) => { setAddress(e.target.value); clearError(); }}
                      className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            {/* ── Shared fields (Email + Password) ── */}
            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  id="auth-email"
                  type="email"
                  placeholder="e.g. owner@flourmill.com"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); clearError(); }}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1.5">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-3.5 h-4 w-4 text-zinc-400" />
                <input
                  id="auth-password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); clearError(); }}
                  className="w-full pl-11 pr-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border border-zinc-200/80 dark:border-zinc-700/80 rounded-xl text-xs font-semibold text-zinc-900 dark:text-zinc-100 focus:outline-none focus:bg-white dark:focus:bg-zinc-800 transition-all"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              id="auth-submit-btn"
              type="submit"
              disabled={loading}
              className="w-full mt-2 inline-flex items-center justify-center gap-2 px-6 py-3.5
                         bg-zinc-900 dark:bg-zinc-100 hover:bg-zinc-800 dark:hover:bg-zinc-200 disabled:opacity-70
                         text-white dark:text-zinc-900 rounded-xl text-xs font-bold shadow-xs
                         transition-all active:scale-[0.98] cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {isRegister ? 'Creating your shop…' : 'Logging you in…'}
                </>
              ) : (
                <>
                  {isRegister ? 'Register & Open Shop' : 'Login Dashboard'}
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Toggle Login ↔ Register */}
          <div className="mt-6 pt-6 border-t border-zinc-100 dark:border-zinc-800 text-center">
            <button
              id="auth-toggle-btn"
              type="button"
              onClick={toggleMode}
              className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline transition-all cursor-pointer"
            >
              {isRegister
                ? 'Already have a shop? Sign in here'
                : 'Register a new business shop account'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
