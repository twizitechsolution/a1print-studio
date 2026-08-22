import React from 'react';
import { CustomFrameTemplate } from '../../types/template';
import { Image as ImageIcon, ArrowRight, Eye, Check, Sparkles } from 'lucide-react';

interface TemplateFormControlsProps {
  template: CustomFrameTemplate;
  selectedSize: 'A4' | 'A3';
  onSelectSize: (size: 'A4' | 'A3') => void;
  selectedGender: 'Boy' | 'Girl';
  onSelectGender: (gender: 'Boy' | 'Girl') => void;
  textValues: Record<string, string>;
  onTextChange: (key: string, val: string) => void;
  photoValues: Record<string, string>;
  onOpenCropModal: (layerId: string) => void;
  onProceedToCheckout: () => void;
}

export const TemplateFormControls: React.FC<TemplateFormControlsProps> = ({
  template,
  selectedSize,
  onSelectSize,
  selectedGender,
  onSelectGender,
  textValues,
  onTextChange,
  photoValues,
  onOpenCropModal,
  onProceedToCheckout,
}) => {
  return (
    <div className="space-y-6 font-jost">
      
      {/* 1. Size Selection (Matching Screenshots 1-4) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-2">
          Size (Select frame size)
        </label>

        <div className="grid grid-cols-2 gap-3">
          {/* A3 Size */}
          <div
            onClick={() => onSelectSize('A3')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedSize === 'A3'
                ? 'border-[#F82BA9] bg-[#F82BA9]/5 ring-2 ring-[#F82BA9]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h4 className="font-bold text-sm text-[#160E4B]">A3 (12x18 Inch)</h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-extrabold text-sm text-gray-900">Rs.999.00</span>
              <span className="text-xs text-gray-400 line-through">Rs.1,499.00</span>
            </div>
          </div>

          {/* A4 Size */}
          <div
            onClick={() => onSelectSize('A4')}
            className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all ${
              selectedSize === 'A4'
                ? 'border-[#F82BA9] bg-[#F82BA9]/5 ring-2 ring-[#F82BA9]'
                : 'border-gray-200 bg-white hover:border-gray-300'
            }`}
          >
            <h4 className="font-bold text-sm text-[#160E4B]">A4 (8x12 Inch)</h4>
            <div className="flex items-baseline gap-1.5 mt-1">
              <span className="font-extrabold text-sm text-[#F82BA9]">Rs.699.00</span>
              <span className="text-xs text-gray-400 line-through">Rs.999.00</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Select Baby Gender Toggle (Boy / Girl) */}
      <div>
        <label className="block text-xs font-bold text-gray-800 mb-2">
          Select Baby Gender :
        </label>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onSelectGender('Boy')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
              selectedGender === 'Boy'
                ? 'bg-sky-500 text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Boy
          </button>

          <button
            type="button"
            onClick={() => onSelectGender('Girl')}
            className={`flex-1 py-2.5 px-4 rounded-xl font-bold text-xs transition-all ${
              selectedGender === 'Girl'
                ? 'bg-[#F82BA9] text-white shadow-md'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
            }`}
          >
            Girl
          </button>
        </div>
      </div>

      {/* 3. Baby Name Input */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-800">Baby Name :</label>
        <input
          type="text"
          placeholder="e.g. Arya Sharma"
          value={textValues.babyName || ''}
          onChange={(e) => onTextChange('babyName', e.target.value)}
          className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl focus:outline-hidden focus:border-[#F82BA9] focus:bg-white"
        />
      </div>

      {/* 4. Select Baby Picture Upload Button + Thumbnail Preview */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-800 block">Select Baby Picture :</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenCropModal('babyPhoto')}
            className="px-4 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Change Image
          </button>
        </div>
        {photoValues.babyPhoto && (
          <div className="w-16 h-16 rounded-xl border border-gray-300 overflow-hidden shadow-xs">
            <img src={photoValues.babyPhoto} alt="Baby thumbnail" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* 5. Parents Photo Upload Button + Thumbnail Preview */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-800 block">Parents Photo :</label>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => onOpenCropModal('parentsPhoto')}
            className="px-4 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white text-xs font-bold rounded-lg shadow-xs transition-colors flex items-center gap-1.5"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Change Image
          </button>
        </div>
        {photoValues.parentsPhoto && (
          <div className="w-16 h-16 rounded-xl border border-gray-300 overflow-hidden shadow-xs">
            <img src={photoValues.parentsPhoto} alt="Parents thumbnail" className="w-full h-full object-cover" />
          </div>
        )}
      </div>

      {/* 6. Date of Birth Dropdowns */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-800">Date of Birth :</label>
        <div className="grid grid-cols-3 gap-2">
          <select
            onChange={(e) => onTextChange('birthDateDay', e.target.value)}
            className="px-2 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          >
            <option value="31">31</option>
            {[...Array(31)].map((_, i) => (
              <option key={i + 1} value={String(i + 1).padStart(2, '0')}>
                {String(i + 1).padStart(2, '0')}
              </option>
            ))}
          </select>

          <select
            onChange={(e) => onTextChange('birthDateMonth', e.target.value)}
            className="px-2 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          >
            <option value="Jan">Jan</option>
            {['Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>

          <select
            onChange={(e) => onTextChange('birthDateYear', e.target.value)}
            className="px-2 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          >
            <option value="2025">2025</option>
            <option value="2026">2026</option>
          </select>
        </div>
      </div>

      {/* 7. Birth Time Selector */}
      <div className="space-y-1">
        <label className="text-xs font-bold text-gray-800">Birth Time :</label>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="11:00"
            value={textValues.birthTimeVal || ''}
            onChange={(e) => onTextChange('birthTimeVal', e.target.value)}
            className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          />
          <button
            type="button"
            onClick={() => onTextChange('birthTimeAmpm', textValues.birthTimeAmpm === 'PM' ? 'AM' : 'PM')}
            className="px-4 py-2 bg-sky-50 text-sky-700 border border-sky-200 font-bold text-xs rounded-xl"
          >
            {textValues.birthTimeAmpm || 'AM'}
          </button>
        </div>
      </div>

      {/* 8. Birth Place & Parents Name */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800">Birth Place :</label>
          <input
            type="text"
            placeholder="Enter Birth Place"
            value={textValues.hospitalName || ''}
            onChange={(e) => onTextChange('hospitalName', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800">Parents Name :</label>
          <input
            type="text"
            placeholder="Nikhil & Nikita"
            value={textValues.parentsName || ''}
            onChange={(e) => onTextChange('parentsName', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          />
        </div>
      </div>

      {/* 9. Height & Weight */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800">Height (in cm) :</label>
          <input
            type="text"
            placeholder="e.g. 49"
            value={textValues.height || ''}
            onChange={(e) => onTextChange('height', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800">Weight (in kg) :</label>
          <input
            type="text"
            placeholder="e.g. 3.5"
            value={textValues.weight || ''}
            onChange={(e) => onTextChange('weight', e.target.value)}
            className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
          />
        </div>
      </div>

      {/* 10. Blood Group & WhatsApp Number */}
      <div className="space-y-3 pt-2">
        <div className="space-y-1">
          <label className="text-xs font-bold text-gray-800">Enter WhatsApp Number :</label>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-gray-500">+91</span>
            <input
              type="tel"
              maxLength={10}
              placeholder="Enter Your WhatsApp Number"
              value={textValues.whatsappNumber || ''}
              onChange={(e) => onTextChange('whatsappNumber', e.target.value)}
              className="flex-1 px-3 py-2 text-xs bg-gray-50 border border-gray-300 rounded-xl"
            />
          </div>
          <p className="text-[10px] text-gray-400">
            We will send you a preview of your order to this number when it is ready.
          </p>
        </div>
      </div>

      {/* Action Buttons matching Screenshot 4: 'Proceed to Checkout' & 'Preview My Design' */}
      <div className="space-y-3 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={onProceedToCheckout}
          className="w-full py-4 bg-[#3C187B] hover:bg-[#2A1058] text-white font-bold text-sm rounded-xl shadow-lg transition-all flex items-center justify-center gap-2"
        >
          Proceed to Checkout <ArrowRight className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => {
            const canvasEl = document.getElementById('live-frame-canvas');
            canvasEl?.scrollIntoView({ behavior: 'smooth' });
          }}
          className="w-full py-3 bg-white border-2 border-sky-500 text-sky-600 font-bold text-xs rounded-xl hover:bg-sky-50 transition-colors flex items-center justify-center gap-1.5"
        >
          <Eye className="w-4 h-4" /> Preview My Design
        </button>
      </div>

    </div>
  );
};
