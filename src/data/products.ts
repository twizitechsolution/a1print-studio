import { Product } from '../types';

// Hardcoded initial products array is set to empty ([]) so that client-uploaded frames in Firebase Cloud Firestore
// are 100% authoritative and NEVER overwritten or re-seeded by codebase updates or server pushes!
export const PRODUCTS: Product[] = [];

