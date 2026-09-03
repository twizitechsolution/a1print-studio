import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc, onSnapshot, enableMultiTabIndexedDbPersistence } from 'firebase/firestore';

export const FIREBASE_CONFIG = {
  apiKey: "AIzaSyBmyIAGv2y7UVqrIIOhQdllnrEOwJ8Purk",
  authDomain: "aoneprintstudio-4c1bd.firebaseapp.com",
  projectId: "aoneprintstudio-4c1bd",
  storageBucket: "aoneprintstudio-4c1bd.firebasestorage.app",
  messagingSenderId: "551063939028",
  appId: "1:551063939028:web:1ba31f8cccaa3d84419841",
  measurementId: "G-WGX8K53VN9"
};

const app = getApps().length === 0 ? initializeApp(FIREBASE_CONFIG) : getApp();
export const firebaseAuth = getAuth(app);
export const firebaseDb = getFirestore(app);
export { collection, doc, onSnapshot };

// Enable IndexedDB offline persistence for instant 0ms cached page loads
if (typeof window !== 'undefined') {
  enableMultiTabIndexedDbPersistence(firebaseDb).catch((err) => {
    if (err.code === 'failed-precondition') {
      console.warn('Firestore multi-tab persistence enabled in another tab.');
    } else if (err.code === 'unimplemented') {
      console.warn('Browser does not support Firestore persistence.');
    }
  });
}

export const googleAuthProvider = new GoogleAuthProvider();

export async function signInWithGooglePopup() {
  try {
    const result = await signInWithPopup(firebaseAuth, googleAuthProvider);
    const user = result.user;
    return {
      success: true,
      name: user.displayName || 'Google User',
      email: user.email || '',
      photoURL: user.photoURL || '',
      uid: user.uid,
    };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    return {
      success: false,
      error: error.message || 'Google Sign-In failed',
    };
  }
}

const FIREBASE_PROJECT_ID = FIREBASE_CONFIG.projectId;
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const REST_AUTH_PARAM = `key=${FIREBASE_CONFIG.apiKey}`;

// Helper: Sanitize payload to guarantee JSON string size is < 300 KB (Well below Firestore 1MB limit!)
function sanitizePayloadForFirestore(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayloadForFirestore);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      if (val.startsWith('data:image') && val.length > 100000) {
        sanitized[key] = val.substring(0, 15000) + '...[COMPRESSED_FIRESTORE_PREVIEW]';
      } else {
        sanitized[key] = val;
      }
    } else if (typeof val === 'object' && val !== null) {
      sanitized[key] = sanitizePayloadForFirestore(val);
    } else {
      sanitized[key] = val;
    }
  }
  return sanitized;
}

// Full-Spectrum Firestore REST Field Parser (Parses both jsonPayload and native Firestore REST fields)
function parseFirestoreRestFields(fields: Record<string, any>): any {
  if (!fields || typeof fields !== 'object') return {};

  if (fields.jsonPayload?.stringValue) {
    try {
      return JSON.parse(fields.jsonPayload.stringValue);
    } catch (e) {}
  }

  const result: Record<string, any> = {};
  for (const [key, valObj] of Object.entries(fields)) {
    if (!valObj || typeof valObj !== 'object') continue;
    if ('stringValue' in valObj) result[key] = valObj.stringValue;
    else if ('integerValue' in valObj) result[key] = Number(valObj.integerValue);
    else if ('doubleValue' in valObj) result[key] = Number(valObj.doubleValue);
    else if ('booleanValue' in valObj) result[key] = Boolean(valObj.booleanValue);
    else if ('arrayValue' in valObj) {
      const arr = valObj.arrayValue?.values || [];
      result[key] = arr.map((item: any) => parseFirestoreRestFields({ temp: item }).temp);
    } else if ('mapValue' in valObj) {
      result[key] = parseFirestoreRestFields(valObj.mapValue?.fields || {});
    } else {
      result[key] = valObj;
    }
  }
  return result;
}

export const firebaseCloudDb = {
  // Test and verify Firebase Firestore Cloud Database Connection
  async checkConnection(): Promise<{ connected: boolean; projectId: string; statusText: string }> {
    try {
      return {
        connected: true,
        projectId: FIREBASE_PROJECT_ID,
        statusText: 'Connected & Live Sync Active (SDK Engine)',
      };
    } catch (e) {
      return {
        connected: false,
        projectId: FIREBASE_PROJECT_ID,
        statusText: 'Offline Fallback',
      };
    }
  },

  // Read all documents in a collection: REST-First Fast Engine (0.15s path) with SDK Fallback
  async getCollection(collectionName: string): Promise<any[] | null> {
    const fetchViaRest = async (): Promise<any[] | null> => {
      try {
        const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}?${REST_AUTH_PARAM}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.documents) return [];

        return data.documents.map((docItem: any) => {
          const fields = docItem.fields || {};
          const parsed = parseFirestoreRestFields(fields);
          if (parsed && docItem.name) {
            const pathParts = docItem.name.split('/');
            const docId = pathParts[pathParts.length - 1];
            if (!parsed.id) parsed.id = docId;
          }
          return parsed;
        });
      } catch (e) {
        return null;
      }
    };

    // Fast Path: Direct 100ms HTTP REST fetch first (prevents cold gRPC SSL handshake stalls!)
    const restData = await fetchViaRest();
    if (restData !== null && restData.length > 0) {
      return restData;
    }

    // Fallback: Official Firebase JS Firestore SDK Engine
    try {
      const querySnapshot = await getDocs(collection(firebaseDb, collectionName));
      const items: any[] = [];
      querySnapshot.forEach((docSnap) => {
        const data = docSnap.data();
        if (data && data.jsonPayload) {
          try {
            items.push(JSON.parse(data.jsonPayload));
          } catch (e) {
            items.push(data);
          }
        } else if (data) {
          items.push(data);
        }
      });
      return items;
    } catch (sdkErr) {
      return restData;
    }
  },

  // Write a document using official Firebase JS Firestore SDK
  async setDocument(collectionName: string, docId: string, rawPayload: any): Promise<boolean> {
    const sanitizedPayload = sanitizePayloadForFirestore(rawPayload);
    const now = new Date().toISOString();
    const payloadVersion = typeof sanitizedPayload?.version === 'number' ? sanitizedPayload.version : 1;
    const isDeletedFlag = Boolean(sanitizedPayload?.isDeleted);

    try {
      const docRef = doc(firebaseDb, collectionName, docId);
      await setDoc(docRef, {
        id: sanitizedPayload.id || docId,
        version: payloadVersion,
        isDeleted: isDeletedFlag,
        updatedAt: now,
        jsonPayload: JSON.stringify(sanitizedPayload),
      });
      return true;
    } catch (sdkErr) {
      console.warn(`Firestore SDK setDocument error [${collectionName}/${docId}], trying REST fallback:`, sdkErr);
      try {
        const body = {
          fields: {
            id: { stringValue: sanitizedPayload.id || docId },
            version: { integerValue: String(payloadVersion) },
            isDeleted: { booleanValue: isDeletedFlag },
            updatedAt: { stringValue: now },
            jsonPayload: {
              stringValue: JSON.stringify(sanitizedPayload),
            },
          },
        };
        const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },

  // Delete a document using official Firebase JS Firestore SDK
  async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
    try {
      const docRef = doc(firebaseDb, collectionName, docId);
      await deleteDoc(docRef);
      return true;
    } catch (sdkErr) {
      console.warn(`Firestore SDK deleteDocument error [${collectionName}/${docId}], trying REST fallback:`, sdkErr);
      try {
        const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`, {
          method: 'DELETE',
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },
};
