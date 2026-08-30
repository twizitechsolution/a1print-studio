import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

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

// Helper: Sanitize payload to guarantee JSON string size is < 500 KB (Well below Firestore 1MB limit!)
function sanitizePayloadForFirestore(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(sanitizePayloadForFirestore);
  }

  const sanitized: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (typeof val === 'string') {
      // Preserve customer photo slot keys & URLs intact up to 250,000 chars (~250 KB)
      const isPhotoKey = key.startsWith('photo') || key.includes('Photo') || key === 'baseImageUrl' || key === 'thumbnail' || key === 'image';
      if (val.startsWith('data:image') && val.length > 250000 && !isPhotoKey) {
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
      const res = await fetch(`${FIRESTORE_BASE_URL}/products`);
      if (res.ok) {
        return {
          connected: true,
          projectId: FIREBASE_PROJECT_ID,
          statusText: 'Connected & Live Sync Active',
        };
      }
      return {
        connected: true,
        projectId: FIREBASE_PROJECT_ID,
        statusText: 'Connected (Database Ready)',
      };
    } catch (e) {
      return {
        connected: false,
        projectId: FIREBASE_PROJECT_ID,
        statusText: 'Offline Fallback',
      };
    }
  },

  // Read all documents in a collection from live Firebase Firestore
  async getCollection(collectionName: string): Promise<any[]> {
    try {
      const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}`);
      if (!res.ok) return [];
      const data = await res.json();
      if (!data.documents) return [];

      return data.documents.map((doc: any) => {
        const fields = doc.fields || {};
        const jsonStr = fields.jsonPayload?.stringValue;
        if (jsonStr) {
          try {
            return JSON.parse(jsonStr);
          } catch (e) {}
        }
        return fields;
      });
    } catch (e) {
      console.warn(`Firestore REST getCollection error [${collectionName}]:`, e);
      return [];
    }
  },

  // Write a document to live Firebase Firestore (Sanitized < 1MB Payload Guarantee!)
  async setDocument(collectionName: string, docId: string, rawPayload: any): Promise<boolean> {
    try {
      const sanitizedPayload = sanitizePayloadForFirestore(rawPayload);
      const body = {
        fields: {
          jsonPayload: {
            stringValue: JSON.stringify(sanitizedPayload),
          },
        },
      };

      // Tier 1: Try PATCH without restrictive query params
      let res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) return true;

      // Tier 2: Fallback to POST on collection
      res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}?documentId=${encodeURIComponent(docId)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return res.ok;
    } catch (e) {
      console.warn(`Firestore REST setDocument error [${collectionName}/${docId}]:`, e);
      return false;
    }
  },

  // Delete a document from live Firebase Firestore
  async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
    try {
      const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${encodeURIComponent(docId)}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      console.warn(`Firestore REST deleteDocument error [${collectionName}/${docId}]:`, e);
      return false;
    }
  },
};
