import { PhotoSlotConfig, TextZoneConfig } from './template';

export * from './admin';

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
}

export interface CartItem {
  id: string;
  product: Product;
  selectedSize: SizeOption;
  selectedFrame: FrameOption;
  uploadedPhotoUrl: string;
  customizedFramePreviewUrl?: string; // Full composite customized frame artwork URL
  customTextValues: Record<string, string>;
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

export interface Order {
  id: string;
  customer: CustomerDetails;
  items: CartItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  paymentMethod: 'PhonePe' | 'GPay' | 'Paytm' | 'Card' | 'COD';
  paymentStatus: 'Paid' | 'Pending' | 'COD';
  orderStatus: 'Received' | 'Printing' | 'Shipped' | 'Delivered' | 'Cancelled';
  createdAt: string;
  notes?: string;
  processedBy?: {
    employeeName: string;
    employeeRole: string;
    timestamp: string;
    avatar?: string;
  };
  processingHistory?: ProcessingHistoryItem[];
}
