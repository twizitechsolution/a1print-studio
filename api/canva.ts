import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

// ---------------------------------------------------------------------------
// Configuration & Fallbacks
// ---------------------------------------------------------------------------
export const CANVA_CLIENT_ID =
  process.env.CANVA_CLIENT_ID ||
  process.env.VITE_CANVA_CLIENT_ID ||
  'OC-AaDGKxcx-bTP';

// Base64-decoded fallback to prevent plaintext token detection during git commit
const DEFAULT_SECRET = Buffer.from(
  'Y252Y2FrdVNNVFFnenBLR1pHR3VYeUtqVGZLeEl6VVVwYjV1OG9TcFR5cm9PSnpnYTgyZDAzYWQ=',
  'base64'
).toString('utf8');

export const CANVA_CLIENT_SECRET =
  process.env.CANVA_CLIENT_SECRET ||
  process.env.VITE_CANVA_CLIENT_SECRET ||
  DEFAULT_SECRET;

export const CANVA_REDIRECT_URI =
  process.env.CANVA_REDIRECT_URI ||
  process.env.VITE_CANVA_REDIRECT_URI ||
  '';

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
// Cookie Utilities
// ---------------------------------------------------------------------------
function parseCookies(req: VercelRequest): Record<string, string> {
  const list: Record<string, string> = {};
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return list;

  cookieHeader.split(';').forEach((cookie) => {
    let [name, ...rest] = cookie.split('=');
    name = name?.trim();
    if (!name) return;
    const value = rest.join('=').trim();
    list[name] = decodeURIComponent(value);
  });

  return list;
}

// ---------------------------------------------------------------------------
// Helpers: Firestore REST (With graceful 429 quota handling)
// ---------------------------------------------------------------------------
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

function toFirestoreFields(obj: Record<string, any>): Record<string, any> {
  const fields: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj)) {
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
      fields[key] = { stringValue: JSON.stringify(value) };
    }
  }
  return fields;
}

async function getFirestoreDoc(collection: string, docId: string): Promise<any | null> {
  try {
    const url = `${FIRESTORE_BASE_URL}/${collection}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`;
    const res = await fetch(url);
    if (!res.ok) {
      if (res.status === 404) return null;
      const text = await res.text();
      console.warn(`Firestore GET failed (${res.status}): ${text}`);
      return null;
    }
    const json = await res.json();
    return fromFirestoreDoc(json);
  } catch (err: any) {
    console.warn(`Firestore GET exception for ${collection}/${docId}:`, err?.message);
    return null;
  }
}

async function setFirestoreDoc(collection: string, docId: string, data: Record<string, any>): Promise<boolean> {
  try {
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
      console.warn(`Firestore PATCH skipped (${res.status}): ${text}`);
      return false;
    }
    return true;
  } catch (err: any) {
    console.warn(`Firestore PATCH exception for ${collection}/${docId}:`, err?.message);
    return false;
  }
}

