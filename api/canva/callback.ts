import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CANVA_CLIENT_ID,
  CANVA_CLIENT_SECRET,
  CANVA_REDIRECT_URI,
  getFirestoreDoc,
  deleteFirestoreDoc,
  saveCanvaTokens,
} from './_canvaHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed. Use GET.' });
  }

  const { code, state, error, error_description } = req.query as Record<string, string>;

  // Handle errors from Canva consent screen
  if (error) {
    console.error('Canva OAuth error returned from consent screen:', error, error_description);
    return res.status(400).send(`
      <!DOCTYPE html>
      <html>
        <head><title>Canva Connection Cancelled</title></head>
        <body style="font-family:sans-serif;padding:40px;text-align:center;background:#090d16;color:#fff;">
          <h2 style="color:#f43f5e;">Canva Authorization Failed</h2>
          <p>${error_description || error}</p>
          <a href="/admin" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;">Return to Admin</a>
        </body>
      </html>
    `);
  }

  if (!code || !state) {
    return res.status(400).json({ error: 'Missing code or state from Canva callback.' });
  }

  try {
    // 1. Retrieve PKCE state from Firestore
    const stateDoc = await getFirestoreDoc('canva_oauth_states', state);
    if (!stateDoc || !stateDoc.codeVerifier) {
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Session Expired</title></head>
          <body style="font-family:sans-serif;padding:40px;text-align:center;background:#090d16;color:#fff;">
            <h2 style="color:#f43f5e;">Authorization Session Expired</h2>
            <p>Your Canva connection request timed out or has already been used. Please try clicking 'Connect Canva' again in the admin panel.</p>
            <a href="/admin" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;">Return to Admin</a>
          </body>
        </html>
      `);
    }

    const { codeVerifier, returnUrl, redirectUri: storedRedirectUri } = stateDoc;

    // Determine redirect URI
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'a1print-studio.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const computedRedirectUri = `${proto}://${host}/api/canva/callback`;
    const redirectUri = storedRedirectUri || CANVA_REDIRECT_URI || computedRedirectUri;

    // 2. Exchange authorization code for access & refresh tokens
    const basicAuth = Buffer.from(`${CANVA_CLIENT_ID}:${CANVA_CLIENT_SECRET}`).toString('base64');
    const tokenParams = new URLSearchParams();
    tokenParams.append('grant_type', 'authorization_code');
    tokenParams.append('code_verifier', codeVerifier);
    tokenParams.append('code', code);
    tokenParams.append('redirect_uri', redirectUri);

    const tokenRes = await fetch('https://api.canva.com/rest/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${basicAuth}`,
      },
      body: tokenParams.toString(),
    });

    if (!tokenRes.ok) {
      const errBody = await tokenRes.text();
      console.error('Canva token exchange failed:', errBody);
      return res.status(400).send(`
        <!DOCTYPE html>
        <html>
          <head><title>Canva Token Exchange Failed</title></head>
          <body style="font-family:sans-serif;padding:40px;text-align:center;background:#090d16;color:#fff;">
            <h2 style="color:#f43f5e;">Token Exchange Failed</h2>
            <p>Canva rejected the authorization code: ${errBody}</p>
            <a href="/admin" style="display:inline-block;margin-top:20px;padding:10px 20px;background:#3b82f6;color:#fff;border-radius:8px;text-decoration:none;">Return to Admin</a>
          </body>
        </html>
      `);
    }

    const tokenData = await tokenRes.json();

    // 3. Persist tokens in Firestore canvaAuth/admin_tokens
    await saveCanvaTokens({
      access_token: tokenData.access_token,
      refresh_token: tokenData.refresh_token,
      expires_in: tokenData.expires_in || 14400,
      scope: tokenData.scope,
    });

    // 4. Delete used state
    deleteFirestoreDoc('canva_oauth_states', state).catch(() => {});

    // 5. Redirect admin back to returnUrl with success flag
    const targetUrl = new URL(returnUrl || '/admin', `https://${host}`);
    targetUrl.searchParams.set('canvaConnected', 'true');

    res.writeHead(302, { Location: targetUrl.toString() });
    res.end();
  } catch (err: any) {
    console.error('Unhandled error in Canva callback:', err);
    return res.status(500).json({
      error: 'Failed to process Canva authorization callback.',
      details: err?.message,
    });
  }
}
