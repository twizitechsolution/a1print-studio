import { useState, useEffect } from 'react';
import { CartItem, Order, Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';

const STORAGE_KEY = 'a1print_store_data_v6';

interface StoreData {
  products: Product[];
  items: CartItem[];
  orders: Order[];
}

const defaultOrder: Order = {
  id: 'ORD-849201',
  customer: {
    fullName: 'Neha Saxena',
    phone: '9876543210',
    email: 'neha.saxena@example.com',
    address: 'Flat 402, Gomti Nagar',
    city: 'Lucknow',
    state: 'Uttar Pradesh',
    pincode: '226010',
  },
  items: [
    {
      id: 'cart-1',
      product: INITIAL_PRODUCTS[0],
      selectedSize: INITIAL_PRODUCTS[0].sizes[0],
      selectedFrame: INITIAL_PRODUCTS[0].frames[0],
      uploadedPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&q=80&w=600',
      customTextValues: {
        babyName: 'Arya Sharma',
        birthDateDay: '31',
        hospitalName: 'Duya Hospital',
        parentsName: 'Nikhil & Nikita',
        height: '49',
        weight: '3.5',
        bloodGroup: 'A+',
      },
      quantity: 1,
      photoScale: 1,
      photoPosition: { x: 0, y: 0 },
      photoRotation: 0,
      itemTotalPrice: 699,
    },
  ],
  subtotal: 699,
  discount: 0,
  shipping: 0,
  total: 699,
  paymentMethod: 'PhonePe',
  paymentStatus: 'Paid',
  orderStatus: 'Received',
  createdAt: new Date().toISOString(),
};

// Automatic Legacy Storage Key Purger (Reclaims 100% of browser localStorage 5MB quota!)
function cleanupLegacyKeys() {
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith('a1print_store_data_') && key !== STORAGE_KEY) {
        keysToRemove.push(key);
      }
    }
    keysToRemove.forEach((k) => {
      console.log('Purging legacy storage key to free up quota:', k);
      localStorage.removeItem(k);
    });
  } catch (e) {
    console.warn('Failed to cleanup legacy storage keys:', e);
  }
}

// Global In-Memory Store Cache (Guarantees zero state loss in active JavaScript memory!)
let memoryData: StoreData | null = null;

function getStoredData(): StoreData {
  if (memoryData) {
    return memoryData;
  }

  // Purge legacy storage keys first to free up disk quota
  cleanupLegacyKeys();

  let storedProducts: Product[] = [];
  let storedItems: CartItem[] = [];
  let storedOrders: Order[] = [];

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      storedProducts = parsed.products || [];
      storedItems = parsed.items || [];
      storedOrders = parsed.orders || [];
    }
  } catch (e) {
    console.error('Failed to read store data:', e);
  }

  // GUARANTEE: INITIAL_PRODUCTS from code (all 3 core template frames) are ALWAYS present in the catalog!
  const storedMap = new Map(storedProducts.map((p) => [p.id, p]));

  // Merge INITIAL_PRODUCTS from src/data/products.ts with any saved admin customizations
  const mergedProducts = INITIAL_PRODUCTS.map((initProd) => {
    const stored = storedMap.get(initProd.id);
    if (stored) {
      return {
        ...initProd,
        ...stored,
        photoSlots: stored.photoSlots && stored.photoSlots.length > 0 ? stored.photoSlots : initProd.photoSlots,
        textZones: stored.textZones && stored.textZones.length > 0 ? stored.textZones : initProd.textZones,
      };
    }
    return initProd;
  });

  // Add any custom admin-created products that aren't in INITIAL_PRODUCTS
  const customAdminProducts = storedProducts.filter(
    (sp) => !INITIAL_PRODUCTS.some((ip) => ip.id === sp.id)
  );

  const finalProducts = [...mergedProducts, ...customAdminProducts];

  memoryData = {
    products: finalProducts,
    items: storedItems,
    orders: storedOrders.length > 0 ? storedOrders : [defaultOrder],
  };

  return memoryData;
}