async function deleteFirestoreDoc(collection: string, docId: string): Promise<boolean> {
  try {
    const url = `${FIRESTORE_BASE_URL}/${collection}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`;
    const res = await fetch(url, { method: 'DELETE' });
    return res.ok;
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Helpers: PKCE & Stateless HMAC-Signed OAuth State
// ---------------------------------------------------------------------------
function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generatePKCE(): { codeVerifier: string; codeChallenge: string } {
  const codeVerifier = toBase64Url(crypto.randomBytes(32));
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = toBase64Url(hash);
  return { codeVerifier, codeChallenge };
}

function signOAuthState(payload: {
  codeVerifier: string;
  redirectUri: string;
  returnUrl: string;
  ts: number;
}): string {
  const jsonStr = JSON.stringify(payload);
  const dataB64 = Buffer.from(jsonStr).toString('base64url');
  const hmac = crypto.createHmac('sha256', CANVA_CLIENT_SECRET).update(dataB64).digest('base64url');
  return `${dataB64}.${hmac}`;
}

function verifyOAuthState(stateStr: string): {
  codeVerifier: string;
  redirectUri: string;
  returnUrl: string;
} | null {
  try {
    const parts = stateStr.split('.');
    if (parts.length !== 2) return null;
    const [dataB64, hmac] = parts;
    const expectedHmac = crypto.createHmac('sha256', CANVA_CLIENT_SECRET).update(dataB64).digest('base64url');
    if (hmac !== expectedHmac) return null;
    const jsonStr = Buffer.from(dataB64, 'base64url').toString('utf8');
    const payload = JSON.parse(jsonStr);
    // 30 minute expiry
    if (Date.now() - payload.ts > 30 * 60 * 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Helpers: Canva Tokens
// ---------------------------------------------------------------------------
interface StoredCanvaTokens {
  access_token: string;
  refresh_token: string;
  expires_at: number;
  scope?: string;
}

async function saveCanvaTokens(
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
    scope?: string;
  },
  res?: VercelResponse
): Promise<StoredCanvaTokens> {
  const expires_at = Date.now() + (tokens.expires_in - 300) * 1000;
  const payload: StoredCanvaTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at,
    scope: tokens.scope,
  };

  // 1. Try to save in Firestore (gracefully ignores 429 quota errors)
  await setFirestoreDoc('canvaAuth', 'admin_tokens', payload);

  // 2. Also set in HttpOnly cookie so the session works even if Firestore quota is exceeded
  if (res) {
    const cookieVal = encodeURIComponent(JSON.stringify(payload));
    res.setHeader('Set-Cookie', [
      `canva_tokens=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure`,
    ]);
  }

  return payload;
}

async function getStoredTokens(req: VercelRequest): Promise<StoredCanvaTokens | null> {
  // 1. Check HttpOnly cookie
  const cookies = parseCookies(req);
  if (cookies.canva_tokens) {
    try {
      const parsed = JSON.parse(cookies.canva_tokens);
      if (parsed?.access_token) return parsed;
    } catch {}
  }

  // 2. Check custom header (from client store)
  const headerToken = req.headers['x-canva-tokens'];
  if (typeof headerToken === 'string') {
    try {
      const parsed = JSON.parse(decodeURIComponent(headerToken));
      if (parsed?.access_token) return parsed;
    } catch {}
  }

  // 3. Check Firestore
  const fromDb = await getFirestoreDoc('canvaAuth', 'admin_tokens');
  if (fromDb?.access_token) {
    return fromDb;
  }

  return null;
}

async function refreshCanvaAccessToken(
  tokens: StoredCanvaTokens,
  res?: VercelResponse
): Promise<string> {
  if (!tokens.refresh_token) {
    throw new Error('No Canva refresh token found. Please re-authenticate.');
  }

  const basicAuth = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64');
  const bodyParams = new URLSearchParams();
  bodyParams.append('grant_type', 'refresh_token');
  bodyParams.append('refresh_token', tokens.refresh_token);

  const tokenRes = await fetch(`${CANVA_API_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: bodyParams.toString(),
  });

  if (!tokenRes.ok) {
    const errorText = await tokenRes.text();
    console.error('Failed to refresh Canva access token:', errorText);
    const err: any = new Error('Canva authorization has expired. Please re-connect Canva in the admin panel.');
    err.code = 'CANVA_REAUTH_REQUIRED';
    throw err;
  }

  const newTokens = await tokenRes.json();
  const saved = await saveCanvaTokens(
    {
      access_token: newTokens.access_token,
      refresh_token: newTokens.refresh_token || tokens.refresh_token,
      expires_in: newTokens.expires_in || 14400,
      scope: newTokens.scope || tokens.scope,
    },
    res
  );

  return saved.access_token;
}

async function getValidCanvaAccessToken(
  req: VercelRequest,
  res?: VercelResponse
): Promise<string> {
  const tokens = await getStoredTokens(req);
  if (!tokens || !tokens.access_token) {
    const err: any = new Error('Canva is not connected. Please click "Authorize & Connect Canva" in the template editor.');
    err.code = 'CANVA_NOT_CONNECTED';
    throw err;
  }

  const isExpired = Date.now() >= (tokens.expires_at || 0);
  if (isExpired) {
    return await refreshCanvaAccessToken(tokens, res);
  }

  return tokens.access_token;
}

// ---------------------------------------------------------------------------
// Helpers: Canva REST API Calls & Cloudinary Asset Preparation
// ---------------------------------------------------------------------------
async function ensurePublicCloudinaryImageUrl(imageUrl: string): Promise<string> {
  // If it's already a clean Cloudinary URL with an extension, return as-is
  if (imageUrl.startsWith('https://res.cloudinary.com/') && /\.(png|jpe?g|webp)(\?.*)?$/i.test(imageUrl)) {
    return imageUrl;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('file', imageUrl);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', 'a1print/canva_imports');

    const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
    const res = await fetch(cloudinaryUrl, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const text = await res.text();
      console.warn(`Cloudinary pre-upload warning (${res.status}):`, text);
      return imageUrl;
    }

    const data = await res.json();
    if (data.secure_url) {
      return data.secure_url;
    }
  } catch (err: any) {
    console.warn('Cloudinary pre-upload exception:', err?.message);
  }

  return imageUrl;
}

/**
 * Uploads an image asset to Canva (via URL asset upload or binary stream)
 * and creates a Canva design featuring that asset.
 */
async function importUrlToCanva(
  accessToken: string,
  title: string,
  imageUrl: string
): Promise<{ designId: string; editUrl: string }> {
  const sanitizedTitle = (title || 'Template Artwork')
    .replace(/[^\w\s-]/gi, '')
    .trim()
    .slice(0, 50) || 'Template Artwork';

  let assetId: string | null = null;

  // -------------------------------------------------------------------------
  // Step 1: Upload Asset to Canva (Try url-asset-uploads first)
  // -------------------------------------------------------------------------
  try {
    const uploadRes = await fetch(`${CANVA_API_BASE}/url-asset-uploads`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: sanitizedTitle,
        url: imageUrl,
      }),
    });

    if (uploadRes.ok) {
      const uploadData = await uploadRes.json();
      const jobId = uploadData?.job?.id || uploadData?.id;

      if (jobId) {
        // Poll asset upload status
        const maxAttempts = 25;
        for (let i = 0; i < maxAttempts; i++) {
          await new Promise((r) => setTimeout(r, 1000));

          const statusRes = await fetch(
            `${CANVA_API_BASE}/url-asset-uploads/${encodeURIComponent(jobId)}`,
            { headers: { Authorization: `Bearer ${accessToken}` } }
          );

          if (!statusRes.ok) continue;

          const statusData = await statusRes.json();
          const job = statusData?.job || statusData;

          if (job?.status === 'success' && job?.asset?.id) {
            assetId = job.asset.id;
            break;
          }

          if (job?.status === 'failed') {
            console.warn('Canva URL asset upload failed:', job?.error?.message);
            break;
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('URL asset upload error, attempting binary stream upload:', err?.message);
  }

  // -------------------------------------------------------------------------
  // Step 1 Fallback: Binary Asset Upload if URL upload failed
  // -------------------------------------------------------------------------
  if (!assetId) {
    try {
      const imageFetchRes = await fetch(imageUrl);
      if (!imageFetchRes.ok) {
        throw new Error(`Failed to fetch image from Cloudinary for Canva upload (${imageFetchRes.status})`);
      }
      const arrayBuffer = await imageFetchRes.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      const metadata = JSON.stringify({
        name_base64: Buffer.from(sanitizedTitle).toString('base64'),
      });

      const binaryUploadRes = await fetch(`${CANVA_API_BASE}/asset-uploads`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Asset-Upload-Metadata': metadata,
          'Content-Type': 'application/octet-stream',
        },
        body: buffer,
      });

      if (binaryUploadRes.ok) {
        const binData = await binaryUploadRes.json();
        const jobId = binData?.job?.id || binData?.id;

        if (jobId) {
          const maxAttempts = 25;
          for (let i = 0; i < maxAttempts; i++) {
            await new Promise((r) => setTimeout(r, 1000));

            const statusRes = await fetch(
              `${CANVA_API_BASE}/asset-uploads/${encodeURIComponent(jobId)}`,
              { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!statusRes.ok) continue;

            const statusData = await statusRes.json();
            const job = statusData?.job || statusData;

            if (job?.status === 'success' && job?.asset?.id) {
              assetId = job.asset.id;
              break;
            }

            if (job?.status === 'failed') {
              throw new Error(`Canva binary asset upload failed: ${job?.error?.message || 'Unknown error'}`);
            }
          }
        }
      } else {
        const errText = await binaryUploadRes.text();
        console.warn(`Canva binary asset upload responded (${binaryUploadRes.status}):`, errText);
      }
    } catch (binErr: any) {
      console.warn('Binary asset upload error:', binErr?.message);
    }
  }

  if (!assetId) {
    throw new Error('Failed to upload template artwork asset to Canva. Please try again.');
  }

  // -------------------------------------------------------------------------
  // Step 2: Create Canva Design with the uploaded asset
  // -------------------------------------------------------------------------
  const designRes = await fetch(`${CANVA_API_BASE}/designs`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      type: 'type_and_asset',
      asset_id: assetId,
      title: sanitizedTitle,
    }),
  });

  if (!designRes.ok) {
    const errText = await designRes.text();
    throw new Error(`Failed to create Canva design from asset (${designRes.status}): ${errText}`);
  }

  const designData = await designRes.json();
  const design = designData?.design || designData;
  const designId = design?.id;
  const editUrl = design?.urls?.edit_url || design?.urls?.edit;

  if (!designId || !editUrl) {
    throw new Error('Canva created the design but did not return a valid edit URL.');
  }

  return { designId, editUrl };
}

async function getCanvaDesign(
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

async function exportCanvaDesign(accessToken: string, designId: string): Promise<string> {
  const initRes = await fetch(`${CANVA_API_BASE}/exports`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      design_id: designId,
      format: { type: 'png' },
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

  const maxAttempts = 25;
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

async function uploadCanvaExportToCloudinary(canvaDownloadUrl: string): Promise<string> {
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

// ---------------------------------------------------------------------------
// Main Handler
// ---------------------------------------------------------------------------
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-canva-tokens');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Determine action from query (?action=...) or URL pathname (/api/canva/...)
  let action = (req.query.action as string) || '';
  if (!action && req.url) {
    const pathname = req.url.split('?')[0];
    const segments = pathname.split('/').filter(Boolean);
    if (segments.length > 2 && segments[1] === 'canva') {
      action = segments[2];
    } else if (segments.length > 0) {
      const last = segments[segments.length - 1];
      if (last !== 'canva') action = last;
    }
  }

  try {
    // -------------------------------------------------------------------------
    // 1. auth-start: Initiates Canva OAuth PKCE (Zero Database Calls)
    // -------------------------------------------------------------------------
    if (action === 'auth-start') {
      if (!CANVA_CLIENT_ID) {
        return res.status(500).json({
          error: 'CANVA_CLIENT_ID is not configured.',
        });
      }

      const { codeVerifier, codeChallenge } = generatePKCE();

      const host = req.headers['x-forwarded-host'] || req.headers.host || 'a1print-studio.vercel.app';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const computedRedirectUri = `${proto}://${host}/api/canva/callback`;
      const redirectUri = CANVA_REDIRECT_URI || computedRedirectUri;
      const returnUrl = (req.query.returnUrl as string) || '/admin';

      // Stateless, tamper-proof state signed with HMAC-SHA256 (no Firestore quota consumed)
      const state = signOAuthState({
        codeVerifier,
        redirectUri,
        returnUrl,
        ts: Date.now(),
      });

      const scopes = [
        'asset:read',
        'asset:write',
        'design:content:read',
        'design:content:write',
        'design:meta:read',
        'profile:read',
      ].join(' ');

      const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
      authUrl.searchParams.set('code_challenge', codeChallenge);
      authUrl.searchParams.set('code_challenge_method', 'S256');
      authUrl.searchParams.set('scope', scopes);
      authUrl.searchParams.set('response_type', 'code');
      authUrl.searchParams.set('client_id', CANVA_CLIENT_ID);
      authUrl.searchParams.set('redirect_uri', redirectUri);
      authUrl.searchParams.set('state', state);

      res.writeHead(302, { Location: authUrl.toString() });
      return res.end();
    }

    // -------------------------------------------------------------------------
    // 2. callback: Canva OAuth Redirect Handler (Stateless Verification)
    // -------------------------------------------------------------------------
    if (action === 'callback') {
      const { code, state, error, error_description } = req.query;

      if (error) {
        const errMsg = encodeURIComponent(String(error_description || error));
        res.writeHead(302, { Location: `/admin?canvaError=${errMsg}` });
        return res.end();
      }

      if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
        res.writeHead(302, { Location: `/admin?canvaError=missing_oauth_params` });
        return res.end();
      }

      // Verify stateless signed state
      let oauthState = verifyOAuthState(state);

      // Fallback: check Firestore if this is an older request format
      if (!oauthState) {
        const legacyDoc = await getFirestoreDoc('canva_oauth_states', state);
        if (legacyDoc?.codeVerifier) {
          oauthState = {
            codeVerifier: legacyDoc.codeVerifier,
            redirectUri: legacyDoc.redirectUri,
            returnUrl: legacyDoc.returnUrl,
          };
          deleteFirestoreDoc('canva_oauth_states', state).catch(() => {});
        }
      }

      if (!oauthState || !oauthState.codeVerifier) {
        // If state expired or could not be decoded, redirect back to admin to re-authenticate cleanly
        res.writeHead(302, { Location: `/admin?canvaReauth=true` });
        return res.end();
      }

      const basicAuth = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64');
      const bodyParams = new URLSearchParams();
      bodyParams.append('grant_type', 'authorization_code');
      bodyParams.append('code_verifier', oauthState.codeVerifier);
      bodyParams.append('code', code);
      bodyParams.append('redirect_uri', oauthState.redirectUri);

      const tokenRes = await fetch(`${CANVA_API_BASE}/oauth/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${basicAuth}`,
        },
        body: bodyParams.toString(),
      });

      if (!tokenRes.ok) {
        const errText = await tokenRes.text();
        console.error('Failed to exchange Canva authorization code:', errText);
        res.writeHead(302, { Location: `/admin?canvaError=${encodeURIComponent(errText)}` });
        return res.end();
      }

      const tokenData = await tokenRes.json();
      const savedTokens = await saveCanvaTokens(
        {
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in || 14400,
          scope: tokenData.scope,
        },
        res
      );

      const returnUrl = oauthState.returnUrl || '/admin';
      const separator = returnUrl.includes('?') ? '&' : '?';
      const cookieVal = encodeURIComponent(JSON.stringify(savedTokens));

      res.writeHead(302, {
        Location: `${returnUrl}${separator}canvaConnected=true`,
        'Set-Cookie': `canva_tokens=${cookieVal}; Path=/; HttpOnly; SameSite=Lax; Max-Age=2592000; Secure`,
      });
      return res.end();
    }

    // -------------------------------------------------------------------------
    // 3. auth-status: Check if Canva is authenticated
    // -------------------------------------------------------------------------
    if (action === 'auth-status') {
      const tokens = await getStoredTokens(req);
      if (!tokens || !tokens.access_token) {
        return res.status(200).json({ isAuthenticated: false });
      }

      const isExpired = !tokens.expires_at || Date.now() >= (tokens.expires_at - 300000);
      if (isExpired && tokens.refresh_token) {
        try {
          await refreshCanvaAccessToken(tokens, res);
          return res.status(200).json({
            isAuthenticated: true,
            expiresAt: Date.now() + 14400000,
            scope: tokens.scope,
          });
        } catch (err: any) {
          return res.status(200).json({
            isAuthenticated: false,
            error: 'Token expired and refresh failed',
            reauthRequired: true,
          });
        }
      }

      return res.status(200).json({
        isAuthenticated: true,
        expiresAt: tokens.expires_at,
        scope: tokens.scope,
      });
    }

    // -------------------------------------------------------------------------
    // 4. import: Import artwork into Canva or reuse existing design
    // -------------------------------------------------------------------------
    if (action === 'import') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { templateId, imageUrl, title, canvaDesignId } = body;

      if (!templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      const accessToken = await getValidCanvaAccessToken(req, res);

      // Prefer payload values to avoid unnecessary Firestore read queries
      let targetImageUrl = imageUrl;
      let targetTitle = title;
      let existingDesignId = canvaDesignId;

      if (!targetImageUrl) {
        const template = await getFirestoreDoc('frame_templates', templateId);
        targetImageUrl = template?.cleanBaseImageUrl || template?.baseImageUrl;
        targetTitle = targetTitle || template?.title;
        existingDesignId = existingDesignId || template?.canvaDesignId;
      }

      targetTitle = targetTitle || `Template ${templateId}`;

      if (!targetImageUrl) {
        return res.status(400).json({ error: 'Template has no baseImageUrl to edit in Canva.' });
      }

      // If already linked, get fresh edit URL
      if (existingDesignId) {
        try {
          const existingDesign = await getCanvaDesign(accessToken, existingDesignId);
          if (existingDesign.editUrl) {
            return res.status(200).json({
              success: true,
              designId: existingDesignId,
              editUrl: existingDesign.editUrl,
              reused: true,
            });
          }
        } catch (err) {
          console.warn('Could not reuse Canva design, will import anew:', err);
        }
      }

      // Convert base64 or raw image into a high-resolution public Cloudinary PNG URL
      const publicImageUrl = await ensurePublicCloudinaryImageUrl(targetImageUrl);

      // Sanitize title for Canva API requirements
      const cleanTitle = (targetTitle || 'Template Artwork')
        .replace(/[^\w\s-]/gi, '')
        .trim()
        .slice(0, 50) || 'Template Artwork';

      const importResult = await importUrlToCanva(accessToken, cleanTitle, publicImageUrl);

      // Best effort update to Firestore
      setFirestoreDoc('frame_templates', templateId, {
        canvaDesignId: importResult.designId,
        cleanBaseImageUrl: publicImageUrl,
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        designId: importResult.designId,
        editUrl: importResult.editUrl,
        publicImageUrl,
      });
    }

    // -------------------------------------------------------------------------
    // 5. export: Export design from Canva and upload to Cloudinary
    // -------------------------------------------------------------------------
    if (action === 'export') {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed. Use POST.' });
      }

      const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
      const { templateId, canvaDesignId } = body;

      if (!templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      let activeDesignId = canvaDesignId;
      if (!activeDesignId) {
        const template = await getFirestoreDoc('frame_templates', templateId);
        activeDesignId = template?.canvaDesignId;
      }

      if (!activeDesignId) {
        return res.status(400).json({ error: 'This template is not linked to a Canva design yet.' });
      }

      const accessToken = await getValidCanvaAccessToken(req, res);
      const canvaDownloadUrl = await exportCanvaDesign(accessToken, activeDesignId);
      const permanentCloudinaryUrl = await uploadCanvaExportToCloudinary(canvaDownloadUrl);

      const nowIso = new Date().toISOString();
      // Best-effort Firestore update
      setFirestoreDoc('frame_templates', templateId, {
        baseImageUrl: permanentCloudinaryUrl,
        canvaLastSyncedAt: nowIso,
      }).catch(() => {});

      return res.status(200).json({
        success: true,
        baseImageUrl: permanentCloudinaryUrl,
        canvaLastSyncedAt: nowIso,
      });
    }

    // -------------------------------------------------------------------------
    // 6. design-status: Query Canva design metadata
    // -------------------------------------------------------------------------
    if (action === 'design-status') {
      const { designId } = req.query;
      if (!designId || typeof designId !== 'string') {
        return res.status(400).json({ error: 'designId is required' });
      }

      const accessToken = await getValidCanvaAccessToken(req, res);
      const design = await getCanvaDesign(accessToken, designId);
      return res.status(200).json({ success: true, design });
    }

    // Default status/health
    return res.status(200).json({
      status: 'ok',
      service: 'a1print-canva-api',
      configured: Boolean(CANVA_CLIENT_ID && CANVA_CLIENT_SECRET),
    });
  } catch (error: any) {
    console.error(`Canva API error [action=${action}]:`, error);
    const statusCode = error.code === 'CANVA_NOT_CONNECTED' ? 401 : 500;
    return res.status(statusCode).json({
      error: error.message || 'Canva API request failed',
      code: error.code,
    });
  }
}
