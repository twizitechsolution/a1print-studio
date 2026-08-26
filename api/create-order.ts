import type { VercelRequest, VercelResponse } from '@vercel/node';
import Razorpay from 'razorpay';

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

  const keyId = process.env.RAZORPAY_KEY_ID || 'rzp_test_TUVA8GMaELbV0a';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'fjrS6b6Nn8AQMs1AbQ5OM1YQ';

  if (!keyId || !keySecret) {
    return res.status(401).json({ error: 'Razorpay API credentials not configured on server.' });
  }

  try {
    const { amount, currency = 'INR', receipt } = req.body || {};

    // Validate amount >= 100 paise (1 INR)
    const amountInPaise = Number(amount);
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be a valid number and at least 100 paise (₹1.00).' });
    }

    const razorpay = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: Math.round(amountInPaise),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const order = await razorpay.orders.create(options);

    return res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Error:', error);
    return res.status(500).json({
      error: 'Failed to create Razorpay order',
      details: error.message || error,
    });
  }
}
