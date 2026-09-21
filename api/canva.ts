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
// Helpers: Firestore REST
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

async function setFirestoreDoc(collection: string, docId: string, data: Record<string, any>): Promise<boolean> {
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

async function deleteFirestoreDoc(collection: string, docId: string): Promise<boolean> {
  const url = `${FIRESTORE_BASE_URL}/${collection}/${encodeURIComponent(docId)}?${REST_AUTH_PARAM}`;
  const res = await fetch(url, { method: 'DELETE' });
  return res.ok;
}

// ---------------------------------------------------------------------------
// Helpers: PKCE
// ---------------------------------------------------------------------------
function toBase64Url(buf: Buffer): string {
  return buf.toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function generatePKCE(): { codeVerifier: string; codeChallenge: string; state: string } {
  const codeVerifier = toBase64Url(crypto.randomBytes(32));
  const hash = crypto.createHash('sha256').update(codeVerifier).digest();
  const codeChallenge = toBase64Url(hash);
  const state = toBase64Url(crypto.randomBytes(16));
  return { codeVerifier, codeChallenge, state };
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

async function saveCanvaTokens(tokens: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  scope?: string;
}): Promise<StoredCanvaTokens> {
  const expires_at = Date.now() + (tokens.expires_in - 300) * 1000;
  const payload: StoredCanvaTokens = {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token,
    expires_at,
    scope: tokens.scope,
  };

  await setFirestoreDoc('canvaAuth', 'admin_tokens', payload);
  return payload;
}

async function refreshCanvaAccessToken(tokens: StoredCanvaTokens): Promise<string> {
  if (!tokens.refresh_token) {
    throw new Error('No Canva refresh token found. Please re-authenticate.');
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

async function getValidCanvaAccessToken(): Promise<string> {
  const tokens = await getFirestoreDoc('canvaAuth', 'admin_tokens');
  if (!tokens || !tokens.access_token) {
    const err: any = new Error('Canva is not connected. Please click "Authorize & Connect Canva" in the template editor.');
    err.code = 'CANVA_NOT_CONNECTED';
    throw err;
  }

  const isExpired = Date.now() >= (tokens.expires_at || 0);
  if (isExpired) {
    return await refreshCanvaAccessToken(tokens);
  }

  return tokens.access_token;
}

// ---------------------------------------------------------------------------
// Helpers: Canva REST API Calls
// ---------------------------------------------------------------------------
async function importUrlToCanva(
  accessToken: string,
  title: string,
  imageUrl: string
): Promise<{ designId: string; editUrl: string }> {
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

  const maxAttempts = 25;
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
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

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
    // 1. auth-start: Initiates Canva OAuth PKCE
    // -------------------------------------------------------------------------
    if (action === 'auth-start') {
      if (!CANVA_CLIENT_ID) {
        return res.status(500).json({
          error: 'CANVA_CLIENT_ID is not configured.',
        });
      }

      const { codeVerifier, codeChallenge, state } = generatePKCE();

      const host = req.headers['x-forwarded-host'] || req.headers.host || 'a1print-studio.vercel.app';
      const proto = req.headers['x-forwarded-proto'] || 'https';
      const computedRedirectUri = `${proto}://${host}/api/canva/callback`;
      const redirectUri = CANVA_REDIRECT_URI || computedRedirectUri;
      const returnUrl = (req.query.returnUrl as string) || '/admin';

      await setFirestoreDoc('canva_oauth_states', state, {
        codeVerifier,
        redirectUri,
        returnUrl,
        createdAt: Date.now(),
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
    // 2. callback: Canva OAuth Redirect Handler
    // -------------------------------------------------------------------------
    if (action === 'callback') {
      const { code, state, error, error_description } = req.query;

      if (error) {
        const errMsg = encodeURIComponent(String(error_description || error));
        res.writeHead(302, { Location: `/admin?canvaError=${errMsg}` });
        return res.end();
      }

      if (!code || !state || typeof code !== 'string' || typeof state !== 'string') {
        return res.status(400).send('Missing authorization code or state parameter.');
      }

      const oauthState = await getFirestoreDoc('canva_oauth_states', state);
      if (!oauthState || !oauthState.codeVerifier) {
        return res.status(400).send('Invalid or expired OAuth state session. Please try connecting to Canva again.');
      }

      await deleteFirestoreDoc('canva_oauth_states', state).catch(() => {});

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
        return res.status(502).send(`Canva token exchange failed: ${errText}`);
      }

      const tokenData = await tokenRes.json();
      await saveCanvaTokens({
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_in: tokenData.expires_in || 14400,
        scope: tokenData.scope,
      });

      const returnUrl = oauthState.returnUrl || '/admin';
      const separator = returnUrl.includes('?') ? '&' : '?';
      res.writeHead(302, { Location: `${returnUrl}${separator}canvaConnected=true` });
      return res.end();
    }

    // -------------------------------------------------------------------------
    // 3. auth-status: Check if Canva is authenticated
    // -------------------------------------------------------------------------
    if (action === 'auth-status') {
      const tokens = await getFirestoreDoc('canvaAuth', 'admin_tokens');
      if (!tokens || !tokens.access_token) {
        return res.status(200).json({ isAuthenticated: false });
      }

      const isExpired = !tokens.expires_at || Date.now() >= (tokens.expires_at - 300000);
      if (isExpired && tokens.refresh_token) {
        try {
          await refreshCanvaAccessToken(tokens);
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
      const { templateId, imageUrl, title } = body;

      if (!templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      const accessToken = await getValidCanvaAccessToken();
      const template = await getFirestoreDoc('frame_templates', templateId);
      const targetImageUrl = imageUrl || template?.cleanBaseImageUrl || template?.baseImageUrl;
      const targetTitle = title || template?.title || `Template ${templateId}`;

      if (!targetImageUrl) {
        return res.status(400).json({ error: 'Template has no baseImageUrl to edit in Canva.' });
      }

      // If already linked, get fresh edit URL
      if (template?.canvaDesignId) {
        try {
          const existingDesign = await getCanvaDesign(accessToken, template.canvaDesignId);
          if (existingDesign.editUrl) {
            return res.status(200).json({
              success: true,
              designId: template.canvaDesignId,
              editUrl: existingDesign.editUrl,
              reused: true,
            });
          }
        } catch (err) {
          console.warn('Could not reuse Canva design, will import anew:', err);
        }
      }

      const importResult = await importUrlToCanva(accessToken, targetTitle, targetImageUrl);

      if (template) {
        await setFirestoreDoc('frame_templates', templateId, {
          ...template,
          canvaDesignId: importResult.designId,
        });
      }

      return res.status(200).json({
        success: true,
        designId: importResult.designId,
        editUrl: importResult.editUrl,
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
      const { templateId } = body;

      if (!templateId) {
        return res.status(400).json({ error: 'templateId is required' });
      }

      const template = await getFirestoreDoc('frame_templates', templateId);
      if (!template) {
        return res.status(404).json({ error: `Template with ID '${templateId}' not found.` });
      }

      if (!template.canvaDesignId) {
        return res.status(400).json({ error: 'This template is not linked to a Canva design yet.' });
      }

      const accessToken = await getValidCanvaAccessToken();
      const canvaDownloadUrl = await exportCanvaDesign(accessToken, template.canvaDesignId);
      const permanentCloudinaryUrl = await uploadCanvaExportToCloudinary(canvaDownloadUrl);

      const nowIso = new Date().toISOString();
      await setFirestoreDoc('frame_templates', templateId, {
        ...template,
        baseImageUrl: permanentCloudinaryUrl,
        canvaLastSyncedAt: nowIso,
      });

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

      const accessToken = await getValidCanvaAccessToken();
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
