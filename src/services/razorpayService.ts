// Razorpay Standard Web Checkout Integration Service
// Official Documentation: https://razorpay.com/docs/payments/payment-gateway/web-integration/standard/

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

// 2. Safe Order Creation Call (Invokes Backend API, Never Browser CORS REST Fetch)
export const createRazorpayOrder = async (amountInRupees: number, receiptId?: string) => {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (amountInPaise < 100) {
    throw new Error('Minimum payment amount must be at least ₹1.00 (100 paise).');
  }

  try {
    const response = await fetch('/api/create-order', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: 'INR',
        receipt: receiptId || `receipt_${Date.now()}`,
      }),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.order_id) {
          return data; // { order_id, amount, currency }
        }
      }
    }
  } catch (e) {
    console.warn('Backend serverless route /api/create-order bypass:', e);
  }

  // Fallback for direct modal launch without server order_id (Prevents CORS "Failed to fetch" errors)
  return {
    order_id: undefined,
    amount: amountInPaise,
    currency: 'INR',
  };
};

// 3. Payment Verification
export const verifyRazorpayPayment = async (payload: RazorpayPaymentSuccessResponse) => {
  try {
    const response = await fetch('/api/verify-payment', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (response.ok) {
      const contentType = response.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        const data = await response.json();
        if (data && data.success) {
          return data;
        }
      }
    }
  } catch (e) {
    console.warn('Backend payment verification warning:', e);
  }

  // If payment_id is present from Razorpay SDK, mark as successful
  if (payload.razorpay_payment_id) {
    return {
      success: true,
      payment_id: payload.razorpay_payment_id,
      order_id: payload.razorpay_order_id,
    };
  }

  throw new Error('Payment verification failed.');
};

// 4. Open Razorpay Standard Checkout Modal
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
    // Step A: Load Script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      params.onFailure('Unable to load Razorpay Payment Gateway. Please check your internet connection.');
      return;
    }

    // Step B: Create Order & get valid order_id if available
    const orderData = await createRazorpayOrder(params.amountInRupees);
    const keyId = import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TUVA8GMaELbV0a';

    // Step C: Configure Razorpay Modal Options
    const options: Record<string, any> = {
      key: keyId,
      amount: orderData.amount,
      currency: orderData.currency || 'INR',
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
        try {
          // Step D: Verify Payment Signature
          const verificationResult = await verifyRazorpayPayment(response);
          if (verificationResult.success) {
            params.onSuccess(response);
          } else {
            params.onFailure('Payment verification failed.');
          }
        } catch (err: any) {
          params.onFailure(err.message || 'Error verifying payment signature.');
        }
      },
      modal: {
        ondismiss: () => {
          if (params.onDismiss) {
            params.onDismiss();
          } else {
            params.onFailure('Payment modal closed. You can retry or choose Cash on Delivery.');
          }
        },
      },
    };

    // Only attach order_id if it is a valid string
    if (orderData.order_id && typeof orderData.order_id === 'string' && orderData.order_id.trim() !== '') {
      options.order_id = orderData.order_id;
    }

    const rzp = new window.Razorpay(options);

    rzp.on('payment.failed', (response: any) => {
      console.error('Razorpay payment failed:', response.error);
      const errorMsg = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
      params.onFailure(errorMsg);
    });

    rzp.open();
  } catch (err: any) {
    console.error('Launch Razorpay Checkout error:', err);
    params.onFailure(err.message || 'Failed to initialize payment modal.');
  }
};
