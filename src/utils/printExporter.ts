import { UniversalFrameTemplate } from '../types/template';

const drawImageCover = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  x: number,
  y: number,
  w: number,
  h: number
) => {
  const imgRatio = img.width / img.height;
  const targetRatio = w / h;
  let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;

  if (imgRatio > targetRatio) {
    sWidth = img.height * targetRatio;
    sx = (img.width - sWidth) / 2;
  } else {
    sHeight = img.width / targetRatio;
    sy = (img.height - sHeight) / 2;
  }

  ctx.drawImage(img, sx, sy, sWidth, sHeight, x, y, w, h);
};

export async function generateHighResPrintFile(
  template: UniversalFrameTemplate,
  photoValues: Record<string, string>,
  textValues: Record<string, string>,
  targetWidth = 1200,
  targetHeight = 1760
): Promise<string> {
  return new Promise((resolve) => {
    let isResolved = false;

    // Strict 3-second safety timeout so Proceed to Checkout NEVER hangs spinning!
    const timeoutId = setTimeout(() => {
      if (!isResolved) {
        isResolved = true;
        console.warn('Canvas export timed out, proceeding to checkout with standard preview');
        resolve('');
      }
    }, 3000);

    const safeResolve = (result: string) => {
      if (!isResolved) {
        isResolved = true;
        clearTimeout(timeoutId);
        resolve(result);
      }
    };

    const canvas = document.createElement('canvas');
    canvas.width = targetWidth;
    canvas.height = targetHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return safeResolve('');

    const baseImg = new Image();
    baseImg.crossOrigin = 'anonymous';
    baseImg.src = template.baseImageUrl;

    baseImg.onload = async () => {
      try {
        // 1. Fill solid background
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, targetWidth, targetHeight);

        // 2. Draw base frame background image
        drawImageCover(ctx, baseImg, 0, 0, targetWidth, targetHeight);

        // 3. Draw photo slots using drawImageCover (object-fit: cover)
        for (const slot of template.photoSlots) {
          const photoSrc = photoValues[slot.id];
          if (photoSrc) {
            try {
              const photoImg = await loadImage(photoSrc);
              const centerX = (slot.x / 100) * targetWidth;
              const centerY = (slot.y / 100) * targetHeight;
              const slotW = (slot.width / 100) * targetWidth;
              const slotH = (slot.height / 100) * targetHeight;
              const leftX = centerX - slotW / 2;
              const topY = centerY - slotH / 2;

              ctx.save();
              ctx.beginPath();
              if (slot.shape === 'circle') {
                ctx.arc(centerX, centerY, slotW / 2, 0, Math.PI * 2);
              } else {
                ctx.rect(leftX, topY, slotW, slotH);
              }
              ctx.clip();

              drawImageCover(ctx, photoImg, leftX, topY, slotW, slotH);
              ctx.restore();
            } catch (err) {
              console.warn('Failed to load photo slot image:', photoSrc);
            }
          }
        }

        // 4. Draw dynamic text zones & calendar grids
        for (const zone of template.textZones) {
          const val = textValues[zone.id] || zone.defaultValue;
          if (val && !val.startsWith('data:image')) {
            const textX = (zone.x / 100) * targetWidth;
            const textY = (zone.y / 100) * targetHeight;
            const maxBoxWidth = ((zone.maxWidth || 85) / 100) * targetWidth;

            const labelLower = (zone.label || '').toLowerCase();
            const idLower = (zone.id || '').toLowerCase();
            const valLower = (zone.defaultValue || '').toLowerCase();

            const isCalendarZone =
              zone.isCalendar ||
              zone.type === 'calendar' ||
              labelLower.includes('calendar') ||
              labelLower.includes('date') ||
              labelLower.includes('dob') ||
              idLower.includes('calendar') ||
              idLower.includes('date') ||
              valLower.includes('february') ||
              valLower.includes('january');

            if (isCalendarZone) {
              // Draw high-res month calendar grid onto canvas
              drawCalendarGridOnCanvas(ctx, val, textX, textY, maxBoxWidth, zone.color || '#FFFFFF', zone.fontFamily || 'serif');
            } else {
              // Draw multi-line paragraph wrapped text
              const scaledFontSize = Math.round((zone.fontSize || 14) * (targetWidth / 400));
              ctx.font = `bold ${scaledFontSize}px ${zone.fontFamily || 'sans-serif'}`;
              ctx.fillStyle = zone.color || '#000000';
              ctx.textAlign = (zone.align as CanvasTextAlign) || 'center';
              ctx.textBaseline = 'middle';

              const words = val.split(' ');
              const lines: string[] = [];
              let currentLine = '';

              for (const word of words) {
                const testLine = currentLine ? `${currentLine} ${word}` : word;
                const metrics = ctx.measureText(testLine);
                if (metrics.width > maxBoxWidth && currentLine) {
                  lines.push(currentLine);
                  currentLine = word;
                } else {
                  currentLine = testLine;
                }
              }
              if (currentLine) lines.push(currentLine);

              const lineHeight = scaledFontSize * 1.25;
              const startY = textY - ((lines.length - 1) * lineHeight) / 2;

              lines.forEach((line, lineIdx) => {
                ctx.fillText(line, textX, startY + lineIdx * lineHeight);
              });
            }
          }
        }

        // 5. Draw Solid Black Wood Frame Molding Border Overlay
        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 32;
        ctx.strokeRect(16, 16, targetWidth - 32, targetHeight - 32);

        safeResolve(canvas.toDataURL('image/png', 0.9));
      } catch (err) {
        console.warn('Error during canvas draw:', err);
        safeResolve('');
      }
    };

    baseImg.onerror = () => {
      console.warn('Failed to load base frame image for print export');
      safeResolve('');
    };
  });
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((res, rej) => {
    const img = new Image();
    if (src.startsWith('http')) {
      img.crossOrigin = 'anonymous';
    }
    img.onload = () => res(img);
    img.onerror = () => {
      const img2 = new Image();
      img2.onload = () => res(img2);
      img2.onerror = (e) => rej(e);
      img2.src = src;
    };
    img.src = src;
  });
}

