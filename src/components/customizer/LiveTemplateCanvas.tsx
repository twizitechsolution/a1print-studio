import React from 'react';
import { CustomFrameTemplate } from '../../types/template';

interface LiveTemplateCanvasProps {
  template: CustomFrameTemplate;
  selectedGender: 'Boy' | 'Girl';
  photoValues: Record<string, string>;
  textValues: Record<string, string>;
}

export const LiveTemplateCanvas: React.FC<LiveTemplateCanvasProps> = ({
  template,
  selectedGender,
  photoValues,
  textValues,
}) => {
  const currentVariant =
    template.variants.find((v) => v.gender === selectedGender) || template.variants[0];

  const isGirl = selectedGender === 'Girl';

  // Theme Colors matching reference image media_1787319173856.png
  const labelColor = isGirl ? '#D946EF' : '#0084B4';
  const nameColor = isGirl ? '#D946EF' : '#0084B4';
  const momDadColor = '#E11D48';

  return (
    /* Outer Wall Backdrop Container matching single-bg.webp */
    <div 
      className="relative w-full min-h-[580px] rounded-2xl overflow-hidden p-4 sm:p-8 flex items-center justify-center shadow-xl select-none"
      style={{
        backgroundImage: "url('https://lovecraftbyse.com/wp-content/uploads/2025/06/single-bg.webp')",
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Poster Canvas inside Black Frame Molding matching media_1787319173856.png */}
      <div 
        id="live-frame-canvas"
        className="relative w-full max-w-[400px] aspect-[3/4.4] rounded-xs border-[12px] sm:border-[16px] border-black shadow-[0_25px_60px_rgba(0,0,0,0.7)] bg-white overflow-hidden font-serif select-none"
      >
        {/* Soft Cloud Balloons Watermark Background Pattern */}
        <div 
          className={`absolute inset-0 transition-colors duration-500 ${
            isGirl 
              ? 'bg-gradient-to-b from-pink-100/90 via-rose-50/60 to-purple-100/80' 
              : 'bg-gradient-to-b from-[#E0F2FE] via-[#F0F9FF] to-[#E0F2FE]'
          }`}
        />

        {/* Floating Clouds Background Watermarks */}
        <div className="absolute top-0 right-0 w-44 h-44 opacity-30 pointer-events-none text-6xl">
          🎈☁️
        </div>
        <div className="absolute top-0 left-0 w-36 h-36 opacity-30 pointer-events-none text-5xl">
          ☁️🎈
        </div>
        <div className="absolute bottom-10 left-0 w-36 h-36 opacity-20 pointer-events-none text-5xl">
          🎈☁️
        </div>

        {/* ============================================================ */}
        {/* 1. TOP CLOTHESLINE WITH 5 3D ITEMS (media_1787319173856.png) */}
        {/* ============================================================ */}
        <div className="absolute top-3 left-0 right-0 z-10 px-2">
          {/* Main Rope Line */}
          <div className="w-full h-0.5 bg-gray-400/70 relative">
            <div className="flex items-start justify-around px-3 -mt-1">
              
              {/* Item 1: Baby Socks */}
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-2.5 bg-[#8D5B4C] rounded-xs shadow-xs" />
                <svg className="w-7 h-8 -mt-1" viewBox="0 0 40 45">
                  <path d="M10 5 L20 5 L20 22 C20 28, 30 28, 30 35 C30 40, 20 42, 12 40 C6 38, 5 30, 10 25 Z" fill={isGirl ? '#F472B6' : '#93C5FD'} stroke="#ffffff" strokeWidth="2" />
                </svg>
              </div>

              {/* Item 2: Dungarees Overalls */}
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-2.5 bg-[#8D5B4C] rounded-xs shadow-xs" />
                <svg className="w-10 h-12 -mt-1" viewBox="0 0 50 60">
                  <path d="M15 10 L20 10 L20 22 L30 22 L30 10 L35 10 L40 50 L30 50 L25 35 L20 50 L10 50 Z" fill={isGirl ? '#EC4899' : '#0284C7'} stroke="#ffffff" strokeWidth="2" />
                  <circle cx="20" cy="26" r="2" fill="#ffffff" />
                  <circle cx="30" cy="26" r="2" fill="#ffffff" />
                </svg>
              </div>

              {/* Item 3: Onesie labeled BOY / GIRL */}
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-2.5 bg-[#8D5B4C] rounded-xs shadow-xs" />
                <div className="relative -mt-1">
                  <svg className="w-11 h-12" viewBox="0 0 50 55">
                    <path d="M15 5 L35 5 L45 15 L38 22 L38 45 C38 52, 12 52, 12 45 L12 22 L5 15 Z" fill={isGirl ? '#F472B6' : '#38BDF8'} stroke="#ffffff" strokeWidth="2" />
                  </svg>
                  <span className="absolute inset-0 flex items-center justify-center font-sans font-black text-[10px] text-white tracking-widest pt-1">
                    {isGirl ? 'GIRL' : 'BOY'}
                  </span>
                </div>
              </div>

              {/* Item 4: 3D White Plush Teddy Bear */}
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-2.5 bg-[#8D5B4C] rounded-xs shadow-xs" />
                <div className="text-3xl -mt-1 drop-shadow-md">🧸</div>
              </div>

              {/* Item 5: Baby Bib with Heart */}
              <div className="flex flex-col items-center">
                <div className="w-1.5 h-2.5 bg-[#8D5B4C] rounded-xs shadow-xs" />
                <svg className="w-9 h-10 -mt-1" viewBox="0 0 40 45">
                  <path d="M10 5 C10 0, 30 0, 30 5 L35 25 C35 40, 5 40, 5 25 Z" fill={isGirl ? '#F472B6' : '#38BDF8'} stroke="#ffffff" strokeWidth="2" />
                  <path d="M20 18 L23 23 L17 23 Z" fill="#F59E0B" />
                </svg>
              </div>

            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* 2. LEFT COLUMN: Born In, Blood Group, Weight (media_1787319173856) */}
        {/* ============================================================ */}
        <div className="absolute top-[26%] left-[4%] w-[30%] space-y-4 z-20 text-center">
          
          {/* Born In: Calendar Icon */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-extrabold tracking-tight mb-1" style={{ color: labelColor }}>
              Born In:
            </span>
            {/* 3-Ring Calendar Graphic matching reference */}
            <div className="w-11 h-11 bg-white rounded-lg border border-gray-200 shadow-md flex flex-col items-center overflow-hidden">
              <div className="w-full bg-[#E11D48] h-3.5 flex items-center justify-around px-1">
                <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
                <div className="w-1.5 h-1.5 rounded-full bg-gray-800" />
              </div>
              <div className="flex-1 flex items-center justify-center font-sans text-xs font-black text-gray-800">
                {textValues.birthDateMonth || 'Jan'}
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-900 mt-1 font-serif leading-tight">
              {textValues.birthDateDay || '31'} {textValues.birthDateMonth || 'Jan'} {textValues.birthDateYear || '2025'}
            </span>
          </div>

          {/* Blood Group: Drops Icon */}
          <div className="flex flex-col items-center pt-1">
            <span className="text-[11px] font-extrabold tracking-tight mb-1" style={{ color: labelColor }}>
              Blood Group
            </span>
            <div className="flex items-center justify-center">
              <span className="text-2xl leading-none drop-shadow-xs">🩸</span>
            </div>
            <span className="text-[11px] font-bold text-gray-900 mt-1 font-serif">
              {textValues.bloodGroup || 'A+'}
            </span>
          </div>

          {/* Weight: Blue Weighing Scale Machine */}
          <div className="flex flex-col items-center pt-1">
            <span className="text-[11px] font-extrabold tracking-tight mb-1" style={{ color: labelColor }}>
              Weight:
            </span>
            {/* 3D Weighing Scale Machine Graphic matching reference */}
            <div className="w-11 h-9 bg-[#0284C7] rounded-md border border-[#0369A1] shadow-md flex flex-col items-center justify-between p-1">
              <div className="w-full bg-[#0369A1] h-1.5 rounded-xs" />
              <div className="w-5 h-5 rounded-full bg-white border border-gray-300 flex items-center justify-center shadow-inner">
                <div className="w-1.5 h-1.5 rounded-full bg-[#0284C7]" />
              </div>
            </div>
            <span className="text-[11px] font-bold text-gray-900 mt-1 font-serif">
              {textValues.weight ? `${textValues.weight} Kg` : '3.5 Kg'}
            </span>
          </div>

        </div>

        {/* ============================================================ */}
        {/* 3. CENTER COLUMN: Scalloped Baby Photo, Name, Hospital, Mom&Dad */}
        {/* ============================================================ */}
        
        {/* Center Circular Baby Photo with Scalloped Lace Frame matching reference */}
        {template.photoLayers.find((p) => p.id === 'babyPhoto') && (
          <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-36 sm:w-40 h-36 sm:h-40 z-20 flex items-center justify-center">
            
            {/* Scalloped Lace SVG Overlay Frame matching media_1787319173856 */}
            <svg className="absolute inset-0 w-full h-full text-[#38BDF8] drop-shadow-md" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" fill={isGirl ? '#FCE7F3' : '#E0F2FE'} stroke={isGirl ? '#F472B6' : '#38BDF8'} strokeWidth="3" strokeDasharray="4 3" />
            </svg>

            {/* Clipped Baby Photo */}
            <div className="relative w-[78%] h-[78%] rounded-full overflow-hidden border-2 border-white shadow-md bg-white z-10">
              <img
                src={
                  photoValues.babyPhoto ||
                  currentVariant.defaultBabyPhoto
                }
                alt="Baby Photo"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Baby Name Banner directly below baby photo */}
        <div className="absolute top-[52%] left-0 right-0 text-center z-20 px-2 font-serif">
          <h3 
            className="font-bold text-xl sm:text-2xl tracking-tight leading-none"
            style={{ color: nameColor }}
          >
            {textValues.babyName || 'Arya Sharma'}
          </h3>
        </div>

        {/* Hospital Building & Accessories matching media_1787319173856 */}
        <div className="absolute top-[60%] left-1/2 -translate-x-1/2 flex flex-col items-center z-20 font-serif">
          <div className="flex items-center gap-3 mb-1">
            <span className="text-base">🍼</span>
            {/* Red Cross Hospital Icon matching reference */}
            <div className="w-10 h-10 bg-white border border-rose-200 rounded-md shadow-md flex flex-col items-center justify-center p-1">
              <div className="w-3.5 h-3.5 text-rose-600 font-bold text-xs flex items-center justify-center">✚</div>
              <div className="w-full h-1.5 bg-[#38BDF8] mt-1 rounded-xs" />
            </div>
            <span className="text-base">🪇</span>
          </div>
          <span className="text-xs font-extrabold text-gray-900 font-serif">
            {textValues.hospitalName || 'Duya Hospital'}
          </span>
        </div>

        {/* Mom & Dad Tag + Parents Name */}
        <div className="absolute bottom-[3%] left-1/2 -translate-x-1/2 text-center z-20 font-serif">
          <span 
            className="text-xs font-bold block font-serif tracking-wide"
            style={{ color: momDadColor }}
          >
            Mom & Dad
          </span>
          <span className="text-xs font-extrabold text-gray-900 block font-serif truncate max-w-[140px] mt-0.5">
            {textValues.parentsName || 'Nikhil & Nikita'}
          </span>
        </div>

        {/* ============================================================ */}
        {/* 4. RIGHT COLUMN: Born Time, Height, Parents Photo Circle */}
        {/* ============================================================ */}
        <div className="absolute top-[26%] right-[4%] w-[30%] space-y-4 z-20 text-center">
          
          {/* Born Time: Clock Icon */}
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-extrabold tracking-tight mb-1" style={{ color: labelColor }}>
              Born Time:
            </span>
            {/* 3D Round Clock Icon matching media_1787319173856 */}
            <div className="w-10 h-10 rounded-full bg-white border-2 border-rose-500 shadow-md flex items-center justify-center relative">
              <div className="w-0.5 h-3 bg-gray-900 rounded-xs absolute top-2 left-1/2 -translate-x-1/2 origin-bottom rotate-45" />
              <div className="w-2.5 h-0.5 bg-gray-900 rounded-xs absolute top-1/2 left-1/2 origin-left" />
              <div className="w-1.5 h-1.5 rounded-full bg-rose-600 z-10" />
            </div>
            <span className="text-[11px] font-bold text-gray-900 mt-1 font-serif">
              {textValues.birthTimeVal || '11:00'} {textValues.birthTimeAmpm || 'AM'}
            </span>
          </div>

          {/* Height: Measuring Tape Icon */}
          <div className="flex flex-col items-center pt-1">
            <span className="text-[11px] font-extrabold tracking-tight mb-1" style={{ color: labelColor }}>
              Height:
            </span>
            {/* Measuring Tape Graphic matching reference */}
            <div className="w-11 h-5 bg-amber-200 border border-amber-400 rounded-xs flex items-center justify-around px-1 shadow-xs">
              <div className="w-0.5 h-3 bg-amber-800" />
              <div className="w-0.5 h-2 bg-amber-800" />
              <div className="w-0.5 h-3 bg-amber-800" />
            </div>
            <span className="text-[11px] font-bold text-gray-900 mt-1 font-serif">
              {textValues.height ? `${textValues.height} Cm` : '49 Cm'}
            </span>
          </div>

        </div>

        {/* Bottom Right Circle: Parents Photo with Gold Beaded Frame matching media_1787319173856 */}
        {template.photoLayers.find((p) => p.id === 'parentsPhoto') && (
          <div className="absolute bottom-[3%] right-[3%] w-24 sm:w-28 h-24 sm:h-28 rounded-full border-4 border-amber-400 shadow-xl overflow-hidden bg-white z-20 ring-2 ring-amber-200">
            <img
              src={
                photoValues.parentsPhoto ||
                currentVariant.defaultParentsPhoto
              }
              alt="Parents"
              className="w-full h-full object-cover"
            />
          </div>
        )}

      </div>
    </div>
  );
};
