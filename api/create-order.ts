import type { VercelRequest, VercelResponse } from '@vercel/node';

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

  const keyId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUVA8GMaELbV0a';
  const keySecret = process.env.RAZORPAY_KEY_SECRET || 'fjrS6b6Nn8AQMs1AbQ5OM1YQ';

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { amount, currency = 'INR', receipt } = body;

    const amountInPaise = Number(amount);
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be a valid number and at least 100 paise (₹1.00).' });
    }

    // Direct HTTP Request to Official Razorpay REST API with Basic Auth
    const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
    
    const razorpayRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authHeader,
      },
      body: JSON.stringify({
        amount: Math.round(amountInPaise),
        currency: currency || 'INR',
        receipt: receipt || `receipt_${Date.now()}`,
      }),
    });

    const data = await razorpayRes.json();

    if (!razorpayRes.ok) {
      console.error('Razorpay API error response:', data);
      return res.status(razorpayRes.status).json({
        error: data.error?.description || 'Razorpay order creation failed',
        details: data,
      });
    }

    return res.status(200).json({
      order_id: data.id,
      amount: data.amount,
      currency: data.currency,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Serverless Error:', error);
    return res.status(500).json({
      error: 'Failed to create Razorpay order',
      details: error.message || error,
    });
  }
}
