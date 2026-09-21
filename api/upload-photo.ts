import type { VercelRequest, VercelResponse } from '@vercel/node';

const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME || 'dcnnn0ogm';
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || process.env.CLOUDINARY_UPLOAD_PRESET || 'a1print_products';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '20mb',
    },
  },
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS configuration
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
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { image, folder = 'a1print/customer_uploads', filename } = body;

    if (!image || typeof image !== 'string') {
      return res.status(400).json({ error: 'Missing required field: image (Base64 data URI or image URL).' });
    }

    // Validation: Only allow image data URIs or valid http(s) image URLs
    const isDataUri = image.startsWith('data:image/');
    const isHttpUrl = image.startsWith('http://') || image.startsWith('https://');

    if (!isDataUri && !isHttpUrl) {
      return res.status(400).json({ error: 'Invalid image format. Must be an image Data URI (jpeg, png, webp) or HTTP(S) URL.' });
    }

    if (isDataUri) {
      const match = image.match(/^data:image\/(jpeg|jpg|png|webp);base64,/i);
      if (!match) {
        return res.status(400).json({ error: 'Unsupported image type. Only JPEG, PNG, and WebP are allowed.' });
      }

      // Check size (Base64 length ~ 1.37x binary size; 15MB binary ~ 20.5MB base64)
      const approxBytes = Math.round((image.length * 3) / 4);
      if (approxBytes > 15 * 1024 * 1024) {
        return res.status(400).json({ error: 'Image exceeds maximum allowed size of 15MB.' });
      }
    }

    // Prepare Cloudinary FormData payload
    const formData = new URLSearchParams();
    formData.append('file', image);
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('folder', folder);
    if (filename) {
      formData.append('public_id', filename.replace(/\.[^/.]+$/, ''));
    }

    const cloudinaryEndpoint = `https://api.cloudinary.com/v1_1/${encodeURIComponent(CLOUDINARY_CLOUD_NAME)}/image/upload`;
    const response = await fetch(cloudinaryEndpoint, {
      method: 'POST',
      body: formData,
    });

    const data = await response.json();

    if (!response.ok || data.error) {
      console.error('Cloudinary serverless upload error:', data);
      return res.status(response.status || 500).json({
        error: data.error?.message || 'Failed to upload photo to Cloudinary.',
      });
    }

    return res.status(200).json({
      url: data.secure_url || data.url,
      secure_url: data.secure_url,
      public_id: data.public_id,
      width: data.width,
      height: data.height,
      format: data.format,
    });
  } catch (error: any) {
    console.error('API /upload-photo error:', error);
    return res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
