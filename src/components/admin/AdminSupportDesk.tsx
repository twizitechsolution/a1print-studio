import React, { useState } from 'react';
import { SupportTicket } from '../../types';
import { useCartStore } from '../../store/useCartStore';
import { MessageSquare, CheckCircle2, Clock, AlertTriangle, Send, Image as ImageIcon, Search, ShieldCheck } from 'lucide-react';

export const AdminSupportDesk: React.FC = () => {
  const { supportTickets, updateSupportTicketStatus } = useCartStore();
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [replyInputs, setReplyInputs] = useState<Record<string, string>>({});
  const [savedTicketIds, setSavedTicketIds] = useState<Record<string, boolean>>({});

  const filteredTickets = supportTickets.filter((t) => {
    if (filterStatus !== 'All' && t.status !== filterStatus) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNumber = t.ticketNumber.toLowerCase().includes(q);
      const matchOrder = t.orderId.toLowerCase().includes(q);
      const matchCustomer = t.customerName.toLowerCase().includes(q);
      const matchIssue = t.issueType.toLowerCase().includes(q);
      return matchNumber || matchOrder || matchCustomer || matchIssue;
    }
    return true;
  });

  const handleSendReply = (ticketId: string, currentStatus: SupportTicket['status']) => {
    const replyText = replyInputs[ticketId] !== undefined ? replyInputs[ticketId] : '';
    const newStatus = currentStatus === 'Pending' ? 'In Review' : currentStatus;
    updateSupportTicketStatus(ticketId, newStatus, replyText);
    setSavedTicketIds((prev) => ({ ...prev, [ticketId]: true }));
    setTimeout(() => {
      setSavedTicketIds((prev) => ({ ...prev, [ticketId]: false }));
    }, 3000);
  };

  return (
    <div className="space-y-6 font-sans select-none">
      
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b dark:border-zinc-800 border-slate-200 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight dark:text-zinc-100 text-slate-900 flex items-center gap-2">
            🎧 Help Desk & Customer Support Tickets ({supportTickets.length})
          </h2>
          <p className="text-xs dark:text-zinc-400 text-slate-500">
            Manage customer complaints, transit damage reports, print quality queries, and reply in real-time.
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2">
          {['All', 'Pending', 'In Review', 'Resolved'].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filterStatus === st
                  ? 'bg-purple-600 text-white shadow-xs'
                  : 'dark:bg-zinc-900 bg-slate-100 dark:text-zinc-400 text-slate-600 hover:text-slate-900'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Field */}
      <div className="relative max-w-md">
        <input
          type="text"
          placeholder="Search by Ticket #, Order ID, or Customer Name..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-4 py-2 bg-white dark:bg-zinc-900 border dark:border-zinc-800 border-slate-300 rounded-xl text-xs font-medium dark:text-zinc-100 text-slate-900 focus:outline-none"
        />
        <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-2.5" />
      </div>

      {/* Tickets List */}
      {filteredTickets.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-zinc-900/40 rounded-2xl border dark:border-zinc-800 border-slate-200 text-zinc-400 text-xs font-medium">
          No customer support tickets found matching criteria.
        </div>
      ) : (
        <div className="space-y-4">
          {filteredTickets.map((t) => (
            <div key={t.id} className="p-5 bg-white dark:bg-zinc-900/40 rounded-2xl border dark:border-zinc-800 border-slate-200 space-y-4 shadow-xs">
              
              {/* Ticket Top Row */}
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b dark:border-zinc-800 border-slate-100 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-purple-600 dark:text-purple-400 font-mono">{t.ticketNumber}</span>
                    <span className="text-xs font-mono dark:text-zinc-400 text-slate-500">For Order: <strong>{t.orderId}</strong></span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold border ${
                      t.status === 'Resolved' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30' :
                      t.status === 'In Review' ? 'bg-amber-500/10 text-amber-500 border-amber-500/30' :
                      'bg-rose-500/10 text-rose-500 border-rose-500/30'
                    }`}>
                      {t.status}
                    </span>
                  </div>
                  <p className="text-xs dark:text-zinc-300 text-slate-800 font-semibold">
                    Customer: <strong>{t.customerName}</strong> ({t.customerPhone} | {t.customerEmail})
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <select
                    value={t.status}
                    onChange={(e) => updateSupportTicketStatus(t.id, e.target.value as any)}
                    className="px-3 py-1 text-xs font-bold rounded-lg border dark:bg-zinc-950 bg-slate-100 dark:border-zinc-800 border-slate-300 dark:text-zinc-100 text-slate-800 cursor-pointer"
                  >
                    <option value="Pending">🔴 Status: Pending</option>
                    <option value="In Review">🟠 Status: In Review</option>
                    <option value="Resolved">🟢 Status: Resolved</option>
                    <option value="Closed">⚪ Status: Closed</option>
                  </select>
                </div>
              </div>

              {/* Issue Category & Description */}
              <div className="space-y-2">
                <span className="text-xs font-bold text-rose-500 dark:text-rose-400 uppercase tracking-wider block">
                  Issue: {t.issueType}
                </span>
                <p className="text-xs dark:text-zinc-200 text-slate-800 font-medium bg-slate-50 dark:bg-zinc-950/60 p-3 rounded-xl border dark:border-zinc-800/60 border-slate-200 leading-relaxed">
                  "{t.description}"
                </p>

                {/* Uploaded Damage Proof Photos */}
                {t.images && t.images.length > 0 && (
                  <div className="space-y-1 pt-1">
                    <span className="text-[11px] font-bold text-zinc-400 block">📷 Uploaded Proof Images:</span>
                    <div className="flex items-center gap-2">
                      {t.images.map((imgUrl, i) => (
                        <a key={i} href={imgUrl} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-xl border border-gray-300 overflow-hidden block">
                          <img src={imgUrl} alt={`Proof ${i + 1}`} className="w-full h-full object-cover" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Admin Live Reply Form & Display Box */}
              <div className="p-3 bg-purple-50/50 dark:bg-purple-950/20 rounded-xl border border-purple-100 dark:border-purple-900/30 space-y-2">
                <span className="text-[11px] font-bold text-purple-700 dark:text-purple-300 block">
                  💬 Official Admin Support Response:
                </span>
                
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type official reply for customer (e.g. Free replacement dispatched via BlueDart #BLUEDART-88910)..."
                    value={replyInputs[t.id] !== undefined ? replyInputs[t.id] : t.adminReply || ''}
                    onChange={(e) => setReplyInputs({ ...replyInputs, [t.id]: e.target.value })}
                    className="flex-1 px-3 py-2 text-xs bg-white dark:bg-zinc-900 border dark:border-zinc-800 border-slate-300 rounded-xl dark:text-zinc-100 text-slate-900 focus:outline-none"
                  />
                  <button
                    onClick={() => handleSendReply(t.id, t.status)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
                      savedTicketIds[t.id] ? 'bg-emerald-600 text-white' : 'bg-purple-600 hover:bg-purple-700 text-white'
                    }`}
                  >
                    <Send className="w-3.5 h-3.5" /> {savedTicketIds[t.id] ? 'Reply Sent ✓' : 'Send Reply'}
                  </button>
                </div>
              </div>

            </div>
          ))}
        </div>
      )}

    </div>
  );
};
