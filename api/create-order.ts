import type { VercelRequest, VercelResponse } from '@vercel/node';
import RazorpayPkg from 'razorpay';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Set CORS Headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed. Use POST.' });
  }

  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const { amount, currency = 'INR', receipt, customKeyId, customKeySecret } = body;

    const keyId = customKeyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TWrhN46NzOrFA4';
    const keySecret = customKeySecret || process.env.RAZORPAY_KEY_SECRET || '1OoKv4t5vKRYfYGRRqCpv9H0';

    if (!keyId || !keySecret) {
      return res.status(401).json({ error: 'Razorpay API credentials missing. Please check server environment variables.' });
    }

    const amountInPaise = Number(amount);
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be a valid number and at least 100 paise (₹1.00).' });
    }

    let orderId: string | null = null;
    let orderAmount: number = Math.round(amountInPaise);
    let orderCurrency: string = currency || 'INR';

    // Approach 1: Try Razorpay Node SDK (ESM-safe import)
    try {
      const RazorpayClass = (RazorpayPkg as any).default || RazorpayPkg;
      const razorpay = new RazorpayClass({
        key_id: keyId,
        key_secret: keySecret,
      });

      const order = await razorpay.orders.create({
        amount: orderAmount,
        currency: orderCurrency,
        receipt: receipt || `receipt_${Date.now()}`,
      });

      if (order && order.id) {
        orderId = order.id;
      }
    } catch (sdkError: any) {
      console.warn('Razorpay SDK order creation failed, executing direct REST API fallback:', sdkError?.message || sdkError);
      if (sdkError?.statusCode === 401 || sdkError?.error?.code === 'BAD_REQUEST_ERROR') {
        // Continue to REST fallback
      }
    }

    // Approach 2: Direct REST API Fallback with Basic Auth if SDK failed
    if (!orderId) {
      const authHeader = 'Basic ' + Buffer.from(`${keyId}:${keySecret}`).toString('base64');
      const apiRes = await fetch('https://api.razorpay.com/v1/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          amount: orderAmount,
          currency: orderCurrency,
          receipt: receipt || `receipt_${Date.now()}`,
        }),
      });

      const apiData = await apiRes.json();
      if (apiRes.ok && apiData && apiData.id) {
        orderId = apiData.id;
      } else {
        console.error('Razorpay Direct REST API Error response:', apiData);
        const statusCode = apiRes.status === 401 ? 401 : 500;
        return res.status(statusCode).json({
          error: apiData?.error?.description || 'Failed to create order on Razorpay API.',
          details: apiData,
        });
      }
    }

    return res.status(200).json({
      order_id: orderId,
      amount: orderAmount,
      currency: orderCurrency,
      key_id: keyId,
    });
  } catch (error: any) {
    console.error('Razorpay Create Order Serverless Function Error:', error);
    return res.status(500).json({
      error: error?.error?.description || error?.message || 'Failed to create Razorpay order on server.',
    });
  }
}
