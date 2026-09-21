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
    const {
      amount,
      currency = 'INR',
      receipt,
      customKeyId,
      customKeySecret,
      notes = {},
      items = [],
      customer,
    } = body;

    const keyId = customKeyId || process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || 'rzp_live_TYixCQSVrMZ1et';
    const keySecret = customKeySecret || process.env.RAZORPAY_KEY_SECRET || 'FrL6S0QU2AqHddY2NHCiV706';

    if (!keyId || !keySecret) {
      return res.status(401).json({ error: 'Razorpay API credentials missing. Please configure RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
    }

    const amountInPaise = Number(amount);
    if (!amountInPaise || isNaN(amountInPaise) || amountInPaise < 100) {
      return res.status(400).json({ error: 'Amount must be a valid number and at least 100 paise (₹1.00).' });
    }

    let orderId: string | null = null;
    let orderAmount: number = Math.round(amountInPaise);
    let orderCurrency: string = currency || 'INR';

    // Prepare Razorpay notes (maximum 15 key-value pairs, string values up to 500 chars)
    const orderNotes: Record<string, string> = { ...notes };
    if (customer?.fullName) orderNotes.customer_name = String(customer.fullName).slice(0, 100);
    if (customer?.phone) orderNotes.customer_phone = String(customer.phone).slice(0, 20);
    if (Array.isArray(items) && items.length > 0) {
      orderNotes.items_count = String(items.length);
      const firstItem = items[0];
      if (firstItem?.customizedFramePreviewUrl) {
        orderNotes.preview_url = String(firstItem.customizedFramePreviewUrl).slice(0, 200);
      }
      if (firstItem?.customPhotoValues) {
        orderNotes.photos_count = String(Object.keys(firstItem.customPhotoValues).length);
      }
    }

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
        notes: orderNotes,
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
          notes: orderNotes,
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
