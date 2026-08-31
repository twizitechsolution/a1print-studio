import { useState, useEffect } from 'react';
import { firebaseCloudDb } from '../config/firebase';

export interface SavedAddress {
  id: string;
  type: 'Home' | 'Work' | 'Other';
  fullName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

export interface CustomerUser {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  createdAt: string;
  savedAddresses: SavedAddress[];
}

interface AuthState {
  user: CustomerUser | null;
  isAuthenticated: boolean;
  isAuthModalOpen: boolean;
  authModalMode: 'login' | 'register';
}

const AUTH_STORAGE_KEY = 'a1print_customer_auth_v7';
const CUSTOMERS_DIRECTORY_KEY = 'a1print_registered_customers_v2';

let globalAuthState: AuthState = {
  user: null,
  isAuthenticated: false,
  isAuthModalOpen: false,
  authModalMode: 'login',
};

// Helper: Save customer to global persistent directory
function saveToCustomerDirectory(customer: CustomerUser) {
  try {
    const raw = localStorage.getItem(CUSTOMERS_DIRECTORY_KEY);
    let list: CustomerUser[] = raw ? JSON.parse(raw) : [];
    const idx = list.findIndex((c) => c.id === customer.id || c.phone === customer.phone || c.email === customer.email);
    if (idx !== -1) {
      list[idx] = customer;
    } else {
      list.push(customer);
    }
    localStorage.setItem(CUSTOMERS_DIRECTORY_KEY, JSON.stringify(list));
  } catch (e) {}

  // Write to Cloud Firestore DB
  firebaseCloudDb.setDocument('customer_users', customer.id, customer);
}

// Read initial state from localStorage
try {
  const saved = localStorage.getItem(AUTH_STORAGE_KEY);
  if (saved) {
    const parsed = JSON.parse(saved);
    if (parsed && parsed.user) {
      if (typeof parsed.user.fullName !== 'string') {
        parsed.user.fullName = String(parsed.user.email ? parsed.user.email.split('@')[0] : 'Valued Customer');
      }
    }
    globalAuthState = {
      ...globalAuthState,
      ...parsed,
    };
  }
} catch (e) {
  console.warn('Failed to load auth state:', e);
}

const listeners = new Set<() => void>();

function notifyAuthListeners() {
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({
      user: globalAuthState.user,
      isAuthenticated: globalAuthState.isAuthenticated,
    }));
  } catch (e) {
    console.warn('Failed to persist auth state:', e);
  }

  if (globalAuthState.user) {
    saveToCustomerDirectory(globalAuthState.user);
  }

  listeners.forEach((l) => l());
}

let isCustomerCloudSyncInit = false;

async function initCustomerCloudSync() {
  if (isCustomerCloudSyncInit) return;
  isCustomerCloudSyncInit = true;

  try {
    const cloudCustomers = await firebaseCloudDb.getCollection('customer_users');
    if (cloudCustomers && cloudCustomers.length > 0) {
      const raw = localStorage.getItem(CUSTOMERS_DIRECTORY_KEY);
      let list: CustomerUser[] = raw ? JSON.parse(raw) : [];

      cloudCustomers.forEach((cc) => {
        if (cc && cc.id) {
          const idx = list.findIndex((c) => c.id === cc.id || c.phone === cc.phone || c.email === cc.email);
          if (idx !== -1) {
            list[idx] = { ...list[idx], ...cc };
          } else {
            list.push(cc);
          }
        }
      });

      localStorage.setItem(CUSTOMERS_DIRECTORY_KEY, JSON.stringify(list));

      if (globalAuthState.user) {
        const matchingCloudUser = cloudCustomers.find(
          (c) => c.id === globalAuthState.user?.id || c.email === globalAuthState.user?.email || c.phone === globalAuthState.user?.phone
        );
        if (matchingCloudUser) {
          globalAuthState.user = {
            ...globalAuthState.user,
            ...matchingCloudUser,
            fullName: typeof matchingCloudUser.fullName === 'string' ? matchingCloudUser.fullName : globalAuthState.user.fullName,
          };
          notifyAuthListeners();
        }
      }
    }
  } catch (e) {
    console.warn('Customer cloud sync fallback:', e);
  }
}

