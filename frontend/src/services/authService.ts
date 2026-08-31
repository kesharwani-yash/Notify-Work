import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import type { User } from 'firebase/auth';

export const syncGoogleUserToFirestore = async (user: User) => {
  try {
    const shopRef = doc(db, 'shops', user.uid);
    const shopSnap = await getDoc(shopRef);

    if (!shopSnap.exists()) {
      const baseSlug = (user.displayName || user.email?.split('@')[0] || 'shop')
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '');
      const slug = `${baseSlug}-${Math.floor(100 + Math.random() * 900)}`;

      await setDoc(shopRef, {
        shopId: user.uid,
        slug: slug,
        shopName: `${user.displayName || 'Owner'}'s Shop`,
        ownerName: user.displayName || 'Owner',
        email: user.email || '',
        phone: user.phoneNumber || '',
        businessType: 'Flour Mill',
        address: '',
        operatingHours: '9:00 AM - 8:00 PM',
        services: [
          { name: 'Wheat (Atta)', rate: 5, unit: 'kg' },
          { name: 'Rice (Chawal)', rate: 8, unit: 'kg' }
        ],
        createdAt: serverTimestamp()
      }, { merge: true });
    }
  } catch (error) {
    console.error("Error syncing Google user to Firestore:", error);
    throw error;
  }
};
