import crypto from 'crypto';

// Environment Configuration
export const CANVA_CLIENT_ID = process.env.CANVA_CLIENT_ID || '';
export const CANVA_CLIENT_SECRET = process.env.CANVA_CLIENT_SECRET || '';
export const CANVA_REDIRECT_URI = process.env.CANVA_REDIRECT_URI || '';

const FIREBASE_PROJECT_ID =
  process.env.VITE_FIREBASE_PROJECT_ID ||
  process.env.FIREBASE_PROJECT_ID ||
  'aoneprintstudio-4c1bd';
const FIREBASE_API_KEY =
  process.env.VITE_FIREBASE_API_KEY ||
  process.env.FIREBASE_API_KEY ||
  'AIzaSyBmyIAGv2y7UVqrIIOhQdllnrEOwJ8Purk';

const FIRESTORE_BASE_URL = `https://firestore.googleapis.com/v1/projects/${FIREBASE_PROJECT_ID}/databases/(default)/documents`;
const REST_AUTH_PARAM = `key=${FIREBASE_API_KEY}`;

const CLOUDINARY_CLOUD_NAME =
  process.env.VITE_CLOUDINARY_CLOUD_NAME ||
  process.env.CLOUDINARY_CLOUD_NAME ||
  'dcnnn0ogm';
const CLOUDINARY_UPLOAD_PRESET =
  process.env.VITE_CLOUDINARY_UPLOAD_PRESET ||
  process.env.CLOUDINARY_UPLOAD_PRESET ||
  'a1print_products';

const CANVA_API_BASE = 'https://api.canva.com/rest/v1';

