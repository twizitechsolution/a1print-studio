import React from 'react';
import { Order } from '../../types';
import { MessageCircle, Phone, Mail, User, ShieldCheck, Clock, ExternalLink, MessageSquare } from 'lucide-react';

interface AdminSupportDeskProps {
  orders: Order[];
}

export const AdminSupportDesk: React.FC<AdminSupportDeskProps> = ({ orders }) => {
  return (
    <div className="space-y-6 font-jost select-none">
      
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-[#121829] p-6 rounded-3xl border border-[#262E4A]">
        <div>
          <h2 className="font-playfair text-2xl sm:text-3xl font-extrabold text-white flex items-center gap-2">
            <MessageSquare className="w-7 h-7 text-emerald-400" /> Customer Support & WhatsApp Desk
          </h2>
          <p className="text-xs text-gray-400 pt-1">
            Direct WhatsApp chat shortcuts and customer inquiry assistance queue.
          </p>
        </div>

        <a
          href="https://wa.me/919583626786"
          target="_blank"
          rel="noopener noreferrer"
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-2xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer"
        >
          <MessageCircle className="w-4 h-4" /> Open Official Admin WhatsApp
        </a>
      </div>

      <div className="bg-[#121829] rounded-3xl border border-[#262E4A] p-6 space-y-4">
        <h3 className="font-bold text-base text-white">Recent Customer Contacts & Order Support Inquiries</h3>

        <div className="space-y-3">
          {orders.map((ord) => (
            <div key={ord.id} className="p-4 bg-[#1A2035] rounded-2xl border border-[#262E4A] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white">{ord.customer.fullName}</span>
                  <span className="text-gray-400 font-mono">({ord.customer.phone})</span>
                  <span className="px-2 py-0.5 bg-purple-500/20 text-purple-300 rounded-md text-[10px] font-bold">
                    Order {ord.id}
                  </span>
                </div>
                <p className="text-gray-400 text-[11px]">{ord.customer.address}, {ord.customer.city} ({ord.customer.pincode})</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <a
                  href={`https://wa.me/91${ord.customer.phone}?text=Hi%20${encodeURIComponent(ord.customer.fullName)},%20regarding%20your%20A1print%20Studio%20order%20${ord.id}:`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 bg-emerald-600/20 hover:bg-emerald-600/40 text-emerald-400 border border-emerald-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <MessageCircle className="w-3.5 h-3.5" /> WhatsApp Customer
                </a>

                <a
                  href={`tel:${ord.customer.phone}`}
                  className="px-3 py-2 bg-[#2563EB]/20 hover:bg-[#2563EB]/40 text-blue-400 border border-blue-500/30 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5" /> Call Phone
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  );
};
