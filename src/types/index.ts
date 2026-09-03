import { PhotoSlotConfig, TextZoneConfig } from './template';

export * from './admin';

export interface Category {
  id: string;
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  color?: string;
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string | null;
}

export interface StockLogItem {
  id: string;
  type: 'credit' | 'debit';
  quantity: number;
  previousStock: number;
  newStock: number;
  reason: string; // e.g. "Customer Order #ORD-849201" or "Admin Manual Restock"
  timestamp: string;
  performedBy?: string;
}

export interface FrameOption {
  id: string;
  name: string;
  borderStyle: string;
  frameColor: string;
  borderColorClass: string;
}

export interface SizeOption {
  id: string;
  name: string;
  dimensions: string;
  price: number;
  originalPrice: number;
  discountPercentage: number;
}

export interface Product {
  id: string;
  productId?: string;
  slug: string;
  title: string;
  subtitle: string;
  category: string;
  categoryLabel: string;
  rating: number;
  reviewsCount: number;
  thumbnail: string;
  baseImageUrl?: string;
  images: string[];
  bestseller?: boolean;
  onSale?: boolean;
  description: string;
  features: string[];
  sizes: SizeOption[];
  frames: FrameOption[];
  photoSlots?: PhotoSlotConfig[];
  textZones?: TextZoneConfig[];
  stockQuantity?: number;
  stockLogs?: StockLogItem[];
  allowedPaymentModes?: ('Prepaid' | 'COD' | 'GoQuick50')[];
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string | null;
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: SizeOption;
  selectedFrame: FrameOption;
  uploadedPhotoUrl: string;
  customizedFramePreviewUrl?: string; // Full composite customized frame artwork URL
  customTextValues: Record<string, string>;
  selectedFontFamily?: string;
  quantity: number;
  photoScale?: number;
  photoPosition?: { x: number; y: number };
  photoRotation?: number;
  itemTotalPrice: number;
}

export interface CustomerDetails {
  fullName: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export interface ProcessingHistoryItem {
  id: string;
  employeeName: string;
  employeeRole: string;
  action: string;
  timestamp: string;
  notes?: string;
}

export interface SupportTicket {
  id: string;
  ticketNumber: string;
  orderId: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string;
  issueType: 'Frame Damaged in Transit' | 'Wrong Photo Printed' | 'Print Quality Issue' | 'Delivery Delayed' | 'Payment / Refund Query' | 'Other Issue';
  description: string;
  images: string[];
  status: 'Pending' | 'In Review' | 'Resolved' | 'Closed';
  createdAt: string;
  updatedAt?: string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string | null;
  adminReply?: string;
  adminReplyTimestamp?: string;
  repliedBy?: string;
}

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'Razorpay' | 'PhonePe' | 'GPay' | 'Paytm' | 'Card' | 'COD';
  paymentStatus: 'Paid' | 'Pending' | 'COD' | 'Refund';
  orderStatus: 'New' | 'Design' | 'Printing' | 'QC' | 'Packing' | 'Shipped' | 'Delivered' | 'Cancelled' | 'Received' | 'Reprint' | 'RTO';
  notes?: string;
  adminRemark?: string;
  adminRemarkTimestamp?: string;
  trackingNumber?: string;
  courierPartner?: string;
  processedBy?: {
    employeeName: string;
    employeeRole: string;
    timestamp: string;
    avatar?: string;
  };
  processingHistory?: ProcessingHistoryItem[];
  createdAt?: string;
  updatedAt?: string;
  version?: number;
  isDeleted?: boolean;
  deletedAt?: string | null;
  syncStatus?: 'synced' | 'pending' | 'failed';
  lastSyncedAt?: string | null;
}
