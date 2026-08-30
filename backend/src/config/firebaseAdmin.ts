import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore as getAdminFirestore } from 'firebase-admin/firestore';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config({ path: path.join(__dirname, '../../../.env') });

const projectId = process.env.FIREBASE_PROJECT_ID || 'notify-work';
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

const formatPrivateKey = (key?: string) => {
  if (!key) return undefined;
  let k = key.trim();
  if (k.startsWith('"') && k.endsWith('"')) {
    k = k.substring(1, k.length - 1);
  }
  return k.replace(/\\n/g, '\n');
};

const privateKey = formatPrivateKey(process.env.FIREBASE_PRIVATE_KEY);

let isRealAdmin = false;

if (!getApps().length) {
  if (clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      isRealAdmin = true;
    } catch (e: any) {
      console.warn('⚠️ Firebase Admin init fallback to dev store:', e.message);
    }
  } else if (process.env.FIRESTORE_EMULATOR_HOST) {
    try {
      initializeApp({ projectId });
      isRealAdmin = true;
    } catch (e) {}
  }
} else {
  isRealAdmin = true;
}

// Persistent Dev Firestore Fallback Store
const DB_FILE = path.join(__dirname, '../../../data/dev_firestore.json');

const loadMemoryStore = (): Record<string, Record<string, any>> => {
  try {
    if (fs.existsSync(DB_FILE)) {
      return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
    }
  } catch (e) {}
  return {};
};

const saveMemoryStore = (store: Record<string, Record<string, any>>) => {
  try {
    const dir = path.dirname(DB_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(DB_FILE, JSON.stringify(store, null, 2));
  } catch (e) {}
};

class MemoryDocRef {
  constructor(private colName: string, public id: string) {}

  async get() {
    const store = loadMemoryStore();
    const data = store[this.colName]?.[this.id];
    return {
      exists: !!data,
      id: this.id,
      data: () => (data ? { ...data } : undefined),
      ref: this
    };
  }

  async set(data: any, options?: { merge?: boolean }) {
    const store = loadMemoryStore();
    if (!store[this.colName]) store[this.colName] = {};
    if (options?.merge && store[this.colName][this.id]) {
      store[this.colName][this.id] = { ...store[this.colName][this.id], ...data };
    } else {
      store[this.colName][this.id] = { ...data, id: this.id };
    }
    saveMemoryStore(store);
    return true;
  }

  async update(data: any) {
    const store = loadMemoryStore();
    if (!store[this.colName]) store[this.colName] = {};
    store[this.colName][this.id] = { ...store[this.colName][this.id], ...data };
    saveMemoryStore(store);
    return true;
  }

  async delete() {
    const store = loadMemoryStore();
    if (store[this.colName]) {
      delete store[this.colName][this.id];
      saveMemoryStore(store);
    }
    return true;
  }
}

class MemoryQuery {
  private conditions: { field: string; op: string; val: any }[] = [];
  private limitVal?: number;

  constructor(private colName: string) {}

  where(field: string, op: string, val: any) {
    this.conditions.push({ field, op, val });
    return this;
  }

  limit(num: number) {
    this.limitVal = num;
    return this;
  }

  async get() {
    const store = loadMemoryStore();
    const col = store[this.colName] || {};
    let docs = Object.keys(col).map(id => new MemoryDocRef(this.colName, id));
    let matched: any[] = [];

    for (const ref of docs) {
      const snap = await ref.get();
      const data = snap.data();
      if (!data) continue;

      let passes = true;
      for (const cond of this.conditions) {
        const val = data[cond.field];
        if (cond.op === '==' && val !== cond.val) passes = false;
        if (cond.op === 'in' && Array.isArray(cond.val) && !cond.val.includes(val)) passes = false;
      }
      if (passes) {
        matched.push(snap);
      }
    }

    if (this.limitVal !== undefined) {
      matched = matched.slice(0, this.limitVal);
    }

    return {
      empty: matched.length === 0,
      docs: matched,
      size: matched.length
    };
  }
}

class MemoryCollectionRef extends MemoryQuery {
  constructor(private name: string) {
    super(name);
  }

  doc(id?: string) {
    const docId = id || `doc_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    return new MemoryDocRef(this.name, docId);
  }
}

const memoryDb = {
  collection: (name: string) => new MemoryCollectionRef(name)
};

export const db: any = isRealAdmin ? getAdminFirestore() : memoryDb;
export const auth: any = isRealAdmin
  ? getAdminAuth()
  : {
      verifyIdToken: async () => {
        throw new Error('Fallback token auth mode');
      }
    };

export const adminAuth = auth;

export default { db, auth, adminAuth };
