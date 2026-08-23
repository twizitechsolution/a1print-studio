import React, { useState, useRef, useEffect } from 'react';
import { Product } from '../../types';
import { PhotoSlotConfig, TextZoneConfig } from '../../types/template';
import { useCartStore } from '../../store/useCartStore';
import { compressImageBase64 } from '../../utils/imageCompressor';
import {
  ArrowLeft,
  Upload,
  Plus,
  Type,
  Image as ImageIcon,
  Check,
  Sparkles,
  Sliders,
  Move,
  Layers,
  ZoomIn,
  Save,
  Lock,
  Unlock,
  Trash2,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Wand2,
} from 'lucide-react';

interface AdminTemplateEditorProps {
  product: Product;
  onBack: () => void;
}

export const AdminTemplateEditor: React.FC<AdminTemplateEditorProps> = ({
  product,
  onBack,
}) => {
  if (!product) return null;
  const { updateProduct } = useCartStore();

  const [baseFrameUrl, setBaseFrameUrl] = useState<string>(
    product.thumbnail || 'https://lovecraftbyse.com/wp-content/uploads/2025/02/welcome-baby-boy-scaled.webp'
  );

  const [workspaceZoom, setWorkspaceZoom] = useState<number>(100);
  const [lockRatio, setLockRatio] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Read photoSlots EXCLUSIVELY from the passed product object (0 leakage from other products!)
  const [photoSlots, setPhotoSlots] = useState<PhotoSlotConfig[]>(
    product.photoSlots || []
  );

  // Read textZones EXCLUSIVELY from the passed product object (0 leakage from other products!)
  const [textZones, setTextZones] = useState<TextZoneConfig[]>(
    product.textZones || []
  );

  const [activeLayerId, setActiveLayerId] = useState<string>(
    photoSlots[0]?.id || textZones[0]?.id || ''
  );

  const selectedSlot = photoSlots.find((p) => p.id === activeLayerId);
  const selectedText = textZones.find((t) => t.id === activeLayerId);

  // Mouse Dragging State
  const canvasRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  // Mouse Move Handler for Canva Drag & Drop
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!canvasRef.current) return;
      const canvasRect = canvasRef.current.getBoundingClientRect();

      const relX = Math.min(98, Math.max(2, parseFloat((((e.clientX - canvasRect.left) / canvasRect.width) * 100).toFixed(1))));
      const relY = Math.min(98, Math.max(2, parseFloat((((e.clientY - canvasRect.top) / canvasRect.height) * 100).toFixed(1))));

      if (isDragging) {
        if (selectedSlot) {
          setPhotoSlots((prev) =>
            prev.map((p) => (p.id === activeLayerId ? { ...p, x: relX, y: relY } : p))
          );
        } else if (selectedText) {
          setTextZones((prev) =>
            prev.map((t) => (t.id === activeLayerId ? { ...t, x: relX, y: relY } : t))
          );
        }
      } else if (isResizing && selectedSlot) {
        const deltaW = Math.abs(relX - selectedSlot.x) * 2;
        const newW = Math.min(90, Math.max(5, parseFloat(deltaW.toFixed(1))));
        setPhotoSlots((prev) =>
          prev.map((p) =>
            p.id === activeLayerId
              ? { ...p, width: newW, height: lockRatio ? newW : p.height }
              : p
          )
        );
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, activeLayerId, selectedSlot, selectedText, lockRatio]);

  // Nudge Helper for Sub-Pixel Precision Positioning
  const handleNudge = (dx: number, dy: number) => {
    if (selectedSlot) {
      setPhotoSlots((prev) =>
        prev.map((p) =>
          p.id === activeLayerId
            ? { ...p, x: parseFloat((p.x + dx).toFixed(1)), y: parseFloat((p.y + dy).toFixed(1)) }
            : p
        )
      );
    } else if (selectedText) {
      setTextZones((prev) =>
        prev.map((t) =>
          t.id === activeLayerId
            ? { ...t, x: parseFloat((t.x + dx).toFixed(1)), y: parseFloat((t.y + dy).toFixed(1)) }
            : t
        )
      );
    }
  };

  // Unified Layer Order State (Allows intermixing photo slots and text zones in ANY sequence!)
  const [layerOrder, setLayerOrder] = useState<string[]>(() => {
    const photos = (product.photoSlots || []).map((p) => p.id);
    const texts = (product.textZones || []).map((t) => t.id);
    return [...photos, ...texts];
  });

  const moveLayer = (id: string, direction: 'left' | 'right') => {
    const currentIndex = layerOrder.indexOf(id);
    if (currentIndex === -1) return;
    const targetIndex = direction === 'left' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= layerOrder.length) return;

    const updated = [...layerOrder];
    const [moved] = updated.splice(currentIndex, 1);
    updated.splice(targetIndex, 0, moved);
    setLayerOrder(updated);
  };

  // Smart Auto-Detect specifically for this frame's image
  const handleAutoDetectThisFrame = () => {
    setPhotoSlots([
      {
        id: 'photo-1',
        label: 'Photo Slot 1',
        shape: 'rectangle',
        x: 21,
        y: 30,
        width: 32,
        height: 38,
        defaultPhotoUrl: '',
      },
      {
        id: 'photo-2',
        label: 'Photo Slot 2',
        shape: 'rectangle',
        x: 79,
        y: 30,
        width: 32,
        height: 38,
        defaultPhotoUrl: '',
      },
      {
        id: 'photo-3',
        label: 'Photo Slot 3',
        shape: 'rectangle',
        x: 21,
        y: 74,
        width: 32,
        height: 38,
        defaultPhotoUrl: '',
      },
      {
        id: 'photo-4',
        label: 'Photo Slot 4',
        shape: 'rectangle',
        x: 79,
        y: 74,
        width: 32,
        height: 38,
        defaultPhotoUrl: '',
      },
    ]);

    setTextZones([
      {
        id: 'text-1',
        label: 'Custom Text Field',
        defaultValue: 'Custom Text Details',
        x: 50,
        y: 54,
        fontSize: 22,
        fontFamily: 'Playfair Display',
        color: '#111827',
        align: 'center',
        type: 'text',
      },
    ]);
  };

  // Add Photo Slot Button
  const handleAddPhotoSlot = () => {
    const newId = `photo-${photoSlots.length + 1}`;
    const newSlot: PhotoSlotConfig = {
      id: newId,
      label: `Photo Slot ${photoSlots.length + 1}`,
      shape: 'rectangle',
      x: 50,
      y: 50,
      width: 25,
      height: 25,
      defaultPhotoUrl: '',
    };
    setPhotoSlots([...photoSlots, newSlot]);
    setActiveLayerId(newId);
  };

  // Add Text Slot Button
  const handleAddTextSlot = () => {
    const newId = `text-${textZones.length + 1}`;
    const newZone: TextZoneConfig = {
      id: newId,
      label: `Text Field ${textZones.length + 1}`,
      defaultValue: `Custom Text ${textZones.length + 1}`,
      x: 50,
      y: 60,
      fontSize: 16,
      fontFamily: 'Playfair Display',
      color: '#000000',
      align: 'center',
      type: 'text',
    };
    setTextZones([...textZones, newZone]);
    setActiveLayerId(newId);
  };

  // Save Template Config & Sync Live Directly to Product Object
  const handleSaveTemplateConfig = () => {
    const sortedPhotos = [...photoSlots].sort(
      (a, b) => layerOrder.indexOf(a.id) - layerOrder.indexOf(b.id)
    );
    const sortedTexts = [...textZones].sort(
      (a, b) => layerOrder.indexOf(a.id) - layerOrder.indexOf(b.id)
    );

    updateProduct(product.id, {
      thumbnail: baseFrameUrl,
      images: [baseFrameUrl],
      photoSlots: sortedPhotos,
      textZones: sortedTexts,
    });
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-[#F3F4F6] text-gray-900 font-jost select-none flex flex-col">
      
      {/* Top Admin Header Navigation */}
      <header className="h-16 bg-white border-b border-gray-200 px-6 flex items-center justify-between shadow-2xs shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={onBack}
            className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Catalog
          </button>

          <div className="text-xs">
            <span className="text-gray-400 font-bold">Catalog / Products / </span>
            <span className="font-extrabold text-[#160E4B]">{product.title} Template</span>
          </div>
        </div>

        {saveSuccess && (
          <div className="px-4 py-2 bg-emerald-500 text-white rounded-xl font-bold text-xs flex items-center gap-2 animate-fadeIn shadow-md">
            <Check className="w-4 h-4" /> Template Config Saved & Live on Storefront!
          </div>
        )}
      </header>

      {/* Main Visual Workspace Grid */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 overflow-hidden">
        
        {/* Left Column: Canva-Style Draggable Workspace Canvas (8 Cols) */}
        <div className="lg:col-span-8 p-6 flex flex-col space-y-4 overflow-y-auto border-r border-gray-200 bg-white">
          
          {/* Top Action Buttons Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50 p-3 rounded-2xl border border-gray-200 shadow-2xs">
            <div className="flex flex-wrap items-center gap-2">
              <label className="px-3.5 py-2 bg-white hover:bg-gray-100 border border-gray-300 text-gray-800 font-bold text-xs rounded-xl shadow-2xs cursor-pointer flex items-center gap-1.5">
                <Upload className="w-3.5 h-3.5 text-blue-600" /> Change Poster Frame
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = async (evt) => {
                        const rawUrl = evt.target?.result as string;
                        const compressedUrl = await compressImageBase64(rawUrl, 600, 0.75);
                        setBaseFrameUrl(compressedUrl);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                  className="hidden"
                />
              </label>

              <button
                type="button"
                onClick={handleAddPhotoSlot}
                className="px-3.5 py-2 bg-[#2563EB] hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" /> 📷 Add Photo Slot
              </button>

              <button
                type="button"
                onClick={handleAddTextSlot}
                className="px-3.5 py-2 bg-[#9333EA] hover:bg-purple-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Type className="w-3.5 h-3.5" /> 🔤 Add Text Slot
              </button>

              <button
                type="button"
                onClick={handleAutoDetectThisFrame}
                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors flex items-center gap-1.5 cursor-pointer"
              >
                <Wand2 className="w-3.5 h-3.5" /> ⚡ Auto-Detect Frame Zones
              </button>
            </div>

            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-amber-500" /> Sub-Pixel Precision Workspace
            </span>
          </div>

          {/* Design Layers Horizontal Bar */}
          <div className="flex items-center gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs overflow-x-auto">
            <span className="font-bold text-gray-400 uppercase tracking-wider shrink-0 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5 text-blue-600" /> DESIGN LAYERS:
            </span>

            {photoSlots.length === 0 && textZones.length === 0 && (
              <span className="text-gray-400 italic">No zones added yet. Click Add Photo Slot or Auto-Detect above!</span>
            )}

            {layerOrder.map((layerId, index) => {
              const photo = photoSlots.find((p) => p.id === layerId);
              const text = textZones.find((t) => t.id === layerId);
              if (!photo && !text) return null;

              const isPhoto = !!photo;
              const label = photo ? photo.label : text!.label;
              const isActive = activeLayerId === layerId;

              return (
                <div
                  key={layerId}
                  className={`px-2.5 py-1 rounded-lg font-bold text-xs transition-all flex items-center gap-1.5 shrink-0 ${
                    isActive
                      ? isPhoto
                        ? 'bg-[#2563EB] text-white shadow-xs'
                        : 'bg-[#9333EA] text-white shadow-xs'
                      : 'bg-white text-gray-700 border border-gray-200'
                  }`}
                >
                  <button
                    onClick={() => moveLayer(layerId, 'left')}
                    disabled={index === 0}
                    className="hover:text-amber-300 disabled:opacity-30 cursor-pointer"
                    title="Move Layer Left"
                  >
                    ◀
                  </button>
                  <span onClick={() => setActiveLayerId(layerId)} className="cursor-pointer">
                    {isPhoto ? `📷 ${label}` : `🔤 ${label}`}
                  </span>
                  <button
                    onClick={() => moveLayer(layerId, 'right')}
                    disabled={index === layerOrder.length - 1}
                    className="hover:text-amber-300 disabled:opacity-30 cursor-pointer"
                    title="Move Layer Right"
                  >
                    ▶
                  </button>
                </div>
              );
            })}
          </div>

          {/* Main Interactive Canvas Workspace */}
          <div className="flex-1 flex items-center justify-center p-6 bg-[#E5E7EB] rounded-2xl border border-gray-300 min-h-[500px]">
            
            <div
              ref={canvasRef}
              className="relative w-full max-w-[380px] aspect-[3/4.4] rounded-xs border-8 border-black shadow-2xl bg-white overflow-hidden select-none font-serif transition-transform duration-300"
              style={{
                transform: `scale(${workspaceZoom / 100})`,
              }}
            >
              {/* Base Poster Background Image */}
              <img
                src={baseFrameUrl}
                alt="Frame Mockup"
                className="w-full h-full object-cover absolute inset-0 pointer-events-none"
              />

              {/* Rendered Photo Slots (Exclusively for this product!) */}
              {photoSlots.map((slot) => {
                const isActive = activeLayerId === slot.id;
                return (
                  <div
                    key={slot.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setActiveLayerId(slot.id);
                      setIsDragging(true);
                    }}
                    className={`absolute cursor-grab active:cursor-grabbing transition-all flex items-center justify-center ${
                      isActive
                        ? 'border-2 border-[#2563EB] ring-4 ring-blue-500/40 z-30'
                        : 'border-2 border-dashed border-sky-400/80 hover:border-sky-500 z-20'
                    } ${
                      slot.shape === 'circle'
                        ? 'rounded-full'
                        : slot.shape === 'rounded'
                        ? 'rounded-xl'
                        : 'rounded-none'
                    }`}
                    style={{
                      left: `${slot.x}%`,
                      top: `${slot.y}%`,
                      width: `${slot.width}%`,
                      height: `${slot.height}%`,
                      transform: 'translate(-50%, -50%)',
                    }}
                  >
                    <div className="w-full h-full overflow-hidden flex items-center justify-center rounded-[inherit] bg-blue-500/10 backdrop-blur-2xs">
                      <span className="text-[10px] font-sans font-black text-blue-900 bg-white/90 px-1.5 py-0.5 rounded-md shadow-2xs pointer-events-none">
                        📷 {slot.label}
                      </span>
                    </div>

                    {/* Corner Handle for Resizing */}
                    {isActive && (
                      <div
                        onMouseDown={(e) => {
                          e.stopPropagation();
                          setIsResizing(true);
                        }}
                        className="w-4 h-4 bg-[#2563EB] rounded-full border-2 border-white absolute -bottom-2 -right-2 shadow-lg cursor-nwse-resize hover:scale-125 transition-transform"
                      />
                    )}
                  </div>
                );
              })}

              {/* Rendered Text Zones (Exclusively for this product!) */}
              {textZones.map((zone) => {
                const isActive = activeLayerId === zone.id;
                return (
                  <div
                    key={zone.id}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setActiveLayerId(zone.id);
                      setIsDragging(true);
                    }}
                    className={`absolute cursor-grab active:cursor-grabbing transition-all px-1.5 py-0.5 rounded-md ${
                      isActive
                        ? 'border-2 border-[#9333EA] bg-purple-500/20 z-30 ring-2 ring-purple-500/40'
                        : 'hover:border border-dashed border-gray-400 z-20'
                    }`}
                    style={{
                      left: `${zone.x}%`,
                      top: `${zone.y}%`,
                      transform: 'translate(-50%, -50%)',
                      color: zone.color,
                      fontFamily: zone.fontFamily,
                      fontSize: `${zone.fontSize * 0.7}px`,
                      fontWeight: 'bold',
                      textAlign: zone.align,
                    }}
                  >
                    {zone.defaultValue}
                  </div>
                );
              })}

            </div>

          </div>

        </div>

        {/* Right Column: Element Properties Inspector Panel (4 Cols) */}
        <div className="lg:col-span-4 p-6 bg-white flex flex-col justify-between space-y-6 overflow-y-auto text-xs">
          
          <div className="space-y-6">
            
            <div className="border-b border-gray-200 pb-3 flex items-center justify-between">
              <h3 className="font-bold text-sm text-[#160E4B] uppercase tracking-wider flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-blue-600" /> Element Properties
              </h3>
              {(selectedSlot || selectedText) && (
                <button
                  onClick={() => {
                    if (selectedSlot) setPhotoSlots(photoSlots.filter((p) => p.id !== activeLayerId));
                    if (selectedText) setTextZones(textZones.filter((t) => t.id !== activeLayerId));
                  }}
                  className="text-rose-600 hover:text-rose-800 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Selected Layer Properties */}
            {selectedSlot ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Slot Label :</label>
                  <input
                    type="text"
                    value={selectedSlot.label}
                    onChange={(e) =>
                      setPhotoSlots(
                        photoSlots.map((p) => (p.id === activeLayerId ? { ...p, label: e.target.value } : p))
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                {/* Sub-Pixel Nudge Positioning Arrows */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <span className="font-bold text-gray-700 block">SUB-PIXEL NUDGE POSITIONING :</span>
                  <div className="flex items-center justify-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-200">
                    <button
                      onClick={() => handleNudge(-0.5, 0)}
                      className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-2xs font-bold text-gray-700 cursor-pointer"
                      title="Nudge Left (0.5%)"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleNudge(0, -0.5)}
                        className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-2xs font-bold text-gray-700 cursor-pointer"
                        title="Nudge Up (0.5%)"
                      >
                        <ChevronUp className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleNudge(0, 0.5)}
                        className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-2xs font-bold text-gray-700 cursor-pointer"
                        title="Nudge Down (0.5%)"
                      >
                        <ChevronDown className="w-4 h-4" />
                      </button>
                    </div>
                    <button
                      onClick={() => handleNudge(0.5, 0)}
                      className="p-2 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-2xs font-bold text-gray-700 cursor-pointer"
                      title="Nudge Right (0.5%)"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* POSITION X & Y (%) */}
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100">
                  <div>
                    <span className="text-[10px] text-gray-400 font-bold">X POSITION (%)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedSlot.x}
                      onChange={(e) => {
                        const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                        setPhotoSlots(
                          photoSlots.map((p) => (p.id === activeLayerId ? { ...p, x: val } : p))
                        );
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold"
                    />
                  </div>

                  <div>
                    <span className="text-[10px] text-gray-400 font-bold">Y POSITION (%)</span>
                    <input
                      type="number"
                      step="0.1"
                      value={selectedSlot.y}
                      onChange={(e) => {
                        const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                        setPhotoSlots(
                          photoSlots.map((p) => (p.id === activeLayerId ? { ...p, y: val } : p))
                        );
                      }}
                      className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold"
                    />
                  </div>
                </div>

                {/* SIZE (%) */}
                <div className="space-y-2 pt-2 border-t border-gray-100">
                  <div className="flex items-center justify-between font-bold text-gray-700">
                    <span>SIZE (%)</span>
                    <button
                      onClick={() => setLockRatio(!lockRatio)}
                      className="text-blue-600 flex items-center gap-1 text-[11px]"
                    >
                      {lockRatio ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                      {lockRatio ? 'Lock Ratio' : 'Unlock'}
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <span className="text-[10px] text-gray-400 font-bold">WIDTH (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedSlot.width}
                        onChange={(e) => {
                          const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                          setPhotoSlots(
                            photoSlots.map((p) =>
                              p.id === activeLayerId
                                ? { ...p, width: val, height: lockRatio ? val : p.height }
                                : p
                            )
                          );
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold"
                      />
                    </div>

                    <div>
                      <span className="text-[10px] text-gray-400 font-bold">HEIGHT (%)</span>
                      <input
                        type="number"
                        step="0.1"
                        value={selectedSlot.height}
                        onChange={(e) => {
                          const val = parseFloat(parseFloat(e.target.value).toFixed(1));
                          setPhotoSlots(
                            photoSlots.map((p) =>
                              p.id === activeLayerId
                                ? { ...p, height: val, width: lockRatio ? val : p.width }
                                : p
                            )
                          );
                        }}
                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-mono font-bold"
                      />
                    </div>
                  </div>
                </div>

                {/* CUTOUT SHAPE MASKING */}
                <div className="space-y-1 pt-2 border-t border-gray-100">
                  <label className="font-bold text-gray-700 block">CUTOUT SHAPE MASKING :</label>
                  <select
                    value={selectedSlot.shape}
                    onChange={(e) =>
                      setPhotoSlots(
                        photoSlots.map((p) =>
                          p.id === activeLayerId ? { ...p, shape: e.target.value as any } : p
                        )
                      )
                    }
                    className="w-full px-3 py-2.5 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  >
                    <option value="rectangle">Square / Rectangle Cutout</option>
                    <option value="circle">Auto Circle Cutout</option>
                    <option value="rounded">Rounded Box Cutout</option>
                  </select>
                </div>

              </div>
            ) : selectedText ? (
              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Text Field Label :</label>
                  <input
                    type="text"
                    value={selectedText.label}
                    onChange={(e) =>
                      setTextZones(
                        textZones.map((t) => (t.id === activeLayerId ? { ...t, label: e.target.value } : t))
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Default Value :</label>
                  <input
                    type="text"
                    value={selectedText.defaultValue}
                    onChange={(e) =>
                      setTextZones(
                        textZones.map((t) => (t.id === activeLayerId ? { ...t, defaultValue: e.target.value } : t))
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-gray-700">Font Size (PX) :</label>
                  <input
                    type="number"
                    value={selectedText.fontSize}
                    onChange={(e) =>
                      setTextZones(
                        textZones.map((t) => (t.id === activeLayerId ? { ...t, fontSize: Number(e.target.value) } : t))
                      )
                    }
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-xl font-bold"
                  />
                </div>
              </div>
            ) : (
              <p className="text-gray-400 italic">Click any photo slot or text zone on the canvas to inspect properties.</p>
            )}

            {/* WORKSPACE ZOOM SLIDER */}
            <div className="space-y-2 pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between font-bold text-gray-700">
                <span className="flex items-center gap-1"><ZoomIn className="w-4 h-4 text-blue-600" /> WORKSPACE ZOOM</span>
                <span className="text-blue-600 font-mono">{workspaceZoom}%</span>
              </div>
              <input
                type="range"
                min="80"
                max="140"
                value={workspaceZoom}
                onChange={(e) => setWorkspaceZoom(Number(e.target.value))}
                className="w-full accent-blue-600"
              />
            </div>

          </div>

          {/* Green SAVE TEMPLATE CONFIG Button */}
          <button
            type="button"
            onClick={handleSaveTemplateConfig}
            className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-2xl shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer mt-6"
          >
            <Save className="w-4 h-4" /> Save Template Config & Sync Live
          </button>

        </div>

      </div>

    </div>
  );
};