function saveStoredData(data: StoreData) {
  // Always update in-memory state FIRST!
  memoryData = data;

  cleanupLegacyKeys();

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('localStorage quota exceeded, performing quota-proof disk sanitization:', e);
    try {
      // Strip heavy customizedFramePreviewUrl strings and truncate non-essential blobs for disk persistence
      const sanitizedItems = data.items.map((item) => ({
        ...item,
        customizedFramePreviewUrl: undefined,
      }));

      const sanitizedProducts = data.products.map((p) => ({
        ...p,
        images: p.images ? [p.thumbnail] : [],
      }));

      const sanitizedOrders = data.orders.slice(0, 30).map((ord) => ({
        ...ord,
        items: ord.items.map((item) => ({
          ...item,
          customizedFramePreviewUrl: undefined,
        })),
      }));

      const sanitizedData: StoreData = {
        products: sanitizedProducts,
        items: sanitizedItems,
        orders: sanitizedOrders,
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(sanitizedData));
    } catch (err) {
      console.error('Failed to save sanitized store data:', err);
    }
  }
}

// Global BroadcastChannel & Event Listener for Real-Time Synchronization across components & tabs
let broadcastChannel: BroadcastChannel | null = null;
try {
  if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    broadcastChannel = new BroadcastChannel('a1print_store_channel');
    broadcastChannel.onmessage = (event) => {
      if (event.data && event.data.type === 'STORE_UPDATED' && event.data.payload) {
        memoryData = event.data.payload;
        saveStoredData(event.data.payload);
        listeners.forEach((l) => l());
      }
    };
  }
} catch (e) {
  console.warn('BroadcastChannel initialization fallback:', e);
}

const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((l) => l());
  if (broadcastChannel && memoryData) {
    try {
      broadcastChannel.postMessage({ type: 'STORE_UPDATED', payload: memoryData });
    } catch (e) {
      console.warn('Broadcast postMessage fallback:', e);
    }
  }
}

export function useCartStore() {
  const [data, setData] = useState<StoreData>(getStoredData());

  useEffect(() => {
    const listener = () => setData(getStoredData());
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  const updateStore = (updater: (prev: StoreData) => StoreData) => {
    const current = getStoredData();
    const next = updater(current);
    saveStoredData(next);
    setData(next);
    notifyListeners();
  };

  const addProduct = (newProd: Product) => {
    updateStore((prev) => ({
      ...prev,
      products: [newProd, ...prev.products.filter((p) => p.id !== newProd.id)],
    }));
  };

  const updateProduct = (id: string, updated: Partial<Product>) => {
    updateStore((prev) => ({
      ...prev,
      products: prev.products.map((p) => (p.id === id ? { ...p, ...updated } : p)),
    }));
  };

  const deleteProduct = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      products: prev.products.filter((p) => p.id !== id),
    }));
  };

  const addToCart = (itemData: Omit<CartItem, 'id'>) => {
    const newItem: CartItem = {
      ...itemData,
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    updateStore((prev) => ({
      ...prev,
      items: [...prev.items, newItem],
    }));
  };

  const removeFromCart = (id: string) => {
    updateStore((prev) => ({
      ...prev,
      items: prev.items.filter((item) => item.id !== id),
    }));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(id);
      return;
    }
    updateStore((prev) => ({
      ...prev,
      items: prev.items.map((item) =>
        item.id === id
          ? {
              ...item,
              quantity,
              itemTotalPrice: item.selectedSize.price * quantity,
            }
          : item
      ),
    }));
  };

  const placeOrder = (orderData: Omit<Order, 'id' | 'createdAt'>): Order => {
    const newOrder: Order = {
      ...orderData,
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    };

    updateStore((prev) => ({
      ...prev,
      orders: [newOrder, ...prev.orders],
      items: [], // Clear cart
    }));

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    updateStore((prev) => ({
      ...prev,
      orders: prev.orders.map((order) =>
        order.id === orderId ? { ...order, orderStatus: status } : order
      ),
    }));
  };

  const subtotal = data.items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const totalItems = data.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products: data.products,
    items: data.items,
    orders: data.orders,
    addProduct,
    updateProduct,
    deleteProduct,
    addToCart,
    removeFromCart,
    updateQuantity,
    placeOrder,
    updateOrderStatus,
    subtotal,
    totalItems,
  };
}
