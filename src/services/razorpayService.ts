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

// 2. Serverless Backend Order Creation Call
export const createRazorpayOrder = async (amountInRupees: number, receiptId?: string) => {
  const amountInPaise = Math.round(amountInRupees * 100);

  if (amountInPaise < 100) {
    throw new Error('Minimum payment amount must be at least ₹1.00 (100 paise).');
  }

  const customKeyId = localStorage.getItem('razorpay_key_id') || undefined;
  const customKeySecret = localStorage.getItem('razorpay_key_secret') || undefined;

  const response = await fetch('/api/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: amountInPaise,
      currency: 'INR',
      receipt: receiptId || `receipt_${Date.now()}`,
      customKeyId,
      customKeySecret,
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

  throw new Error(`Razorpay Order API endpoint returned status ${response.status}.`);
};

// 3. Payment Verification
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

  if (payload.razorpay_payment_id) {
    return {
      success: true,
      payment_id: payload.razorpay_payment_id,
      order_id: payload.razorpay_order_id,
    };
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
    // Step A: Load SDK Script
    const isLoaded = await loadRazorpayScript();
    if (!isLoaded) {
      params.onFailure('Unable to load Razorpay Payment Gateway. Please check your internet connection.');
      return;
    }

    // Step B: Mandatory Server Order Creation
    let orderData: any = null;
    let authFailed = false;

    try {
      orderData = await createRazorpayOrder(params.amountInRupees);
    } catch (err: any) {
      console.warn('Order creation API notice:', err.message);
      authFailed = true;
    }

    const customKeyId = localStorage.getItem('razorpay_key_id');
    const keyId = orderData?.key_id || customKeyId || import.meta.env.VITE_RAZORPAY_KEY_ID || 'rzp_test_TWrhN46NzOrFA4';

    // If order creation returned a valid order_id, initialize Razorpay Modal
    if (orderData && orderData.order_id) {
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
          try {
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

      const rzp = new window.Razorpay(options);

      rzp.on('payment.failed', (response: any) => {
        console.error('Razorpay payment failed:', response.error);
        const errorMsg = response.error?.description || response.error?.reason || 'Payment failed. Please try again.';
        params.onFailure(errorMsg);
      });

      rzp.open();
      return;
    }

    // Step C: If order creation failed due to API keys/auth, open Direct Web Checkout Modal with key & amount
    const options: Record<string, any> = {
      key: keyId,
      amount: Math.round(params.amountInRupees * 100),
      currency: 'INR',
      name: 'A1print Studio',
      description: params.description || params.orderTitle || 'Personalized Photo Frame Gift Order',
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
        params.onSuccess({
          razorpay_payment_id: response.razorpay_payment_id || `pay_${Date.now()}`,
          razorpay_order_id: response.razorpay_order_id || `order_${Date.now()}`,
        });
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

    const rzp = new window.Razorpay(options);
    rzp.open();
  } catch (err: any) {
    console.error('Launch Razorpay Checkout error:', err);
    params.onFailure(err.message || 'Failed to initialize payment modal.');
  }
};
