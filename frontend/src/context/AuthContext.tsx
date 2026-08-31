import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  onAuthStateChanged,
  signInWithPopup,
  signOut
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, googleProvider } from '../config/firebase';
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
  loginWithGoogle: () => Promise<FirebaseUser>;
  logout: () => void;
  refreshShop: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const syncGoogleUserToFirestore = async (user: FirebaseUser) => {
  const shopRef = doc(db, 'shops', user.uid);
  const shopSnap = await getDoc(shopRef);

  if (!shopSnap.exists()) {
    // Generate standard slug from display name or email prefix
    const baseSlug = (user.displayName || user.email?.split('@')[0] || 'shop')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '');
    const slug = `${baseSlug}-${Math.floor(10 + Math.random() * 90)}`;

    await setDoc(shopRef, {
      shopId: user.uid,
      slug: slug,
      shopName: `${user.displayName || 'Owner'}'s Shop`,
      ownerName: user.displayName || 'Owner',
      email: user.email,
      phone: user.phoneNumber || '',
      businessType: 'Flour Mill', // Hardcoded standard
      address: '',
      operatingHours: '9:00 AM - 8:00 PM',
      services: [
        { name: 'Wheat (Atta)', rate: 5, unit: 'kg' },
        { name: 'Rice (Chawal)', rate: 8, unit: 'kg' }
      ],
      createdAt: serverTimestamp()
    });
  }
};

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

  const loginWithGoogle = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;

      // Check or initialize shop document in Firestore
      await syncGoogleUserToFirestore(user);

      const idToken = await user.getIdToken();
      setAuthToken(idToken);
      setTokenState(idToken);
      setUser(user);

      try {
        await api.post('/auth/google', {
          email: user.email,
          displayName: user.displayName,
          firebaseUid: user.uid
        });
      } catch (e) {
        // Fallback or non-blocking
      }

      await fetchProfile();
      return user;
    } catch (error) {
      console.error("Google Sign-In failed:", error);
      throw error;
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
