import type { VercelRequest, VercelResponse } from '@vercel/node';

// HTML Email Layout Generator for A1print Studio
function generateEmailHtml(type: string, data: any): { subject: string; html: string } {
  const brandPink = '#F82BA9';
  const brandDark = '#160E4B';
  const storeUrl = 'https://aoneprint.store';
  const whatsappUrl = 'https://wa.me/919583626786?text=Hi%20A1print%20Studio,%20I%20have%20an%20order%20inquiry';

  const baseHeader = `
    <div style="background-color: ${brandDark}; padding: 24px 20px; text-align: center; border-radius: 12px 12px 0 0;">
      <h1 style="color: #FFFFFF; font-family: 'Playfair Display', Georgia, serif; margin: 0; font-size: 26px; letter-spacing: 1px;">
        A1PRINT <span style="color: ${brandPink};">STUDIO</span>
      </h1>
      <p style="color: #E2E8F0; font-family: 'Helvetica Neue', Arial, sans-serif; font-size: 11px; margin: 6px 0 0 0; text-transform: uppercase; letter-spacing: 2px;">
        Personalized Keepsakes & Archival Framing
      </p>
    </div>
  `;

  const baseFooter = `
    <div style="background-color: #F8FAFC; padding: 20px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #E2E8F0; font-family: 'Helvetica Neue', Arial, sans-serif;">
      <p style="font-size: 12px; color: #64748B; margin: 0 0 10px 0;">
        Have questions about your order? Chat with us directly on WhatsApp:
      </p>
      <a href="${whatsappUrl}" target="_blank" style="display: inline-block; background-color: #25D366; color: #FFFFFF; font-weight: bold; font-size: 12px; text-decoration: none; padding: 8px 16px; border-radius: 8px;">
        💬 Chat on WhatsApp (+91 95836 26786)
      </a>
      <p style="font-size: 11px; color: #94A3B8; margin: 16px 0 0 0;">
        © ${new Date().getFullYear()} A1print Studio. All rights reserved.<br/>
        <a href="${storeUrl}" style="color: ${brandPink}; text-decoration: none;">Visit Website: aoneprint.store</a>
      </p>
    </div>
  `;

  if (type === 'welcome') {
    const name = data.name || data.fullName || 'Valued Customer';
    return {
      subject: `Welcome to A1print Studio, ${name}! 🎨`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
          ${baseHeader}
          <div style="padding: 30px 24px; line-height: 1.6;">
            <h2 style="color: ${brandDark}; font-size: 20px; margin: 0 0 14px 0;">Welcome to A1print Studio! 🎉</h2>
            <p style="font-size: 14px; margin: 0 0 16px 0;">
              Hello <strong>${name}</strong>,
            </p>
            <p style="font-size: 14px; margin: 0 0 16px 0;">
              Thank you for creating an account with <strong>A1print Studio</strong>. We specialize in transforming your cherished memories, baby birth milestones, birthdays, and anniversaries into archival-grade 300 GSM photo frames.
            </p>
            <div style="background-color: #FDF2F8; border-left: 4px solid ${brandPink}; padding: 14px; border-radius: 6px; margin: 20px 0;">
              <p style="margin: 0; font-size: 13px; color: #831843; font-weight: bold;">
                🎁 Ready to personalize your first frame?
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #9D174D;">
                Upload your favourite photos, enter your custom text and dates, and see a live 3D preview in real-time!
              </p>
            </div>
            <div style="text-align: center; margin: 26px 0;">
              <a href="${storeUrl}" style="background-color: ${brandPink}; color: #FFFFFF; font-weight: bold; font-size: 14px; text-decoration: none; padding: 12px 28px; border-radius: 8px; display: inline-block;">
                Explore Frame Catalog →
              </a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `,
    };
  }

  if (type === 'order_confirmation') {
    const order = data;
    const items = order.items || [];
    const customer = order.customer || {};

    const itemsHtml = items
      .map((item: any) => {
        const previewImg = item.customizedFramePreviewUrl || item.uploadedPhotoUrl || item.product?.thumbnail || '';
        return `
          <tr style="border-bottom: 1px solid #F1F5F9;">
            <td style="padding: 12px 8px; width: 64px;">
              ${
                previewImg
                  ? `<img src="${previewImg}" alt="Frame" style="width: 56px; height: 72px; object-fit: cover; border-radius: 6px; border: 1px solid #CBD5E1;" />`
                  : ''
              }
            </td>
            <td style="padding: 12px 8px; font-size: 13px;">
              <strong style="color: ${brandDark};">${item.product?.title || 'Custom Photo Frame'}</strong><br/>
              <span style="color: #64748B; font-size: 11px;">Size: ${item.selectedSize?.name || 'A4'} | Frame: ${item.selectedFrame?.name || 'Default'}</span><br/>
              <span style="color: #64748B; font-size: 11px;">Qty: ${item.quantity || 1}</span>
            </td>
            <td style="padding: 12px 8px; text-align: right; font-size: 13px; font-weight: bold; color: ${brandDark};">
              ₹${item.itemTotalPrice || (item.selectedSize?.price || 0) * (item.quantity || 1)}.00
            </td>
          </tr>
        `;
      })
      .join('');

    return {
      subject: `Order Confirmed #${order.id} - A1print Studio 🎉`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
          ${baseHeader}
          <div style="padding: 26px 20px; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: #ECFDF5; color: #059669; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px;">
                ✓ Order Confirmed & In Production
              </div>
              <h2 style="color: ${brandDark}; font-size: 20px; margin: 4px 0;">Thank You for Your Order!</h2>
              <p style="font-size: 13px; color: #64748B; margin: 0;">Order ID: <strong style="color: ${brandDark}; font-family: monospace;">#${order.id}</strong></p>
            </div>

            <p style="font-size: 13px; margin: 0 0 16px 0;">
              Hello <strong>${customer.fullName || 'Valued Customer'}</strong>, we have received your custom order and our design team has queued your customized artwork for high-definition 300 GSM archival printing.
            </p>

            <table style="width: 100%; border-collapse: collapse; margin: 16px 0;">
              <thead>
                <tr style="background-color: #F8FAFC; border-bottom: 2px solid #E2E8F0; text-align: left; font-size: 11px; text-transform: uppercase; color: #64748B;">
                  <th style="padding: 8px;">Preview</th>
                  <th style="padding: 8px;">Item Details</th>
                  <th style="padding: 8px; text-align: right;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr>
                  <td colspan="2" style="padding: 10px 8px; text-align: right; font-size: 12px; color: #64748B;">Subtotal:</td>
                  <td style="padding: 10px 8px; text-align: right; font-size: 12px; font-weight: bold;">₹${order.subtotal || order.total || 0}.00</td>
                </tr>
                <tr>
                  <td colspan="2" style="padding: 4px 8px; text-align: right; font-size: 12px; color: #64748B;">Shipping:</td>
                  <td style="padding: 4px 8px; text-align: right; font-size: 12px; color: #059669; font-weight: bold;">FREE (Pan India)</td>
                </tr>
                <tr style="border-top: 2px solid ${brandPink};">
                  <td colspan="2" style="padding: 10px 8px; text-align: right; font-size: 14px; font-weight: bold; color: ${brandDark};">Total Paid:</td>
                  <td style="padding: 10px 8px; text-align: right; font-size: 16px; font-weight: 800; color: ${brandPink};">₹${order.total || order.subtotal || 0}.00</td>
                </tr>
              </tfoot>
            </table>

            <div style="background-color: #F8FAFC; border-radius: 8px; padding: 14px; margin: 18px 0; font-size: 12px;">
              <h4 style="margin: 0 0 6px 0; color: ${brandDark}; text-transform: uppercase; font-size: 11px; letter-spacing: 0.5px;">📦 Shipping To:</h4>
              <p style="margin: 0; color: #334155; line-height: 1.4;">
                <strong>${customer.fullName || ''}</strong><br/>
                ${customer.address || ''}, ${customer.city || ''}, ${customer.state || ''} - ${customer.pincode || ''}<br/>
                Phone: ${customer.phone || ''}
              </p>
            </div>

            <div style="text-align: center; margin: 22px 0 10px 0;">
              <a href="${storeUrl}" style="background-color: ${brandDark}; color: #FFFFFF; font-weight: bold; font-size: 13px; text-decoration: none; padding: 10px 24px; border-radius: 8px; display: inline-block;">
                Track Live Order Status →
              </a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `,
    };
  }

  if (type === 'order_shipped') {
    const order = data;
    const trackingNumber = data.trackingNumber || order.trackingNumber || 'Tracking ID will update shortly';
    const courier = data.courierPartner || order.courierPartner || 'Bluedart / Delhivery Express';

    return {
      subject: `Your Order #${order.id} Has Been Shipped! 🚚 - A1print Studio`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
          ${baseHeader}
          <div style="padding: 26px 20px; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: #EFF6FF; color: #2563EB; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px;">
                🚚 Dispatched via Express Courier
              </div>
              <h2 style="color: ${brandDark}; font-size: 20px; margin: 4px 0;">Your Customized Frame is on its Way!</h2>
              <p style="font-size: 13px; color: #64748B; margin: 0;">Order ID: <strong style="color: ${brandDark}; font-family: monospace;">#${order.id}</strong></p>
            </div>

            <p style="font-size: 13px; margin: 0 0 16px 0;">
              Hello <strong>${order.customer?.fullName || 'Valued Customer'}</strong>, your personalized photo frame has passed quality inspection and has been dispatched!
            </p>

            <div style="background-color: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 8px; padding: 16px; margin: 16px 0; font-size: 13px;">
              <table style="width: 100%;">
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Courier Partner:</td>
                  <td style="font-weight: bold; color: ${brandDark}; padding: 4px 0; text-align: right;">${courier}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Tracking Number / AWB:</td>
                  <td style="font-weight: bold; font-family: monospace; color: ${brandPink}; padding: 4px 0; text-align: right;">${trackingNumber}</td>
                </tr>
                <tr>
                  <td style="color: #64748B; padding: 4px 0;">Estimated Delivery:</td>
                  <td style="font-weight: bold; color: #059669; padding: 4px 0; text-align: right;">2 - 4 Business Days</td>
                </tr>
              </table>
            </div>

            <div style="text-align: center; margin: 24px 0 10px 0;">
              <a href="${storeUrl}" style="background-color: ${brandPink}; color: #FFFFFF; font-weight: bold; font-size: 13px; text-decoration: none; padding: 11px 26px; border-radius: 8px; display: inline-block;">
                Check Live Tracking →
              </a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `,
    };
  }

  if (type === 'order_delivered') {
    const order = data;
    return {
      subject: `Your Order #${order.id} Has Been Delivered! 📦 - A1print Studio`,
      html: `
        <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Arial, sans-serif; color: #1E293B;">
          ${baseHeader}
          <div style="padding: 26px 20px; line-height: 1.6;">
            <div style="text-align: center; margin-bottom: 20px;">
              <div style="display: inline-block; background-color: #ECFDF5; color: #059669; font-weight: bold; font-size: 12px; padding: 4px 12px; border-radius: 20px; margin-bottom: 8px;">
                🎉 Successfully Delivered
              </div>
              <h2 style="color: ${brandDark}; font-size: 20px; margin: 4px 0;">Package Delivered!</h2>
              <p style="font-size: 13px; color: #64748B; margin: 0;">Order ID: <strong style="color: ${brandDark}; font-family: monospace;">#${order.id}</strong></p>
            </div>

            <p style="font-size: 13px; margin: 0 0 16px 0;">
              Hello <strong>${order.customer?.fullName || 'Valued Customer'}</strong>, our courier partner indicates that your custom photo frame order has been safely delivered!
            </p>

            <div style="background-color: #FFFBEB; border-left: 4px solid #F59E0B; padding: 14px; border-radius: 6px; margin: 18px 0;">
              <p style="margin: 0; font-size: 13px; color: #92400E; font-weight: bold;">
                ❤️ How do you love your customized frame?
              </p>
              <p style="margin: 6px 0 0 0; font-size: 12px; color: #B45309;">
                Snap a picture of your frame hanging on your wall and tag us or share it on WhatsApp! If there are any concerns or transit damages, our team is always here to help you immediately.
              </p>
            </div>

            <div style="text-align: center; margin: 24px 0 10px 0;">
              <a href="${whatsappUrl}" style="background-color: #25D366; color: #FFFFFF; font-weight: bold; font-size: 13px; text-decoration: none; padding: 11px 26px; border-radius: 8px; display: inline-block;">
                Share Feedback on WhatsApp →
              </a>
            </div>
          </div>
          ${baseFooter}
        </div>
      `,
    };
  }

  // Fallback template
  return {
    subject: `Notification from A1print Studio`,
    html: `
      <div style="max-width: 600px; margin: 0 auto; background: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; font-family: 'Helvetica Neue', Arial, sans-serif;">
        ${baseHeader}
        <div style="padding: 24px; font-size: 14px;">
          <p>Hello, you have a new notification regarding your A1print Studio account.</p>
        </div>
        ${baseFooter}
      </div>
    `,
  };
}

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
    const { type, to, data } = body;

    if (!to || !to.includes('@')) {
      return res.status(400).json({ error: 'A valid recipient email address ("to") is required.' });
    }

    const { subject, html } = generateEmailHtml(type, data);

    const resendApiKey = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
    const brevoApiKey = process.env.BREVO_API_KEY || process.env.VITE_BREVO_API_KEY;

    // 1. Try Resend API if configured
    if (resendApiKey) {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${resendApiKey.trim()}`,
          },
          body: JSON.stringify({
            from: process.env.EMAIL_FROM || 'A1print Studio <onboarding@resend.dev>',
            to: [to],
            subject,
            html,
          }),
        });

        const resData = await response.json();
        if (response.ok) {
          return res.status(200).json({ success: true, provider: 'resend', id: resData.id });
        } else {
          console.warn('Resend API response error:', resData);
        }
      } catch (err) {
        console.warn('Resend API fetch failed:', err);
      }
    }

    // 2. Try Brevo API if configured
    if (brevoApiKey) {
      try {
        const response = await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'api-key': brevoApiKey.trim(),
          },
          body: JSON.stringify({
            sender: { name: 'A1print Studio', email: process.env.EMAIL_FROM || 'support@aoneprint.store' },
            to: [{ email: to }],
            subject,
            htmlContent: html,
          }),
        });

        const resData = await response.json();
        if (response.ok) {
          return res.status(200).json({ success: true, provider: 'brevo', messageId: resData.messageId });
        } else {
          console.warn('Brevo API response error:', resData);
        }
      } catch (err) {
        console.warn('Brevo API fetch failed:', err);
      }
    }

    // 3. Graceful Fallback / Demo Mode:
    // If no external email API key is provided, log to console and return success
    console.log(`[A1print Studio Email] DEMO/LOGGED MODE:
Type: ${type}
To: ${to}
Subject: ${subject}
Order ID: ${data?.id || 'N/A'}`);

    return res.status(200).json({
      success: true,
      provider: 'logged_demo',
      message: 'Email processed in logged demo mode. To deliver real inbox emails, add RESEND_API_KEY in Vercel Environment Variables.',
    });
  } catch (error: any) {
    console.error('send-email endpoint error:', error);
    return res.status(500).json({ error: error?.message || 'Internal server error while sending email.' });
  }
}
