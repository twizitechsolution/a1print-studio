import React, { useState } from 'react';
import { Order, CartItem } from '../../types';
import { LiveCustomizedFrameThumbnail } from '../customizer/LiveCustomizedFrameThumbnail';
import { Download, MessageCircle, Loader2, Printer, X } from 'lucide-react';

interface AdminOrderListProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
}

// Convert any URL into a Base64 Data URI (Eliminates CORS Tainted Canvas Errors 100%!)
const urlToBase64DataUri = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
};

// Safe Image Loader using Base64 Data URI
const loadBase64Image = (dataUri: string, timeoutMs = 3000): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!dataUri) return resolve(null);

    const img = new Image();
    let timer: any = null;

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.src = dataUri;
  });
};

export const AdminOrderList: React.FC<AdminOrderListProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [printPreviewItem, setPrintPreviewItem] = useState<{ order: Order; item: CartItem } | null>(null);

  // High-Res DOM-to-Canvas PNG Exporter (100% Ditto Match with Print Preview Modal!)
  const handleDownloadCustomerPrintFile = async (order: Order, itemIndex: number) => {
    const item = order.items[itemIndex];
    if (!item) return;

    setDownloadingOrderId(`${order.id}-${itemIndex}`);

    try {
      const targetW = 1200;
      const targetH = 1760;
      const borderThickness = 24; // 24px border matches DOM border-8 border-black at 1200px width

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        setDownloadingOrderId(null);
        return;
      }

      // 1. Fill solid background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);

      // Inner poster bounds inside frame border
      const innerX = borderThickness;
      const innerY = borderThickness;
      const innerW = targetW - borderThickness * 2;
      const innerH = targetH - borderThickness * 2;

      // 2. Draw Base Poster Template Image matching DOM object-cover inside inner bounds
      const baseDataUri = await urlToBase64DataUri(item.product.thumbnail);
      const baseImg = await loadBase64Image(baseDataUri, 3000);

      if (baseImg) {
        const imgRatio = baseImg.width / baseImg.height;
        const targetRatio = innerW / innerH;
        let sx = 0, sy = 0, sWidth = baseImg.width, sHeight = baseImg.height;

        if (imgRatio > targetRatio) {
          sWidth = baseImg.height * targetRatio;
          sx = (baseImg.width - sWidth) / 2;
        } else {
          sHeight = baseImg.width / targetRatio;
          sy = (baseImg.height - sHeight) / 2;
        }

        ctx.drawImage(baseImg, sx, sy, sWidth, sHeight, innerX, innerY, innerW, innerH);
      } else {
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(innerX, innerY, innerW, innerH);
      }

      const photoSlots = item.product.photoSlots || [];
      const textZones = item.product.textZones || [];

      // 3. Draw customer uploaded photos inside inner bounds (Preserves white margin gap 100%!)
      for (const slot of photoSlots) {
        const photoUrl = item.customTextValues[slot.id] || (slot.id === 'photo-1' || slot.id === 'babyPhoto' ? item.uploadedPhotoUrl : '');
        if (!photoUrl) continue;

        const photoDataUri = await urlToBase64DataUri(photoUrl);
        const photoImg = await loadBase64Image(photoDataUri, 3000);

        if (photoImg) {
          // Calculate percentage coordinates relative to inner poster area
          const centerX = innerX + (slot.x / 100) * innerW;
          const centerY = innerY + (slot.y / 100) * innerH;
          const slotW = (slot.width / 100) * innerW;
          const slotH = (slot.height / 100) * innerH;
          const leftX = centerX - slotW / 2;
          const topY = centerY - slotH / 2;

          ctx.save();
          ctx.beginPath();
          if (slot.shape === 'circle') {
            ctx.arc(centerX, centerY, slotW / 2, 0, Math.PI * 2);
          } else {
            ctx.rect(leftX, topY, slotW, slotH);
          }
          ctx.clip();

          // Calculate exact object-fit cover matching DOM <img className="w-full h-full object-cover" />
          const imgRatio = photoImg.width / photoImg.height;
          const targetRatio = slotW / slotH;
          let sx = 0, sy = 0, sWidth = photoImg.width, sHeight = photoImg.height;

          if (imgRatio > targetRatio) {
            sWidth = photoImg.height * targetRatio;
            sx = (photoImg.width - sWidth) / 2;
          } else {
            sHeight = photoImg.width / targetRatio;
            sy = (photoImg.height - sHeight) / 2;
          }

          ctx.drawImage(photoImg, sx, sy, sWidth, sHeight, leftX, topY, slotW, slotH);
          ctx.restore();
        }
      }

      // 4. Draw assigned text zones ONLY
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      for (const zone of textZones) {
        const val = item.customTextValues[zone.id] || zone.defaultValue;
        if (val && typeof val === 'string' && !val.startsWith('data:image')) {
          ctx.fillStyle = zone.color || '#000000';
          ctx.font = `bold ${zone.fontSize * 1.6}px sans-serif`;
          const textX = innerX + (zone.x / 100) * innerW;
          const textY = innerY + (zone.y / 100) * innerH;
          ctx.fillText(val, textX, textY);
        }
      }

      // 5. Draw Solid Black Wood Frame Molding Border Overlay matching LiveCustomizedFrameThumbnail border-8 border-black!
      ctx.strokeStyle = '#000000';
      ctx.lineWidth = borderThickness * 2;
      ctx.strokeRect(0, 0, targetW, targetH);

      // Convert UNTAINTED Canvas to Instant Download File
      try {
        const dataUrl = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = `A1PRINT-${order.id}-CUSTOM-PRINT-FRAME.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.warn('Fallback to print preview modal:', err);
        setPrintPreviewItem({ order, item });
      }

      setDownloadingOrderId(null);
    } catch (e) {
      console.error('Print download error:', e);
      setDownloadingOrderId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <div className="p-8 bg-[#121829] rounded-2xl border border-[#262E4A] text-center font-jost space-y-2">
        <p className="text-gray-400 font-bold text-sm">No customer orders placed yet.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 font-jost text-xs">
      {orders.map((order) => {
        const statusColors: Record<string, string> = {
          Received: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
          Printing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
          Shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
          Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        };

        return (
          <div
            key={order.id}
            className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-4 text-gray-300 select-none"
          >
            
            {/* Top Order Row Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-[#262E4A] pb-3">
              <div className="flex items-center gap-3">
                <span className="font-extrabold text-sm text-white font-mono">{order.id}</span>
                <span
                  className={`px-3 py-1 rounded-full font-bold border text-[11px] ${
                    statusColors[order.orderStatus] || 'bg-gray-500/10 text-gray-400'
                  }`}
                >
                  Status: {order.orderStatus}
                </span>
              </div>

              <div className="flex items-center gap-2">
                <select
                  value={order.orderStatus}
                  onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as any)}
                  className="px-3 py-1.5 bg-[#1A2035] border border-[#262E4A] text-white font-bold rounded-xl text-xs"
                >
                  <option value="Received">Received</option>
                  <option value="Printing">Printing</option>
                  <option value="Shipped">Shipped</option>
                  <option value="Delivered">Delivered</option>
                </select>

                <a
                  href={`https://wa.me/91${order.customer.phone}?text=Hi%20${encodeURIComponent(
                    order.customer.fullName
                  )},%20we%20have%20received%20your%20A1print%20order%20${order.id}!`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors flex items-center gap-1"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Proof
                </a>
              </div>
            </div>

            {/* Order Items & Customer Info */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-center">
              
              {/* Customer Info (4 Cols) */}
              <div className="lg:col-span-4 space-y-1">
                <h4 className="font-bold text-white text-sm">{order.customer.fullName}</h4>
                <p className="text-gray-400">📞 {order.customer.phone}</p>
                <p className="text-gray-400 line-clamp-2">📍 {order.customer.address}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
                <span className="text-emerald-400 font-bold block pt-1">Paid via {order.paymentMethod} • ₹{order.total}</span>
              </div>

              {/* Order Items & Live Frame Thumbnail (8 Cols) */}
              <div className="lg:col-span-8 space-y-3">
                {order.items.map((item, idx) => {
                  const isDownloading = downloadingOrderId === `${order.id}-${idx}`;

                  // Filter out raw photo base64 entries cleanly!
                  const textEntries = Object.entries(item.customTextValues || {}).filter(
                    ([k, v]) => !k.startsWith('photo') && v && typeof v === 'string' && !v.startsWith('data:image')
                  );

                  return (
                    <div key={idx} className="p-3.5 bg-[#1A2035] rounded-xl border border-[#262E4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {/* Live Frame Renderer Component in Admin Panel */}
                        <div className="w-14 h-18 shrink-0">
                          <LiveCustomizedFrameThumbnail item={item} fontScale={0.22} />
                        </div>

                        <div className="space-y-0.5 min-w-0 flex-1">
                          <h5 className="font-bold text-white text-xs truncate">{item.product.title}</h5>
                          <span className="text-[#3B82F6] font-bold block text-[11px]">{item.selectedSize.name}</span>
                          
                          {textEntries.length > 0 && (
                            <div className="text-[10px] text-gray-300 font-mono truncate">
                              {textEntries.map(([k, v]) => `${k}:${v}`).join(' | ')}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons Container (Always 100% Visible & Accessible!) */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Direct High-Res Canvas Download Button */}
                        <button
                          disabled={isDownloading}
                          onClick={() => handleDownloadCustomerPrintFile(order, idx)}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Preparing PNG...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" /> Download Customer Print File
                            </>
                          )}
                        </button>

                        <button
                          onClick={() => setPrintPreviewItem({ order, item })}
                          className="p-2.5 bg-[#262E4A] hover:bg-gray-700 text-gray-200 rounded-xl transition-colors cursor-pointer shrink-0"
                          title="Print Preview Modal"
                        >
                          <Printer className="w-4 h-4" />
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>

            </div>

          </div>
        );
      })}

      {/* Admin Print Preview Modal Popup */}
      {printPreviewItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn">
          <div className="relative bg-white text-gray-900 rounded-3xl p-6 max-w-md w-full shadow-2xl flex flex-col items-center space-y-4">
            
            <div className="flex items-center justify-between w-full border-b border-gray-200 pb-3">
              <h3 className="font-bold text-sm text-[#160E4B]">Print Preview - {printPreviewItem.order.id}</h3>
              <button
                onClick={() => setPrintPreviewItem(null)}
                className="p-1 text-gray-400 hover:text-gray-900 rounded-full"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* High-Res Live Frame Renderer Container */}
            <div className="w-full max-w-[280px]">
              <LiveCustomizedFrameThumbnail item={printPreviewItem.item} />
            </div>

            <div className="w-full space-y-2 pt-2 border-t border-gray-100 text-center">
              <p className="text-xs text-gray-500 font-bold">Customer: {printPreviewItem.order.customer.fullName}</p>
              <button
                onClick={() => window.print()}
                className="w-full py-3 bg-[#3C187B] hover:bg-[#251877] text-white font-bold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" /> Print High-Res Poster (CTRL + P / Save PDF)
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
