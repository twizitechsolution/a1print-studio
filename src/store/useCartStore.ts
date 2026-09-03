import { useState, useEffect } from 'react';
import { CartItem, Order, Product, Category, StockLogItem } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { firebaseCloudDb, firebaseDb, collection, onSnapshot } from '../config/firebase';
import { enqueueOutboxJob, flushOutboxQueue, writeAuditLog, getStoredOutboxJobs } from '../services/outboxService';

const STORAGE_KEY = 'a1print_store_data_v20';
const DELETED_IDS_KEY = 'a1print_deleted_product_ids_v20';
const CATEGORIES_KEY = 'a1print_categories_v20';

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Baby & Kids', slug: 'baby-kids', description: 'Customized newborn birth stats & baby milestone frames', icon: '👶', createdAt: new Date().toISOString() },
  { id: 'cat-2', name: 'Couples & Wedding', slug: 'couples', description: 'Romantic anniversary, engagement & wedding memory frames', icon: '💑', createdAt: new Date().toISOString() },
  { id: 'cat-3', name: 'Birthday Gifts', slug: 'birthday', description: 'Personalized birthday collage & age milestone photo frames', icon: '🎂', createdAt: new Date().toISOString() },
  { id: 'cat-4', name: 'Calendar Frames', slug: 'calendar', description: 'Interactive date & month highlight calendar photo frames', icon: '📅', createdAt: new Date().toISOString() },
  { id: 'cat-5', name: 'Photo Collage', slug: 'collage', description: 'Multi-photo grid frames for family memories', icon: '🖼️', createdAt: new Date().toISOString() },
  { id: 'cat-6', name: 'Corporate Office', slug: 'office', description: 'Professional desk & wall frames for corporate gifting', icon: '💼', createdAt: new Date().toISOString() },
];

interface StoreData {
  products: Product[];
  items: CartItem[];
  orders: Order[];
  categories: Category[];
}

function getDeletedProductIds(): Set<string> {
  try {
    const raw = localStorage.getItem(DELETED_IDS_KEY);
    if (raw) {
      return new Set(JSON.parse(raw));
    }
  } catch (e) {}
  return new Set<string>();
}

function saveDeletedProductIds(ids: Set<string>) {
  try {
    localStorage.setItem(DELETED_IDS_KEY, JSON.stringify(Array.from(ids)));
  } catch (e) {}
}

