import { useState, useEffect } from 'react';
import { CartItem, Order, Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { db } from '../config/firebase';
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';

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
// Real-Time Firebase Firestore Synchronization
// -------------------------------------------------------------
let isFirebaseSubscribed = false;

function initFirebaseSync() {
  if (isFirebaseSubscribed) return;
  isFirebaseSubscribed = true;

  try {
    // 1. Listen to Real-Time Product Catalog Updates from Cloud Firestore
    const productsRef = collection(db, 'products');
    onSnapshot(
      productsRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudProducts: Product[] = snapshot.docs.map((docSnap) => docSnap.data() as Product);
          memoryData.products = cloudProducts;
          notifyListeners();
        } else {
          // If Firestore collection is empty, seed initial 7 products into Firestore!
          seedFirestoreProducts();
        }
      },
      (error) => {
        console.warn('Firestore Products onSnapshot fallback:', error);
      }
    );

    // 2. Listen to Real-Time Orders Queue from Cloud Firestore
    const ordersRef = collection(db, 'orders');
    onSnapshot(
      ordersRef,
      (snapshot) => {
        if (!snapshot.empty) {
          const cloudOrders: Order[] = snapshot.docs.map((docSnap) => docSnap.data() as Order);
          memoryData.orders = cloudOrders;
          notifyListeners();
        }
      },
      (error) => {
        console.warn('Firestore Orders onSnapshot fallback:', error);
      }
    );
  } catch (err) {
    console.warn('Firebase sync setup fallback to memory/local:', err);
  }
}

// Seed all master products into Cloud Firestore if collection is empty
async function seedFirestoreProducts() {
  try {
    const batch = writeBatch(db);
    INITIAL_PRODUCTS.forEach((prod) => {
      const pRef = doc(db, 'products', prod.id);
      batch.set(pRef, prod);
    });
    await batch.commit();
    console.log('Successfully seeded 7 master custom frame products into Cloud Firestore!');
  } catch (e) {
    console.warn('Firestore seed warning:', e);
  }
}

// Write a single product to Cloud Firestore
async function syncProductToCloud(product: Product) {
  try {
    const pRef = doc(db, 'products', product.id);
    await setDoc(pRef, product, { merge: true });
  } catch (e) {
    console.warn('Cloud sync product error:', e);
  }
}

// Delete a single product from Cloud Firestore
async function deleteProductFromCloud(productId: string) {
  try {
    const pRef = doc(db, 'products', productId);
    await deleteDoc(pRef);
  } catch (e) {
    console.warn('Cloud delete product error:', e);
  }
}

// Write a single order to Cloud Firestore
async function syncOrderToCloud(order: Order) {
  try {
    const oRef = doc(db, 'orders', order.id);
    await setDoc(oRef, order, { merge: true });
  } catch (e) {
    console.warn('Cloud sync order error:', e);
  }
}

export function useCartStore() {
  const [store, setStore] = useState<StoreData>(memoryData);

  useEffect(() => {
    initFirebaseSync();
    const listener = () => setStore({ ...memoryData });
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  // E-Commerce Actions with Real-Time Cloud Firestore Persistence

  const addProduct = (newProduct: Product) => {
    memoryData.products = [...memoryData.products, newProduct];
    notifyListeners();
    syncProductToCloud(newProduct);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    memoryData.products = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        syncProductToCloud(updated);
        return updated;
      }
      return p;
    });
    notifyListeners();
  };

  const deleteProduct = (id: string) => {
    memoryData.products = memoryData.products.filter((p) => p.id !== id);
    notifyListeners();
    deleteProductFromCloud(id);
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

    // Persist new order live to Cloud Firestore
    syncOrderToCloud(newOrder);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    memoryData.orders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const updated = { ...ord, orderStatus: status };
        syncOrderToCloud(updated);
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
