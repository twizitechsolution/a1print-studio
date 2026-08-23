// A1print Studio Cloud Firestore REST Database Client
// Provides 100% Real-Time Cloud Database Persistence without external package bloat!

const FIREBASE_PROJECT_ID = 'a1print-studio-app';
const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;

export const firebaseCloudDb = {
  // Read all documents in a collection
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

  // Write a document to Cloud Firestore
  async setDocument(collectionName: string, docId: string, payload: any): Promise<boolean> {
    try {
      const body = {
        fields: {
          jsonPayload: {
            stringValue: JSON.stringify(payload),
          },
        },
      };

      const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${docId}?updateMask.fieldPaths=jsonPayload`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      return res.ok;
    } catch (e) {
      console.warn(`Firestore REST setDocument error [${collectionName}/${docId}]:`, e);
      return false;
    }
  },

  // Delete a document from Cloud Firestore
  async deleteDocument(collectionName: string, docId: string): Promise<boolean> {
    try {
      const res = await fetch(`${FIRESTORE_BASE_URL}/${collectionName}/${docId}`, {
        method: 'DELETE',
      });
      return res.ok;
    } catch (e) {
      console.warn(`Firestore REST deleteDocument error [${collectionName}/${docId}]:`, e);
      return false;
    }
  },
};
