import React, { useState } from 'react';
import { CMSBanner, CMSFAQ } from '../../types/admin';
import { FileText, Plus, Trash2, Image as ImageIcon, HelpCircle } from 'lucide-react';

export const AdminCMSManager: React.FC = () => {
  const [faqs, setFaqs] = useState<CMSFAQ[]>([
    {
      id: 'q1',
      question: 'What paper quality is used for printing photo frames?',
      answer: 'We use 300 GSM Archival Premium Matte Paper printed with fade-proof museum-grade inks.',
      category: 'customization',
      displayOrder: 1,
    },
    {
      id: 'q2',
      question: 'How long does shipping take?',
      answer: 'Standard shipping takes 3-5 business days pan-India.',
      category: 'shipping',
      displayOrder: 2,
    },
  ]);

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  const handleAddFaq = () => {
    if (!question.trim()) return;
    setFaqs([
      ...faqs,
      {
        id: `q-${Date.now()}`,
        question,
        answer,
        category: 'customization',
        displayOrder: faqs.length + 1,
      },
    ]);
    setQuestion('');
    setAnswer('');
  };

  return (
    <div className="space-y-6 font-jost">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-playfair text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Storefront Content Management (CMS)
          </h3>
          <p className="text-xs text-gray-400">Edit home page promotional banners, How It Works section, and FAQs.</p>
        </div>
      </div>

      {/* Add FAQ Form */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] space-y-4 shadow-xl">
        <h4 className="font-bold text-sm text-white flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" /> Add New FAQ Question & Answer
        </h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Question Title (e.g. Can I preview before ordering?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full bg-[#1A2035] border border-[#262E4A] px-3.5 py-2 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
          />
          <textarea
            rows={2}
            placeholder="Answer Details..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full bg-[#1A2035] border border-[#262E4A] p-3 rounded-xl text-xs text-white placeholder-gray-500 focus:outline-hidden"
          />
          <button
            onClick={handleAddFaq}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-xl shadow-md transition-colors cursor-pointer"
          >
            Save FAQ Item
          </button>
        </div>
      </div>

      {/* FAQs List */}
      <div className="p-5 bg-[#121829] rounded-2xl border border-[#262E4A] shadow-xl space-y-3">
        <h4 className="font-bold text-sm text-white">Active FAQ Questions ({faqs.length})</h4>
        <div className="divide-y divide-[#262E4A]">
          {faqs.map((f) => (
            <div key={f.id} className="py-3 space-y-1">
              <div className="flex items-center justify-between">
                <h5 className="font-bold text-white text-xs">{f.question}</h5>
                <button
                  onClick={() => setFaqs(faqs.filter((q) => q.id !== f.id))}
                  className="p-1 text-rose-400 hover:text-rose-300"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-400">{f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
