import React, { useState, useRef } from 'react';
import { FileCode, Upload, Check, AlertCircle, Eye, Loader2, X, Layers, Sparkles, FolderArchive } from 'lucide-react';
import { parsePSDFileBinary, PSDImportResult } from '../utils/psdParser';
import { uploadCategoryImage } from '../../../config/firebase';
import { PhotoSlotConfig, TextZoneConfig } from '../../../types/template';

interface StudioPSDImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  category: string;
  onApplyPSDLayers: (params: {
    photoSlots: PhotoSlotConfig[];
    textZones: TextZoneConfig[];
    baseImageUrl?: string;
    originalUploadUrl?: string;
  }) => void;
}

export const StudioPSDImportModal: React.FC<StudioPSDImportModalProps> = ({
  isOpen,
  onClose,
  category,
  onApplyPSDLayers,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isParsing, setIsParsing] = useState<boolean>(false);
  const [parseStep, setParseStep] = useState<string>('');
  const [psdResult, setPsdResult] = useState<PSDImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlots, setSelectedSlots] = useState<Record<string, boolean>>({});
  const [selectedZones, setSelectedZones] = useState<Record<string, boolean>>({});
  const [isUploading, setIsUploading] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check extension
    if (!file.name.toLowerCase().endsWith('.psd')) {
      setError('Please select a valid Adobe Photoshop (.psd) file.');
      return;
    }

    setError(null);
    setSelectedFile(file);
    setIsParsing(true);
    setPsdResult(null);

    try {
      setParseStep('1/3 Reading binary Photoshop header (8BPS)...');
      await new Promise((r) => setTimeout(r, 300));

      setParseStep('2/3 Decoding layer records & bounding boxes...');
      const result = await parsePSDFileBinary(file);

      setParseStep('3/3 Converting layer coordinates to responsive grid...');
      await new Promise((r) => setTimeout(r, 200));

      setPsdResult(result);

      // Default select all
      const slotMap: Record<string, boolean> = {};
      result.photoSlots.forEach((s) => (slotMap[s.id] = true));
      setSelectedSlots(slotMap);

      const zoneMap: Record<string, boolean> = {};
      result.textZones.forEach((z) => (zoneMap[z.id] = true));
      setSelectedZones(zoneMap);
    } catch (err: any) {
      console.error('PSD parsing error:', err);
      setError(err?.message || 'Failed to read Photoshop file. Please ensure it is a valid .psd document.');
    } finally {
      setIsParsing(false);
      setParseStep('');
    }
  };

  const toggleSlot = (id: string) => {
    setSelectedSlots((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleZone = (id: string) => {
    setSelectedZones((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleApply = async () => {
    if (!psdResult) return;

    setIsUploading(true);
    let originalUrl = '';
    try {
      if (selectedFile) {
        // Upload PSD file to Cloudinary / storage for backup audit
        originalUrl = await uploadCategoryImage(category || 'psd-templates', selectedFile, `psd-${Date.now()}`);
      }
    } catch (uploadErr) {
      console.warn('PSD cloud upload warning (continuing with extracted layers):', uploadErr);
    } finally {
      setIsUploading(false);
    }

    const approvedSlots = psdResult.photoSlots.filter((s) => selectedSlots[s.id] !== false);
    const approvedZones = psdResult.textZones.filter((z) => selectedZones[z.id] !== false);

    onApplyPSDLayers({
      photoSlots: approvedSlots,
      textZones: approvedZones,
      originalUploadUrl: originalUrl,
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 w-full max-w-4xl max-h-[92vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-indigo-600/20 border border-blue-500/30 text-blue-400">
              <FileCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-white flex items-center gap-2">
                Adobe Photoshop (PSD) Layer Importer
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/40 uppercase tracking-wider">
                  Phase 3
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Extract native Photoshop layers, smart objects, photo apertures, and typographical text zones.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {error && (
            <div className="p-3.5 rounded-xl bg-red-950/50 border border-red-800/80 text-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {!psdResult && !isParsing ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-700 hover:border-blue-500 rounded-2xl p-12 flex flex-col items-center justify-center text-center cursor-pointer transition-all bg-slate-950/30 hover:bg-blue-500/5 group"
            >
              <div className="p-4 rounded-full bg-slate-800 group-hover:bg-blue-500/20 text-slate-300 group-hover:text-blue-400 transition-colors mb-4">
                <FolderArchive className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-sm text-slate-200 mb-1">
                Drop Photoshop .PSD template here or click to browse
              </h4>
              <p className="text-xs text-slate-400 max-w-md">
                Reads 8BPS Photoshop format directly. Extracts layer names (e.g. "Photo_Arch", "Baby_Name", "Calendar_Zone"), bounding boxes, and styles.
              </p>
              <input
                type="file"
                ref={fileInputRef}
                accept=".psd"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          ) : isParsing ? (
            <div className="p-10 rounded-2xl bg-slate-950/50 border border-slate-800 text-center space-y-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-400 mx-auto" />
              <h5 className="font-bold text-sm text-slate-200">Parsing Photoshop Document...</h5>
              <p className="text-xs font-mono text-blue-300">{parseStep}</p>
            </div>
          ) : psdResult ? (
            <div className="space-y-6">
              {/* Document Overview Topbar */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-500/10 border border-blue-500/30 text-blue-400">
                    <FileCode className="w-6 h-6" />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-200">
                      {selectedFile?.name || 'Photoshop Template'}
                    </h5>
                    <p className="text-xs text-slate-400 font-mono">
                      Canvas: {psdResult.documentDimensions.width} × {psdResult.documentDimensions.height} px | {psdResult.detectedLayerCount} Layers Found
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => {
                    setPsdResult(null);
                    setSelectedFile(null);
                  }}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                >
                  Select Another PSD
                </button>
              </div>

              {/* Extracted Photo Slots */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Layers className="w-4 h-4 text-blue-400" />
                    Extracted Photo Slots ({psdResult.photoSlots.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Check layers to include
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {psdResult.photoSlots.map((slot) => {
                    const isChecked = selectedSlots[slot.id] !== false;
                    return (
                      <div
                        key={slot.id}
                        onClick={() => toggleSlot(slot.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-blue-950/20 border-blue-500/60 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-100">{slot.label}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                              {slot.shape}
                            </span>
                          </div>
                          {slot.sourceLayerName && (
                            <p className="text-[11px] font-mono text-blue-300">
                              Layer: "{slot.sourceLayerName}"
                            </p>
                          )}
                          <p className="text-[10px] font-mono text-slate-500">
                            Pos: X={slot.x}%, Y={slot.y}% | Size: {slot.width}% × {slot.height}%
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Extracted Text & Calendar Zones */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-400" />
                    Extracted Text & Calendar Zones ({psdResult.textZones.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Check layers to include
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {psdResult.textZones.map((zone) => {
                    const isChecked = selectedZones[zone.id] !== false;
                    return (
                      <div
                        key={zone.id}
                        onClick={() => toggleZone(zone.id)}
                        className={`p-3.5 rounded-xl border transition-all cursor-pointer flex items-start justify-between gap-3 ${
                          isChecked
                            ? 'bg-indigo-950/20 border-indigo-500/60 text-white'
                            : 'bg-slate-950/40 border-slate-800 text-slate-400 opacity-60'
                        }`}
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-100">{zone.label}</span>
                            <span
                              className={`text-[10px] uppercase font-mono px-1.5 py-0.5 rounded ${
                                zone.isCalendar
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                  : 'bg-slate-800 text-slate-300'
                              }`}
                            >
                              {zone.type}
                            </span>
                          </div>
                          <p className="text-[11px] text-slate-300 font-serif italic">
                            "{zone.defaultValue}"
                          </p>
                          {zone.sourceLayerName && (
                            <p className="text-[11px] font-mono text-indigo-300">
                              Layer: "{zone.sourceLayerName}"
                            </p>
                          )}
                          <p className="text-[10px] font-mono text-slate-500">
                            Pos: Y={zone.y}%, Font: {zone.fontFamily} {zone.fontSize}px
                          </p>
                        </div>

                        <div
                          className={`w-5 h-5 rounded flex items-center justify-center border transition-colors shrink-0 mt-0.5 ${
                            isChecked
                              ? 'bg-indigo-600 border-indigo-600 text-white'
                              : 'border-slate-600 bg-slate-800'
                          }`}
                        >
                          {isChecked && <Check className="w-3.5 h-3.5" />}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : null}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 flex items-center justify-between bg-slate-950/80">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>

          {psdResult && (
            <button
              onClick={handleApply}
              disabled={isUploading}
              className="px-6 py-2.5 rounded-xl text-xs font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 hover:brightness-110 text-white transition-all shadow-lg flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isUploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Saving & Importing Layers...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Import PSD Layers into Studio
                </>
              )}
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
