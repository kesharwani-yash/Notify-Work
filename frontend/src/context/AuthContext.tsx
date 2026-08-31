import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut,
  GoogleAuthProvider
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth } from '../config/firebase';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';
import { syncGoogleUserToFirestore } from '../services/authService';

export { syncGoogleUserToFirestore };

interface Shop {
  id: string;
  shopId: string;
  shopName: string;
  phone?: string;
  address?: string;
  email?: string;
  businessType: string;
}

interface AuthContextType {
  token: string | null;
  shop: Shop | null;
  user: FirebaseUser | null;
  loading: boolean;
  loginWithGoogle: () => Promise<FirebaseUser>;
  logout: () => void;
  refreshShop: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [token, setTokenState] = useState<string | null>(getAuthToken());
  const [shop, setShop] = useState<Shop | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const skipFetchRef = useRef<boolean>(false);

  // Safety fallback timeout to ensure loading is never stuck
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 2500);

    return () => clearTimeout(timeoutId);
  }, []);

  const fetchProfile = async () => {
    try {
      const data = await api.get('/auth/me');
      if (data) {
        setShop(data);
        return data;
      }
    } catch (err) {
      console.warn('Backend profile GET fallback to in-memory user details:', err);
      if (auth.currentUser) {
        const fallbackEmail = auth.currentUser.email || 'owner@notifywork.com';
        const rawPrefix = (fallbackEmail.split('@')[0] || 'owner').toLowerCase();
        const fallbackSlug = rawPrefix || 'owner';
        const fallbackShop: Shop = {
          id: auth.currentUser.uid,
          shopId: `${fallbackSlug}-shop`,
          shopName: `${fallbackSlug.charAt(0).toUpperCase() + fallbackSlug.slice(1)} Shop`,
          email: fallbackEmail,
          businessType: 'Flour Mill',
          phone: '+91 98765 43210',
          address: 'Main Market'
        };
        setShop(fallbackShop);
        return fallbackShop;
      }
    }
  };

  // Synchronize Firebase auth state listener safely
  useEffect(() => {
    let isMounted = true;

    const unsubscribe = onAuthStateChanged(
      auth,
      async (currentUser) => {
        if (!isMounted) return;
        try {
          if (currentUser) {
            try {
              await syncGoogleUserToFirestore(currentUser);
            } catch (syncErr) {
              console.warn('Firestore user sync warning in auth state listener:', syncErr);
            }

            const idToken = await currentUser.getIdToken();
            setAuthToken(idToken);
            setTokenState(idToken);
            setUser(currentUser);

            if (!skipFetchRef.current) {
              await fetchProfile();
            } else {
              skipFetchRef.current = false;
            }
          } else {
            clearAuthToken();
            setShop(null);
            setTokenState(null);
            setUser(null);
          }
        } catch (e) {
          console.error('Error in onAuthStateChanged:', e);
        } finally {
          if (isMounted) {
            setLoading(false);
          }
        }
      },
      (error) => {
        console.error('Firebase Auth Listener Error:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async (): Promise<FirebaseUser> => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      skipFetchRef.current = true;
      const idToken = await user.getIdToken();
      setAuthToken(idToken);
      setTokenState(idToken);
      setUser(user);

      // Synchronize Firestore shop profile
      try {
        await syncGoogleUserToFirestore(user);
      } catch (syncErr) {
        console.warn('Direct Firestore sync caught:', syncErr);
      }

      // Synchronize backend database record
      try {
        const res = await api.post('/auth/google', {
          email: user.email,
          displayName: user.displayName,
          firebaseUid: user.uid
        });
        if (res?.shop) {
          setShop(res.shop);
        }
      } catch (backendErr) {
        console.warn('Backend sync fallback warning:', backendErr);
      }

      await fetchProfile();
      return user;
    } catch (error: any) {
      // Check if user is actually authenticated despite popup close event
      if (auth.currentUser) {
        const currentUser = auth.currentUser;
        setUser(currentUser);
        const idToken = await currentUser.getIdToken();
        setAuthToken(idToken);
        setTokenState(idToken);
        try {
          await syncGoogleUserToFirestore(currentUser);
        } catch (e) {
          // ignore
        }
        await fetchProfile();
        return currentUser;
      }

      console.error('Google Sign-In failed:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      // ignore
    }
    clearAuthToken();
    setTokenState(null);
    setShop(null);
    setUser(null);
    setLoading(false);
  };

  const refreshShop = async () => {
    if (!token && !user) return;
    await fetchProfile();
  };

  return (
    <AuthContext.Provider value={{ token, shop, user, loading, loginWithGoogle, logout, refreshShop }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
