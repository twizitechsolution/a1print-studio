// Types for Admin Panel System Modules

export interface Coupon {
  id: string;
  code: string;
  type: 'flat' | 'percentage' | 'free_shipping';
  discountValue: number;
  minOrderValue: number;
  maxDiscountAmount?: number;
  usageLimit: number;
  usageLimitPerUser?: 1 | 2 | 3 | 4 | 5 | 'Unlimited';
  usedPerUser?: Record<string, number>;
  timesUsed: number;
  validFrom: string;
  validUntil: string;
  active: boolean;
}

export interface ShippingRule {
  id: string;
  regionType: 'pincode' | 'city' | 'state' | 'pan_india';
  regionName: string;
  shippingCharge: number;
  freeShippingThreshold: number;
  estimatedDays: string;
  courierPartner: string;
  active: boolean;
}

export interface PaymentSetting {
  id: string;
  name: string;
  provider: 'razorpay' | 'upi' | 'cod' | 'paytm';
  enabled: boolean;
  extraFee: number; // COD extra charge e.g. 50
  description: string;
}

export interface CustomFieldConfig {
  id: string;
  label: string;
  fieldType: 'text' | 'textarea' | 'date' | 'photo' | 'dropdown' | 'boolean';
  required: boolean;
  placeholder?: string;
  defaultValue?: string;
  displayOrder: number;
  options?: string[]; // for dropdown fields
}

export interface CMSBanner {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  ctaLink: string;
  ctaText: string;
  active: boolean;
}

export interface CMSFAQ {
  id: string;
  question: string;
  answer: string;
  category: 'orders' | 'shipping' | 'customization' | 'payments';
  displayOrder: number;
}

export interface AdminUser {
  id: string;
  name: string;
  username: string; // Login ID
  password?: string; // Account password
  email: string;
  role: 'Super Admin' | 'Production Manager' | 'Customer Support' | 'Content Editor';
  allowedTabs: string[]; // List of permitted menu tab IDs
  active: boolean;
  lastLogin: string;
  phone: string;
}

export interface ActivityLog {
  id: string;
  userName: string;
  action: string;
  timestamp: string;
  ipAddress: string;
}

export interface WatermarkSetting {
  enabled: boolean;
  text: string;
  opacity: number;
  position: 'center' | 'bottom_right' | 'top_left';
}
