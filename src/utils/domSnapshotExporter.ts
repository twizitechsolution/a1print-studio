// DOM Snapshot Exporter: Rasterizes LiveCustomizedFrameThumbnail DOM Component to High-Res PNG (1200x1760)

const urlToBase64DataUri = async (url: string): Promise<string> => {
  if (!url) return '';
  if (url.startsWith('data:')) return url;

  try {
    const response = await fetch(url, { mode: 'cors' });
    const blob = await response.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(url);
      reader.readAsDataURL(blob);
    });
  } catch (e) {
    return url;
  }
};

const loadBase64Image = (dataUri: string, timeoutMs = 4000): Promise<HTMLImageElement | null> => {
  return new Promise((resolve) => {
    if (!dataUri) return resolve(null);

    const img = new Image();
    let timer: any = null;

    img.onload = () => {
      clearTimeout(timer);
      resolve(img);
    };

    img.onerror = () => {
      clearTimeout(timer);
      resolve(null);
    };

    timer = setTimeout(() => {
      resolve(null);
    }, timeoutMs);

    img.src = dataUri;
  });
};

export async function rasterizeDomElementToHighResPng(
  element: HTMLElement,
  targetWidth = 1200,
  targetHeight = 1760
): Promise<string> {
  // 1. Clone target DOM element
  const clone = element.cloneNode(true) as HTMLElement;

  // 2. Wrap in temporary off-screen container with explicit 1200x1760 dimensions
  const container = document.createElement('div');
  container.style.position = 'fixed';
  container.style.left = '-9999px';
  container.style.top = '-9999px';
  container.style.width = `${targetWidth}px`;
  container.style.height = `${targetHeight}px`;
  container.style.zIndex = '-9999';
  container.style.backgroundColor = '#FFFFFF';
  container.style.overflow = 'hidden';

  // Apply high-res styling to clone
  clone.style.width = '100%';
  clone.style.height = '100%';
  clone.style.margin = '0';
  clone.style.padding = '0';
  clone.style.boxSizing = 'border-box';
  clone.style.borderWidth = '24px'; // Scale 8px border-black to 24px on 1200x1760 canvas

  container.appendChild(clone);
  document.body.appendChild(container);

  // 3. Pre-convert all images inside clone to Base64 Data URIs (Prevents tainted canvas / missing images!)
  const imgs = Array.from(clone.querySelectorAll('img'));
  for (const img of imgs) {
    if (img.src && !img.src.startsWith('data:')) {
      const dataUri = await urlToBase64DataUri(img.src);
      img.src = dataUri;
    }
  }

  // 4. Serialize cloned HTML DOM to SVG foreignObject
  const serializedHtml = new XMLSerializer().serializeToString(clone);
  document.body.removeChild(container);

  const svgString = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${targetWidth}" height="${targetHeight}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml" style="width:${targetWidth}px;height:${targetHeight}px;box-sizing:border-box;">
          ${serializedHtml}
        </div>
      </foreignObject>
    </svg>
  `;

  const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
  const svgUrl = URL.createObjectURL(svgBlob);

  const loadedSvgImg = await loadBase64Image(svgUrl, 4000);
  URL.revokeObjectURL(svgUrl);

  if (!loadedSvgImg) {
    throw new Error('SVG foreignObject rasterization failed');
  }

  // 5. Render onto HTML5 canvas
  const canvas = document.createElement('canvas');
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('No canvas context');

  ctx.fillStyle = '#FFFFFF';
  ctx.fillRect(0, 0, targetWidth, targetHeight);
  ctx.drawImage(loadedSvgImg, 0, 0, targetWidth, targetHeight);

  return canvas.toDataURL('image/png', 1.0);
}
