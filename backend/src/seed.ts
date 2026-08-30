import { db } from './config/firebaseAdmin';
import { FieldValue } from 'firebase-admin/firestore';

const seedDatabase = async () => {
  try {

    const sharmaId = 'sharma-flour-mill-doc-id';
    const guptaId = 'gupta-tailors-doc-id';

    // 1. Seed Shops
    const sharmaMill = {
      shopId: sharmaId,
      slug: 'sharma-flour-mill',
      shopName: 'Sharma Flour Mill',
      ownerName: 'Ramesh Sharma',
      email: 'owner@sharmaflourmill.com',
      phone: '+91 98765 43210',
      businessType: 'Flour Mill',
      address: 'Shop 14, Grain Market, Sector 26, Chandigarh',
      operatingHours: '9:00 AM - 8:00 PM',
      services: [
        { name: 'Wheat (Atta)', unit: 'kg', rate: 5 },
        { name: 'Rice (Chawal)', unit: 'kg', rate: 8 },
        { name: 'Chana (Gram)', unit: 'kg', rate: 10 }
      ],
      createdAt: FieldValue.serverTimestamp()
    };

    const guptaTailor = {
      shopId: guptaId,
      slug: 'gupta-tailors',
      shopName: 'Gupta Tailors & Drapers',
      ownerName: 'Suresh Gupta',
      email: 'owner@guptatailors.com',
      phone: '+91 91234 56789',
      businessType: 'Tailor',
      address: 'SCF 45, Interior Bazaar, Chandigarh',
      operatingHours: '10:00 AM - 8:00 PM',
      services: [
        { name: 'Suit Stitching', unit: 'pcs', rate: 1200 },
        { name: 'Shirt Alteration', unit: 'pcs', rate: 150 }
      ],
      createdAt: FieldValue.serverTimestamp()
    };

    await db.collection('shops').doc(sharmaId).set(sharmaMill);
    await db.collection('shops').doc(guptaId).set(guptaTailor);

    // 2. Seed Customers
    const cust1Id = 'cust-1-ravi';
    const cust2Id = 'cust-2-sunita';

    const customer1 = {
      customerId: cust1Id,
      name: 'Ravi Kumar',
      phone: '+919999999999',
      pushSubscriptions: [],
      createdAt: FieldValue.serverTimestamp()
    };

    const customer2 = {
      customerId: cust2Id,
      name: 'Sunita Sharma',
      phone: '+918888888888',
      pushSubscriptions: [],
      createdAt: FieldValue.serverTimestamp()
    };

    await db.collection('customers').doc(cust1Id).set(customer1);
    await db.collection('customers').doc(cust2Id).set(customer2);

    // 3. Seed Orders

    const order1 = {
      orderId: 'order-1-wheat',
      id: 'order-1-wheat',
      _id: 'order-1-wheat',
      status: 'Pending',
      shopId: sharmaId,
      customerId: cust1Id,
      itemDetails: {
        itemName: 'Wheat Flour',
        weight: 15.0,
        unit: 'kg',
        ratePerUnit: 5,
        totalPrice: 75.0
      },
      customerData: { name: 'Ravi Kumar', phone: '+919999999999' },
      shopData: { slug: 'sharma-flour-mill', shopName: 'Sharma Flour Mill', phone: '+91 98765 43210', address: 'Shop 14, Grain Market, Sector 26, Chandigarh' },
      timestamps: {
        createdAt: FieldValue.serverTimestamp()
      },
      remarks: 'Grind extra fine, keep separate',
      item: 'Wheat Flour',
      weight: 15.0,
      createdAt: new Date().toISOString()
    };

    const order2 = {
      orderId: 'order-2-multigrain',
      id: 'order-2-multigrain',
      _id: 'order-2-multigrain',
      status: 'Accepted',
      shopId: sharmaId,
      customerId: cust2Id,
      itemDetails: {
        itemName: 'Multigrain Atta',
        weight: 20.0,
        unit: 'kg',
        ratePerUnit: 8,
        totalPrice: 160.0
      },
      customerData: { name: 'Sunita Sharma', phone: '+918888888888' },
      shopData: { slug: 'sharma-flour-mill', shopName: 'Sharma Flour Mill', phone: '+91 98765 43210', address: 'Shop 14, Grain Market, Sector 26, Chandigarh' },
      timestamps: {
        createdAt: FieldValue.serverTimestamp(),
        acceptedAt: FieldValue.serverTimestamp()
      },
      remarks: 'Mix soybean and oats',
      item: 'Multigrain Atta',
      weight: 20.0,
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString()
    };

    const order3 = {
      orderId: 'order-3-mustard',
      id: 'order-3-mustard',
      _id: 'order-3-mustard',
      status: 'Ready',
      shopId: sharmaId,
      customerId: cust1Id,
      itemDetails: {
        itemName: 'Mustard Oil extraction',
        weight: 5.0,
        unit: 'kg',
        ratePerUnit: 10,
        totalPrice: 50.0
      },
      customerData: { name: 'Ravi Kumar', phone: '+919999999999' },
      shopData: { slug: 'sharma-flour-mill', shopName: 'Sharma Flour Mill', phone: '+91 98765 43210', address: 'Shop 14, Grain Market, Sector 26, Chandigarh' },
      timestamps: {
        createdAt: FieldValue.serverTimestamp(),
        acceptedAt: FieldValue.serverTimestamp(),
        readyAt: FieldValue.serverTimestamp()
      },
      remarks: 'Keep bottle tightly sealed',
      item: 'Mustard Oil extraction',
      weight: 5.0,
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      readyAt: new Date().toISOString()
    };

    const order4 = {
      orderId: 'order-4-besan',
      id: 'order-4-besan',
      _id: 'order-4-besan',
      status: 'Collected',
      shopId: sharmaId,
      customerId: cust2Id,
      itemDetails: {
        itemName: 'Gram Flour (Besan)',
        weight: 8.5,
        unit: 'kg',
        ratePerUnit: 10,
        totalPrice: 85.0
      },
      customerData: { name: 'Sunita Sharma', phone: '+918888888888' },
      shopData: { slug: 'sharma-flour-mill', shopName: 'Sharma Flour Mill', phone: '+91 98765 43210', address: 'Shop 14, Grain Market, Sector 26, Chandigarh' },
      timestamps: {
        createdAt: FieldValue.serverTimestamp(),
        acceptedAt: FieldValue.serverTimestamp(),
        readyAt: FieldValue.serverTimestamp(),
        collectedAt: FieldValue.serverTimestamp()
      },
      remarks: '',
      item: 'Gram Flour (Besan)',
      weight: 8.5,
      createdAt: new Date().toISOString(),
      acceptedAt: new Date().toISOString(),
      readyAt: new Date().toISOString(),
      collectedAt: new Date().toISOString()
    };

    await db.collection('orders').doc(order1.orderId).set(order1);
    await db.collection('orders').doc(order2.orderId).set(order2);
    await db.collection('orders').doc(order3.orderId).set(order3);
    await db.collection('orders').doc(order4.orderId).set(order4);

    process.exit(0);
  } catch (err: any) {
    console.error('❌ Error seeding Firestore database:', err.message);
    process.exit(1);
  }
};

seedDatabase();
