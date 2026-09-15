import React, { useState, useEffect } from 'react';
import { UniversalFrameTemplate } from '../../../types/template';
import { firebaseCloudDb } from '../../../config/firebase';
import { Plus, Copy, Check, Trash2, Edit3, Image as ImageIcon, Layers } from 'lucide-react';

interface FrameLibraryViewProps {
  onNewFrame: () => void;
  onEditTemplate: (template: UniversalFrameTemplate) => void;
  onOpenAdvancedImageImport?: () => void;
}

export const FrameLibraryView: React.FC<FrameLibraryViewProps> = ({
  onNewFrame,
  onEditTemplate,
  onOpenAdvancedImageImport,
}) => {
  const [templates, setTemplates] = useState<UniversalFrameTemplate[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const loadTemplates = async () => {
    setIsLoading(true);
    try {
      const list = await firebaseCloudDb.getCollection<UniversalFrameTemplate>('universal_templates');
      list.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setTemplates(list);
    } catch (err) {
      console.warn('Failed to load templates from Firestore:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const handleCopyId = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleDeleteTemplate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await firebaseCloudDb.deleteDocument('universal_templates', id);
      setTemplates((prev) => prev.filter((t) => t.id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Failed to delete template:', err);
    }
  };

  const filteredTemplates = templates.filter((t) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (t.title || '').toLowerCase().includes(q) ||
      (t.id || '').toLowerCase().includes(q) ||
      (t.category || '').toLowerCase().includes(q)
    );
  });

  return (
    <div className="flex flex-col min-h-[calc(100vh-64px)] bg-slate-950 font-jost text-white p-6 select-none">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2.5 bg-gradient-to-tr from-pink-500/20 to-purple-500/20 border border-pink-500/30 rounded-2xl text-pink-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">Frame Template Library</h1>
              <p className="text-xs text-slate-400">
                PSD-Powered Custom Photo Frames. Manage your print frame layer templates.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {/* Primary Action Button */}
          <button
            onClick={onNewFrame}
            className="flex-1 sm:flex-initial px-5 py-2.5 bg-gradient-to-r from-[#F82BA9] to-[#D61B90] hover:brightness-110 text-white font-extrabold text-sm rounded-xl shadow-lg shadow-pink-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>+ New Frame</span>
          </button>
        </div>
      </div>

      {/* Filter / Search Bar */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by frame title, ID (tmpl-...) or category..."
          className="px-4 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-pink-500 w-full sm:w-80"
        />

        <div className="text-xs text-slate-400 font-medium">
          Total Templates: <strong className="text-pink-400">{templates.length}</strong>
        </div>
      </div>

      {/* Template Grid */}
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        </div>
      ) : filteredTemplates.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-20 text-center max-w-md mx-auto">
          <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500 mb-4">
            <ImageIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-white mb-1">No Frame Templates Found</h3>
          <p className="text-xs text-slate-400 mb-6">
            Upload your first Adobe Photoshop (.PSD) file to automatically generate a custom photo frame template with real layers.
          </p>
          <button
            onClick={onNewFrame}
            className="px-6 py-2.5 bg-gradient-to-r from-[#F82BA9] to-[#D61B90] hover:brightness-110 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-2 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Your First Frame</span>
          </button>

          {onOpenAdvancedImageImport && (
            <button
              onClick={onOpenAdvancedImageImport}
              className="mt-4 text-[11px] text-slate-500 hover:text-pink-400 transition-colors cursor-pointer"
            >
              Advanced: Import from Image (Beta)
            </button>
          )}
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredTemplates.map((t) => {
            const isCopied = copiedId === t.id;
            const isDeleting = deleteConfirmId === t.id;
            const photoSlotsCount = t.photoSlots?.length || 0;
            const textZonesCount = t.textZones?.length || 0;
            const isPublished = t.status === 'published';

            return (
              <div
                key={t.id}
                onClick={() => onEditTemplate(t)}
                className="group relative bg-slate-900 border border-slate-800 hover:border-pink-500/50 rounded-2xl overflow-hidden shadow-lg transition-all hover:shadow-pink-500/10 cursor-pointer flex flex-col"
              >
                {/* Thumbnail Preview */}
                <div className="relative aspect-[3/4] bg-slate-950 flex items-center justify-center overflow-hidden">
                  {t.cleanBaseImageUrl || t.baseImageUrl ? (
                    <img
                      src={t.cleanBaseImageUrl || t.baseImageUrl}
                      alt={t.title}
                      className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="text-slate-600 flex flex-col items-center gap-1 text-xs">
                      <ImageIcon className="w-6 h-6" />
                      <span>No Artwork</span>
                    </div>
                  )}

                  {/* Status Badge */}
                  <div className="absolute top-2.5 left-2.5">
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold uppercase tracking-wider ${
                        isPublished
                          ? 'bg-emerald-500/90 text-white shadow-xs'
                          : 'bg-amber-500/90 text-slate-950 font-black'
                      }`}
                    >
                      {isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>

                  {/* Source Badge */}
                  <div className="absolute top-2.5 right-2.5">
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-slate-900/80 backdrop-blur-xs text-slate-300 border border-slate-700">
                      {t.importSource === 'psd' ? 'PSD Layered' : t.importSource === 'ai-image' ? 'AI Scanned' : 'Manual'}
                    </span>
                  </div>
                </div>

                {/* Info Content */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <h3 className="font-extrabold text-sm text-white line-clamp-1 group-hover:text-pink-400 transition-colors">
                      {t.title}
                    </h3>
                    <p className="text-[11px] text-slate-400 capitalize mt-0.5">
                      {t.category?.replace(/[_-]/g, ' ') || 'General Frame'}
                    </p>
                  </div>

                  {/* Template ID with 1-Click Copy */}
                  <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                    <div className="flex items-center gap-1.5 font-mono text-[11px] text-slate-300">
                      <span className="text-slate-500">ID:</span>
                      <span className="font-bold text-pink-300">{t.id}</span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => handleCopyId(t.id, e)}
                      className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                        isCopied
                          ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white hover:border-slate-600'
                      }`}
                      title="Copy Template ID for Product Linking"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>

                  {/* Layer Counts & Action Buttons */}
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <div className="flex items-center gap-2">
                      <span className="text-cyan-400 font-semibold">{photoSlotsCount} Slots</span>
                      <span>•</span>
                      <span className="text-purple-400 font-semibold">{textZonesCount} Texts</span>
                    </div>

                    <div className="flex items-center gap-1">
                      {isDeleting ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => handleDeleteTemplate(t.id, e)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded-md text-[10px] font-bold"
                          >
                            Delete
                          </button>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteConfirmId(null);
                            }}
                            className="px-1.5 py-1 bg-slate-800 text-slate-400 rounded-md text-[10px]"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteConfirmId(t.id);
                          }}
                          className="p-1.5 text-slate-500 hover:text-red-400 rounded-lg hover:bg-slate-800 transition-colors"
                          title="Delete Template"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer link for Advanced Image Import */}
      {templates.length > 0 && onOpenAdvancedImageImport && (
        <div className="mt-12 pt-6 border-t border-slate-900 flex items-center justify-between text-xs text-slate-500">
          <span>A1print Studio PSD Layer Engine v4.0</span>
          <button
            onClick={onOpenAdvancedImageImport}
            className="hover:text-pink-400 transition-colors cursor-pointer"
          >
            Advanced: Import from Flat Image (Beta)
          </button>
        </div>
      )}
    </div>
  );
};
