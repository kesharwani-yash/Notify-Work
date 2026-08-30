import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { auth, googleProvider } from '../config/firebase';
import { api, setAuthToken, clearAuthToken, getAuthToken } from '../services/api';

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
  login: (email: string, password: string) => Promise<void>;
  register: (data: any) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
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
    }, 2000);

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
        const fallbackSlug = fallbackEmail.split('@')[0].toLowerCase();
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
      async (firebaseUser) => {
        if (!isMounted) return;
        try {
          setUser(firebaseUser);
          if (firebaseUser) {
            const idToken = await firebaseUser.getIdToken();
            setAuthToken(idToken);
            setTokenState(idToken);
            if (!skipFetchRef.current) {
              await fetchProfile();
            } else {
              skipFetchRef.current = false;
            }
          } else {
            clearAuthToken();
            setShop(null);
            setTokenState(null);
          }
        } catch (e) {
          console.error('Error in onAuthStateChanged:', e);
        } finally {
          if (isMounted) setLoading(false);
        }
      },
      (error) => {
        console.error('Firebase Auth Listener Error:', error);
        if (isMounted) setLoading(false);
      }
    );

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const idToken = await userCredential.user.getIdToken();
      skipFetchRef.current = true;
      setAuthToken(idToken);
      setTokenState(idToken);
      setUser(userCredential.user);
    } catch (e) {
      const data = await api.post('/auth/login', { email, password });
      skipFetchRef.current = true;
      setAuthToken(data.token);
      setShop(data.shop);
      setTokenState(data.token);
    } finally {
      await fetchProfile();
      setLoading(false);
    }
  };

  const register = async (registerData: any) => {
    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        registerData.email,
        registerData.password
      );
      const idToken = await userCredential.user.getIdToken();
      skipFetchRef.current = true;
      setAuthToken(idToken);
      setTokenState(idToken);
      setUser(userCredential.user);

      try {
        const res = await api.post('/auth/register', {
          ...registerData,
          firebaseUid: userCredential.user.uid
        });
        if (res?.shop) setShop(res.shop);
      } catch (err) {
        await fetchProfile();
      }
    } catch (e) {
      const data = await api.post('/auth/register', registerData);
      skipFetchRef.current = true;
      setAuthToken(data.token);
      setShop(data.shop);
      setTokenState(data.token);
    } finally {
      setLoading(false);
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    try {
      const userCredential = await signInWithPopup(auth, googleProvider);
      const idToken = await userCredential.user.getIdToken();
      skipFetchRef.current = true;
      setAuthToken(idToken);
      setTokenState(idToken);
      setUser(userCredential.user);

      try {
        const res = await api.post('/auth/google', {
          email: userCredential.user.email,
          displayName: userCredential.user.displayName,
          firebaseUid: userCredential.user.uid
        });
        setShop(res.shop);
      } catch (err) {
        await fetchProfile();
      }
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
    <AuthContext.Provider value={{ token, shop, user, loading, login, register, loginWithGoogle, logout, refreshShop }}>
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
