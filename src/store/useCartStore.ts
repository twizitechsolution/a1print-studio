import { useState, useEffect } from 'react';
import { CartItem, Order, Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { firebaseCloudDb } from '../config/firebase';

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

// Global In-Memory Data Store Cache
let memoryData: StoreData = {
  products: INITIAL_PRODUCTS,
  items: [],
  orders: [defaultOrder],
};

const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

// -------------------------------------------------------------
// Real-Time Firebase Cloud Firestore Synchronization Engine
// -------------------------------------------------------------
let isCloudSyncInitialized = false;

async function initCloudSync() {
  if (isCloudSyncInitialized) return;
  isCloudSyncInitialized = true;

  try {
    // 1. Initial Cloud Sync for Products
    const cloudProds = await firebaseCloudDb.getCollection('products');
    if (cloudProds && cloudProds.length > 0) {
      memoryData.products = cloudProds;
      notifyListeners();
    } else {
      // Seed Cloud Database with 7 master products if Firestore collection is empty!
      INITIAL_PRODUCTS.forEach((prod) => {
        firebaseCloudDb.setDocument('products', prod.id, prod);
      });
    }

    // 2. Initial Cloud Sync for Orders
    const cloudOrders = await firebaseCloudDb.getCollection('orders');
    if (cloudOrders && cloudOrders.length > 0) {
      memoryData.orders = cloudOrders;
      notifyListeners();
    }

    // 3. Periodic Poll for Real-Time Multi-Device Sync every 5 seconds
    setInterval(async () => {
      try {
        const freshProds = await firebaseCloudDb.getCollection('products');
        if (freshProds && freshProds.length > 0) {
          memoryData.products = freshProds;
          notifyListeners();
        }
        const freshOrders = await firebaseCloudDb.getCollection('orders');
        if (freshOrders && freshOrders.length > 0) {
          memoryData.orders = freshOrders;
          notifyListeners();
        }
      } catch (e) {}
    }, 5000);
  } catch (e) {
    console.warn('Cloud sync initialization fallback:', e);
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

  // E-Commerce Actions with Cloud Persistence

  const addProduct = (newProduct: Product) => {
    memoryData.products = [...memoryData.products, newProduct];
    notifyListeners();
    firebaseCloudDb.setDocument('products', newProduct.id, newProduct);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    memoryData.products = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        firebaseCloudDb.setDocument('products', updated.id, updated);
        return updated;
      }
      return p;
    });
    notifyListeners();
  };

  const deleteProduct = (id: string) => {
    memoryData.products = memoryData.products.filter((p) => p.id !== id);
    notifyListeners();
    firebaseCloudDb.deleteDocument('products', id);
  };

  const addToCart = (
    product: Product,
    selectedSize: Product['sizes'][0],
    selectedFrame: Product['frames'][0],
    uploadedPhotoUrl: string,
    customTextValues: Record<string, string>,
    quantity = 1,
    customizedFramePreviewUrl?: string
  ) => {
    const itemTotalPrice = selectedSize.price * quantity;
    const newItem: CartItem = {
      id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      product,
      selectedSize,
      selectedFrame,
      uploadedPhotoUrl,
      customizedFramePreviewUrl,
      customTextValues,
      quantity,
      itemTotalPrice,
    };

    memoryData.items = [...memoryData.items, newItem];
    notifyListeners();
  };

  const removeFromCart = (itemId: string) => {
    memoryData.items = memoryData.items.filter((i) => i.id !== itemId);
    notifyListeners();
  };

  const updateQuantity = (itemId: string, delta: number) => {
    memoryData.items = memoryData.items
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

    notifyListeners();
  };

  const placeOrder = (
    customer: Order['customer'],
    paymentMethod: Order['paymentMethod']
  ): Order => {
    const subtotal = memoryData.items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
    const total = subtotal;

    const newOrder: Order = {
      id: `ORD-${Math.floor(100000 + Math.random() * 900000)}`,
      customer,
      items: [...memoryData.items],
      subtotal,
      discount: 0,
      shipping: 0,
      total,
      paymentMethod,
      paymentStatus: paymentMethod === 'COD' ? 'COD' : 'Paid',
      orderStatus: 'Received',
      createdAt: new Date().toISOString(),
    };

    memoryData.orders = [newOrder, ...memoryData.orders];
    memoryData.items = [];
    notifyListeners();

    // Persist new order live to Cloud Firestore REST Database
    firebaseCloudDb.setDocument('orders', newOrder.id, newOrder);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    memoryData.orders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const updated = { ...ord, orderStatus: status };
        firebaseCloudDb.setDocument('orders', updated.id, updated);
        return updated;
      }
      return ord;
    });
    notifyListeners();
  };

  const subtotal = store.items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const totalItems = store.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products: store.products,
    items: store.items,
    orders: store.orders,
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
