import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDBXw-da2m7FTfMAF6kzAmPWgKq0AgVcTg",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "notify-work.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "notify-work",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "notify-work.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "234471117279",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:234471117279:web:7f686bfc16e1cd9e03746a",
};

// Validate critical keys to prevent silent failures
if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
  console.error("❌ Missing Firebase VITE_ environment variables in .env file!");
}

// Prevent re-initialization errors during Vite Hot Module Replacement (HMR)
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const googleProvider = new GoogleAuthProvider();
export default app;
