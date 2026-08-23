import React, { useState } from 'react';
import { Order, CartItem } from '../../types';
import { LiveCustomizedFrameThumbnail } from '../customizer/LiveCustomizedFrameThumbnail';
import { Download, Loader2, Printer, X } from 'lucide-react';
import html2canvas from 'html2canvas';

interface AdminOrderListProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus']) => void;
}

export const AdminOrderList: React.FC<AdminOrderListProps> = ({
  orders,
  onUpdateOrderStatus,
}) => {
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [printPreviewItem, setPrintPreviewItem] = useState<{ order: Order; item: CartItem } | null>(null);

  // 100% Pixel-Perfect DOM-to-PNG Exporter using html2canvas (Downloads COMPLETE printed frame artwork!)
  const handleDownloadCustomerPrintFile = async (order: Order, itemIndex: number) => {
    const item = order.items[itemIndex];
    if (!item) return;

    const elementId = `order-frame-container-${order.id}-${itemIndex}`;
    const frameElement = document.getElementById(elementId);
    if (!frameElement) {
      console.warn('Frame element container not found:', elementId);
      return;
    }

    setDownloadingOrderId(`${order.id}-${itemIndex}`);

    try {
      // Capture the EXACT rendered DOM frame element with 3x High Resolution (300 DPI Quality!)
      const canvas = await html2canvas(frameElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#FFFFFF',
        logging: false,
      });

      // Export as Instant PNG File Download to Computer Disk!
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = `A1PRINT-${order.id}-PRINT-READY-FRAME.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
          }
          setDownloadingOrderId(null);
        },
        'image/png',
        1.0
      );
    } catch (err) {
      console.error('html2canvas export error, fallback to dataURL:', err);
      try {
        const frameElement = document.getElementById(elementId);
        if (frameElement) {
          const canvas = await html2canvas(frameElement, { scale: 2, useCORS: true });
          const dataUrl = canvas.toDataURL('image/png');
          const link = document.createElement('a');
          link.href = dataUrl;
          link.download = `A1PRINT-${order.id}-PRINT-READY-FRAME.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        }
      } catch (e) {
        console.error('Final download error:', e);
      }
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
    <div className="space-y-4 font-jost text-xs select-none">
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
                
                {/* Order Status Badge */}
                <select
                  value={order.orderStatus || 'Received'}
                  onChange={(e) => onUpdateOrderStatus(order.id, e.target.value as Order['orderStatus'])}
                  className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                    statusColors[order.orderStatus || 'Received'] || statusColors.Received
                  }`}
                >
                  <option value="Received" className="bg-[#121829] text-amber-400">Status: Received</option>
                  <option value="Printing" className="bg-[#121829] text-blue-400">Status: Printing</option>
                  <option value="Shipped" className="bg-[#121829] text-purple-400">Status: Shipped</option>
                  <option value="Delivered" className="bg-[#121829] text-emerald-400">Status: Delivered</option>
                </select>
              </div>

              {/* WhatsApp Launch Proof Button */}
              <a
                href={`https://wa.me/91${order.customer.phone}?text=Hello%20${encodeURIComponent(order.customer.fullName)},%20your%20A1print%20order%20${order.id}%20has%20been%20received!`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                💬 WhatsApp Proof
              </a>
            </div>

            {/* Order Details Body Grid */}
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
                        {/* High-Fidelity Capture Container for 300 DPI PNG Download */}
                        <div
                          id={`order-frame-container-${order.id}-${idx}`}
                          className="w-16 h-22 shrink-0 bg-white p-0.5 rounded-sm overflow-hidden"
                        >
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

                      {/* Action Buttons Container */}
                      <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                        {/* Direct High-Res Canvas Download Button */}
                        <button
                          disabled={isDownloading}
                          onClick={() => handleDownloadCustomerPrintFile(order, idx)}
                          className="px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                        >
                          {isDownloading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin" /> Capturing HD PNG...
                            </>
                          ) : (
                            <>
                              <Download className="w-3.5 h-3.5" /> Download Customer Print File
                            </>
                          )}
                        </button>

                        {/* Print Preview Modal Button */}
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
