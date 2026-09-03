import { Product, Order, Category } from '../types';
import { firebaseCloudDb } from '../config/firebase';
import { applyProductDelta } from '../store/useCartStore';

export interface CollectionSnapshot {
  id: string;
  timestamp: string;
  label: string;
  productCount: number;
  orderCount: number;
  categoryCount: number;
  products: Product[];
  orders: Order[];
  categories: Category[];
}

const SNAPSHOT_KEY = 'a1print_snapshots_v1';

// Read snapshot history from local cache
export function getLocalSnapshotHistory(): CollectionSnapshot[] {
  try {
    const raw = localStorage.getItem(SNAPSHOT_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [];
}

// Create a timestamped backup snapshot of all products, orders, and categories
export async function createCollectionSnapshot(
  products: Product[],
  orders: Order[],
  categories: Category[],
  label: string = 'Manual Snapshot'
): Promise<CollectionSnapshot> {
  const now = new Date().toISOString();
  const snapshot: CollectionSnapshot = {
    id: `snap-${Date.now()}`,
    timestamp: now,
    label,
    productCount: products.length,
    orderCount: orders.length,
    categoryCount: categories.length,
    products,
    orders,
    categories,
  };

  // 1. Save to local storage snapshots (keep latest 14 snapshots)
  try {
    const history = getLocalSnapshotHistory();
    const updated = [snapshot, ...history].slice(0, 14);
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(updated));
  } catch (e) {}

  // 2. Save snapshot to Cloud Firestore
  try {
    await firebaseCloudDb.setDocument('snapshots', snapshot.id, snapshot);
  } catch (e) {}

  return snapshot;
}

// Fetch all available snapshots from Cloud Firestore & local storage
export async function fetchAllSnapshots(): Promise<CollectionSnapshot[]> {
  const localSnaps = getLocalSnapshotHistory();

  try {
    const cloudSnaps = await firebaseCloudDb.getCollection('snapshots');
    if (cloudSnaps && cloudSnaps.length > 0) {
      const snapMap = new Map<string, CollectionSnapshot>();
      localSnaps.forEach((s) => snapMap.set(s.id, s));
      cloudSnaps.forEach((cs: any) => snapMap.set(cs.id, cs));
      return Array.from(snapMap.values()).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }
  } catch (e) {}

  return localSnaps;
}
