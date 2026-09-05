import { firebaseCloudDb } from '../config/firebase';

declare global {
  interface Window {
    Razorpay: any;
  }
}

export interface RazorpayPaymentSuccessResponse {
  razorpay_payment_id: string;
  razorpay_order_id?: string;
  razorpay_signature?: string;
}

export interface CustomerCheckoutDetails {
  name: string;
  email: string;
  phone: string;
  address?: string;
}

// Dynamic Live Razorpay Key Resolver from Environment or Database
export const getLiveRazorpayKeyId = async (): Promise<string> => {
  const localKey = localStorage.getItem('razorpay_key_id');
  if (localKey && localKey.trim().length > 5) {
    return localKey.trim();
  }

  try {
    const docs = await firebaseCloudDb.getCollection('store_settings');
    const gatewayDoc = docs?.find((d) => d.id === 'payment_gateway');
    if (gatewayDoc && gatewayDoc.razorpay_key_id) {
      const liveKey = gatewayDoc.razorpay_key_id.trim();
      localStorage.setItem('razorpay_key_id', liveKey);
      return liveKey;
    }
  } catch (e) {}

  return import.meta.env.VITE_RAZORPAY_KEY_ID || '';
};

// 1. Dynamic Script Loader for Official Razorpay Checkout Script
export const loadRazorpayScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (window.Razorpay) {
      return resolve(true);
    }

    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => {
      console.error('Failed to load Razorpay Checkout SDK script.');
      resolve(false);
    };
    document.body.appendChild(script);
  });
};

// 2. Serverless Backend Order Creation Call: POST /api/create-order
export const createRazorpayOrder = async (amountInRupees: number, receiptId?: string) => {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (amountInPaise < 100) {
    throw new Error('Minimum payment amount must be at least ₹1.00 (100 paise).');
  }

  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId || `rcpt_${Date.now()}`,
    }),
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (response.ok && data && data.order_id) {
      return data; // { order_id, amount, currency, key_id }
    }
    if (data && data.error) {
      throw new Error(data.error);
    }
  }

  throw new Error(`Razorpay Order creation failed (HTTP ${response.status}). Please check API credentials.`);
};

// 3. Backend Payment Signature Verification Call: POST /api/verify-payment
export const verifyRazorpayPayment = async (payload: RazorpayPaymentSuccessResponse) => {
  const response = await fetch('/api/verify-payment', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await response.json();
    if (response.ok && data && data.success) {
      return data;
    }
    if (data && data.error) {
      throw new Error(data.error);
    }
  }

  throw new Error('Payment signature verification failed.');
};

// 4. Razorpay Standard Web Checkout Launcher
export const launchRazorpayCheckout = async (params: {
  amountInRupees: number;
  orderTitle?: string;
  description?: string;
  customer: CustomerCheckoutDetails;
  onSuccess: (response: RazorpayPaymentSuccessResponse) => void;
  onFailure: (errorMsg: string) => void;
  onDismiss?: () => void;
}) => {
  try {
    // Step A: Ensure Razorpay SDK Script is loaded
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded || !window.Razorpay) {
      params.onFailure('Unable to load Razorpay Payment Gateway. Please check your internet connection.');
      return;
    }

    // Step B: Call backend /api/create-order to create order on Razorpay
    let orderData: any;
    try {
      orderData = await createRazorpayOrder(params.amountInRupees);
    } catch (err: any) {
      console.error('Order creation error:', err);
      params.onFailure(err.message || 'Failed to initialize payment with server.');
      return;
    }

    const liveKey = await getLiveRazorpayKeyId();
    const keyId = orderData.key_id || liveKey;

    if (!keyId) {
      params.onFailure('Razorpay Key ID is not configured.');
      return;
    }

    let isCompleted = false;

    // Step C: Open Razorpay Modal with order_id
    const options = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
      order_id: orderData.order_id,
      name: 'A1print Studio',
      description: params.description || params.orderTitle || 'Personalized Photo Frame Gift Order',
      image: 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=200&q=80',
      prefill: {
        name: params.customer.name,
        email: params.customer.email,
        contact: params.customer.phone,
      },
      notes: {
        address: params.customer.address || '',
      },
      theme: {
        color: '#F82BA9',
      },
      handler: async (response: RazorpayPaymentSuccessResponse) => {
        isCompleted = true;
        try {
          // Step D: Send payment_id, order_id, signature to /api/verify-payment
          const verificationResult = await verifyRazorpayPayment(response);
          if (verificationResult && verificationResult.success) {
            params.onSuccess(response);
          } else {
            params.onFailure('Payment signature verification failed. Payment was not recorded as paid.');
          }
        } catch (verifyErr: any) {
          console.error('Payment verification failed:', verifyErr);
          params.onFailure(verifyErr.message || 'Payment signature verification failed.');
        }
      },
      modal: {
        ondismiss: () => {
          if (isCompleted) return;
          if (params.onDismiss) {
            params.onDismiss();
          } else {
            params.onFailure('Payment cancelled. You can retry or choose Cash on Delivery.');
          }
        },
      },
    };

    const rzp = new window.Razorpay(options);

    // Handle payment.failed event
    rzp.on('payment.failed', (failResponse: any) => {
      if (isCompleted) return;
      console.error('Razorpay payment failed:', failResponse.error);
      const errorMsg = failResponse.error?.description || failResponse.error?.reason || 'Payment failed. Please try again.';
      params.onFailure(errorMsg);
    });

    rzp.open();
  } catch (err: any) {
    console.error('Launch Razorpay Checkout error:', err);
    params.onFailure(err.message || 'Failed to initialize payment modal.');
  }
};
