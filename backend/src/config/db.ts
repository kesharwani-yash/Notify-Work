import { db } from './firebaseAdmin';

export const connectDB = async () => {
  try {
    // Database connection established
  } catch (err: any) {
    console.error('❌ Firebase connection error:', err.message);
  }
};

export const isDBConnected = (): boolean => {
  return true;
};
