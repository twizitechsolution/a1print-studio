import { UniversalFrameTemplate } from '../types/template';
import { renderUnifiedTemplateComposite } from './cleanBaseGenerator';

export async function generateHighResPrintFile(
  template: UniversalFrameTemplate,
  photoValues: Record<string, string>,
  textValues: Record<string, string>,
  targetWidth = 1200,
  targetHeight = 1760
): Promise<string> {
  try {
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        console.warn('Canvas export timed out, proceeding to checkout with standard preview');
        resolve('');
      }, 3000);
    });

    const exportPromise = renderUnifiedTemplateComposite({
      template,
      photoValues,
      textValues,
      targetWidth,
      targetHeight,
      drawFrameBorder: true,
    });

    return await Promise.race([exportPromise, timeoutPromise]);
  } catch (err) {
    console.warn('generateHighResPrintFile error:', err);
    return '';
  }
}


