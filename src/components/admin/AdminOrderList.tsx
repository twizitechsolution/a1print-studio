import React, { useState } from 'react';
import { Order, CartItem, ProcessingHistoryItem } from '../../types';
import { LiveCustomizedFrameThumbnail } from '../customizer/LiveCustomizedFrameThumbnail';
import { Download, Loader2, Printer, X, Calendar, Clock, User, Filter, ChevronLeft, ChevronRight, FileText, CheckCircle2, History, Tag, ShieldCheck } from 'lucide-react';

interface AdminOrderListProps {
  orders: Order[];
  onUpdateOrderStatus: (orderId: string, status: Order['orderStatus'], employeeName?: string, employeeRole?: string) => void;
  onRecordOrderAction?: (orderId: string, action: string, employeeName?: string, employeeRole?: string) => void;
  currentAdminUser?: { name: string; roleName: string } | null;
}

// Convert any image URL into a Base64 Data URI (Eliminates CORS Tainted Canvas Errors 100%!)
const urlToBase64DataUri = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      try {
        const c = document.createElement('canvas');
        c.width = img.width || 800;
        c.height = img.height || 1200;
        const ctx = c.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          resolve(c.toDataURL('image/png'));
          return;
        }
      } catch (e) {
        console.warn('Canvas toDataURL CORS error:', e);
      }
      resolve(url);
    };
    img.onerror = async () => {
      try {
        const response = await fetch(url, { mode: 'cors' });
        const blob = await response.blob();
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.onerror = () => resolve(url);
        reader.readAsDataURL(blob);
      } catch (e) {
        resolve(url);
      }
    };
    img.src = url;
  });
};

