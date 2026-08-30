import { api } from './api';

// Helper to convert VAPID public key
function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export const isPushSupported = (): boolean => {
  return 'serviceWorker' in navigator && 'PushManager' in window;
};

export const registerPushNotifications = async (orderId: string): Promise<boolean> => {
  if (!isPushSupported()) {
    console.warn('Push notifications are not supported by this browser.');
    return false;
  }

  try {
    // 1. Request notification permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      console.warn('Notification permission denied by user.');
      return false;
    }

    // 2. Register Service Worker (we will create sw.js in public folder)
    const registration = await navigator.serviceWorker.register('/sw.js');
    await navigator.serviceWorker.ready;

    // 3. Fetch VAPID public key from backend
    const { publicKey } = await fetch('/api/vapid-public-key').then(r => r.json());
    if (!publicKey) {
      throw new Error('VAPID public key not returned by backend');
    }

    // 4. Subscribe the user
    const convertedVapidKey = urlBase64ToUint8Array(publicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedVapidKey
    });

    // 5. Send subscription to server
    await api.post(`/orders/${orderId}/subscribe`, { subscription });
    return true;
  } catch (error) {
    console.error('Error during push notification registration:', error);
    return false;
  }
};
