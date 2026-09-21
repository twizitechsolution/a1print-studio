import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getValidCanvaAccessToken,
  getFirestoreDoc,
  setFirestoreDoc,
  exportCanvaDesign,
  uploadCanvaExportToCloudinary,
} from './_canvaHelper';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '1mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body || {};
    const { templateId } = body;

    if (!templateId || typeof templateId !== 'string') {
      return res.status(400).json({ error: 'Missing required field: templateId.' });
    }

    // 1. Fetch template from Firestore
    let template = await getFirestoreDoc('universal_templates', templateId);
    let collectionName = 'universal_templates';

    if (!template) {
      template = await getFirestoreDoc('frame_templates', templateId);
      collectionName = 'frame_templates';
    }

    if (!template) {
      return res.status(404).json({ error: `Template '${templateId}' not found in database.` });
    }

    if (!template.canvaDesignId) {
      return res.status(400).json({
        error: 'This template has not been opened in Canva yet. Please click "Edit in Canva" first.',
      });
    }

    // 2. Obtain valid Canva access token
    let accessToken: string;
    try {
      accessToken = await getValidCanvaAccessToken();
    } catch (authErr: any) {
      return res.status(401).json({
        error: authErr.message || 'Canva is not authenticated.',
        code: authErr.code || 'CANVA_NOT_AUTHENTICATED',
        authUrl: '/api/canva/auth-start',
      });
    }

    // 3. Export design from Canva (PNG format)
    const canvaDownloadUrl = await exportCanvaDesign(accessToken, template.canvaDesignId);

    // 4. Download from Canva and permanently re-upload to Cloudinary
    const cloudinaryUrl = await uploadCanvaExportToCloudinary(canvaDownloadUrl);

    // 5. Update template in Firestore
    const now = new Date().toISOString();
    const updatedTemplate = {
      ...template,
      baseImageUrl: cloudinaryUrl,
      canvaLastSyncedAt: now,
      updatedAt: now,
    };

    await setFirestoreDoc(collectionName, templateId, updatedTemplate);
    if (collectionName === 'universal_templates') {
      setFirestoreDoc('frame_templates', templateId, updatedTemplate).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      templateId,
      baseImageUrl: cloudinaryUrl,
      canvaLastSyncedAt: now,
    });
  } catch (error: any) {
    console.error('Error exporting template from Canva:', error);
    const msg = error?.message || 'Failed to export artwork from Canva.';
    return res.status(500).json({
      error: msg,
      isLicenseError: msg.includes('premium Canva elements') || msg.includes('license'),
    });
  }
}
