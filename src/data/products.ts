import { Product } from '../types';

export const PRODUCTS: Product[] = [
  {
    id: 'prod-brother-sister',
    slug: 'personalized-brother-sister-photo-frame',
    title: 'Custom Birthday Collage Photo Frame with Name, Date & Message',
    subtitle: 'Personalized birthday collage frame with interactive month calendar date highlight & love message generator',
    category: 'birthday',
    categoryLabel: 'Photo Collages',
    rating: 5.0,
    reviewsCount: 24,
    thumbnail: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    ],
    bestseller: true,
    onSale: true,
    description: 'A beautiful birthday photo collage frame featuring a personalized name, special interactive calendar date highlight with red heart icon, and dynamic love message generator.',
    features: [
      'Archival 300 GSM Matte Paper',
      'Unbreakable acrylic glass overlay',
      'Synthetic black wood frame',
      'Interactive month calendar grid with red heart highlight',
      'AI Love Message Generator with 1-click Regenerate button',
    ],
    photoSlots: [
      { id: 'photo-1', label: 'Top Left Photo', shape: 'rounded', x: 25, y: 32, width: 34, height: 26, defaultPhotoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
      { id: 'photo-2', label: 'Top Right Photo', shape: 'rounded', x: 75, y: 32, width: 34, height: 26, defaultPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
      { id: 'photo-3', label: 'Bottom Center Photo', shape: 'rounded', x: 50, y: 72, width: 78, height: 30, defaultPhotoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=400&q=80' },
    ],
    textZones: [
      { id: 'headerTitle', label: 'Header Title', defaultValue: 'Happy Birthday', x: 50, y: 10, color: '#FFFFFF', fontFamily: 'Playfair Display', fontSize: 20, align: 'center', type: 'text' },
      { id: 'calendarDate', label: 'Special Date (Calendar ❤️)', defaultValue: '14 Feb 2026', x: 50, y: 50, color: '#FFFFFF', fontFamily: 'Playfair Display', fontSize: 12, align: 'center', type: 'calendar', isCalendar: true },
      { id: 'loveMessage', label: 'Custom Love Message (🔄)', defaultValue: 'Happy Birthday to the one who holds my heart forever! ❤️', x: 50, y: 92, color: '#F82BA9', fontFamily: 'Jost', fontSize: 12, align: 'center', type: 'message', isAIMessage: true },
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
    id: 'prod-welcome-baby',
    slug: 'welcome-baby-customizable-birth-frame',
    title: 'Welcome Little One – Personalized Baby Birth Details Frame',
    subtitle: 'Preserve your newborn\'s birth details in a personalized keepsake frame with birth calendar grid',
    category: 'baby',
    categoryLabel: 'Photo Collages',
    rating: 4.9,
    reviewsCount: 11,
    thumbnail: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=600&q=80',
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
      { id: 'babyPhoto', label: 'Baby Picture', shape: 'circle', x: 50, y: 28, width: 36, height: 26, defaultPhotoUrl: 'https://images.unsplash.com/photo-1519689680058-324335c77eba?auto=format&fit=crop&w=400&q=80' },
      { id: 'parentsPhoto', label: 'Parents Picture', shape: 'circle', x: 50, y: 82, width: 28, height: 20, defaultPhotoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80' },
    ],
    textZones: [
      { id: 'babyName', label: 'Baby Name', defaultValue: 'Arya Sharma', x: 50, y: 50, color: '#0369A1', fontFamily: 'Jost', fontSize: 20, align: 'center', type: 'text' },
      { id: 'birthDateDay', label: 'Date of Birth (Calendar ❤️)', defaultValue: '31 Jan 2025', x: 22, y: 35, color: '#334155', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'calendar', isCalendar: true },
      { id: 'birthTime', label: 'Birth Time', defaultValue: '11:00 AM', x: 78, y: 35, color: '#334155', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'time' },
      { id: 'bloodGroup', label: 'Blood Group', defaultValue: 'A+', x: 22, y: 55, color: '#DC2626', fontFamily: 'Jost', fontSize: 12, align: 'center', type: 'text' },
      { id: 'height', label: 'Height (Cm)', defaultValue: '49 Cm', x: 78, y: 55, color: '#0369A1', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'text' },
      { id: 'weight', label: 'Weight (Kg)', defaultValue: '3.5 Kg', x: 22, y: 73, color: '#0369A1', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'text' },
      { id: 'hospitalName', label: 'Hospital Name', defaultValue: 'Duya Hospital', x: 50, y: 63, color: '#334155', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'text' },
      { id: 'parentsName', label: 'Love Message (🔄)', defaultValue: 'May your little angel be blessed with infinite love and joy ❤️', x: 50, y: 94, color: '#DC2626', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'message', isAIMessage: true },
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
    subtitle: 'Express your gratitude with a personalized heartbeat photo collage and special date highlight',
    category: 'family',
    categoryLabel: 'Family Frame',
    rating: 4.9,
    reviewsCount: 38,
    thumbnail: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
    images: [
      'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=600&q=80',
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
      { id: 'photo-1', label: 'Left Photo', shape: 'rounded', x: 26, y: 40, width: 36, height: 35, defaultPhotoUrl: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?auto=format&fit=crop&w=400&q=80' },
      { id: 'photo-2', label: 'Right Photo', shape: 'rounded', x: 74, y: 40, width: 36, height: 35, defaultPhotoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=400&q=80' },
      { id: 'photo-3', label: 'Bottom Center Photo', shape: 'rounded', x: 50, y: 78, width: 60, height: 28, defaultPhotoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80' },
    ],
    textZones: [
      { id: 'dadTitle', label: 'Dad Title', defaultValue: 'Dad Heartbeat', x: 50, y: 15, color: '#FFFFFF', fontFamily: 'Playfair Display', fontSize: 20, align: 'center', type: 'text' },
      { id: 'heroText', label: 'Hero Message (🔄)', defaultValue: 'You are our Superhero! ❤️', x: 50, y: 60, color: '#F82BA9', fontFamily: 'Jost', fontSize: 13, align: 'center', type: 'message', isAIMessage: true },
      { id: 'fromNames', label: 'From Names', defaultValue: 'From Samavedra & Pujarini', x: 50, y: 94, color: '#FFFFFF', fontFamily: 'Jost', fontSize: 11, align: 'center', type: 'text' },
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
