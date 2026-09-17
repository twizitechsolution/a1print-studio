import { UniversalFrameTemplate } from '../types/template';
import { renderTemplateComposite } from './templateCompositor';

export async function generateHighResPrintFile(
  template: UniversalFrameTemplate,
  photoValues: Record<string, string>,
  textValues: Record<string, string>,
  targetWidth = 2400,
  targetHeight = 3520
): Promise<string> {
  try {
    const timeoutPromise = new Promise<string>((resolve) => {
      setTimeout(() => {
        console.warn('Canvas export timed out, proceeding with fallback preview');
        resolve('');
      }, 5000);
    });

    const exportPromise = renderTemplateComposite({
      template,
      customerInputs: {
        photoValues,
        textValues,
      },
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


