import { useState, useEffect } from 'react';
import { CartItem, Order, Product } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { firebaseCloudDb } from '../config/firebase';

const STORAGE_KEY = 'a1print_store_data_v8';
const DELETED_IDS_KEY = 'a1print_deleted_product_ids_v8';

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

function getStoredLocalData(): StoreData {
  const deletedIds = getDeletedProductIds();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const prods = (parsed.products && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS).filter(
        (p: Product) => !deletedIds.has(p.id)
      );
      return {
        products: prods,
        items: parsed.items || [],
        orders: parsed.orders && parsed.orders.length > 0 ? parsed.orders : [defaultOrder],
      };
    }
  } catch (e) {}
  return {
    products: INITIAL_PRODUCTS.filter((p) => !deletedIds.has(p.id)),
    items: [],
    orders: [defaultOrder],
  };
}

let memoryData: StoreData = getStoredLocalData();

function saveStoredLocalData(data: StoreData) {
  memoryData = data;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {}
}

const listeners = new Set<() => void>();
function notifyListeners() {
  listeners.forEach((l) => l());
}

// Real-Time Cloud Firestore Sync Engine
let isCloudSyncInitialized = false;

async function initCloudSync() {
  if (isCloudSyncInitialized) return;
  isCloudSyncInitialized = true;

  try {
    const deletedIds = getDeletedProductIds();

    // 1. FETCH CLOUD FIRESTORE CATALOG FIRST (Cloud-First Priority!)
    const cloudProds = await firebaseCloudDb.getCollection('products');

    if (cloudProds && cloudProds.length > 0) {
      const filteredCloud = cloudProds.filter((p: Product) => !deletedIds.has(p.id));
      if (filteredCloud.length > 0) {
        // Merge cloud products: Cloud Firestore ALWAYS overwrites local memory defaults!
        const merged = [...memoryData.products];
        filteredCloud.forEach((cp) => {
          const idx = merged.findIndex((mp) => mp.id === cp.id);
          if (idx !== -1) {
            merged[idx] = cp; // CLOUD WINS 100%! Preserves all custom visual edits!
          } else {
            merged.push(cp);
          }
        });

        memoryData.products = merged;
        saveStoredLocalData(memoryData);
        notifyListeners();
      }
    }

    // 2. Only push products to Cloud Firestore if they DO NOT exist in Cloud Firestore yet!
    const existingCloudIds = new Set((cloudProds || []).map((cp: Product) => cp.id));
    memoryData.products.forEach((prod) => {
      if (!deletedIds.has(prod.id) && !existingCloudIds.has(prod.id)) {
        firebaseCloudDb.setDocument('products', prod.id, prod);
      }
    });

    const cloudOrders = await firebaseCloudDb.getCollection('orders');
    if (cloudOrders && cloudOrders.length > 0) {
      memoryData.orders = cloudOrders;
      saveStoredLocalData(memoryData);
      notifyListeners();
    }
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

  const addProduct = (newProduct: Product) => {
    const updated = [...memoryData.products, newProduct];
    saveStoredLocalData({ ...memoryData, products: updated });
    notifyListeners();
    firebaseCloudDb.setDocument('products', newProduct.id, newProduct);
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated = { ...p, ...updates };
        firebaseCloudDb.setDocument('products', updated.id, updated);
        return updated;
      }
      return p;
    });

    saveStoredLocalData({ ...memoryData, products: updatedProducts });
    notifyListeners();
  };

  const deleteProduct = (id: string) => {
    const deletedIds = getDeletedProductIds();
    deletedIds.add(id);
    saveDeletedProductIds(deletedIds);

    const updatedProducts = memoryData.products.filter((p) => p.id !== id);
    saveStoredLocalData({ ...memoryData, products: updatedProducts });
    notifyListeners();

    firebaseCloudDb.deleteDocument('products', id);
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
      // Called with a single CartItem object payload
      const itemObj = productOrItem;
      newItem = {
        id: itemObj.id || `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product: itemObj.product,
        selectedSize: itemObj.selectedSize,
        selectedFrame: itemObj.selectedFrame || itemObj.product.frames?.[0],
        uploadedPhotoUrl: itemObj.uploadedPhotoUrl || itemObj.product.thumbnail,
        customizedFramePreviewUrl: itemObj.customizedFramePreviewUrl || itemObj.product.thumbnail,
        customTextValues: itemObj.customTextValues || {},
        quantity: itemObj.quantity || 1,
        itemTotalPrice: itemObj.itemTotalPrice || (itemObj.selectedSize?.price || 699) * (itemObj.quantity || 1),
      };
    } else {
      // Called with positional arguments
      const product = productOrItem as Product;
      const size = selectedSize || product?.sizes?.[0];
      const frame = selectedFrame || product?.frames?.[0];
      const price = size?.price || 699;
      const itemTotalPrice = price * quantity;

      newItem = {
        id: `cart-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        product,
        selectedSize: size,
        selectedFrame: frame,
        uploadedPhotoUrl: uploadedPhotoUrl || product?.thumbnail || '',
        customizedFramePreviewUrl: customizedFramePreviewUrl || product?.thumbnail || '',
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

    const updatedOrders = [newOrder, ...memoryData.orders];
    saveStoredLocalData({ ...memoryData, orders: updatedOrders, items: [] });
    notifyListeners();

    firebaseCloudDb.setDocument('orders', newOrder.id, newOrder);

    return newOrder;
  };

  const updateOrderStatus = (orderId: string, status: Order['orderStatus']) => {
    const updatedOrders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const updated = { ...ord, orderStatus: status };
        firebaseCloudDb.setDocument('orders', updated.id, updated);
        return updated;
      }
      return ord;
    });

    saveStoredLocalData({ ...memoryData, orders: updatedOrders });
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