// ---------------------------------------------------------------------------
// Firestore REST Helpers
// ---------------------------------------------------------------------------
export function fromFirestoreDoc(docData: any): any {
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

export function toFirestoreFields(data: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (value === null || value === undefined) {
      fields[key] = { nullValue: null };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (typeof value === 'number') {
      if (Number.isInteger(value)) {
        fields[key] = { integerValue: value.toString() };
      } else {
        fields[key] = { doubleValue: value };
      }
    } else if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else {
      // Complex nested object/array -> store as JSON string in value
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

export async function getFirestoreDoc(collection: string, docId: string): Promise<any | null> {
  const url = `${FIRESTORE_BASE_URL}/${collection}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`;
  const res = await fetch(url);
  if (!res.ok) {
    if (res.status === 404) return null;
    const text = await res.text();
    throw new Error(`Firestore GET failed (${res.status}): ${text}`);
  }
  const json = await res.json();
  return fromFirestoreDoc(json);
}

export async function setFirestoreDoc(collection: string, docId: string, data: Record<string, any>): Promise<boolean> {
  const url = `${FIRESTORE_BASE_URL}/${collection}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`;
  const fields = toFirestoreFields({
    ...data,
    jsonPayload: JSON.stringify(data),
    updatedAt: new Date().toISOString(),
  });

  const res = await fetch(url, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Firestore PATCH failed (${res.status}): ${text}`);
  }
  return true;
}

export async function deleteFirestoreDoc(collection: string, docId: string): Promise<boolean> {
  const url = `${FIRESTORE_BASE_URL}/${collection}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`;
  const res = await fetch(url, { method: 'DELETE' });
  return res.ok;
}

// ---------------------------------------------------------------------------
// PKCE Generators
// ---------------------------------------------------------------------------
export function generatePKCE(): { codeVerifier: string; codeChallenge: string; state: string } {
  // 64 random bytes produces a safe, url-safe high-entropy code_verifier
  const codeVerifier = crypto.randomBytes(48).toString('base64url');
  const codeChallenge = crypto.createHash('sha256').update(codeVerifier).digest('base64url');
  const state = crypto.randomBytes(24).toString('base64url');
  return { codeVerifier, codeChallenge, state };
}

// ---------------------------------------------------------------------------
// Canva Token Management
// ---------------------------------------------------------------------------
export interface CanvaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number; // epoch ms
  scope?: string;
  updated_at?: string;
}

const TOKENS_COLLECTION = 'canvaAuth';
const TOKENS_DOC_ID = 'admin_tokens';

export async function saveCanvaTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}): Promise<CanvaTokens> {
  // Subtract 5 minutes buffer so we refresh before token expires mid-operation
  const expires_at = Date.now() + (tokens.expires_in * 1000) - 300000;
  const tokenDoc: CanvaTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at,
    scope: tokens.scope || '',
    updated_at: new Date().toISOString(),
  };

  await setFirestoreDoc(TOKENS_COLLECTION, TOKENS_DOC_ID, tokenDoc);
  return tokenDoc;
}

export async function getCanvaTokens(): Promise<CanvaTokens | null> {
  return await getFirestoreDoc(TOKENS_COLLECTION, TOKENS_DOC_ID);
}

/**
 * Returns a guaranteed valid, active Canva access token.
 * Silently refreshes the token using the refresh_token if expired.
 */
export async function getValidCanvaAccessToken(): Promise<string> {
  const tokens = await getCanvaTokens();
  if (!tokens || !tokens.access_token || !tokens.refresh_token) {
    const err: any = new Error('Canva is not connected. Please connect Canva in the admin panel.');
    err.code = 'CANVA_NOT_AUTHENTICATED';
    throw err;
  }

  // Token is still valid!
  if (Date.now() < tokens.expires_at) {
    return tokens.access_token;
  }

  // Token expired — refresh silently
  if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET) {
    throw new Error('CANVA_CLIENT_ID and CANVA_CLIENT_SECRET are required in environment variables.');
  }

  const basicAuth = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64');
  const bodyParams = new URLSearchParams();
  bodyParams.append('grant_type', 'refresh_token');
  bodyParams.append('refresh_token', tokens.refresh_token);

  const res = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: bodyParams.toString(),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('Failed to refresh Canva access token:', errorText);
    const err: any = new Error('Canva authorization has expired. Please re-connect Canva in the admin panel.');
    err.code = 'CANVA_REAUTH_REQUIRED';
    throw err;
  }

  const newTokens = await res.json();
  const saved = await saveCanvaTokens({
    access_token: newTokens.access_token,
    refresh_token: newTokens.refresh_token || tokens.refresh_token,
    expires_in: newTokens.expires_in || 14400,
    scope: newTokens.scope || tokens.scope,
  });

  return saved.access_token;
}

// ---------------------------------------------------------------------------
// Canva REST API Calls
// ---------------------------------------------------------------------------

/**
 * Starts a URL import job in Canva and polls until complete.
 * Returns the design ID and edit URL.
 */
export async function importUrlToCanva(
  accessToken: string,
  title: string,
  imageUrl: string
): Promise<{ designId: string; editUrl: string }> {
  // Step 1: POST to create URL import job
  // Try /url-imports endpoint first, fall back to /imports
  let initRes = await fetch(`${CANVA_API_BASE}/url-imports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: title.slice(0, 255),
      url: imageUrl,
    }),
  });

  if (!initRes.ok && initRes.status === 404) {
    initRes = await fetch(`${CANVA_API_BASE}/imports`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title.slice(0, 255),
        url: imageUrl,
      }),
    });
  }

  if (!initRes.ok) {
    const errText = await initRes.text();
    throw new Error(`Canva URL Import failed (${initRes.status}): ${errText}`);
  }

  const initData = await initRes.json();
  const jobId = initData?.job?.id || initData?.id;
  if (!jobId) {
    throw new Error('Canva did not return a valid import job ID.');
  }

  // Step 2: Poll import job status
  const maxAttempts = 25; // 25 * 1000ms = 25s
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1000));

    let statusRes = await fetch(`${CANVA_API_BASE}/url-imports/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!statusRes.ok && statusRes.status === 404) {
      statusRes = await fetch(`${CANVA_API_BASE}/imports/${encodeURIComponent(jobId)}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
    }

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();
    const job = statusData?.job || statusData;

    if (job?.status === 'success') {
      const design = job?.result?.designs?.[0] || job?.designs?.[0];
      const designId = design?.id;
      const editUrl = design?.urls?.edit_url || design?.urls?.edit;
      if (!designId) {
        throw new Error('Import job succeeded but no Canva design was returned.');
      }
      return { designId, editUrl: editUrl || '' };
    }

    if (job?.status === 'failed') {
      const msg = job?.error?.message || 'Canva import job reported failure.';
      throw new Error(`Canva import failed: ${msg}`);
    }
  }

  throw new Error('Timed out waiting for Canva import job to complete.');
}

