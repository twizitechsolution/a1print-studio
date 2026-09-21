import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  CANVA_CLIENT_ID,
  CANVA_REDIRECT_URI,
  generatePKCE,
  setFirestoreDoc,
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

  try {
    if (!CANVA_CLIENT_ID) {
      return res.status(500).json({
        error: 'CANVA_CLIENT_ID is not configured in server environment variables.',
      });
    }

    // 1. Generate PKCE code verifier, challenge and random state
    const { codeVerifier, codeChallenge, state } = generatePKCE();

    // Determine redirect URI
    const host = req.headers['x-forwarded-host'] || req.headers.host || 'a1print-studio.vercel.app';
    const proto = req.headers['x-forwarded-proto'] || 'https';
    const computedRedirectUri = `${proto}://${host}/api/canva/callback`;
    const redirectUri = CANVA_REDIRECT_URI || computedRedirectUri;

    // Return URL after completing OAuth (default: /admin)
    const returnUrl = (req.query.returnUrl as string) || '/admin';

    // 2. Persist state and code_verifier temporarily in Firestore (TTL: 10 minutes)
    await setFirestoreDoc('canva_oauth_states', state, {
      codeVerifier,
      redirectUri,
      returnUrl,
      createdAt: Date.now(),
    });

    // 3. Scopes required per Canva developer setup
    const scopes = [
      'asset:read',
      'asset:write',
      'design:content:read',
      'design:content:write',
      'design:meta:read',
      'profile:read',
    ].join(' ');

    // 4. Construct Canva OAuth URL
    const authUrl = new URL('https://www.canva.com/api/oauth/authorize');
    authUrl.searchParams.set('code_challenge', codeChallenge);
    authUrl.searchParams.set('code_challenge_method', 'S256');
    authUrl.searchParams.set('scope', scopes);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('client_id', CANVA_CLIENT_ID);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('state', state);

    // Redirect admin to Canva consent screen
    res.writeHead(302, { Location: authUrl.toString() });
    res.end();
  } catch (error: any) {
    console.error('Error starting Canva OAuth:', error);
    return res.status(500).json({
      error: 'Failed to initiate Canva OAuth flow.',
      details: error?.message,
    });
  }
}