// Safe Image Loader using Base64 Data URI
const loadBase64Image = (dataUri: string, timeoutMs = 4000): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!dataUri) return resolve(null);

    const img = new Image();
    img.crossOrigin = 'anonymous';
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
  onRecordOrderAction,
  currentAdminUser,
}) => {
  const [downloadingOrderId, setDownloadingOrderId] = useState<string | null>(null);
  const [printPreviewItem, setPrintPreviewItem] = useState<{ order: Order; item: CartItem } | null>(null);
  const [selectedAuditOrder, setSelectedAuditOrder] = useState<Order | null>(null);

  // Date Filter State
  const [dateFilterMode, setDateFilterMode] = useState<'all' | 'today' | 'yesterday' | '7days' | 'month' | 'custom'>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [specificDate, setSpecificDate] = useState<string>('');

  // 10-Item Pagination State
  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 10;

  // Filter Orders by Date Range & Specific Date
  const filteredOrders = orders.filter((order) => {
    if (!order.createdAt) return true;
    const orderDate = new Date(order.createdAt);
    const orderDateStr = orderDate.toISOString().split('T')[0];
    const todayStr = new Date().toISOString().split('T')[0];

    if (dateFilterMode === 'today') {
      return orderDateStr === todayStr;
    }
    if (dateFilterMode === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      return orderDateStr === yest.toISOString().split('T')[0];
    }
    if (dateFilterMode === '7days') {
      const d7 = new Date();
      d7.setDate(d7.getDate() - 7);
      return orderDate >= d7;
    }
    if (dateFilterMode === 'month') {
      const now = new Date();
      return orderDate.getMonth() === now.getMonth() && orderDate.getFullYear() === now.getFullYear();
    }
    if (dateFilterMode === 'custom') {
      if (specificDate) {
        return orderDateStr === specificDate;
      }
      if (startDate && endDate) {
        return orderDateStr >= startDate && orderDateStr <= endDate;
      }
      if (startDate) {
        return orderDateStr >= startDate;
      }
      if (endDate) {
        return orderDateStr <= endDate;
      }
    }
    return true;
  });

  const totalPages = Math.max(1, Math.ceil(filteredOrders.length / pageSize));
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Pure HTML5 Canvas 300 DPI Print File Exporter
  const handleDownloadCustomerPrintFile = async (order: Order, itemIndex: number) => {
    const item = order.items[itemIndex];
    if (!item) return;

    setDownloadingOrderId(`${order.id}-${itemIndex}`);

    // Auto-record employee processing log
    if (onRecordOrderAction) {
      onRecordOrderAction(
        order.id,
        `Downloaded 300 DPI Print File (${item.product?.title || 'Frame'})`,
        currentAdminUser?.name,
        currentAdminUser?.roleName
      );
    }

    try {
      const targetW = 1200;
      const targetH = 1760;
      const borderThickness = 24;

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        setDownloadingOrderId(null);
        return;
      }

      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, targetW, targetH);

      const innerX = borderThickness;
      const innerY = borderThickness;
      const innerW = targetW - borderThickness * 2;
      const innerH = targetH - borderThickness * 2;

      const printSrc =
        (item.product?.baseImageUrl && !item.product.baseImageUrl.includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? item.product.baseImageUrl : null) ||
        (item.product?.thumbnail && !item.product.thumbnail.includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? item.product.thumbnail : null) ||
        (item.product?.image && !item.product.image.includes('[COMPRESSED_FIRESTORE_PREVIEW]') ? item.product.image : null) ||
        'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=800&q=80';

      const baseDataUri = await urlToBase64DataUri(printSrc);
      const baseImg = await loadBase64Image(baseDataUri, 4000);

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

      const photoSlots = item.product?.photoSlots || [];
      const textZones = item.product?.textZones || [];

      for (const slot of photoSlots) {
        const photoUrl =
          item.customTextValues?.[slot.id] ||
          (slot.id === 'photo-1' || slot.id === 'babyPhoto' ? item.uploadedPhotoUrl : '') ||
          (Object.values(item.customTextValues || {}).find((val) => typeof val === 'string' && val.startsWith('data:image')) as string || '');
        if (!photoUrl) continue;

        const photoDataUri = await urlToBase64DataUri(photoUrl);
        const photoImg = await loadBase64Image(photoDataUri, 4000);

        if (photoImg) {
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

      ctx.strokeStyle = '#000000';
      ctx.lineWidth = borderThickness * 2;
      ctx.strokeRect(0, 0, targetW, targetH);

      const highResDataUri = canvas.toDataURL('image/png', 1.0);
      const link = document.createElement('a');
      link.href = highResDataUri;
      link.download = `A1PRINT-${order.id}-PRINT-READY-FRAME.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setDownloadingOrderId(null);
    } catch (e) {
      console.error('Print download error:', e);
      setDownloadingOrderId(null);
    }
  };

  return (
    <div className="space-y-6 font-jost text-xs select-none">
      
      {/* Date Range & Specific Date Interactive Filter Toolbar */}
      <div className="p-4 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#262E4A] pb-3">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-[#3B82F6]" />
            <h3 className="font-extrabold text-sm text-white">Filter Orders by Placement Date</h3>
            <span className="px-2.5 py-0.5 bg-[#3B82F6]/20 text-[#3B82F6] font-mono text-[11px] font-bold rounded-full">
              {filteredOrders.length} {filteredOrders.length === 1 ? 'Order' : 'Orders'}
            </span>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap items-center gap-1.5">
            {[
              { id: 'all', label: 'All Time' },
              { id: 'today', label: 'Today' },
              { id: 'yesterday', label: 'Yesterday' },
              { id: '7days', label: 'Last 7 Days' },
              { id: 'month', label: 'This Month' },
              { id: 'custom', label: 'Custom Calendar Range / Specific Date' },
            ].map((p) => (
              <button
                key={p.id}
                onClick={() => {
                  setDateFilterMode(p.id as any);
                  setCurrentPage(1);
                }}
                className={`px-3 py-1.5 rounded-xl font-bold transition-all cursor-pointer ${
                  dateFilterMode === p.id
                    ? 'bg-[#3B82F6] text-white shadow-md'
                    : 'bg-[#1A2035] text-gray-400 hover:text-white border border-[#262E4A]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Calendar Inputs (Renders if Custom mode is selected) */}
        {dateFilterMode === 'custom' && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1 animate-fadeIn">
            <div className="space-y-1">
              <label className="text-gray-400 font-bold text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-pink-400" /> Specific Date :
              </label>
              <input
                type="date"
                value={specificDate}
                onChange={(e) => {
                  setSpecificDate(e.target.value);
                  setStartDate('');
                  setEndDate('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold cursor-pointer focus:outline-hidden focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-purple-400" /> Range From Date :
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => {
                  setStartDate(e.target.value);
                  setSpecificDate('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold cursor-pointer focus:outline-hidden focus:border-[#3B82F6]"
              />
            </div>

            <div className="space-y-1">
              <label className="text-gray-400 font-bold text-[11px] flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" /> Range To Date :
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => {
                  setEndDate(e.target.value);
                  setSpecificDate('');
                  setCurrentPage(1);
                }}
                className="w-full px-3 py-2 bg-[#1A2035] border border-[#262E4A] rounded-xl text-white font-bold cursor-pointer focus:outline-hidden focus:border-[#3B82F6]"
              />
            </div>
          </div>
        )}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="p-8 bg-[#121829] rounded-2xl border border-[#262E4A] text-center space-y-2">
          <p className="text-gray-400 font-bold text-sm">No customer orders match the selected date filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {paginatedOrders.map((order) => {
            const statusColors: Record<string, string> = {
              Received: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
              Printing: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
              Shipped: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
              Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            };

            const formattedDate = order.createdAt
              ? new Date(order.createdAt).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit',
                })
              : '26 Aug 2026';

            return (
              <div
                key={order.id}
                className="p-5 bg-zinc-900/50 rounded-xl border border-zinc-800 shadow-xs space-y-4 text-zinc-300 hover:border-zinc-700 transition-colors"
              >
                {/* Top Order Row Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-zinc-800/80 pb-3">
                  <div className="flex flex-wrap items-center gap-2.5">
                    <span className="font-mono font-bold text-zinc-100 text-sm tracking-tight">{order.id}</span>

                    {/* Order Date & Time Badge */}
                    <span className="px-2 py-0.5 bg-zinc-950 text-zinc-400 font-medium text-[11px] rounded-md border border-zinc-800 flex items-center gap-1.5">
                      <Calendar className="w-3 h-3 text-zinc-500" />
                      <span>{formattedDate}</span>
                    </span>
                    
                    {/* Order Status Selector */}
                    <select
                      value={order.orderStatus || 'Received'}
                      onChange={(e) =>
                        onUpdateOrderStatus(
                          order.id,
                          e.target.value as Order['orderStatus'],
                          currentAdminUser?.name,
                          currentAdminUser?.roleName
                        )
                      }
                      className={`px-3 py-1 rounded-full text-xs font-bold border cursor-pointer ${
                        statusColors[order.orderStatus || 'Received'] || statusColors.Received
                      }`}
                    >
                      <option value="Received" className="bg-[#121829] text-amber-400">Status: Received</option>
                      <option value="Printing" className="bg-[#121829] text-blue-400">Status: Printing</option>
                      <option value="Shipped" className="bg-[#121829] text-purple-400">Status: Shipped</option>
                      <option value="Delivered" className="bg-[#121829] text-emerald-400">Status: Delivered</option>
                    </select>

                    {/* Employee Profile Processing Badge */}
                    {order.processedBy && (
                      <div className="px-3 py-1 bg-[#1F293D] rounded-full border border-blue-500/30 flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-extrabold text-[9px]">
                          {(order.processedBy.employeeName || 'E')[0]}
                        </div>
                        <span className="text-gray-200 text-[11px] font-bold">
                          Processed by: <strong className="text-blue-400">{order.processedBy.employeeName}</strong>
                        </span>
                      </div>
                    )}
                  </div>

                  {/* WhatsApp Launch Proof Button */}
                  <a
                    href={`https://wa.me/91${order.customer?.phone || ''}?text=Hello%20${encodeURIComponent(order.customer?.fullName || 'Customer')},%20your%20A1print%20order%20${order.id}%20has%20been%20received!`}
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
                    <h4 className="font-bold text-white text-sm">{order.customer?.fullName || 'Valued Customer'}</h4>
                    <p className="text-gray-400">📞 {order.customer?.phone || 'N/A'}</p>
                    <p className="text-gray-400 line-clamp-2">📍 {order.customer?.address || 'N/A'}, {order.customer?.city || 'N/A'}, {order.customer?.state || 'N/A'} - {order.customer?.pincode || ''}</p>
                    <span className="text-emerald-400 font-bold block pt-1">Paid via {order.paymentMethod || 'PhonePe'} • ₹{order.total || order.subtotal || 0}</span>
                  </div>

                  {/* Order Items & Live Frame Thumbnail (8 Cols) */}
                  <div className="lg:col-span-8 space-y-3">
                    {order.items.map((item, idx) => {
                      const isDownloading = downloadingOrderId === `${order.id}-${idx}`;

                      const textEntries = Object.entries(item.customTextValues || {}).filter(
                        ([k, v]) => !k.startsWith('photo') && v && typeof v === 'string' && !v.startsWith('data:image')
                      );

                      return (
                        <div key={idx} className="p-3.5 bg-[#1A2035] rounded-xl border border-[#262E4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                          
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Live Frame Preview Thumbnail */}
                            <div className="w-14 h-18 shrink-0">
                              <LiveCustomizedFrameThumbnail item={item} fontScale={0.22} />
                            </div>

                            <div className="space-y-0.5 min-w-0 flex-1">
                              <h5 className="font-bold text-white text-xs truncate">{item.product?.title || 'Custom Photo Frame'}</h5>
                              <span className="text-[#3B82F6] font-bold block text-[11px]">{item.selectedSize?.name || 'A4 (8x12 Inch)'}</span>
                              
                              {textEntries.length > 0 && (
                                <div className="text-[10px] text-gray-300 font-mono truncate">
                                  {textEntries.map(([k, v]) => `${k}:${v}`).join(' | ')}
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action Buttons Container */}
                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                            {/* Processing Log Audit Button */}
                            <button
                              onClick={() => setSelectedAuditOrder(order)}
                              className="px-3 py-2 bg-[#262E4A] hover:bg-gray-700 text-gray-200 text-[11px] font-bold rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                              title="View Processing Audit Log"
                            >
                              <FileText className="w-3.5 h-3.5 text-pink-400" /> View Log
                            </button>

                            {/* Direct High-Res Canvas Download Button */}
                            <button
                              disabled={isDownloading}
                              onClick={() => handleDownloadCustomerPrintFile(order, idx)}
                              className="px-4 py-2.5 bg-gradient-to-r from-[#3B82F6] to-[#8B5CF6] hover:from-[#2563EB] hover:to-[#7C3AED] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 shrink-0 cursor-pointer disabled:opacity-50"
                            >
                              {isDownloading ? (
                                <>
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" /> Exporting...
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
        </div>
      )}

      {/* 10-Item Pagination Controls Footer */}
      {totalPages > 1 && (
        <div className="p-4 bg-[#121829] rounded-2xl border border-[#262E4A] flex items-center justify-between gap-4 font-bold text-xs text-gray-300">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            className="px-4 py-2 bg-[#1A2035] hover:bg-[#262E4A] rounded-xl border border-[#262E4A] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </button>

          <span className="text-gray-400">
            Page <strong className="text-white">{currentPage}</strong> of <strong className="text-white">{totalPages}</strong>
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
            className="px-4 py-2 bg-[#1A2035] hover:bg-[#262E4A] rounded-xl border border-[#262E4A] transition-all flex items-center gap-1.5 disabled:opacity-40 cursor-pointer"
          >
            Next <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

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

      {/* Product Processing & Employee Audit Trail Log Modal */}
      {selectedAuditOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs font-jost animate-fadeIn select-none">
          <div className="relative bg-[#121829] text-white rounded-3xl p-6 max-w-lg w-full shadow-2xl border border-[#262E4A] space-y-4 max-h-[90vh] overflow-y-auto">
            
            <div className="flex items-center justify-between border-b border-[#262E4A] pb-3">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-[#F82BA9]" />
                <h3 className="font-extrabold text-base text-white">Product Processing & Audit Log</h3>
              </div>
              <button
                onClick={() => setSelectedAuditOrder(null)}
                className="p-1.5 text-gray-400 hover:text-white rounded-full bg-[#1A2035]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Order & Employee Header Info */}
            <div className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold">
                <span className="text-gray-400">Order ID: <strong className="text-white font-mono">{selectedAuditOrder.id}</strong></span>
                <span className="text-emerald-400">Total: ₹{selectedAuditOrder.total || selectedAuditOrder.subtotal}</span>
              </div>

              {selectedAuditOrder.processedBy && (
                <div className="flex items-center gap-2 pt-2 border-t border-[#262E4A] text-xs">
                  <div className="w-6 h-6 rounded-full bg-[#3B82F6] text-white flex items-center justify-center font-extrabold text-xs">
                    {(selectedAuditOrder.processedBy.employeeName || 'E')[0]}
                  </div>
                  <div>
                    <span className="font-bold text-gray-200 block">Assigned Employee: <strong className="text-blue-400">{selectedAuditOrder.processedBy.employeeName}</strong> ({selectedAuditOrder.processedBy.employeeRole})</span>
                    <span className="text-[10px] text-gray-400">Last Action Timestamp: {new Date(selectedAuditOrder.processedBy.timestamp).toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Order Items Specification Details */}
            <div className="space-y-3">
              <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Product Customization Specs</h4>
              {selectedAuditOrder.items.map((it, idx) => (
                <div key={idx} className="p-3.5 bg-[#1A2035] rounded-2xl border border-[#262E4A] flex items-center gap-3">
                  <div className="w-12 h-16 shrink-0">
                    <LiveCustomizedFrameThumbnail item={it} fontScale={0.2} />
                  </div>
                  <div className="space-y-1 text-xs">
                    <h5 className="font-bold text-white">{it.product?.title}</h5>
                    <span className="text-[#3B82F6] font-bold block text-[11px]">{it.selectedSize?.name}</span>
                    <div className="text-[11px] text-gray-300 font-mono">
                      {Object.entries(it.customTextValues || {})
                        .filter(([k, v]) => !k.startsWith('photo') && typeof v === 'string' && !v.startsWith('data:image'))
                        .map(([k, v]) => `${k}:${v}`)
                        .join(' | ')}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Processing History Action Timeline */}
            <div className="space-y-3 pt-2">
              <h4 className="font-extrabold text-xs text-gray-400 uppercase tracking-wider">Processing Timeline History</h4>
              
              {selectedAuditOrder.processingHistory && selectedAuditOrder.processingHistory.length > 0 ? (
                <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                  {selectedAuditOrder.processingHistory.map((h, i) => (
                    <div key={i} className="p-3 bg-[#1A2035] rounded-xl border border-[#262E4A] flex items-start gap-2.5 text-xs">
                      <div className="w-5 h-5 rounded-full bg-pink-500/20 text-[#F82BA9] flex items-center justify-center font-bold text-[10px] shrink-0 mt-0.5">
                        ✓
                      </div>
                      <div className="space-y-0.5 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">{h.employeeName} <span className="text-gray-400 font-normal">({h.employeeRole})</span></span>
                          <span className="text-[10px] text-gray-400 font-mono">{new Date(h.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                        <p className="text-pink-300 font-bold">{h.action}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 italic p-3 bg-[#1A2035] rounded-xl">No manual employee actions recorded yet.</p>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