function drawCalendarGridOnCanvas(
  ctx: CanvasRenderingContext2D,
  dateString: string,
  centerX: number,
  centerY: number,
  boxWidth: number,
  color: string,
  fontFamily: string
) {
  let targetDate = new Date();
  if (dateString) {
    const parsed = new Date(dateString);
    if (!isNaN(parsed.getTime())) {
      targetDate = parsed;
    } else {
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
  const monthTitle = monthNamesTitle[selectedMonthIdx] || 'February';

  const firstDayOfWeek = new Date(selectedYear, selectedMonthIdx, 1).getDay();
  const daysInMonth = new Date(selectedYear, selectedMonthIdx + 1, 0).getDate();

  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;

  // Month Header
  const titleFontSize = Math.max(14, Math.round(boxWidth * 0.1));
  ctx.font = `bold ${titleFontSize}px ${fontFamily}`;
  ctx.fillText(monthTitle, centerX, centerY - boxWidth * 0.35);

  // Weekdays Header
  const dayHeaderFontSize = Math.max(9, Math.round(boxWidth * 0.055));
  ctx.font = `bold ${dayHeaderFontSize}px sans-serif`;
  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const colStep = boxWidth / 7;
  const startX = centerX - boxWidth / 2 + colStep / 2;

  weekdays.forEach((dayName, colIdx) => {
    ctx.fillText(dayName, startX + colIdx * colStep, centerY - boxWidth * 0.22);
  });

  // Days Grid
  const numFontSize = Math.max(9, Math.round(boxWidth * 0.055));
  ctx.font = `bold ${numFontSize}px sans-serif`;

  const totalGridCells = firstDayOfWeek + daysInMonth;
  const rowStep = boxWidth * 0.09;
  const gridStartY = centerY - boxWidth * 0.12;

  for (let d = 1; d <= daysInMonth; d++) {
    const cellIdx = firstDayOfWeek + d - 1;
    const colIdx = cellIdx % 7;
    const rowIdx = Math.floor(cellIdx / 7);

    const cellX = startX + colIdx * colStep;
    const cellY = gridStartY + rowIdx * rowStep;

    if (d === selectedDayNum) {
      ctx.fillStyle = '#EF4444';
      ctx.fillText('❤️', cellX, cellY);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = `bold ${Math.round(numFontSize * 0.85)}px sans-serif`;
      ctx.fillText(d.toString(), cellX, cellY);
      ctx.fillStyle = color;
      ctx.font = `bold ${numFontSize}px sans-serif`;
    } else {
      ctx.fillText(d.toString(), cellX, cellY);
    }
  }

  ctx.restore();
}
