import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getCanvaTokens } from './_canvaHelper';

export default async function handler(req: VercelRequest, res: VercelResponse) {
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
    const tokens = await getCanvaTokens();
    if (!tokens || !tokens.access_token || !tokens.refresh_token) {
      return res.status(200).json({ isAuthenticated: false });
    }

    return res.status(200).json({
      isAuthenticated: true,
      expiresAt: tokens.expires_at,
      scope: tokens.scope,
      updatedAt: tokens.updated_at,
    });
  } catch (error: any) {
    console.error('Error checking Canva auth status:', error);
    return res.status(500).json({
      error: 'Failed to check Canva auth status.',
      details: error?.message,
    });
  }
}
