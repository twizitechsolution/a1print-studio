import { useState, useEffect } from 'react';
import { CartItem, Order, Product, Category, StockLogItem } from '../types';
import { PRODUCTS as INITIAL_PRODUCTS } from '../data/products';
import { firebaseCloudDb } from '../config/firebase';

const STORAGE_KEY = 'a1print_store_data_v15';
const DELETED_IDS_KEY = 'a1print_deleted_product_ids_v15';
const CATEGORIES_KEY = 'a1print_categories_v15';

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

function getStoredLocalData(): StoreData {
  const categories = getStoredCategories();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      const prods = (parsed.products && parsed.products.length > 0 ? parsed.products : INITIAL_PRODUCTS).map((p: Product) => ({
        ...p,
        stockQuantity: p.stockQuantity !== undefined ? p.stockQuantity : 50,
        stockLogs: p.stockLogs || [],
      }));

      return {
        products: prods,
        items: parsed.items || [],
        orders: parsed.orders && parsed.orders.length > 0 ? parsed.orders : [defaultOrder],
        categories,
      };
    }
  } catch (e) {}

  const defaultProds = INITIAL_PRODUCTS.map((p) => ({
    ...p,
    stockQuantity: 50,
    stockLogs: [],
  }));

  return {
    products: defaultProds,
    items: [],
    orders: [defaultOrder],
    categories,
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
    // 1. FETCH CLOUD FIRESTORE CATALOG
    const cloudProds = await firebaseCloudDb.getCollection('products');

    if (cloudProds && cloudProds.length > 0) {
      const merged = [...memoryData.products];
      cloudProds.forEach((cp) => {
        const idx = merged.findIndex((mp) => mp.id === cp.id);
        if (idx !== -1) {
          const local = merged[idx];
          merged[idx] = {
            ...local,
            ...cp,
            stockQuantity: cp.stockQuantity !== undefined ? cp.stockQuantity : (local.stockQuantity ?? 50),
            stockLogs: (cp.stockLogs && cp.stockLogs.length > 0) ? cp.stockLogs : (local.stockLogs || []),
            isDeleted: cp.isDeleted !== undefined ? cp.isDeleted : local.isDeleted,
            deletedAt: cp.deletedAt || local.deletedAt,
          };
        } else {
          merged.push({
            ...cp,
            stockQuantity: cp.stockQuantity !== undefined ? cp.stockQuantity : 50,
            stockLogs: cp.stockLogs || [],
          });
        }
      });

      memoryData.products = merged;
      saveStoredLocalData(memoryData);
      notifyListeners();
    }

    // 2. NON-DESTRUCTIVE UNION MERGING FOR ORDERS
    const cloudOrders = await firebaseCloudDb.getCollection('orders');
    if (cloudOrders && cloudOrders.length > 0) {
      const orderMap = new Map<string, Order>();
      memoryData.orders.forEach((o) => {
        if (o && o.id) orderMap.set(o.id, o);
      });
      cloudOrders.forEach((co) => {
        if (co && co.id) orderMap.set(co.id, co);
      });

      const mergedOrders = Array.from(orderMap.values()).sort(
        (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );

      memoryData.orders = mergedOrders;
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

  const addCategory = (categoryData: Omit<Category, 'id' | 'createdAt'>) => {
    const newCategory: Category = {
      ...categoryData,
      id: `cat-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    const updatedCategories = [...memoryData.categories, newCategory];
    saveStoredCategories(updatedCategories);
    saveStoredLocalData({ ...memoryData, categories: updatedCategories });
    notifyListeners();
  };

  const deleteCategory = (id: string) => {
    const updatedCategories = memoryData.categories.filter((c) => c.id !== id);
    saveStoredCategories(updatedCategories);
    saveStoredLocalData({ ...memoryData, categories: updatedCategories });
    notifyListeners();
  };

  const addProduct = (newProduct: Product) => {
    const prodWithStock: Product = {
      ...newProduct,
      stockQuantity: newProduct.stockQuantity !== undefined ? newProduct.stockQuantity : 50,
      stockLogs: newProduct.stockLogs || [
        {
          id: `log-${Date.now()}`,
          type: 'credit',
          quantity: newProduct.stockQuantity || 50,
          previousStock: 0,
          newStock: newProduct.stockQuantity || 50,
          reason: 'Initial Product Listing Creation',
          timestamp: new Date().toISOString(),
          performedBy: 'Super Admin',
        },
      ],
    };

    const updated = [...memoryData.products, prodWithStock];
    saveStoredLocalData({ ...memoryData, products: updated });
    notifyListeners();
    firebaseCloudDb.setDocument('products', prodWithStock.id, prodWithStock);
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

  // Soft Delete Product (Moved to Recycle Bin)
  const softDeleteProduct = (id: string) => {
    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated: Product = {
          ...p,
          isDeleted: true,
          deletedAt: new Date().toISOString(),
        };
        firebaseCloudDb.setDocument('products', updated.id, updated);
        return updated;
      }
      return p;
    });

    saveStoredLocalData({ ...memoryData, products: updatedProducts });
    notifyListeners();
  };

  // Restore Soft-Deleted Product from Recycle Bin
  const restoreProduct = (id: string) => {
    const updatedProducts = memoryData.products.map((p) => {
      if (p.id === id) {
        const updated: Product = {
          ...p,
          isDeleted: false,
          deletedAt: undefined,
        };
        firebaseCloudDb.setDocument('products', updated.id, updated);
        return updated;
      }
      return p;
    });

    saveStoredLocalData({ ...memoryData, products: updatedProducts });
    notifyListeners();
  };

  // Permanent Delete Product
  const permanentDeleteProduct = (id: string) => {
    const deletedIds = getDeletedProductIds();
    deletedIds.add(id);
    saveDeletedProductIds(deletedIds);

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
    saveStoredLocalData({ ...memoryData, products: updatedProducts, orders: updatedOrders, items: [] });
    notifyListeners();

    const syncToCloud = async () => {
      let success = await firebaseCloudDb.setDocument('orders', newOrder.id, newOrder);
      if (!success) {
        setTimeout(() => firebaseCloudDb.setDocument('orders', newOrder.id, newOrder), 2000);
      }
    };
    syncToCloud();

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
    const updatedOrders = memoryData.orders.map((ord) => {
      if (ord.id === orderId) {
        const empName = employeeName || 'Nirod Kumar (Super Admin)';
        const now = new Date().toISOString();

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

  const subtotal = store.items.reduce((sum, item) => sum + item.itemTotalPrice, 0);
  const totalItems = store.items.reduce((sum, item) => sum + item.quantity, 0);

  return {
    products: store.products,
    items: store.items,
    orders: store.orders,
    categories: store.categories || DEFAULT_CATEGORIES,
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
