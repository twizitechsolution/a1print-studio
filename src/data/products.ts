import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'prod-welcome-baby',
    slug: 'welcome-baby-customizable-birth-frame',
    title: 'Welcome Little One – Personalized Baby Birth Details Frame',
    subtitle: 'Preserve your newborn\'s birth details in a personalized keepsake frame',
    category: 'baby',
    categoryLabel: 'Baby Birth Frame',
    rating: 4.9,
    reviewsCount: 11,
    thumbnail: 'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp',
    images: [
      'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp',
    ],
    bestseller: true,
    onSale: true,
    description: 'Celebrate the arrival of your little one with our premium Welcome Baby Birth Detail Photo Frame. Handcrafted with high-quality archival paper, customizable date of birth, time, height, weight, blood group, hospital name, and circular baby & parents photo cutouts.',
    features: [
      '300 GSM Archival Premium Matte Paper',
      'High-grade unbreakable acrylic glass overlay',
      'Solid synthetic black wood frame molding',
      'Includes wall hanging mount & tabletop stand',
      '100% Damage-proof bubble wrapper packaging',
    ],
    photoSlots: [
      { id: 'babyPhoto', label: 'Baby Picture', shape: 'circle', x: 50, y: 28, width: 36, height: 26 },
      { id: 'parentsPhoto', label: 'Parents Picture', shape: 'circle', x: 50, y: 82, width: 28, height: 20 },
    ],
    textZones: [
      { id: 'babyName', label: 'Baby Name', defaultValue: 'Arya Sharma', x: 50, y: 50, color: '#0369A1', fontFamily: 'Jost', fontSize: 20, align: 'center' },
      { id: 'birthDateDay', label: 'Date of Birth', defaultValue: '31 Jan 2025', x: 22, y: 35, color: '#334155', fontFamily: 'Jost', fontSize: 11, align: 'center' },
      { id: 'birthTime', label: 'Birth Time', defaultValue: '11:00 AM', x: 78, y: 35, color: '#334155', fontFamily: 'Jost', fontSize: 11, align: 'center' },
      { id: 'bloodGroup', label: 'Blood Group', defaultValue: 'A+', x: 22, y: 55, color: '#DC2626', fontFamily: 'Jost', fontSize: 12, align: 'center' },
      { id: 'height', label: 'Height (Cm)', defaultValue: '49 Cm', x: 78, y: 55, color: '#0369A1', fontFamily: 'Jost', fontSize: 11, align: 'center' },
      { id: 'weight', label: 'Weight (Kg)', defaultValue: '3.5 Kg', x: 22, y: 73, color: '#0369A1', fontFamily: 'Jost', fontSize: 11, align: 'center' },
      { id: 'hospitalName', label: 'Hospital Name', defaultValue: 'Duya Hospital', x: 50, y: 63, color: '#334155', fontFamily: 'Jost', fontSize: 11, align: 'center' },
      { id: 'parentsName', label: 'Parents Name', defaultValue: 'Nikhil & Nikita', x: 50, y: 94, color: '#DC2626', fontFamily: 'Jost', fontSize: 11, align: 'center' },
    ],
    sizes: [
      { id: 'size-a4', name: 'A4 (8x12 Inch)', dimensions: '8 x 12 inches', price: 699, originalPrice: 999, discountPercentage: 30 },
      { id: 'size-a3', name: 'A3 (12x18 Inch)', dimensions: '12 x 18 inches', price: 999, originalPrice: 1499, discountPercentage: 33 },
    ],
    frames: [
      { id: 'frame-black', name: 'Classic Black Wood', borderStyle: 'border-8 border-black shadow-2xl', frameColor: '#000000', borderColorClass: 'border-black' },
    ],
  },
  {
    id: 'prod-brother-sister',
    slug: 'personalized-brother-sister-photo-frame',
    title: 'Personalized Brother Sister Photo Collage Frame with Multiple Pictures',
    subtitle: 'Celebrate the special bond of siblings with a personalized photo story',
    category: 'birthday',
    categoryLabel: 'Birthday Gifts',
    rating: 5.0,
    reviewsCount: 24,
    thumbnail: 'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    images: [
      'https://lovecraftbyse.com/wp-content/uploads/2026/03/custom-birthday-collage-photo-frame-personalized-name-date-1.jpg',
    ],
    bestseller: true,
    onSale: true,
    description: 'A beautiful sibling photo collage frame. Custom names, date, and multiple photo cutouts printed on archival matte paper.',
    features: [
      'Archival 300 GSM Matte Paper',
      'Unbreakable acrylic glass overlay',
      'Synthetic black wood frame',
    ],
    photoSlots: [
      { id: 'photo-1', label: 'Top Left Photo', shape: 'rounded', x: 28, y: 35, width: 34, height: 25 },
      { id: 'photo-2', label: 'Top Right Photo', shape: 'rounded', x: 72, y: 35, width: 34, height: 25 },
      { id: 'photo-3', label: 'Bottom Photo', shape: 'rounded', x: 50, y: 72, width: 78, height: 32 },
    ],
    textZones: [
      { id: 'headerTitle', label: 'Header Title', defaultValue: 'Brother Sister Forever', x: 50, y: 12, color: '#160E4B', fontFamily: 'Playfair Display', fontSize: 18, align: 'center' },
      { id: 'siblingNames', label: 'Sibling Names', defaultValue: 'Raju & Pujarini', x: 50, y: 53, color: '#F82BA9', fontFamily: 'Jost', fontSize: 16, align: 'center' },
      { id: 'subMessage', label: 'Sub Message', defaultValue: 'Best Friends For Life', x: 50, y: 92, color: '#3C187B', fontFamily: 'Jost', fontSize: 12, align: 'center' },
    ],
    sizes: [
      { id: 'size-a4', name: 'A4 (8x12 Inch)', dimensions: '8 x 12 inches', price: 699, originalPrice: 999, discountPercentage: 30 },
      { id: 'size-a3', name: 'A3 (12x18 Inch)', dimensions: '12 x 18 inches', price: 999, originalPrice: 1499, discountPercentage: 33 },
    ],
    frames: [
      { id: 'frame-black', name: 'Classic Black Wood', borderStyle: 'border-8 border-black shadow-2xl', frameColor: '#000000', borderColorClass: 'border-black' },
    ],
  },
  {
    id: 'prod-dad-heartbeat',
    slug: 'personalized-dad-heartbeat-photo-collage-frame',
    title: 'Personalized Dad Heartbeat Photo Collage Frame – Custom Gift for Father',
    subtitle: 'Express your gratitude with a personalized heartbeat photo collage',
    category: 'family',
    categoryLabel: 'Family Frame',
    rating: 4.9,
    reviewsCount: 38,
    thumbnail: 'https://lovecraftbyse.com/wp-content/uploads/2026/02/personalized-dad-heartbeat-frame-multiple-photos.webp-scaled.webp',
    images: [
      'https://lovecraftbyse.com/wp-content/uploads/2026/02/personalized-dad-heartbeat-frame-multiple-photos.webp-scaled.webp',
    ],
    bestseller: true,
    onSale: true,
    description: 'A sentimental heartbeat photo collage dedicated to Dad. Custom text, date, and multiple photo cutouts printed with museum-grade fade-proof inks.',
    features: [
      'Museum-grade fade-proof inks',
      'Acrylic glass overlay protection',
      'Solid black wood frame',
    ],
    photoSlots: [
      { id: 'photo-1', label: 'Left Photo', shape: 'rounded', x: 26, y: 40, width: 36, height: 35 },
      { id: 'photo-2', label: 'Right Photo', shape: 'rounded', x: 74, y: 40, width: 36, height: 35 },
      { id: 'photo-3', label: 'Bottom Center Photo', shape: 'rounded', x: 50, y: 78, width: 60, height: 28 },
    ],
    textZones: [
      { id: 'dadTitle', label: 'Dad Title', defaultValue: 'Dad Heartbeat', x: 50, y: 15, color: '#160E4B', fontFamily: 'Playfair Display', fontSize: 20, align: 'center' },
      { id: 'heroText', label: 'Hero Message', defaultValue: 'You are our Superhero', x: 50, y: 60, color: '#F82BA9', fontFamily: 'Jost', fontSize: 13, align: 'center' },
      { id: 'fromNames', label: 'From Names', defaultValue: 'From Samavedra & Pujarini', x: 50, y: 94, color: '#3C187B', fontFamily: 'Jost', fontSize: 11, align: 'center' },
    ],
    sizes: [
      { id: 'size-a4', name: 'A4 (8x12 Inch)', dimensions: '8 x 12 inches', price: 699, originalPrice: 999, discountPercentage: 30 },
      { id: 'size-a3', name: 'A3 (12x18 Inch)', dimensions: '12 x 18 inches', price: 999, originalPrice: 1499, discountPercentage: 33 },
    ],
    frames: [
      { id: 'frame-black', name: 'Classic Black Wood', borderStyle: 'border-8 border-black shadow-2xl', frameColor: '#000000', borderColorClass: 'border-black' },
    ],
  },
];
