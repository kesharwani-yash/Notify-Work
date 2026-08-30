import webpush from 'web-push';
import { IOrderDoc, IShopDoc, ICustomerDoc } from '../models/firestoreModels';
import { wsService } from './WebSocketService';
import { vapidPublicKey } from '../config/vapid';

export interface NotificationPayload {
  title: string;
  body: string;
  url?: string;
  orderId: string;
  status: string;
}

export interface NotificationProvider {
  name: string;
  sendReadyNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void>;
  sendReminderNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void>;
}

// WebSocket Provider to push instant active page status updates
class WebSocketProvider implements NotificationProvider {
  name = 'WebSocket (Real-time Status)';

  async sendReadyNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    const orderObj = (order as any).toObject ? (order as any).toObject() : order;
    const orderId = (order._id || order.id || order.orderId || '').toString();
    wsService.emitOrderUpdate(orderId, {
      ...orderObj,
      status: order.status,
      order: orderObj,
      message: `🔔 Hello ${customer.name}, your ${order.item} is ready for pickup. Please collect it from ${shop.shopName}.`
    });
  }

  async sendReminderNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    const orderObj = (order as any).toObject ? (order as any).toObject() : order;
    const orderId = (order._id || order.id || order.orderId || '').toString();
    wsService.emitOrderUpdate(orderId, {
      ...orderObj,
      status: order.status,
      order: orderObj,
      message: `🔔 Reminder: Hello ${customer.name}, your ${order.item} is still waiting for pickup at ${shop.shopName}.`
    });
  }
}

// Web Push Provider for standard browser service worker notifications
class WebPushProvider implements NotificationProvider {
  name = 'Browser Web Push';

  private async sendPush(subscriptions: any[], payload: NotificationPayload) {
    if (!subscriptions || subscriptions.length === 0) {
      return;
    }

    const payloadString = JSON.stringify(payload);

    for (const sub of subscriptions) {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth
            }
          },
          payloadString
        );
      } catch (err: any) {
        console.error(`❌ Web Push failed for endpoint: ${sub.endpoint?.substring(0, 40)}... Reason: ${err.message}`);
      }
    }
  }

  async sendReadyNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    const orderId = (order._id || order.id || order.orderId || '').toString();
    const payload: NotificationPayload = {
      title: 'Order Ready for Pickup! 🟢',
      body: `Hello ${customer.name}, your ${order.item} is ready. Please collect it from ${shop.shopName}.`,
      url: `/shop/${shop.slug || shop.shopId}/order/${orderId}`,
      orderId,
      status: order.status
    };
    await this.sendPush(customer.pushSubscriptions || [], payload);
  }

  async sendReminderNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    const orderId = (order._id || order.id || order.orderId || '').toString();
    const payload: NotificationPayload = {
      title: 'Order Reminder 🔔',
      body: `Friendly reminder: Hello ${customer.name}, your ${order.item} is waiting at ${shop.shopName}.`,
      url: `/shop/${shop.slug || shop.shopId}/order/${orderId}`,
      orderId,
      status: order.status
    };
    await this.sendPush(customer.pushSubscriptions || [], payload);
  }
}

// Email Provider (Mock)
class EmailNotificationProvider implements NotificationProvider {
  name = 'Email Service (Mock)';

  async sendReadyNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    // Mock email delivery
  }

  async sendReminderNotification(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    // Mock reminder email delivery
  }
}

// Central Service Manager
class NotificationServiceManager {
  private providers: NotificationProvider[] = [];

  constructor() {
    this.registerProvider(new WebSocketProvider());
    this.registerProvider(new WebPushProvider());
    this.registerProvider(new EmailNotificationProvider());
  }

  registerProvider(provider: NotificationProvider) {
    this.providers.push(provider);
  }

  getVapidPublicKey(): string {
    return vapidPublicKey;
  }

  async notifyReady(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    const promises = this.providers.map(async (provider) => {
      try {
        await provider.sendReadyNotification(order, shop, customer);
      } catch (err: any) {
        console.error(`❌ Provider ${provider.name} failed to notify: ${err.message}`);
      }
    });
    await Promise.allSettled(promises);
  }

  async notifyReminder(order: IOrderDoc | any, shop: IShopDoc | any, customer: ICustomerDoc | any): Promise<void> {
    const promises = this.providers.map(async (provider) => {
      try {
        await provider.sendReminderNotification(order, shop, customer);
      } catch (err: any) {
        console.error(`❌ Provider ${provider.name} failed to send reminder: ${err.message}`);
      }
    });
    await Promise.allSettled(promises);
  }
}

export const notificationService = new NotificationServiceManager();


