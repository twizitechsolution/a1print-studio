import React, { useState } from 'react';
import { Bell, MessageSquare, Mail, Send, CheckCircle2 } from 'lucide-react';

export const AdminNotificationDesk: React.FC = () => {
  const [whatsappTemplate, setWhatsappTemplate] = useState(
    'Hello {customer_name}, your A1print order {order_id} has been received and sent to printing! We will notify you when shipped. Track here: {tracking_link}'
  );
  const [testPhone, setTestPhone] = useState('9876543210');

  const handleTestWhatsApp = () => {
    const msg = encodeURIComponent(whatsappTemplate.replace('{customer_name}', 'Rahul').replace('{order_id}', 'ORD-849201').replace('{tracking_link}', 'https://a1print-studio.vercel.app/my-orders'));
    window.open(`https://wa.me/91${testPhone}?text=${msg}`, '_blank');
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <Bell className="w-5 h-5 text-emerald-400" /> Notifications & WhatsApp Desk
          </h3>
          <p className="text-xs text-gray-400">Configure automated order confirmation templates for WhatsApp, SMS, and Email.</p>
        </div>
      </div>

      {/* WhatsApp Order Notification Template */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-emerald-400" /> WhatsApp Order Confirmation Template
        </h4>
        <div className="space-y-3">
          <textarea
            rows={3}
            value={whatsappTemplate}
            onChange={(e) => setWhatsappTemplate(e.target.value)}
            className="w-full bg-[#1A2035] border border-[#262E4A] p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden font-mono"
          />

          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <input
                type="text"
                placeholder="Test Phone Number"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="bg-[#1A2035] border border-[#262E4A] px-3 py-1.5 rounded-xl text-xs text-white font-mono"
              />
              <button
                onClick={handleTestWhatsApp}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
              >
                <Send className="w-3.5 h-3.5" /> Test WhatsApp Dispatch
              </button>
            </div>
            <span className="text-[11px] text-emerald-400 font-bold">Variables: {"{customer_name}"}, {"{order_id}"}, {"{tracking_link}"}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
