import React, { useState } from 'react';
import { CMSBanner, CMSFAQ } from '../../types/admin';
import { FileText, Plus, Trash2, Video, Play, HelpCircle } from 'lucide-react';
import { INITIAL_UGC_VIDEOS, UGCVideoItem } from '../home/ProductsInMotionReel';

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

  const [ugcVideos, setUgcVideos] = useState<UGCVideoItem[]>(INITIAL_UGC_VIDEOS);
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');

  // New UGC Video Reel Form State
  const [newVideoTitle, setNewVideoTitle] = useState('');
  const [newInfluencer, setNewInfluencer] = useState('');
  const [newVideoUrl, setNewVideoUrl] = useState('');
  const [newThumbUrl, setNewThumbUrl] = useState('');

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

  const handleAddVideoReel = () => {
    if (!newVideoTitle.trim() || !newVideoUrl.trim()) return;
    const newVideo: UGCVideoItem = {
      id: `v-${Date.now()}`,
      title: newVideoTitle,
      influencerName: newInfluencer || '@a1print_customer',
      videoUrl: newVideoUrl,
      thumbnailUrl: newThumbUrl || 'https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=400&q=80',
      active: true,
    };

    setUgcVideos([...ugcVideos, newVideo]);
    setNewVideoTitle('');
    setNewInfluencer('');
    setNewVideoUrl('');
    setNewThumbUrl('');
  };

  const toggleVideoActive = (id: string) => {
    setUgcVideos(ugcVideos.map((v) => (v.id === id ? { ...v, active: !v.active } : v)));
  };

  const handleDeleteVideo = (id: string) => {
    setUgcVideos(ugcVideos.filter((v) => v.id !== id));
  };

  return (
    <div className="space-y-6 font-sans">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold tracking-tight dark:text-zinc-100 text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-500" /> Storefront Content Management (CMS)
          </h3>
          <p className="text-xs dark:text-zinc-400 text-slate-500 mt-0.5">Manage PRODUCTS IN MOTION UGC Video Reels, Home Banners, and FAQs.</p>
        </div>
      </div>

      {/* PRODUCTS IN MOTION UGC Video Reel Manager */}
      <div className="p-5 dark:bg-zinc-900/50 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 space-y-4 shadow-xs">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900 flex items-center gap-2">
          <Video className="w-4 h-4 text-pink-500" /> Add New UGC Video Reel (PRODUCTS IN MOTION)
        </h4>

        <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
          <div className="sm:col-span-4">
            <input
              type="text"
              placeholder="Video Title (e.g. 12 Month Frame Unboxing)"
              value={newVideoTitle}
              onChange={(e) => setNewVideoTitle(e.target.value)}
              className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-3">
            <input
              type="text"
              placeholder="Influencer Tag (e.g. @shreya_parenting)"
              value={newInfluencer}
              onChange={(e) => setNewInfluencer(e.target.value)}
              className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>

          <div className="sm:col-span-5">
            <input
              type="text"
              placeholder="Direct Video MP4 / Reel URL"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Cover Thumbnail Image URL (Optional)"
            value={newThumbUrl}
            onChange={(e) => setNewThumbUrl(e.target.value)}
            className="flex-1 dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            onClick={handleAddVideoReel}
            className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white font-semibold text-xs rounded-lg shadow-xs transition-colors cursor-pointer shrink-0"
          >
            Add Video Reel
          </button>
        </div>
      </div>

      {/* Active UGC Video Reels Grid */}
      <div className="p-5 dark:bg-zinc-900/40 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-3">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900">Active Homepage Video Reels ({ugcVideos.length})</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {ugcVideos.map((vid) => (
            <div key={vid.id} className="p-3 dark:bg-zinc-950 bg-slate-50 rounded-lg border dark:border-zinc-800 border-slate-200 flex items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full overflow-hidden shrink-0 border border-pink-300 relative bg-black">
                  <img src={vid.thumbnailUrl} alt={vid.title} className="w-full h-full object-cover" />
                  <Play className="w-4 h-4 fill-white text-white absolute inset-0 m-auto" />
                </div>
                <div className="min-w-0">
                  <h5 className="font-semibold dark:text-zinc-100 text-slate-900 text-xs truncate">{vid.title}</h5>
                  <span className="text-[10px] text-pink-500 font-mono block">{vid.influencerName}</span>
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => toggleVideoActive(vid.id)}
                  className={`px-2 py-0.5 text-[10px] font-bold rounded-md border ${
                    vid.active ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-slate-200 text-slate-500 border-slate-300'
                  }`}
                >
                  {vid.active ? 'Active' : 'Hidden'}
                </button>

                <button
                  onClick={() => handleDeleteVideo(vid.id)}
                  className="p-1 dark:text-red-400 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-md"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Add FAQ Form */}
      <div className="p-5 dark:bg-zinc-900/50 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 space-y-4 shadow-xs">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900 flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-500" /> Add New FAQ Question & Answer
        </h4>
        <div className="space-y-3">
          <input
            type="text"
            placeholder="Question Title (e.g. Can I preview before ordering?)"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 px-3 py-2 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
          />
          <textarea
            rows={2}
            placeholder="Answer Details..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            className="w-full dark:bg-zinc-950 bg-slate-50 border dark:border-zinc-800 border-slate-200 p-3 rounded-lg text-xs dark:text-zinc-100 text-slate-900 placeholder:text-zinc-500 focus:outline-none"
          />
          <button
            onClick={handleAddFaq}
            className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold text-xs rounded-lg shadow-xs transition-colors cursor-pointer"
          >
            Save FAQ Item
          </button>
        </div>
      </div>

      {/* FAQs List */}
      <div className="p-5 dark:bg-zinc-900/40 bg-white rounded-xl border dark:border-zinc-800 border-slate-200 shadow-xs space-y-3">
        <h4 className="font-semibold text-sm dark:text-zinc-100 text-slate-900">Active FAQ Questions ({faqs.length})</h4>
        <div className="divide-y dark:divide-zinc-800/60 divide-slate-200">
          {faqs.map((f) => (
            <div key={f.id} className="py-2.5 space-y-1">
              <div className="flex items-center justify-between">
                <h5 className="font-semibold dark:text-zinc-100 text-slate-900 text-xs">{f.question}</h5>
                <button
                  onClick={() => setFaqs(faqs.filter((q) => q.id !== f.id))}
                  className="p-1 text-red-500 hover:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs dark:text-zinc-400 text-slate-500">{f.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

