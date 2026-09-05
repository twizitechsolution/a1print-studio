import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  if (!keySecret) {
    return res.status(500).json({
      success: false,
      error: 'Server error: RAZORPAY_KEY_SECRET is not configured on server.',
    });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters: razorpay_order_id, razorpay_payment_id, and razorpay_signature are all required.',
      });
    }

    // Perform HMAC-SHA256 verification: HMAC-SHA256(order_id + "|" + payment_id, KEY_SECRET)
    const text = `${razorpay_order_id}|${razorpay_payment_id}`;
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(text)
      .digest('hex');

    const isValid = generated_signature === razorpay_signature;

    if (isValid) {
      return res.status(200).json({
        success: true,
        message: 'Payment signature verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      });
    } else {
      return res.status(400).json({
        success: false,
        error: 'Invalid payment signature. Verification failed.',
      });
    }
  } catch (error: any) {
    console.error('Razorpay Signature Verification Error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to verify Razorpay payment signature',
      details: error.message || error,
    });
  }
}
