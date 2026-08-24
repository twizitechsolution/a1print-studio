import React from 'react';

interface InteractiveCalendarZoneProps {
  dateString: string; // e.g. "2026-02-14" or "14 Feb 2026"
  color?: string;
  fontFamily?: string;
  scale?: number;
}

export const InteractiveCalendarZone: React.FC<InteractiveCalendarZoneProps> = ({
  dateString,
  color = '#160E4B',
  fontFamily = 'Playfair Display',
  scale = 1,
}) => {
  // Parse date safely
  let targetDate = new Date();
  if (dateString) {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    } else {
      // Try parsing formats like "14 Feb 2026"
      const parts = dateString.split(' ');
      if (parts.length >= 3) {
        const day = parseInt(parts[0]);
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const monthIdx = monthNames.findIndex((m) => parts[1].toLowerCase().startsWith(m));
        const year = parseInt(parts[2]);
        if (!isNaN(day) && monthIdx !== -1 && !isNaN(year)) {
          targetDate = new Date(year, monthIdx, day);
        }
      }
    }
  }

  const selectedYear = targetDate.getFullYear();
  const selectedMonthIdx = targetDate.getMonth();
  const selectedDayNum = targetDate.getDate();

  const monthNamesUpper = [
    'JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE',
    'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER',
  ];

  const monthTitle = `${monthNamesUpper[selectedMonthIdx]} ${selectedYear}`;

  // First day of month (0 = Sun, 1 = Mon, etc.) & Total days in month
  const firstDayOfWeek = new Date(selectedYear, selectedMonthIdx, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();

  // Create grid cells
  const gridCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    gridCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    gridCells.push(d);
  }

  return (
    <div
      className="inline-block text-center font-serif select-none leading-none p-1 bg-white/40 rounded-lg shadow-2xs backdrop-blur-2xs"
      style={{ color, fontFamily, transform: `scale(${scale})`, transformOrigin: 'center' }}
    >
      {/* Month & Year Header */}
      <div className="font-bold text-[11px] tracking-widest border-b border-gray-400/30 pb-0.5 mb-1 uppercase">
        {monthTitle}
      </div>

      {/* Weekdays Header */}
      <div className="grid grid-cols-7 gap-0.5 text-[8px] font-bold text-gray-500 mb-0.5">
        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
      </div>

      {/* Days Grid */}
      <div className="grid grid-cols-7 gap-0.5 text-[9px] font-bold font-mono">
        {gridCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`empty-${idx}`} className="w-4 h-4" />;
          }

          const isSelected = dayNum === selectedDayNum;

          return (
            <div
              key={`day-${dayNum}`}
              className="relative w-4 h-4 flex items-center justify-center text-[9px] font-bold"
            >
              {isSelected ? (
                <div className="relative flex items-center justify-center">
                  <span className="text-red-600 font-extrabold text-[12px] absolute inset-0 flex items-center justify-center animate-pulse">
                    ❤️
                  </span>
                  <span className="relative z-10 text-white font-extrabold text-[7px]">
                    {dayNum}
                  </span>
                </div>
              ) : (
                <span>{dayNum}</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
