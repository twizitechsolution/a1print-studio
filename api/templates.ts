import type { VercelRequest, VercelResponse } from '@vercel/node';

const FIREBASE_PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || process.env.FIREBASE_PROJECT_ID || 'aoneprintstudio-4c1bd';
const FIREBASE_API_KEY = process.env.VITE_FIREBASE_API_KEY || process.env.FIREBASE_API_KEY || 'AIzaSyBmyIAGv2y7UVqrIIOhQdllnrEOwJ8Purk';

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const REST_AUTH_PARAM = `key=${FIREBASE_API_KEY}`;

// Helper to convert Firestore JSON response to plain object
function fromFirestoreDoc(docData: any): any {
  if (!docData) return null;
  const fields = docData.fields || {};
  let result: any = {};

  if (fields.jsonPayload?.stringValue) {
    try {
      result = JSON.parse(fields.jsonPayload.stringValue);
    } catch {
      result = {};
    }
  }

  // Fallback to direct field mapping
  for (const [key, valObj] of Object.entries(fields) as [string, any][]) {
    if (key === 'jsonPayload') continue;
    if (valObj.stringValue !== undefined) result[key] = valObj.stringValue;
    else if (valObj.integerValue !== undefined) result[key] = parseInt(valObj.integerValue, 10);
    else if (valObj.doubleValue !== undefined) result[key] = parseFloat(valObj.doubleValue);
    else if (valObj.booleanValue !== undefined) result[key] = valObj.booleanValue;
    else if (valObj.nullValue !== undefined) result[key] = null;
  }

  const docPath = docData.name || '';
  const idFromPath = docPath.split('/').pop();
  if (idFromPath && !result.id) {
    result.id = idFromPath;
  }

  return result;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // GET: Retrieve single template by ID or all active templates
    if (req.method === 'GET') {
      if (id && typeof id === 'string') {
        const url = `${FIRESTORE_BASE_URL}/frame_templates/${encodeURIComponent(id)}?${REST_AUTH_PARAM}`;
        const response = await fetch(url);
        if (!response.ok) {
          if (response.status === 404) {
            return res.status(404).json({ error: `Template with ID '${id}' not found.` });
          }
          const errText = await response.text();
          return res.status(response.status).json({ error: 'Firestore error', details: errText });
        }
        const docData = await response.json();
        return res.status(200).json(fromFirestoreDoc(docData));
      } else {
        const url = `${FIRESTORE_BASE_URL}/frame_templates?pageSize=100&${REST_AUTH_PARAM}`;
        const response = await fetch(url);
        if (!response.ok) {
          const errText = await response.text();
          return res.status(response.status).json({ error: 'Firestore error', details: errText });
        }
        const data = await response.json();
        const rawDocs = data.documents || [];
        const templates = rawDocs
          .map(fromFirestoreDoc)
          .filter((t: any) => t && t.status !== 'archived');
        return res.status(200).json(templates);
      }
    }

    // POST: Create a new template document
    if (req.method === 'POST') {
      const templateData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      if (!templateData || !templateData.title) {
        return res.status(400).json({ error: 'Template title is required.' });
      }

      const templateId = templateData.id || `tpl-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const now = new Date().toISOString();
      const payload = {
        ...templateData,
        id: templateId,
        createdAt: templateData.createdAt || now,
        updatedAt: now,
        status: templateData.status || 'published',
      };

      const firestoreBody = {
        fields: {
          id: { stringValue: templateId },
          title: { stringValue: payload.title },
          status: { stringValue: payload.status },
          updatedAt: { stringValue: now },
          jsonPayload: { stringValue: JSON.stringify(payload) },
        },
      };

      const url = `${FIRESTORE_BASE_URL}/frame_templates?documentId=${encodeURIComponent(templateId)}&${REST_AUTH_PARAM}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestoreBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Failed to create template', details: errText });
      }

      return res.status(201).json(payload);
    }

    // PUT: Update an existing template document
    if (req.method === 'PUT') {
      const targetId = (id as string) || req.body?.id;
      if (!targetId) {
        return res.status(400).json({ error: 'Template ID is required for update.' });
      }

      const templateData = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const now = new Date().toISOString();
      const payload = {
        ...templateData,
        id: targetId,
        updatedAt: now,
      };

      const firestoreBody = {
        fields: {
          id: { stringValue: targetId },
          title: { stringValue: payload.title || 'Untitled Template' },
          status: { stringValue: payload.status || 'published' },
          updatedAt: { stringValue: now },
          jsonPayload: { stringValue: JSON.stringify(payload) },
        },
      };

      const url = `${FIRESTORE_BASE_URL}/frame_templates/${encodeURIComponent(targetId)}?${REST_AUTH_PARAM}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(firestoreBody),
      });

      if (!response.ok) {
        const errText = await response.text();
        return res.status(response.status).json({ error: 'Failed to update template', details: errText });
      }

      return res.status(200).json(payload);
    }

    return res.status(405).json({ error: 'Method not allowed. Use GET, POST, or PUT.' });
  } catch (error: any) {
    console.error('API /templates error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
