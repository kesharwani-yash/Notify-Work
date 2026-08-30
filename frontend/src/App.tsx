import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { Login } from './pages/Login';
import { SubmitOrder } from './pages/SubmitOrder';
import { OrderStatus } from './pages/OrderStatus';
import { DashboardLayout } from './pages/Dashboard';
import { DashboardHome } from './pages/DashboardHome';
import { DashboardPending } from './pages/DashboardPending';
import { DashboardOrders } from './pages/DashboardOrders';
import { DashboardReady } from './pages/DashboardReady';
import { DashboardHistory } from './pages/DashboardHistory';
import { OwnerProfile } from './pages/OwnerProfile';
import { Loader2, AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  public state: ErrorBoundaryState = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('React ErrorBoundary caught an exception:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950 p-6 text-center">
          <div className="max-w-md w-full backdrop-blur-md bg-white/80 dark:bg-zinc-900/80 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-xl space-y-4">
            <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">Something went wrong</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              {this.state.error?.message || 'An unexpected application error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 text-white text-xs font-bold rounded-xl shadow-xs hover:bg-emerald-600 transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Reload Application
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Protected Route wrapper for owner dashboard
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, shop, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!user && !shop) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

// Route wrapper to redirect logged in users directly to dashboard
const GuestRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, shop, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-zinc-50 dark:bg-zinc-950">
        <Loader2 className="h-8 w-8 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (user || shop) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SocketProvider>
            <BrowserRouter>
              <Routes>
                {/* Owner Authentication */}
                <Route
                  path="/login"
                  element={
                    <GuestRoute>
                      <Login />
                    </GuestRoute>
                  }
                />

                {/* Customer Order Submission (Direct & QR links) */}
                <Route path="/shop/:shopId/submit" element={<SubmitOrder />} />
                <Route path="/shop/:shopId" element={<SubmitOrder />} />
                <Route path="/qr/:shopId/submit" element={<SubmitOrder />} />
                <Route path="/qr/:shopId" element={<SubmitOrder />} />

                {/* Customer Order Status Page */}
                <Route path="/shop/:shopId/order/:orderId" element={<OrderStatus />} />
                <Route path="/order/:orderId" element={<OrderStatus />} />

                {/* Owner Dashboard Layout (Private) */}
                <Route
                  path="/dashboard"
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="pending" element={<DashboardPending />} />
                  <Route path="orders" element={<DashboardOrders />} />
                  <Route path="ready" element={<DashboardReady />} />
                  <Route path="history" element={<DashboardHistory />} />
                  <Route path="profile" element={<OwnerProfile />} />
                  
                  {/* Launchpad Hub (index) */}
                  <Route index element={<DashboardHome />} />
                </Route>

                {/* Root Redirect fallback */}
                <Route path="*" element={<Navigate to="/login" replace />} />
              </Routes>
            </BrowserRouter>
          </SocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
