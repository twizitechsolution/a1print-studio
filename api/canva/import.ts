import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getValidCanvaAccessToken,
  getFirestoreDoc,
  setFirestoreDoc,
  importUrlToCanva,
  getCanvaDesign,
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

    // 2. Obtain valid Canva access token (auto-refreshed if needed)
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

    // 3. If template already has a Canva design ID, reuse it!
    if (template.canvaDesignId) {
      try {
        const existingDesign = await getCanvaDesign(accessToken, template.canvaDesignId);
        if (existingDesign.editUrl) {
          return res.status(200).json({
            success: true,
            designId: template.canvaDesignId,
            editUrl: existingDesign.editUrl,
            reused: true,
            title: existingDesign.title || template.title,
          });
        }
      } catch (checkErr) {
        console.warn(`Could not reuse existing Canva design ${template.canvaDesignId}, re-importing:`, checkErr);
      }
    }

    // 4. Import template artwork into Canva
    const sourceImageUrl = template.cleanBaseImageUrl || template.baseImageUrl || template.thumbnail;
    if (!sourceImageUrl) {
      return res.status(400).json({
        error: 'Template has no base image URL to import into Canva.',
      });
    }

    const { designId, editUrl } = await importUrlToCanva(
      accessToken,
      template.title || 'Frame Template Artwork',
      sourceImageUrl
    );

    // 5. Save canvaDesignId to template in Firestore
    const updatedTemplate = {
      ...template,
      canvaDesignId: designId,
      updatedAt: new Date().toISOString(),
    };

    await setFirestoreDoc(collectionName, templateId, updatedTemplate);
    // Also mirror to alternate collection if exists
    if (collectionName === 'universal_templates') {
      setFirestoreDoc('frame_templates', templateId, updatedTemplate).catch(() => {});
    }

    return res.status(200).json({
      success: true,
      designId,
      editUrl,
      reused: false,
      title: template.title,
    });
  } catch (error: any) {
    console.error('Error importing template to Canva:', error);
    return res.status(500).json({
      error: 'Failed to import template to Canva.',
      details: error?.message,
    });
  }
}
