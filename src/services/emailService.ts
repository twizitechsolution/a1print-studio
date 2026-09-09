import { Order } from '../types';

interface EmailPayload {
  type: 'welcome' | 'order_confirmation' | 'order_shipped' | 'order_delivered';
  to: string;
  data: any;
}

/**
 * Dispatch an email notification request to the serverless /api/send-email endpoint.
 * Fails silently with a warning so customer flow is never blocked.
 */
export async function dispatchEmail(payload: EmailPayload): Promise<{ success: boolean; message?: string }> {
  if (!payload.to || !payload.to.includes('@')) {
    return { success: false, message: 'Invalid recipient email' };
  }

  try {
    const res = await fetch('/api/send-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) {
      console.warn('Email dispatch server warning:', data);
      return { success: false, message: data.error };
    }

    return { success: true, message: data.message };
  } catch (error) {
    console.warn('Email dispatch network error (handled gracefully):', error);
    return { success: false, message: 'Network error while dispatching email' };
  }
}

/**
 * 1. Send Welcome Email upon customer account registration
 */
export async function sendWelcomeEmail(user: { fullName?: string; name?: string; email: string }): Promise<void> {
  if (!user?.email) return;
  await dispatchEmail({
    type: 'welcome',
    to: user.email,
    data: {
      name: user.fullName || user.name || 'Valued Customer',
      email: user.email,
    },
  });
}

/**
 * 2. Send Order Confirmation Email immediately after order creation/payment
 */
export async function sendOrderConfirmationEmail(order: Order): Promise<void> {
  const email = order?.customer?.email;
  if (!email) return;

  await dispatchEmail({
    type: 'order_confirmation',
    to: email,
    data: order,
  });
}

/**
 * 3. Send Order Shipped Email with courier & tracking details
 */
export async function sendOrderShippedEmail(
  order: Order,
  trackingNumber?: string,
  courierPartner?: string
): Promise<void> {
  const email = order?.customer?.email;
  if (!email) return;

  await dispatchEmail({
    type: 'order_shipped',
    to: email,
    data: {
      ...order,
      trackingNumber: trackingNumber || order.trackingNumber || 'Tracking details will update in 24h',
      courierPartner: courierPartner || order.courierPartner || 'Express Courier Partner',
    },
  });
}

/**
 * 4. Send Order Delivered Email
 */
export async function sendOrderDeliveredEmail(order: Order): Promise<void> {
  const email = order?.customer?.email;
  if (!email) return;

  await dispatchEmail({
    type: 'order_delivered',
    to: email,
    data: order,
  });
}
