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

        // 4. Draw dynamic text zones
        for (const zone of template.textZones) {
          const val = textValues[zone.id] || zone.defaultValue;
          if (val && !val.startsWith('data:image')) {
            const textX = (zone.x / 100) * targetWidth;
            const textY = (zone.y / 100) * targetHeight;

            const scaledFontSize = Math.round(zone.fontSize * (targetWidth / 400));
            ctx.font = `bold ${scaledFontSize}px ${zone.fontFamily || 'sans-serif'}`;
            ctx.fillStyle = zone.color || '#000000';
            ctx.textAlign = zone.align || 'center';
            ctx.textBaseline = 'middle';

            ctx.fillText(val, textX, textY);
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
      // Retry without crossOrigin if CORS failed
      const img2 = new Image();
      img2.onload = () => res(img2);
      img2.onerror = (e) => rej(e);
      img2.src = src;
    };
    img.src = src;
  });
}
