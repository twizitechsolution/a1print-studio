import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  getValidCanvaAccessToken,
  getFirestoreDoc,
  getCanvaDesign,
} from './_canvaHelper';

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

  const { templateId } = req.query;
  if (!templateId || typeof templateId !== 'string') {
    return res.status(400).json({ error: 'Missing templateId parameter.' });
  }

  try {
    let template = await getFirestoreDoc('universal_templates', templateId);
    if (!template) {
      template = await getFirestoreDoc('frame_templates', templateId);
    }

    if (!template) {
      return res.status(404).json({ error: 'Template not found.' });
    }

    if (!template.canvaDesignId) {
      return res.status(200).json({
        hasDesign: false,
        templateId,
      });
    }

    let accessToken: string;
    try {
      accessToken = await getValidCanvaAccessToken();
    } catch {
      return res.status(200).json({
        hasDesign: true,
        designId: template.canvaDesignId,
        canvaLastSyncedAt: template.canvaLastSyncedAt,
        authRequired: true,
      });
    }

    const design = await getCanvaDesign(accessToken, template.canvaDesignId);

    return res.status(200).json({
      hasDesign: true,
      designId: template.canvaDesignId,
      title: design.title,
      updatedAt: design.updatedAt,
      editUrl: design.editUrl,
      canvaLastSyncedAt: template.canvaLastSyncedAt,
      authRequired: false,
    });
  } catch (error: any) {
    console.error('Error fetching Canva design status:', error);
    return res.status(500).json({
      error: 'Failed to fetch Canva design status.',
      details: error?.message,
    });
  }
}