/**
 * Retrieves a design from Canva by ID and gets its fresh edit URL.
 */
export async function getCanvaDesign(
  accessToken: string,
  designId: string
): Promise<{ designId: string; title: string; editUrl: string; updatedAt?: number }> {
  const res = await fetch(`${CANVA_API_BASE}/designs/${encodeURIComponent(designId)}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Canva Get Design failed (${res.status}): ${errText}`);
  }

  const data = await res.json();
  const design = data?.design || data;
  const editUrl = design?.urls?.edit_url || design?.urls?.edit || '';

  return {
    designId: design.id || designId,
    title: design.title || '',
    editUrl,
    updatedAt: design.updated_at,
  };
}

/**
 * Creates an export job for a Canva design and polls until completion.
 * Returns the temporary Canva download URL.
 */
export async function exportCanvaDesign(
  accessToken: string,
  designId: string
): Promise<string> {
  // Step 1: POST to create design export job
  const initRes = await fetch(`${CANVA_API_BASE}/exports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design_id: designId,
      format: {
        type: 'png',
      },
    }),
  });

  if (!initRes.ok) {
    const errText = await initRes.text();
    let parsedErr: any = null;
    try {
      parsedErr = JSON.parse(errText);
    } catch {}

    if (parsedErr?.code === 'license_required' || errText.includes('license_required')) {
      throw new Error('Canva export failed: The design contains premium Canva elements. Please remove them or license them in Canva before syncing.');
    }
    throw new Error(`Canva Export Job creation failed (${initRes.status}): ${errText}`);
  }

  const initData = await initRes.json();
  const jobId = initData?.job?.id || initData?.id;
  if (!jobId) {
    throw new Error('Canva did not return an export job ID.');
  }

  // Step 2: Poll export job status
  const maxAttempts = 25; // 25 * 1200ms = 30s
  for (let i = 0; i < maxAttempts; i++) {
    await new Promise((r) => setTimeout(r, 1200));

    const statusRes = await fetch(`${CANVA_API_BASE}/exports/${encodeURIComponent(jobId)}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    if (!statusRes.ok) continue;

    const statusData = await statusRes.json();
    const job = statusData?.job || statusData;

    if (job?.status === 'success') {
      const downloadUrl = job?.urls?.[0];
      if (!downloadUrl) {
        throw new Error('Canva export succeeded but did not return a download URL.');
      }
      return downloadUrl;
    }

    if (job?.status === 'failed') {
      const code = job?.error?.code;
      const msg = job?.error?.message;
      if (code === 'license_required' || msg?.includes('license')) {
        throw new Error('Canva export failed: The design contains premium Canva elements. Please remove them or license them in Canva before syncing.');
      }
      throw new Error(`Canva export failed: ${msg || code || 'Unknown export error'}`);
    }
  }

  throw new Error('Timed out waiting for Canva export job to complete.');
}

/**
 * Downloads the exported image from Canva and uploads it directly to Cloudinary,
 * returning the permanent CDN URL.
 */
export async function uploadCanvaExportToCloudinary(canvaDownloadUrl: string): Promise<string> {
  const formData = new URLSearchParams();
  formData.append('file', canvaDownloadUrl);
  formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
  formData.append('folder', 'a1print/canva_exports');

  const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
  const res = await fetch(cloudinaryUrl, {
    method: 'POST',
    body: formData,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to upload Canva artwork to Cloudinary (${res.status}): ${text}`);
  }

  const data = await res.json();
  if (!data.secure_url) {
    throw new Error('Cloudinary upload succeeded but returned no secure_url.');
  }

  return data.secure_url;
}