function getStoredCategories(): Category[] {
  try {
    const raw = localStorage.getItem(CATEGORIES_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return DEFAULT_CATEGORIES;
}

function saveStoredCategories(categories: Category[]) {
  try {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  } catch (e) {}
}

function getStoredAdminRemarks(): Record<string, { remark: string; timestamp: string }> {
  try {
    const raw = localStorage.getItem('a1print_admin_order_remarks_v1');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

const MASTER_ORDERS_ARCHIVE_KEY = 'a1print_master_orders_v1';
const MASTER_PRODUCTS_ARCHIVE_KEY = 'a1print_master_products_archive_v1';

function getStoredMasterOrders(): Order[] {
  try {
    const raw = localStorage.getItem(MASTER_ORDERS_ARCHIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
}

function saveStoredMasterOrders(orders: Order[]) {
  try {
    localStorage.setItem(MASTER_ORDERS_ARCHIVE_KEY, JSON.stringify(orders));
  } catch (e) {}
}

function getStoredMasterProducts(): Product[] {
  try {
    const raw = localStorage.getItem(MASTER_PRODUCTS_ARCHIVE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}
  return [];
}

// 🛡️ Phase 2 Rule: Never accept an arbitrary full array overwrite. Touch only specific changed records via Delta!
export function applyProductDelta(changedRecords: Product[]) {
  if (!Array.isArray(changedRecords) || changedRecords.length === 0) return;

  const currentMaster = getStoredMasterProducts();
  const masterMap = new Map<string, Product>();
  currentMaster.forEach((p) => { if (p && p.id) masterMap.set(p.id, p); });

  changedRecords.forEach((p) => {
    if (!p || !p.id) return;
    const existing = masterMap.get(p.id);
    const exVer = existing?.version || 0;
    const pVer = p.version || 1;
    if (!existing || pVer >= exVer) {
      masterMap.set(p.id, p);
    }
  });

  const updatedMaster = Array.from(masterMap.values());
  try {
    localStorage.setItem(MASTER_PRODUCTS_ARCHIVE_KEY, JSON.stringify(updatedMaster));
  } catch (e) {}
}

const PRODUCT_OVERRIDES_KEY = 'a1print_admin_product_overrides_v2';

export function getStoredProductOverrides(): Record<string, Product> {
  try {
    const raw = localStorage.getItem(PRODUCT_OVERRIDES_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return {};
}

export function saveStoredProductOverrides(map: Record<string, Product>) {
  try {
    localStorage.setItem(PRODUCT_OVERRIDES_KEY, JSON.stringify(map));
  } catch (e) {}
}

function getStoredLocalData(): StoreData {
  const categories = getStoredCategories();
  const savedRemarks = getStoredAdminRemarks();
  const deletedIds = getDeletedProductIds();
  const masterOrders = getStoredMasterOrders();
  const masterProducts = getStoredMasterProducts();

  let loadedProducts: Product[] = masterProducts;
  let loadedOrders: Order[] = masterOrders;
  let loadedCartItems: CartItem[] = [];

  try {
    const legacyKeys = [STORAGE_KEY, 'a1print_store_data_v20', 'a1print_store_data_v15', 'a1print_store_data_v14', 'a1print_store_data_v1', 'a1print_store_data'];
    let raw: string | null = null;
    for (const key of legacyKeys) {
      const val = localStorage.getItem(key);
      if (val) {
        raw = val;
        break;
      }
    }

    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.products) && parsed.products.length > 0 && loadedProducts.length === 0) {
        loadedProducts = parsed.products;
      }
      if (Array.isArray(parsed.orders) && parsed.orders.length > 0) {
        // Union merge with master orders
        const orderMap = new Map<string, Order>();
        masterOrders.concat(parsed.orders).forEach((o) => {
          if (o && o.id) orderMap.set(o.id, o);
        });
        loadedOrders = Array.from(orderMap.values());
      }
      if (Array.isArray(parsed.items)) {
        loadedCartItems = parsed.items;
      }
    }
  } catch (e) {}

  // Fallback to INITIAL_PRODUCTS only if no products exist anywhere
  if (loadedProducts.length === 0) {
    loadedProducts = INITIAL_PRODUCTS.map((p) => ({
      ...p,
      stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : 50,
      stockLogs: p.stockLogs || [],
    }));
  }

  // Merge admin overrides map into loadedProducts for 0ms instant local rendering
  const overridesMap = getStoredProductOverrides();
  Object.values(overridesMap).forEach((overrideProd) => {
    if (overrideProd && overrideProd.id && !deletedIds.has(overrideProd.id)) {
      const idx = loadedProducts.findIndex((p) => p.id === overrideProd.id);
      if (idx >= 0) {
        loadedProducts[idx] = { ...loadedProducts[idx], ...overrideProd };
      } else {
        loadedProducts.push(overrideProd);
      }
    }
  });

  // Filter deleted products
  const activeProds = loadedProducts.filter((p: Product) => p && p.id && !deletedIds.has(p.id));

  // Attach remarks to orders
  const ordersWithRemarks = loadedOrders.map((o: Order) => {
    const saved = savedRemarks[o.id];
    if (saved && saved.remark) {
      return {
        ...o,
        adminRemark: saved.remark,
        adminRemarkTimestamp: saved.timestamp || o.adminRemarkTimestamp,
      };
    }
    return o;
  });

  return {
    products: activeProds.length > 0 ? activeProds : INITIAL_PRODUCTS,
    items: loadedCartItems,
    orders: ordersWithRemarks,
    categories,
  };
}

let memoryData: StoreData = getStoredLocalData();

function optimizeDataForLocalStorage(data: StoreData): StoreData {
  // Only sanitize transient cart items customizedFramePreviewUrl (not master catalog product images!)
  return {
    ...data,
    items: (data.items || []).map((item) => ({
      ...item,
      customizedFramePreviewUrl: item.customizedFramePreviewUrl && item.customizedFramePreviewUrl.length > 50000
        ? item.customizedFramePreviewUrl.substring(0, 15000) + '...[COMPRESSED_PREVIEW]'
        : item.customizedFramePreviewUrl,
    })),
  };
}

function saveStoredLocalData(data: StoreData) {
  memoryData = data;

  // Continuously update un-resettable master archives
  if (Array.isArray(data.orders) && data.orders.length > 0) {
    saveStoredMasterOrders(data.orders);
  }
  if (Array.isArray(data.products) && data.products.length > 0) {
    applyProductDelta(data.products);
  }

  try {
    const optimized = optimizeDataForLocalStorage(data);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(optimized));
  } catch (e) {
    try {
      // Fallback if quota still exceeded: strip extra preview strings so cart items remain safe
      const fallback = {
        ...data,
        items: (data.items || []).map((item) => ({
          ...item,
          customizedFramePreviewUrl: '',
        })),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(fallback));
    } catch (err) {
      console.warn('Failed to save to localStorage:', err);
    }
  }
}

const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

// Real-Time Cloud Firestore Sync Engine (5-Second Active Polling & 0ms Instant Reactivity)
let isCloudSyncInitialized = false;
let isSyncingFromCloud = false;

async function syncFromCloud() {
  if (isSyncingFromCloud) return;
  isSyncingFromCloud = true;

  try {
    // Step A: FAST PATH - Fetch products via REST or gRPC
    let cloudProds: any[] | null = null;
    try {
      cloudProds = await firebaseCloudDb.getCollection('products');
    } catch (readErr) {
      console.warn('Cloud fetch failed, keeping local memory intact:', readErr);
      return; // Phase 2 Rule 1: Never treat a failed/errored fetch as an empty result!
    }

    // Phase 2 Rule 2: Sanity-check empty results against local state!
    if (cloudProds !== null && cloudProds.length === 0 && memoryData.products.length > 0) {
      console.warn('Sanity Check: Cloud returned 0 products while local cache holds items. Re-verifying...');
      const reVerify = await firebaseCloudDb.getCollection('products');
      if (reVerify !== null && reVerify.length > 0) {
        cloudProds = reVerify;
      } else {
        // Still empty after re-verification! Do NOT wipe local data!
        // Preserve local items and re-enqueue in outbox to restore on cloud
        memoryData.products.forEach((p) => {
          if (p && p.id) {
            enqueueOutboxJob('products', p.id, 'create', p);
          }
        });
        flushOutboxQueue();
      }
    }

    // 1. STRICT NON-DESTRUCTIVE UNION MERGING FOR PRODUCTS CATALOG WITH VERSION RECONCILIATION
    if (cloudProds !== null && cloudProds.length > 0) {
      const overridesMap = getStoredProductOverrides();
      const productMap = new Map<string, Product>();
      const changedDeltas: Product[] = [];

      // Load initial/local memory products & admin overrides first
      memoryData.products.forEach((p) => {
        if (p && p.id) {
          const override = overridesMap[p.id];
          const item = override || p;
          productMap.set(p.id, item);
        }
      });

      // Merge Cloud Firestore products safely (version & timestamp priority guard!)
      cloudProds.forEach((cp) => {
        if (cp && cp.id) {
          const existing = productMap.get(cp.id) || overridesMap[cp.id];
          const cpVer = cp.version || 0;
          const exVer = existing?.version || 0;

          const cpTime = cp.updatedAt ? new Date(cp.updatedAt).getTime() : 0;
          const existingTime = existing?.updatedAt ? new Date(existing.updatedAt).getTime() : 0;
          const isDeletedState = Boolean(cp.isDeleted || (existing && existing.isDeleted));

          if (!existing || cpVer > exVer || (cpVer === exVer && cpTime > existingTime)) {
            const merged: Product = {
              ...cp,
              isDeleted: isDeletedState,
              stockQuantity: cp.stockQuantity !== undefined ? cp.stockQuantity : (existing?.stockQuantity ?? 50),
              stockLogs: cp.stockLogs || existing?.stockLogs || [],
              syncStatus: 'synced',
              lastSyncedAt: new Date().toISOString(),
            };
            productMap.set(cp.id, merged);
            changedDeltas.push(merged);
          }
        }
      });

      const mergedProducts = Array.from(productMap.values());
      if (mergedProducts.length > 0 && JSON.stringify(mergedProducts) !== JSON.stringify(memoryData.products)) {
        memoryData.products = mergedProducts;
        applyProductDelta(changedDeltas);
        saveStoredLocalData(memoryData);
        notifyListeners();
      }
    }

    // Step B: Parallel background fetch for secondary collections without blocking product rendering
    const [cloudOrders, cloudCats] = await Promise.all([
      firebaseCloudDb.getCollection('orders'),
      firebaseCloudDb.getCollection('categories'),
    ]);

    // 3. STRICT NON-DESTRUCTIVE UNION MERGING FOR ORDERS (PRESERVES ALL CUSTOMER ORDERS)
    if (cloudOrders !== null) {
      const savedRemarks = getStoredAdminRemarks();
      const orderMap = new Map<string, Order>();

      // Step A: Load all local memory orders first (never drop un-synced orders!)
      memoryData.orders.forEach((o) => {
        if (o && o.id) orderMap.set(o.id, o);
      });

      // Step B: Merge Cloud Firestore orders
      const cloudOrderIds = new Set<string>();
      if (cloudOrders.length > 0) {
        cloudOrders.forEach((co) => {
          if (co && co.id) {
            cloudOrderIds.add(co.id);
            const existing = orderMap.get(co.id);
            const localRemark = savedRemarks[co.id]?.remark || existing?.adminRemark || '';
            const localRemarkTime = savedRemarks[co.id]?.timestamp || existing?.adminRemarkTimestamp || '';

            orderMap.set(co.id, {
              ...co,
              adminRemark: co.adminRemark || localRemark,
              adminRemarkTimestamp: co.adminRemarkTimestamp || localRemarkTime,
              orderStatus: co.orderStatus || existing?.orderStatus || 'Received',
              paymentStatus: co.paymentStatus || existing?.paymentStatus || 'Paid',
            });
          }
        });
      }

      // Step C: Background retry push for local orders missing on Cloud Firestore server
      orderMap.forEach((localOrder, id) => {
        if (!cloudOrderIds.has(id)) {
          firebaseCloudDb.setDocument('orders', id, localOrder);
        }
      });

      const mergedOrders = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      if (JSON.stringify(mergedOrders) !== JSON.stringify(memoryData.orders)) {
        memoryData.orders = mergedOrders;
        saveStoredLocalData(memoryData);
        notifyListeners();
      }
    }

    // 4. STRICT NON-DESTRUCTIVE UNION MERGING FOR CATEGORIES
    if (cloudCats !== null) {
      const categoryMap = new Map<string, Category>();

      // Step A: Load DEFAULT + memory categories
      DEFAULT_CATEGORIES.concat(memoryData.categories || []).forEach((cat) => {
        if (cat && cat.id) categoryMap.set(cat.id, cat);
      });

      // Step B: Merge Cloud Firestore categories
      const cloudCatIds = new Set<string>();
      if (cloudCats.length > 0) {
        cloudCats.forEach((cc) => {
          if (cc && cc.id) {
            cloudCatIds.add(cc.id);
            categoryMap.set(cc.id, cc);
          }
        });
      }

      // Step C: Push local categories missing on Cloud Firestore server
      categoryMap.forEach((localCat, id) => {
        if (!cloudCatIds.has(id)) {
          firebaseCloudDb.setDocument('categories', id, localCat);
        }
      });

      const mergedCats = Array.from(categoryMap.values());
      if (JSON.stringify(mergedCats) !== JSON.stringify(memoryData.categories)) {
        memoryData.categories = mergedCats;
        saveStoredCategories(mergedCats);
        saveStoredLocalData(memoryData);
        notifyListeners();
      }
    }
  } catch (e) {
    console.warn('Cloud sync background polling error:', e);
  } finally {
    isSyncingFromCloud = false;
  }
}

async function initCloudSync() {
  if (isCloudSyncInitialized) return;
  isCloudSyncInitialized = true;

  // Auto-enqueue all local products into Outbox queue on startup to guarantee Cloud Firestore sync
  if (memoryData.products && memoryData.products.length > 0) {
    memoryData.products.forEach((p) => {
      if (p && p.id) {
        enqueueOutboxJob('products', p.id, 'update', p);
      }
    });
  }

  // Phase 3 Rule 3: CRITICAL ORDERING RULE — Always flush outbox queue BEFORE pulling cloud data!
  await flushOutboxQueue();

  // Step A: Initial guarded sync
  await syncFromCloud();

  // Attach official Real-Time Firebase WebSockets Snapshot Listeners
  try {
    onSnapshot(collection(firebaseDb, 'products'), () => {
      syncFromCloud();
    });
    onSnapshot(collection(firebaseDb, 'orders'), () => {
      syncFromCloud();
    });
  } catch (e) {
    console.warn('Real-time WebSockets listener fallback:', e);
  }

  // Periodic Outbox Flush & Backup Sync
  setInterval(async () => {
    await flushOutboxQueue();
    await syncFromCloud();
  }, 15000);

  if (typeof window !== 'undefined') {
    window.addEventListener('focus', async () => {
      await flushOutboxQueue();
      await syncFromCloud();
    });
  }
}

export function useCartStore() {
  const [store, setStore] = useState<StoreData>(memoryData);

  useEffect(() => {
    initCloudSync();
    const listener = () => setStore({ ...memoryData });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
      version: 1,
      syncStatus: 'pending',
    };
    enqueueOutboxJob('categories', newCategory.id, 'create', newCategory);
    writeAuditLog('CREATE', 'category', newCategory.id, 'Admin User', null, newCategory);

    const updatedCategories = [...memoryData.categories, newCategory];
    saveStoredCategories(updatedCategories);
    saveStoredLocalData({ ...memoryData, categories: updatedCategories });
    notifyListeners();
    flushOutboxQueue();
  };

  const deleteCategory = (id: string) => {
    const updatedCategories = memoryData.categories.filter((c) => c.id !== id);
    saveStoredCategories(updatedCategories);
    saveStoredLocalData({ ...memoryData, categories: updatedCategories });
    notifyListeners();
  };

  const addProduct = (newProduct: Product) => {
    const recordId = newProduct.id || `prod-${Date.now()}`;
    const now = new Date().toISOString();
    const prodWithStock: Product = {
      ...newProduct,
      id: recordId,
      createdAt: newProduct.createdAt || now,
      updatedAt: now,
      version: (newProduct.version || 0) + 1,
      isDeleted: false,
      deletedAt: null,
      syncStatus: 'pending',
      stockQuantity: newProduct.stockQuantity !== undefined ? newProduct.stockQuantity : 50,
      stockLogs: newProduct.stockLogs || [
        {
          id: `log-${Date.now()}`,
          type: 'credit',
          quantity: newProduct.stockQuantity || 50,
          previousStock: 0,
          newStock: newProduct.stockQuantity || 50,
          reason: 'Initial Product Listing Creation',
          timestamp: now,
          performedBy: 'Super Admin',
        },
      ],
    };

    // 1. Enqueue job in Write-Ahead Outbox Queue
    enqueueOutboxJob('products', recordId, 'create', prodWithStock);

    // 2. Write Audit Log
    writeAuditLog('CREATE', 'product', recordId, 'Admin User', null, prodWithStock);

    // 3. Update Admin Overrides & Delta Master Storage
    const overrides = getStoredProductOverrides();
    overrides[recordId] = prodWithStock;
    saveStoredProductOverrides(overrides);
    applyProductDelta([prodWithStock]);

    // 4. Optimistic Local Store update (0ms instant UI rendering!)
    const updated = [prodWithStock, ...memoryData.products.filter(p => p.id !== recordId)];
    memoryData.products = updated;
    saveStoredLocalData(memoryData);
    notifyListeners();

    // 5. Trigger Outbox Flush Worker
    flushOutboxQueue();
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const overrides = getStoredProductOverrides();
    let targetUpdated: Product | null = null;
    let oldProduct: Product | null = null;

    const now = new Date().toISOString();
    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === id) {
        oldProduct = p;
        const updated: Product = {
          ...p,
          ...updates,
          updatedAt: now,
          version: (p.version || 0) + 1,
          syncStatus: 'pending',
        };
        targetUpdated = updated;
        return updated;
      }
      return p;
    });

    if (!targetUpdated && updates.title) {
      targetUpdated = {
        id,
        ...updates,
        createdAt: now,
        updatedAt: now,
        version: 1,
        syncStatus: 'pending',
      } as Product;
      updatedProducts.unshift(targetUpdated);
    }

    if (targetUpdated) {
      const finalTarget: Product = targetUpdated;
      enqueueOutboxJob('products', id, 'update', finalTarget);
      writeAuditLog('UPDATE', 'product', id, 'Admin User', oldProduct, finalTarget);

      overrides[id] = finalTarget;
      saveStoredProductOverrides(overrides);
      applyProductDelta([finalTarget]);
    }

    memoryData.products = updatedProducts;
    saveStoredLocalData(memoryData);
    notifyListeners();
    flushOutboxQueue();
  };

  // Soft Delete Product (Moved to Recycle Bin)
  const softDeleteProduct = (id: string) => {
    const existing = memoryData.products.find(p => p.id === id);
    const now = new Date().toISOString();
    const deletedIds = getDeletedProductIds();
    deletedIds.add(id);
    saveDeletedProductIds(deletedIds);

    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated: Product = {
          ...p,
          isDeleted: true,
          deletedAt: now,
          updatedAt: now,
          version: (p.version || 0) + 1,
          syncStatus: 'pending',
        };
        enqueueOutboxJob('products', id, 'soft_delete', updated);
        writeAuditLog('SOFT_DELETE', 'product', id, 'Admin User', existing, updated);
        applyProductDelta([updated]);
        return updated;
      }
      return p;
    });

    memoryData.products = updatedProducts;
    saveStoredLocalData(memoryData);
    notifyListeners();
    flushOutboxQueue();
  };

  // Restore Soft-Deleted Product from Recycle Bin
  const restoreProduct = (id: string) => {
    const existing = memoryData.products.find(p => p.id === id);
    const now = new Date().toISOString();
    const deletedIds = getDeletedProductIds();
    deletedIds.delete(id);
    saveDeletedProductIds(deletedIds);

    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated: Product = {
          ...p,
          isDeleted: false,
          deletedAt: null,
          updatedAt: now,
          version: (p.version || 0) + 1,
          syncStatus: 'pending',
        };
        enqueueOutboxJob('products', id, 'update', updated);
        writeAuditLog('RESTORE', 'product', id, 'Admin User', existing, updated);
        applyProductDelta([updated]);
        return updated;
      }
      return p;
    });

    memoryData.products = updatedProducts;
    saveStoredLocalData(memoryData);
    notifyListeners();
    flushOutboxQueue();
  };

  // Permanent Delete Product
  const permanentDeleteProduct = (id: string) => {
    const deletedIds = getDeletedProductIds();
    deletedIds.add(id);
    saveDeletedProductIds(deletedIds);

    // Save tombstone to Cloud Firestore so server updates & other devices remember deletion forever!
    firebaseCloudDb.setDocument('deleted_products', 'global_tombstone', {
      id: 'global_tombstone',
      ids: Array.from(deletedIds),
      updatedAt: new Date().toISOString(),
    });

    const updatedProducts = memoryData.products.filter((p) => p.id !== id);
    saveStoredLocalData({ ...memoryData, products: updatedProducts });
    notifyListeners();

    firebaseCloudDb.deleteDocument('products', id);
  };

  // Restock / Credit Stock Quantity
  const updateStockQuantity = (productId: string, addedQuantity: number, reason: string) => {
    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === productId) {
        const prev = p.stockQuantity !== undefined ? p.stockQuantity : 50;
        const newStock = prev + addedQuantity;
        const newLog: StockLogItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'credit',
          quantity: addedQuantity,
          previousStock: prev,
          newStock,
          reason: reason || 'Admin Manual Restock',
          timestamp: new Date().toISOString(),
          performedBy: 'Super Admin',
        };

        const updated: Product = {
          ...p,
          stockQuantity: newStock,
          stockLogs: [newLog, ...(p.stockLogs || [])],
        };

        firebaseCloudDb.setDocument('products', updated.id, updated);
        return updated;
      }
      return p;
    });

    saveStoredLocalData({ ...memoryData, products: updatedProducts });
    notifyListeners();
  };

  const addToCart = (
    productOrItem: Product | any,
    selectedSize?: Product['sizes'][0],
    selectedFrame?: Product['frames'][0],
    uploadedPhotoUrl?: string,
    customTextValues?: Record<string, string>,
    quantity = 1,
    customizedFramePreviewUrl?: string
  ) => {
    let newItem: CartItem;

    if (productOrItem && productOrItem.product && productOrItem.selectedSize) {
      const itemObj = productOrItem;
      const customUrl = itemObj.customizedFramePreviewUrl || itemObj.uploadedPhotoUrl;

      newItem = {
        id: itemObj.id || `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product: itemObj.product,
        selectedSize: itemObj.selectedSize,
        selectedFrame: itemObj.selectedFrame || itemObj.product.frames?.[0],
        uploadedPhotoUrl: itemObj.uploadedPhotoUrl || itemObj.product.thumbnail,
        customizedFramePreviewUrl: customUrl,
        customTextValues: itemObj.customTextValues || {},
        quantity: itemObj.quantity || 1,
        itemTotalPrice: itemObj.itemTotalPrice || (itemObj.selectedSize?.price || 699) * (itemObj.quantity || 1),
      };
    } else {
      const product = productOrItem as Product;
      const size = selectedSize || product?.sizes?.[0];
      const frame = selectedFrame || product?.frames?.[0];
      const price = size?.price || 699;
      const itemTotalPrice = price * quantity;
      const customUrl = customizedFramePreviewUrl || uploadedPhotoUrl;

      newItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product,
        selectedSize: size,
        selectedFrame: frame,
        uploadedPhotoUrl: uploadedPhotoUrl || product?.thumbnail || '',
        customizedFramePreviewUrl: customUrl,
        customTextValues: customTextValues || {},
        quantity,
        itemTotalPrice,
      };
    }

    const updatedItems = [...memoryData.items, newItem];
    saveStoredLocalData({ ...memoryData, items: updatedItems });
    notifyListeners();
  };

  const removeFromCart = (itemId: string) => {
    const updatedItems = memoryData.items.filter((i) => i.id !== itemId);
    saveStoredLocalData({ ...memoryData, items: updatedItems });
    notifyListeners();
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const updatedItems = memoryData.items
      .map((item) => {
        if (item.id === itemId) {
          const newQty = item.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...item,
            quantity: newQty,
            itemTotalPrice: item.selectedSize.price * newQty,
          };
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    saveStoredLocalData({ ...memoryData, items: updatedItems });
    notifyListeners();
  };

  const placeOrder = (
    customerOrOrderData: Order['customer'] | any,
    paymentMethodParam?: Order['paymentMethod']
  ): Order => {
    let customer: Order['customer'];
    let paymentMethod: Order['paymentMethod'];
    let orderItems: CartItem[];
    let orderSubtotal: number;
    let paymentStatus: Order['paymentStatus'];
    let orderStatus: Order['orderStatus'];

    if (customerOrOrderData && customerOrOrderData.customer && customerOrOrderData.customer.fullName) {
      customer = customerOrOrderData.customer;
      paymentMethod = customerOrOrderData.paymentMethod || 'PhonePe';
      orderItems = customerOrOrderData.items && customerOrOrderData.items.length > 0 ? customerOrOrderData.items : [...memoryData.items];
      orderSubtotal = customerOrOrderData.subtotal || orderItems.reduce((sum, item) => sum + item.itemTotalPrice, 0);
      paymentStatus = customerOrOrderData.paymentStatus || (paymentMethod === 'COD' ? 'Pending' : 'Paid');
      orderStatus = customerOrOrderData.orderStatus || 'Received';
    } else {
      customer = customerOrOrderData;
      paymentMethod = paymentMethodParam || 'PhonePe';
      orderItems = [...memoryData.items];
      orderSubtotal = orderItems.reduce((sum, item) => sum + item.itemTotalPrice, 0);
      paymentStatus = paymentMethod === 'COD' ? 'Pending' : 'Paid';
      orderStatus = 'Received';
    }

    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customer,
      items: orderItems,
      subtotal: orderSubtotal,
      discount: 0,
      shipping: 0,
      total: orderSubtotal,
      paymentMethod,
      paymentStatus,
      orderStatus,
      createdAt: new Date().toISOString(),
    };

    // Automated Stock Debit on Order Placement!
    const updatedProducts = memoryData.products.map((prod) => {
      const orderedItem = orderItems.find((item) => item.product?.id === prod.id);
      if (orderedItem) {
        const prevStock = prod.stockQuantity !== undefined ? prod.stockQuantity : 50;
        const debitQty = orderedItem.quantity || 1;
        const newStock = Math.max(0, prevStock - debitQty);

        const debitLog: StockLogItem = {
          id: `log-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          type: 'debit',
          quantity: debitQty,
          previousStock: prevStock,
          newStock,
          reason: `Customer Order #${newOrder.id}`,
          timestamp: new Date().toISOString(),
          performedBy: customer.fullName || 'Customer Order',
        };

        const updatedProd: Product = {
          ...prod,
          stockQuantity: newStock,
          stockLogs: [debitLog, ...(prod.stockLogs || [])],
        };

        firebaseCloudDb.setDocument('products', updatedProd.id, updatedProd);
        return updatedProd;
      }
      return prod;
    });

    const updatedOrders = [newOrder, ...memoryData.orders];
    saveStoredMasterOrders(updatedOrders);
    saveStoredLocalData({ ...memoryData, products: updatedProducts, orders: updatedOrders, items: [] });
    notifyListeners();

    // Enqueue order write job in Write-Ahead Outbox Queue
    enqueueOutboxJob('orders', newOrder.id, 'create', newOrder);
    writeAuditLog('CREATE', 'order', newOrder.id, customer.fullName || 'Customer Order', null, newOrder);
    flushOutboxQueue();

    return newOrder;
  };

  const updateOrderStatus = (
    orderId: string,
    status: Order['orderStatus'],
    employeeName?: string,
    employeeRole?: string
  ) => {
    const updatedOrders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const empName = employeeName || 'Nirod Kumar (Super Admin)';
        const empRole = employeeRole || 'Super Admin';
        const now = new Date().toISOString();

        const historyItem = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          employeeName: empName,
          employeeRole: empRole,
          action: `Status updated to ${status}`,
          timestamp: now,
        };

        const existingHistory = ord.processingHistory || [];
        const updatedHistory = [historyItem, ...existingHistory];

        const updated: Order = {
          ...ord,
          orderStatus: status,
          processedBy: {
            employeeName: empName,
            employeeRole: empRole,
            timestamp: now,
          },
          processingHistory: updatedHistory,
        };

        firebaseCloudDb.setDocument('orders', updated.id, updated);
        return updated;
      }
      return ord;
    });

    saveStoredLocalData({ ...memoryData, orders: updatedOrders });
    notifyListeners();
  };

  const recordOrderAction = (
    orderId: string,
    action: string,
    employeeName?: string,
    employeeRole?: string
  ) => {
    const updatedOrders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const empName = employeeName || 'Nirod Kumar (Super Admin)';
        const empRole = employeeRole || 'Super Admin';
        const now = new Date().toISOString();

        const historyItem = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          employeeName: empName,
          employeeRole: empRole,
          action,
          timestamp: now,
        };

        const existingHistory = ord.processingHistory || [];
        const updatedHistory = [historyItem, ...existingHistory];

        const updated: Order = {
          ...ord,
          processedBy: {
            employeeName: empName,
            employeeRole: empRole,
            timestamp: now,
          },
          processingHistory: updatedHistory,
        };

        firebaseCloudDb.setDocument('orders', updated.id, updated);
        return updated;
      }
      return ord;
    });

    saveStoredLocalData({ ...memoryData, orders: updatedOrders });
    notifyListeners();
  };

  const updatePaymentStatus = (
    orderId: string,
    paymentStatus: Order['paymentStatus'],
    employeeName?: string
  ) => {
    const updatedOrders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const empName = employeeName || 'Nirod Kumar (Super Admin)';
        const now = new Date().toISOString();

        const historyItem = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          employeeName: empName,
          employeeRole: 'Super Admin',
          action: `Payment status updated to ${paymentStatus}`,
          timestamp: now,
        };

        const updated: Order = {
          ...ord,
          paymentStatus,
          processingHistory: [historyItem, ...(ord.processingHistory || [])],
        };

        firebaseCloudDb.setDocument('orders', updated.id, updated);
        return updated;
      }
      return ord;
    });

    saveStoredLocalData({ ...memoryData, orders: updatedOrders });
    notifyListeners();
  };

  const updateOrderAdminRemark = (
    orderId: string,
    remark: string,
    employeeName?: string
  ) => {
    const now = new Date().toISOString();

    // 1. Save to dedicated Remarks localStorage Map
    try {
      const existingMapRaw = localStorage.getItem('a1print_admin_remarks_v1');
      const remarksMap = existingMapRaw ? JSON.parse(existingMapRaw) : {};
      remarksMap[orderId] = { remark, timestamp: now, employeeName };
      localStorage.setItem('a1print_admin_remarks_v1', JSON.stringify(remarksMap));
    } catch (e) {}

    // 2. Update memoryData.orders
    const updatedOrders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const empName = employeeName || 'Nirod Kumar (Super Admin)';

        const historyItem = {
          id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
          employeeName: empName,
          employeeRole: 'Super Admin',
          action: `Admin Remark: "${remark}"`,
          timestamp: now,
        };

        const updated: Order = {
          ...ord,
          adminRemark: remark,
          adminRemarkTimestamp: now,
          processingHistory: [historyItem, ...(ord.processingHistory || [])],
        };

        firebaseCloudDb.setDocument('orders', updated.id, updated);
        return updated;
      }
      return ord;
    });

    saveStoredLocalData({ ...memoryData, orders: updatedOrders });
    notifyListeners();
  };

  // Support Tickets State & Management Engine
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>(() => {
    try {
      const raw = localStorage.getItem('a1print_support_tickets_v1');
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  const createSupportTicket = (data: Omit<SupportTicket, 'id' | 'ticketNumber' | 'createdAt' | 'status'>) => {
    const newTkt: SupportTicket = {
      ...data,
      id: `tkt-${Date.now()}`,
      ticketNumber: `TKT-${Math.floor(100000 + Math.random() * 900000)}`,
      status: 'Pending',
      createdAt: new Date().toISOString(),
    };
    const updated = [newTkt, ...supportTickets];
    setSupportTickets(updated);
    try {
      localStorage.setItem('a1print_support_tickets_v1', JSON.stringify(updated));
    } catch (e) {}
    firebaseCloudDb.setDocument('support_tickets', newTkt.id, newTkt);
    return newTkt;
  };

  const updateSupportTicketStatus = (ticketId: string, status: SupportTicket['status'], adminReply?: string) => {
    const now = new Date().toISOString();
    const updated = supportTickets.map((t) => {
      if (t.id === ticketId) {
        const item: SupportTicket = {
          ...t,
          status,
          adminReply: adminReply !== undefined ? adminReply : t.adminReply,
          adminReplyTimestamp: adminReply !== undefined ? now : t.adminReplyTimestamp,
        };
        firebaseCloudDb.setDocument('support_tickets', item.id, item);
        return item;
      }
      return t;
    });
    setSupportTickets(updated);
    try {
      localStorage.setItem('a1print_support_tickets_v1', JSON.stringify(updated));
    } catch (e) {}
  };

  const subtotal = store.items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const totalItems = store.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products: (store.products || []).filter((p) => p && !p.isDeleted),
    allProducts: store.products || [],
    items: store.items,
    orders: store.orders,
    categories: store.categories || DEFAULT_CATEGORIES,
    supportTickets,
    createSupportTicket,
    updateSupportTicketStatus,
    addCategory,
    deleteCategory,
    addProduct,
    updateProduct,
    deleteProduct: softDeleteProduct, // Soft delete fallback
    softDeleteProduct,
    restoreProduct,
    permanentDeleteProduct,
    updateStockQuantity,
    addToCart,
    removeFromCart,
    updateQuantity,
    placeOrder,
    updateOrderStatus,
    updatePaymentStatus,
    updateOrderAdminRemark,
    recordOrderAction,
    subtotal,
    totalItems,
  };
}
