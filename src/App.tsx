import React, { useState, useEffect } from 'react';
import { Product, CartItem, Order } from './types';
import { useCartStore } from './store/useCartStore';
import { PRODUCTS as INITIAL_PRODUCTS } from './data/products';
import { compressImageBase64 } from './utils/imageCompressor';

import { Header } from './components/layout/Header';
import { Footer } from './components/layout/Footer';
import { FloatingWhatsApp } from './components/layout/FloatingWhatsApp';

import { HomePage } from './pages/HomePage';
import { ProductPage } from './pages/ProductPage';
import { CartPage } from './pages/CartPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { OrderSuccessPage } from './pages/OrderSuccessPage';
import { CustomerOrdersDashboard } from './pages/CustomerOrdersDashboard';
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';

import { CartDrawer } from './components/cart/CartDrawer';
import { ProductGrid } from './components/catalog/ProductGrid';
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
  const activeProduct = selectedProduct || (products && products.length > 0 ? products[0] : INITIAL_PRODUCTS[0]);

  useEffect(() => {
    const handlePopState = () => {
      if (window.location.pathname === '/admin' || window.location.hash === '#admin') {
        setCurrentPage('admin');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

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
    const prod = activeProduct;
    const sizeOpt = prod.sizes.find((s) => s.id.includes(selectedSize.toLowerCase())) || prod.sizes[0];
    const frameOpt = prod.frames[0];

    // Compress all uploaded Base64 photo slot images to crisp ~50KB JPEGs (Reduces 6MB payload to 300KB!)
    const compressedPhotoValues: Record<string, string> = {};
    for (const [key, val] of Object.entries(photoValues)) {
      if (val && val.startsWith('data:image')) {
        compressedPhotoValues[key] = await compressImageBase64(val, 600, 0.70);
      } else {
        compressedPhotoValues[key] = val;
      }
    }

    const mergedValues = {
      ...compressedPhotoValues,
      ...textValues,
    };

    const firstPhoto = Object.values(compressedPhotoValues).find((val) => val && val.length > 0) || prod.thumbnail;

    const cartItemData = {
      product: prod,
      selectedSize: sizeOpt,
      selectedFrame: frameOpt,
      uploadedPhotoUrl: firstPhoto,
      customizedFramePreviewUrl: customizedFramePreviewUrl || prod.thumbnail,
      customTextValues: mergedValues,
      quantity: 1,
      photoScale: 1,
      photoPosition: { x: 0, y: 0 },
      photoRotation: 0,
      itemTotalPrice: sizeOpt.price,
    };

    addToCart(cartItemData);
    setCurrentPage('checkout');
    window.scrollTo({ top: 0, behavior: 'smooth' });
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

        {currentPage === 'catalog' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
            <div className="text-center space-y-2">
              <h1 className="font-playfair text-3xl font-bold text-[#160E4B]">Custom Photo Frames & Collage Gifts</h1>
              <p className="text-xs text-gray-500 max-w-xl mx-auto">Explore premium handcrafted frames with 300 GSM archival paper and shatter-proof acrylic glass overlay.</p>
            </div>
            <ProductGrid onSelectProduct={handleSelectProduct} categoryFilter={currentParam} />
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

        {currentPage === 'about' && <AboutPage />}
        {currentPage === 'contact' && <ContactPage />}

        {currentPage === 'admin' && (
          <AdminDashboard orders={orders} />
        )}
      </main>

      {/* Floating WhatsApp Support Button */}
      {currentPage !== 'admin' && <FloatingWhatsApp />}

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
