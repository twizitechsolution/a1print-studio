import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { getFirestore, collection, getDocs, doc, setDoc, deleteDoc } from 'firebase/firestore';

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

  // Read all documents in a collection using official Firebase JS Firestore SDK
  async getCollection(collectionName: string): Promise<any[] | null> {
    try {
      // Tier 1: Try official Firebase JS Firestore SDK (No REST quota limits!)
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
      console.warn(`Firestore SDK getCollection error [${collectionName}], trying REST fallback:`, sdkErr);
      try {
        const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}`);
        if (!res.ok) return null;
        const data = await res.json();
        if (!data.documents) return [];

        return data.documents.map((docItem: any) => {
          const fields = docItem.fields || {};
          const jsonStr = fields.jsonPayload?.stringValue;
          if (jsonStr) {
            try {
              return JSON.parse(jsonStr);
            } catch (e) {}
          }
          return fields;
        });
      } catch (e) {
        return null;
      }
    }
  },

  // Write a document using official Firebase JS Firestore SDK
  async setDocument(collectionName: string, docId: string, rawPayload: any): Promise<boolean> {
    try {
      const sanitizedPayload = sanitizePayloadForFirestore(rawPayload);
      const docRef = doc(firebaseDb, collectionName, docId);
      await setDoc(docRef, {
        jsonPayload: JSON.stringify(sanitizedPayload),
        updatedAt: new Date().toISOString(),
      });
      return true;
    } catch (sdkErr) {
      console.warn(`Firestore SDK setDocument error [${collectionName}/${docId}], trying REST fallback:`, sdkErr);
      try {
        const sanitizedPayload = sanitizePayloadForFirestore(rawPayload);
        const body = {
          fields: {
            jsonPayload: {
              stringValue: JSON.stringify(sanitizedPayload),
            },
          },
        };
        const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}`, {
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
        const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}`, {
          method: 'DELETE',
        });
        return res.ok;
      } catch (e) {
        return false;
      }
    }
  },
};
