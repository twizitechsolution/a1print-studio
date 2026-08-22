import React from 'react';
import { Order } from '../types';
import { LiveCustomizedFrameThumbnail } from '../components/customizer/LiveCustomizedFrameThumbnail';
import { CheckCircle2, ShoppingBag, Truck, Calendar, ArrowRight, ShieldCheck, Download, Package } from 'lucide-react';

interface OrderSuccessPageProps {
  order: Order;
  onNavigate: (page: string) => void;
}

export const OrderSuccessPage: React.FC<OrderSuccessPageProps> = ({
  order,
  onNavigate,
}) => {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-jost select-none">
      
      {/* Success Hero Header Banner */}
      <div className="bg-emerald-600 text-white p-8 rounded-3xl text-center shadow-xl space-y-3">
        <div className="w-16 h-16 bg-white/20 text-white rounded-full flex items-center justify-center mx-auto backdrop-blur-xs">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <h1 className="font-playfair text-3xl sm:text-4xl font-extrabold">Thank you for your order!</h1>
        <p className="text-xs text-emerald-100 max-w-md mx-auto">
          We have received your custom photo frame order <strong className="font-mono text-white">#{order.id}</strong>. Our team will start high-res archival printing right away!
        </p>
      </div>

      {/* Delivery Tracking Bar */}
      <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center justify-between text-xs text-emerald-900 font-bold">
        <div className="flex items-center gap-2">
          <Truck className="w-5 h-5 text-emerald-600" />
          <span>Estimated Delivery to {order.customer.city}: 3-5 Business Days</span>
        </div>
        <span className="bg-emerald-600 text-white px-3 py-1 rounded-full text-[11px]">
          Status: {order.orderStatus}
        </span>
      </div>

      {/* Order Receipt & Customized Items List with Live Frame Artwork */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-gray-200 shadow-xs space-y-6">
        <h3 className="font-bold text-base text-[#160E4B] flex items-center gap-2 border-b border-gray-200 pb-3">
          <ShoppingBag className="w-5 h-5 text-[#F82BA9]" /> Order Receipt & Customized Items
        </h3>

        <div className="space-y-4">
          {order.items.map((item, idx) => {
            const textEntries = Object.entries(item.customTextValues || {}).filter(
              ([k, v]) => !k.startsWith('photo') && v && typeof v === 'string' && !v.startsWith('data:image')
            );

            return (
              <div key={idx} className="p-4 bg-gray-50 rounded-2xl border border-gray-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                
                <div className="flex items-center gap-4">
                  {/* Live Frame Artwork Renderer */}
                  <div className="w-20 h-24 shrink-0">
                    <LiveCustomizedFrameThumbnail item={item} fontScale={0.22} />
                  </div>

                  <div className="space-y-1 text-xs">
                    <h4 className="font-bold text-sm text-[#160E4B]">{item.product.title}</h4>
                    <p className="text-[#F82BA9] font-bold">Size: {item.selectedSize.name}</p>
                    <p className="text-gray-500">Frame Style: {item.selectedFrame.name}</p>
                    
                    {textEntries.length > 0 && (
                      <div className="p-2 bg-white rounded-lg text-[10px] space-y-0.5 mt-2 font-mono text-gray-700 border border-gray-200">
                        {textEntries.map(([k, v]) => (
                          <div key={k}><span className="capitalize">{k}</span>: <strong>{v}</strong></div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                <div className="text-right text-xs">
                  <span className="font-extrabold text-base text-[#160E4B]">₹{item.itemTotalPrice}</span>
                </div>

              </div>
            );
          })}
        </div>

        {/* Billing & Shipping Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-xs">
          <div className="space-y-1">
            <span className="font-bold text-gray-400 block uppercase">Shipping Address:</span>
            <p className="font-bold text-gray-900">{order.customer.fullName}</p>
            <p className="text-gray-600">{order.customer.address}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}</p>
            <p className="text-gray-600">📞 Phone: {order.customer.phone}</p>
          </div>

          <div className="space-y-1 sm:text-right">
            <span className="font-bold text-gray-400 block uppercase">Payment Summary:</span>
            <p className="text-gray-600">Payment Method: <strong className="text-gray-900">{order.paymentMethod}</strong> ({order.paymentStatus})</p>
            <p className="text-gray-600">Subtotal: ₹{order.subtotal}.00</p>
            <p className="font-extrabold text-sm text-[#F82BA9] pt-1">Total Paid: ₹{order.total}.00</p>
          </div>
        </div>

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-6">
          <button
            onClick={() => onNavigate('catalog')}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Continue Shopping <ArrowRight className="w-4 h-4" />
          </button>

          <button
            onClick={() => onNavigate('my-order')}
            className="w-full sm:w-auto px-6 py-3.5 bg-[#160E4B] hover:bg-[#251877] text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            Go to My Account Orders <Package className="w-4 h-4" />
          </button>
        </div>

      </div>

    </div>
  );
};
