import React from 'react';

interface InteractiveCalendarZoneProps {
  dateString: string; // e.g. "2026-02-14" or "14 Feb 2026"
  color?: string;
  fontFamily?: string;
  scale?: number;
}

export const InteractiveCalendarZone: React.FC<InteractiveCalendarZoneProps> = ({
  dateString,
  color = '#FFFFFF',
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
      if (parts.length >= 1) {
        const day = parseInt(parts[0]);
        const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        let monthIdx = -1;
        if (parts.length >= 2) {
          monthIdx = monthNames.findIndex((m) => parts[1].toLowerCase().startsWith(m));
        }
        const year = parts.length >= 3 ? parseInt(parts[2]) : targetDate.getFullYear();
        if (!isNaN(day)) {
          targetDate = new Date(year, monthIdx !== -1 ? monthIdx : targetDate.getMonth(), day);
        }
      }
    }
  }

  const selectedYear = targetDate.getFullYear();
  const selectedMonthIdx = targetDate.getMonth();
  const selectedDayNum = targetDate.getDate();

  const monthNamesTitle = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
  ];

  // Title Month Name Only (Matching reference image: "February")
  const monthTitle = monthNamesTitle[selectedMonthIdx] || 'February';

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

  const headerFontSize = `${Math.max(10, Math.round(14 * scale))}px`;
  const weekdayFontSize = `${Math.max(7, Math.round(8.5 * scale))}px`;
  const dayFontSize = `${Math.max(7, Math.round(8.5 * scale))}px`;

  return (
    <div
      className="w-full max-w-full inline-block text-center font-serif select-none leading-none p-0 bg-transparent border-0 shadow-none overflow-hidden"
      style={{ color, fontFamily }}
    >
      {/* Month Only Header (No Year) */}
      <div
        className="font-playfair font-bold tracking-wide mb-1 capitalize leading-tight"
        style={{ color, fontSize: headerFontSize }}
      >
        {monthTitle}
      </div>

      {/* Weekdays Header (Sun Mon Tue Wed Thu Fri Sat) */}
      <div
        className="grid grid-cols-7 gap-0.5 font-bold tracking-tight mb-1 opacity-90 leading-tight"
        style={{ color, fontSize: weekdayFontSize }}
      >
        <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
      </div>

      {/* Days Grid */}
      <div
        className="grid grid-cols-7 gap-0.5 font-bold font-sans"
        style={{ fontSize: dayFontSize }}
      >
        {gridCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return <div key={`empty-${idx}`} className="w-full aspect-square" />;
          }

          const isSelected = dayNum === selectedDayNum;

          return (
            <div
              key={`day-${dayNum}`}
              className="relative w-full aspect-square flex items-center justify-center font-bold"
              style={{ color: isSelected ? '#FF1493' : color }}
            >
              {isSelected ? (
                <div className="relative flex items-center justify-center w-full h-full">
                  <span className="text-red-500 font-extrabold text-[1.4em] absolute inset-0 flex items-center justify-center animate-pulse">
                    ❤️
                  </span>
                  <span className="relative z-10 text-white font-black text-[0.8em] drop-shadow-xs">
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
