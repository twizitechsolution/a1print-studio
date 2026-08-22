import React, { useState } from 'react';
import { Order } from '../types';
import { ShieldCheck, Download, Package, Eye, Phone, MapPin, Search, Calendar, Image as ImageIcon } from 'lucide-react';

interface AdminPageProps {
  orders: Order[];
}

export const AdminPage: React.FC<AdminPageProps> = ({ orders }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.customer.phone.includes(searchTerm);

    const matchesStatus = filterStatus === 'all' || order.orderStatus === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const handleDownloadPhoto = (photoUrl: string, fileName: string = 'customer-upload.png') => {
    const a = document.createElement('a');
    a.href = photoUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 font-sans">
      
      {/* Admin Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-[#160E4B] text-white p-6 rounded-3xl shadow-lg">
        <div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#F82BA9]" />
            <h1 className="font-playfair text-2xl sm:text-3xl font-extrabold">
              Store Operator & Print Studio Portal
            </h1>
          </div>
          <p className="text-xs text-gray-300 mt-1">
            Manage incoming frame orders & download high-resolution customer photos for printing.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/10 px-4 py-2 rounded-xl text-center border border-white/20">
            <span className="text-[10px] text-gray-300 uppercase block font-bold">Total Orders</span>
            <span className="font-extrabold text-lg text-white font-mono">{orders.length}</span>
          </div>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-white p-4 rounded-2xl border border-gray-200 shadow-xs">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Search by Order ID, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9]"
          />
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 font-bold">Status:</span>
          {['all', 'Received', 'Printing', 'Shipped', 'Delivered'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-3 py-1.5 text-xs font-bold font-jost rounded-lg transition-all ${
                filterStatus === status
                  ? 'bg-[#F82BA9] text-white shadow-xs'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {status.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List */}
      {filteredOrders.length === 0 ? (
        <div className="bg-white p-12 rounded-2xl border border-gray-200 text-center text-gray-500 space-y-2">
          <Package className="w-12 h-12 text-gray-300 mx-auto" />
          <h4 className="font-jost font-bold text-base text-gray-800">No Orders Found</h4>
          <p className="text-xs text-gray-500">
            Place an order from the store to test high-resolution photo file downloads!
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredOrders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden"
            >
              {/* Order Card Top Bar */}
              <div className="p-4 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4 text-xs font-jost">
                <div className="flex items-center gap-3">
                  <span className="font-extrabold text-[#160E4B] text-sm">{order.id}</span>
                  <span className="text-gray-400">•</span>
                  <span className="text-gray-600 flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> {new Date(order.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-purple-100 text-purple-800">
                    STATUS: {order.orderStatus}
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-emerald-100 text-emerald-800">
                    {order.paymentMethod} ({order.paymentStatus})
                  </span>
                </div>
              </div>

              {/* Order Details & Customer Info */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Customer Info (4 Cols) */}
                <div className="lg:col-span-4 space-y-2 text-xs text-gray-700 border-r border-gray-100 pr-4">
                  <h4 className="font-bold text-sm text-[#160E4B] mb-2 font-jost">
                    Customer & Shipping Info
                  </h4>
                  <p className="font-bold text-gray-900 text-sm">{order.customer.fullName}</p>
                  <p className="flex items-center gap-1.5 text-gray-600">
                    <Phone className="w-3.5 h-3.5 text-[#F82BA9]" /> {order.customer.phone}
                  </p>
                  <p className="flex items-start gap-1.5 text-gray-600 leading-relaxed">
                    <MapPin className="w-3.5 h-3.5 text-[#F82BA9] shrink-0 mt-0.5" />
                    <span>
                      {order.customer.address}, {order.customer.city}, {order.customer.state} - {order.customer.pincode}
                    </span>
                  </p>
                </div>

                {/* Customized Items & High-Res Download Buttons (8 Cols) */}
                <div className="lg:col-span-8 space-y-4">
                  <h4 className="font-bold text-sm text-[#160E4B] font-jost">
                    Print Order Items & Uploaded Customer Photos
                  </h4>

                  <div className="space-y-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={item.uploadedPhotoUrl || item.product.thumbnail}
                            alt="Order Item"
                            className="w-16 h-20 object-cover rounded-lg border border-gray-300 shrink-0"
                          />
                          <div className="text-xs">
                            <h5 className="font-bold text-[#160E4B]">{item.product.title}</h5>
                            <span className="text-[#F82BA9] font-bold block mt-0.5">
                              Size: {item.selectedSize.name}
                            </span>
                            <span className="text-gray-500 block">
                              Frame: {item.selectedFrame.name}
                            </span>
                            {Object.keys(item.customTextValues).length > 0 && (
                              <div className="mt-1 text-[10px] text-gray-600 bg-white p-1.5 rounded-md border border-gray-200">
                                {Object.entries(item.customTextValues).map(([k, v]) => (
                                  v ? <span key={k} className="mr-2"><strong>{k}:</strong> {v}</span> : null
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        {/* High-Res Photo Download Button */}
                        {item.uploadedPhotoUrl ? (
                          <button
                            onClick={() =>
                              handleDownloadPhoto(
                                item.uploadedPhotoUrl!,
                                `${order.id}-item-${idx + 1}-print.png`
                              )
                            }
                            className="px-4 py-2.5 bg-[#F82BA9] hover:bg-[#D61B90] text-white text-xs font-bold font-jost rounded-xl shadow-xs transition-all flex items-center gap-2 shrink-0"
                          >
                            <Download className="w-4 h-4" /> Download High-Res Print File
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400">No Custom Photo</span>
                        )}
                      </div>
                    ))}
                  </div>

                </div>

              </div>
            </div>
          ))}
        </div>
      )}

    </div>
  );
};