export function useAuthStore() {
  const [state, setState] = useState<AuthState>(globalAuthState);

  useEffect(() => {
    initCustomerCloudSync();
    const handleChange = () => setState({ ...globalAuthState });
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    globalAuthState.isAuthModalOpen = true;
    globalAuthState.authModalMode = mode;
    notifyAuthListeners();
  };

  const closeAuthModal = () => {
    globalAuthState.isAuthModalOpen = false;
    notifyAuthListeners();
  };

  const loginUser = (emailOrPhone: string, _password?: string) => {
    const rawName = typeof emailOrPhone === 'string' && emailOrPhone.includes('@') ? emailOrPhone.split('@')[0] : 'Valued Customer';
    const existingUser = globalAuthState.user || {
      id: `cust-${Date.now()}`,
      fullName: (typeof globalAuthState.user?.fullName === 'string' && globalAuthState.user.fullName) ? globalAuthState.user.fullName : rawName,
      email: emailOrPhone.includes('@') ? emailOrPhone : `${emailOrPhone}@a1printstudio.com`,
      phone: emailOrPhone.includes('@') ? '9876543210' : emailOrPhone,
      createdAt: new Date().toISOString(),
      savedAddresses: [],
    };
    if (typeof existingUser.fullName !== 'string') {
      existingUser.fullName = String(existingUser.fullName || 'Valued Customer');
    }
    globalAuthState.user = existingUser;
    globalAuthState.isAuthenticated = true;
    globalAuthState.isAuthModalOpen = false;
    notifyAuthListeners();
    return true;
  };

  const registerUser = (fullName: string | any, email: string, phone: string, _password?: string) => {
    const safeName = (typeof fullName === 'string' && fullName.trim()) ? fullName.trim() : (email ? email.split('@')[0] : 'Valued Customer');
    const newUser: CustomerUser = {
      id: `cust-${Date.now()}`,
      fullName: safeName,
      email: email || `${phone}@a1printstudio.com`,
      phone: phone || '',
      createdAt: new Date().toISOString(),
      savedAddresses: [],
    };
    globalAuthState.user = newUser;
    globalAuthState.isAuthenticated = true;
    globalAuthState.isAuthModalOpen = false;
    notifyAuthListeners();
    return true;
  };

  const logoutUser = () => {
    globalAuthState.user = null;
    globalAuthState.isAuthenticated = false;
    notifyAuthListeners();
  };

  const addSavedAddress = (addressData: Omit<SavedAddress, 'id'>) => {
    if (!globalAuthState.user) return;
    const newAddr: SavedAddress = {
      ...addressData,
      id: `addr-${Date.now()}`,
    };
    globalAuthState.user.savedAddresses.push(newAddr);
    notifyAuthListeners();
  };

  const deleteSavedAddress = (addressId: string) => {
    if (!globalAuthState.user) return;
    globalAuthState.user.savedAddresses = globalAuthState.user.savedAddresses.filter((a) => a.id !== addressId);
    notifyAuthListeners();
  };

  const setDefaultAddress = (addressId: string) => {
    if (!globalAuthState.user) return;
    globalAuthState.user.savedAddresses = globalAuthState.user.savedAddresses.map((a) => ({
      ...a,
      isDefault: a.id === addressId,
    }));
    notifyAuthListeners();
  };

  const updateProfile = (fullNameOrUpdates: string | Partial<CustomerUser>, phoneArg?: string) => {
    if (!globalAuthState.user) return;
    if (typeof fullNameOrUpdates === 'object' && fullNameOrUpdates !== null) {
      if (typeof fullNameOrUpdates.fullName === 'string' && fullNameOrUpdates.fullName.trim()) {
        globalAuthState.user.fullName = fullNameOrUpdates.fullName.trim();
      }
      if (typeof fullNameOrUpdates.phone === 'string') {
        globalAuthState.user.phone = fullNameOrUpdates.phone.trim();
      }
      if (typeof fullNameOrUpdates.email === 'string') {
        globalAuthState.user.email = fullNameOrUpdates.email.trim();
      }
    } else if (typeof fullNameOrUpdates === 'string') {
      if (fullNameOrUpdates.trim()) {
        globalAuthState.user.fullName = fullNameOrUpdates.trim();
      }
      if (phoneArg && typeof phoneArg === 'string') {
        globalAuthState.user.phone = phoneArg.trim();
      }
    }
    notifyAuthListeners();
  };

  return {
    ...state,
    openAuthModal,
    closeAuthModal,
    loginUser,
    registerUser,
    logoutUser,
    addSavedAddress,
    deleteSavedAddress,
    setDefaultAddress,
    updateProfile,
  };
}
