import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order } from './types';
import { useCartStore } from './store/useCartStore';
import { compressImageBase64 } from './utils/imageCompressor';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';
import { RecentPurchaseToast } from './components/common/RecentPurchaseToast';

import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { CustomerOrdersDashboard } from './pages/CustomerOrdersDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { OrderTrackingPage } from './pages/OrderTrackingPage';

import { CartDrawer } from './components/cart/CartDrawer';
import { ProductGrid } from './components/catalog/ProductGrid';
import { ShopProductGrid } from './components/catalog/ShopProductGrid';
import { CustomerAuthModal } from './components/auth/CustomerAuthModal';

export const App: React.FC = () => {
  // Check URL pathname for secret /admin route
  const isInitialAdminPath = window.location.pathname === '/admin' || window.location.hash === '#admin';
  const [currentPage, setCurrentPage] = useState<string>(isInitialAdminPath ? 'admin' : 'home');
  const [currentParam, setCurrentParam] = useState<string | undefined>();
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);

  const {
    products,
    items,
    orders,
    addToCart,
    removeFromCart,
    updateQuantity,
    placeOrder,
    subtotal,
    totalItems,
  } = useCartStore();

  // Default initial product if selectedProduct is null
  const activeProduct = selectedProduct || (products && products.length > 0 ? products[0] : null);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setCurrentPage('admin');
      }
    };
    window.addEventListener('popstate', handlePopState);

    // Direct Product Share Link URL Handler (For Instagram & Facebook Ads)
    const params = new URLSearchParams(window.location.search);
    const prodIdParam = params.get('product');
    if (prodIdParam && products && products.length > 0) {
      const found = products.find((p) => p.id === prodIdParam || p.slug === prodIdParam);
      if (found) {
        setSelectedProduct(found);
        setCurrentPage('product');
      }
    }

    return () => window.removeEventListener('popstate', handlePopState);
  }, [products]);

  const handleNavigate = (page: string, param?: string) => {
    if (page === 'admin') {
      window.history.pushState({}, '', '/admin');
    } else if (page === 'my-order') {
      setCurrentPage('my-order');
      return;
    } else {
      if (window.location.pathname === '/admin') {
        window.history.pushState({}, '', '/');
      }
    }

    setCurrentPage(page);
    setCurrentParam(param);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectProduct = (product: Product) => {
    setSelectedProduct(product);
    setCurrentPage('product');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleProceedToCheckout = async (
    photoValues: Record<string, string>,
    textValues: Record<string, string>,
    selectedSize: 'A4' | 'A3',
    customizedFramePreviewUrl?: string
  ) => {
    try {
      const prod = activeProduct;
      const sizeOpt = prod?.sizes?.find((s) => s.id.includes(selectedSize.toLowerCase())) || prod?.sizes?.[0] || {
        id: 'size-a4',
        name: 'A4 (8x12 Inch)',
        dimensions: '8x12 Inch',
        price: 699,
        originalPrice: 999,
        discountPercentage: 30,
      };
      const frameOpt = prod?.frames?.[0] || {
        id: 'classic-black',
        name: 'Classic Black Wood',
        borderStyle: 'solid',
        frameColor: '#000000',
        borderColorClass: 'border-black',
      };

      // Compress photo slot uploads in parallel with 1.5-second timeout guard
      const compressedPhotoValues: Record<string, string> = {};
      await Promise.all(
        Object.entries(photoValues || {}).map(async ([key, val]) => {
          if (val && val.startsWith('data:image')) {
            try {
              compressedPhotoValues[key] = await Promise.race([
                compressImageBase64(val, 500, 0.65),
                new Promise<string>((res) => setTimeout(() => res(val), 1500)),
              ]);
            } catch (e) {
              compressedPhotoValues[key] = val;
            }
          } else {
            compressedPhotoValues[key] = val;
          }
        })
      );

      const mergedValues = {
        ...compressedPhotoValues,
        ...textValues,
      };

      const firstPhoto = Object.values(compressedPhotoValues).find((val) => val && val.length > 0) || prod?.thumbnail || '';

      const cartItemData = {
        product: prod,
        selectedSize: sizeOpt,
        selectedFrame: frameOpt,
        uploadedPhotoUrl: firstPhoto,
        customizedFramePreviewUrl: (customizedFramePreviewUrl && customizedFramePreviewUrl.startsWith('data:image') && !customizedFramePreviewUrl.includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? customizedFramePreviewUrl : ''),
        customTextValues: mergedValues,
        quantity: 1,
        photoScale: 1,
        photoPosition: { x: 0, y: 0 },
        photoRotation: 0,
        itemTotalPrice: sizeOpt.price,
      };

      addToCart(cartItemData);
      setCurrentPage('cart');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      console.error('Proceed to checkout fallback error:', err);
      setCurrentPage('cart');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleOrderSuccess = (order: Order) => {
    setCompletedOrder(order);
    setCurrentPage('order-success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#FAFAFC] font-jost text-gray-900 flex flex-col justify-between select-none">
      
      {/* Top Main Navigation Header */}
      {currentPage !== 'admin' && (
        <Header
          cartCount={totalItems}
          onNavigate={handleNavigate}
          onOpenCart={() => setIsCartDrawerOpen(true)}
        />
      )}

      {/* Main Dynamic View Content */}
      <main className="flex-1">
        {currentPage === 'home' && (
          <HomePage
            onSelectProduct={handleSelectProduct}
            onNavigate={handleNavigate}
          />
        )}

        {(currentPage === 'catalog' || currentPage === 'shop') && (
          <div className="max-w-[1400px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-playfair text-3xl sm:text-4xl font-extrabold text-[#160E4B]">Custom Photo Frames & Collage Gifts</h1>
              <p className="text-xs text-gray-500 max-w-xl mx-auto">Explore premium handcrafted frames with 300 GSM archival paper and shatter-proof acrylic glass overlay.</p>
            </div>
            <ShopProductGrid onSelectProduct={handleSelectProduct} initialCategory={currentParam || 'all'} />
          </div>
        )}

        {currentPage === 'product' && activeProduct && (
          <ProductPage
            product={activeProduct}
            onProceedToCheckout={handleProceedToCheckout}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'cart' && (
          <CartPage
            items={items}
            subtotal={subtotal}
            onUpdateQuantity={updateQuantity}
            onRemoveItem={removeFromCart}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'checkout' && (
          <CheckoutPage
            items={items}
            subtotal={subtotal}
            onPlaceOrder={(orderData) => {
              const newOrder = placeOrder(orderData);
              return newOrder;
            }}
            onOrderSuccess={(order) => {
              handleOrderSuccess(order);
            }}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'order-success' && completedOrder && (
          <OrderSuccessPage
            order={completedOrder}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'my-order' && (
          <CustomerOrdersDashboard
            orders={orders}
            onNavigate={handleNavigate}
          />
        )}

        {currentPage === 'order-tracking' && <OrderTrackingPage />}

        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'contact' && <ContactPage />}

        {currentPage === 'admin' && (
          <AdminDashboard orders={orders} />
        )}
      </main>

      {/* Floating WhatsApp Support Button */}
      {currentPage !== 'admin' && <FloatingWhatsApp />}

      {/* Floating Social Proof Sales Toast Popup */}
      {currentPage !== 'admin' && <RecentPurchaseToast />}

      {/* Slide-over Shopping Cart Drawer */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        items={items}
        subtotal={subtotal}
        onUpdateQuantity={updateQuantity}
        onRemoveItem={removeFromCart}
        onNavigate={handleNavigate}
      />

      {/* Customer Authentication Modal */}
      <CustomerAuthModal />

      {/* Footer Navigation */}
      {currentPage !== 'admin' && <Footer onNavigate={handleNavigate} />}

    </div>
  );
};

export default App;
