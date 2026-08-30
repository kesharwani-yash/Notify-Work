export type OrderStatus = 'Pending' | 'Accepted' | 'Ready' | 'Collected' | 'Rejected';

export interface IServicePreset {
  name: string;
  unit: string;
  rate: number;
}

export interface IShopDoc {
  shopId: string; // Firebase Auth UID
  slug: string;   // Human-readable slug (e.g. 'testingshop2-85')
  shopName: string;
  ownerName: string;
  email: string;
  phone: string;
  businessType: string;
  address: string;
  operatingHours: string;
  services: IServicePreset[];
  createdAt: any; // Firestore Timestamp
}

export interface IPushSubscription {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface ICustomerDoc {
  customerId: string;
  name: string;
  phone: string;
  pushSubscriptions?: IPushSubscription[];
  createdAt: any; // Firestore Timestamp
}

export interface IItemDetails {
  itemName: string;
  weight: number;
  unit: string;
  ratePerUnit: number;
  totalPrice: number;
}

export interface ICustomerData {
  name: string;
  phone: string;
}

export interface IShopData {
  shopName: string;
  slug: string;
  phone: string;
  address: string;
}

export interface ITimestampsMap {
  createdAt: any; // Firestore Timestamp
  acceptedAt?: any;
  readyAt?: any;
  collectedAt?: any;
}

export interface IOrderDoc {
  orderId: string;
  status: OrderStatus;
  shopId: string; // Firebase Auth UID
  customerId: string;
  itemDetails: IItemDetails;
  customerData: ICustomerData;
  shopData: IShopData;
  timestamps: ITimestampsMap;
  remarks?: string;
  // Backward compatibility fields for legacy views
  item?: string;
  weight?: number;
  createdAt?: any;
}
