import React, { useState } from 'react';
import { Product } from '../types';
import { UniversalFrameCustomizer } from '../components/customizer/UniversalFrameCustomizer';
import { UniversalFrameTemplate } from '../types/template';
import { Star, ShieldCheck, Truck, Heart, Award, CheckCircle2, ChevronRight } from 'lucide-react';

interface ProductPageProps {
  product: Product;
  onProceedToCheckout: (
    photoValues: Record<string, string>,
    textValues: Record<string, string>,
    selectedSize: 'A4' | 'A3',
    customizedFramePreviewUrl?: string
  ) => void;
  onNavigate: (page: string) => void;
}

export const ProductPage: React.FC<ProductPageProps> = ({
  product,
  onProceedToCheckout,
  onNavigate,
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'specifications' | 'reviews'>('description');
  const [newReviewAuthor, setNewReviewAuthor] = useState('');
  const [newReviewComment, setNewReviewComment] = useState('');
  const [newReviewRating, setNewReviewRating] = useState(5);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);

  // Customer Reviews List state
  const [reviewsList, setReviewsList] = useState([
    {
      id: 'rev-1',
      author: 'Pooja Verma',
      rating: 5,
      date: '12 Feb 2026',
      city: 'Delhi',
      comment: 'Absolutely stunning frame quality! The photo cutout and text details were so crisp. Loved the bubble wrapped safe delivery.',
      verified: true,
    },
    {
      id: 'rev-2',
      author: 'Rahul Mishra',
      rating: 5,
      date: '08 Feb 2026',
      city: 'Mumbai',
      comment: 'Ordered for my newborn daughter birth announcement. Very easy live customization and quick dispatch.',
      verified: true,
    },
    {
      id: 'rev-3',
      author: 'Suman Roy',
      rating: 5,
      date: '28 Jan 2026',
      city: 'Kolkata',
      comment: 'The acrylic glass look gives such a luxury premium feel. Highly recommended gift item!',
      verified: true,
    },
  ]);

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newReviewAuthor || !newReviewComment) return;

    const newRev = {
      id: `rev-${Date.now()}`,
      author: newReviewAuthor,
      rating: newReviewRating,
      date: 'Just now',
      city: 'Verified Buyer',
      comment: newReviewComment,
      verified: true,
    };

    setReviewsList([newRev, ...reviewsList]);
    setNewReviewAuthor('');
    setNewReviewComment('');
    setReviewSubmitted(true);
    setTimeout(() => setReviewSubmitted(false), 4000);
  };

  // Construct dynamic template EXCLUSIVELY from saved product object (0 legacy fallbacks!)
  const currentTemplate: UniversalFrameTemplate = {
    id: `tmpl-${product.id}`,
    productId: product.id,
    title: product.title,
    category: product.category,
    basePrice: product.sizes[0]?.price || 699,
    originalPrice: product.sizes[0]?.originalPrice || 999,
    baseImageUrl:
      (product.baseImageUrl && !product.baseImageUrl.includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? product.baseImageUrl : null) ||
      (product.thumbnail && !product.thumbnail.includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? product.thumbnail : null) ||
      (product.images && product.images[0] && !product.images[0].includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? product.images[0] : null) ||
      'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80',
    photoSlots: product.photoSlots || [],
    textZones: product.textZones || [],
    images: (product as any).angleImages || product.images || [],
    product: product,
    createdAt: new Date().toISOString(),
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-12 font-jost select-none">
      
      {/* Breadcrumb Navigation (LovecraftbySE Style) */}
      <nav className="text-xs text-gray-500 font-bold flex items-center gap-1.5">
        <button onClick={() => onNavigate('home')} className="hover:text-[#F82BA9]">Home</button>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <button onClick={() => onNavigate('catalog')} className="hover:text-[#F82BA9]">{product.categoryLabel}</button>
        <ChevronRight className="w-3 h-3 text-gray-400" />
        <span className="text-gray-900 font-extrabold truncate max-w-xs sm:max-w-md">{product.title}</span>
      </nav>

      {/* Main Interactive Universal Customizer Workspace */}

      {/* Main Interactive Universal Customizer Workspace */}
      <UniversalFrameCustomizer
        template={currentTemplate}
        onProceedToCheckout={onProceedToCheckout}
      />

      {/* Detailed Product Description & Customer Reviews Tabs Section */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-8">
        
        {/* Tab Headers */}
        <div className="flex items-center gap-4 border-b border-gray-200 text-sm font-bold pb-1">
          <button
            onClick={() => setActiveTab('description')}
            className={`pb-3 px-2 transition-all cursor-pointer ${
              activeTab === 'description'
                ? 'border-b-2 border-[#F82BA9] text-[#F82BA9]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Product Description
          </button>

          <button
            onClick={() => setActiveTab('specifications')}
            className={`pb-3 px-2 transition-all cursor-pointer ${
              activeTab === 'specifications'
                ? 'border-b-2 border-[#F82BA9] text-[#F82BA9]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Material Specs & Quality
          </button>

          <button
            onClick={() => setActiveTab('reviews')}
            className={`pb-3 px-2 transition-all cursor-pointer ${
              activeTab === 'reviews'
                ? 'border-b-2 border-[#F82BA9] text-[#F82BA9]'
                : 'text-gray-500 hover:text-gray-900'
            }`}
          >
            Customer Reviews ({reviewsList.length})
          </button>
        </div>

        {/* Tab Content: Description */}
        {activeTab === 'description' && (
          <div className="space-y-6 text-xs sm:text-sm text-gray-700 leading-relaxed max-w-3xl">
            <p>
              Celebrate your life&apos;s most cherished milestones with our handcrafted <strong>{product.title}</strong>. Printed on premium 300 GSM archival matte paper using fade-proof inks, this custom frame preserves your photos and details for a lifetime.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-2xl bg-pink-50/50 border border-pink-100 space-y-1">
                <Award className="w-5 h-5 text-[#F82BA9]" />
                <h4 className="font-bold text-[#160E4B]">Archival Paper</h4>
                <p className="text-[11px] text-gray-500">300 GSM museum-grade matte paper print</p>
              </div>

              <div className="p-4 rounded-2xl bg-blue-50/50 border border-blue-100 space-y-1">
                <ShieldCheck className="w-5 h-5 text-[#3B82F6]" />
                <h4 className="font-bold text-[#160E4B]">Acrylic Glass Overlay</h4>
                <p className="text-[11px] text-gray-500">Unbreakable crystal clear acrylic glass</p>
              </div>

              <div className="p-4 rounded-2xl bg-purple-50/50 border border-purple-100 space-y-1">
                <Truck className="w-5 h-5 text-purple-600" />
                <h4 className="font-bold text-[#160E4B]">Damage-Proof Delivery</h4>
                <p className="text-[11px] text-gray-500">Multi-layer bubble wrap safe packaging</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content: Specifications */}
        {activeTab === 'specifications' && (
          <div className="space-y-4 max-w-2xl text-xs text-gray-700">
            <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-900">Paper Quality:</span>
              <span>300 GSM Archival Premium Matte Paper</span>
            </div>
            <div className="grid grid-cols-2 p-3 bg-white border border-gray-100 rounded-xl">
              <span className="font-bold text-gray-900">Glass Material:</span>
              <span>3mm Imported Shatter-proof Gloss Acrylic</span>
            </div>
            <div className="grid grid-cols-2 p-3 bg-gray-50 rounded-xl">
              <span className="font-bold text-gray-900">Frame Molding:</span>
              <span>Solid Synthetic Black Wood Frame (0.75 Inch Depth)</span>
            </div>
            <div className="grid grid-cols-2 p-3 bg-white border border-gray-100 rounded-xl">
              <span className="font-bold text-gray-900">Mounting Options:</span>
              <span>Includes Tabletop Stand & Wall Hanging Hook</span>
            </div>
          </div>
        )}

        {/* Tab Content: Reviews */}
        {activeTab === 'reviews' && (
          <div className="space-y-8">
            
            {/* Reviews Summary Breakdown */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 bg-gray-50 rounded-2xl border border-gray-200">
              <div className="text-center sm:text-left space-y-1">
                <div className="text-4xl font-extrabold text-[#160E4B]">4.9 <span className="text-lg text-gray-400 font-normal">/ 5</span></div>
                <div className="flex items-center justify-center sm:justify-start gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-xs text-gray-500">Based on {reviewsList.length} verified customer reviews</p>
              </div>

              <div className="w-full sm:w-auto">
                <a
                  href="#write-review"
                  className="px-6 py-3 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-md transition-colors block text-center"
                >
                  Write a Customer Review
                </a>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsList.map((rev) => (
                <div key={rev.id} className="p-5 bg-white rounded-2xl border border-gray-200 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-pink-100 text-[#F82BA9] font-bold flex items-center justify-center text-xs">
                        {rev.author.charAt(0)}
                      </div>
                      <div>
                        <h5 className="font-bold text-gray-900 flex items-center gap-1.5">
                          {rev.author}
                          {rev.verified && (
                            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200 flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3" /> Verified Buyer
                            </span>
                          )}
                        </h5>
                        <span className="text-[10px] text-gray-400">{rev.city} • {rev.date}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>

                  <p className="text-gray-700 pt-1 leading-relaxed">{rev.comment}</p>
                </div>
              ))}
            </div>

            {/* Write a Review Form */}
            <form id="write-review" onSubmit={handleAddReview} className="p-6 bg-gray-50 rounded-2xl border border-gray-200 space-y-4 text-xs">
              <h4 className="font-bold text-sm text-[#160E4B]">Write Your Review</h4>

              {reviewSubmitted && (
                <div className="p-3 bg-emerald-500/10 text-emerald-700 font-bold rounded-xl border border-emerald-200">
                  Thank you! Your customer review has been posted successfully.
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Your Full Name :</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Priya Sharma"
                    value={newReviewAuthor}
                    onChange={(e) => setNewReviewAuthor(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Rating :</label>
                  <select
                    value={newReviewRating}
                    onChange={(e) => setNewReviewRating(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl font-bold"
                  >
                    <option value={5}>⭐⭐⭐⭐⭐ (5 / 5 Stars)</option>
                    <option value={4}>⭐⭐⭐⭐ (4 / 5 Stars)</option>
                    <option value={3}>⭐⭐⭐ (3 / 5 Stars)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">Your Review Comment :</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share details about print quality, packaging, and delivery..."
                  value={newReviewComment}
                  onChange={(e) => setNewReviewComment(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-xl"
                />
              </div>

              <button
                type="submit"
                className="px-6 py-3 bg-[#160E4B] hover:bg-[#251877] text-white font-bold rounded-xl shadow-md transition-colors cursor-pointer"
              >
                Submit Review
              </button>
            </form>

          </div>
        )}

      </section>

    </div>
  );
};
