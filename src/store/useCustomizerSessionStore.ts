import { useState, useEffect } from 'react';
import { UniversalFrameTemplate } from '../types/template';
import { uploadOrderArtwork } from '../config/firebase';

export interface CustomizerSessionState {
  template: UniversalFrameTemplate | null;
  customerInputs: Record<string, string>;
  photoValues: Record<string, string>;
  textValues: Record<string, string>;
  selectedSize: string;
  selectedFrame: string;
  isUploadingPhoto: boolean;
  uploadError: string | null;
  compiledPreviewUrl: string | null;
}

let globalSessionState: CustomizerSessionState = {
  template: null,
  customerInputs: {},
  photoValues: {},
  textValues: {},
  selectedSize: 'A4',
  selectedFrame: 'Solid Synthetic Black Wood',
  isUploadingPhoto: false,
  uploadError: null,
  compiledPreviewUrl: null,
};

const sessionListeners = new Set<() => void>();

function notifySessionListeners() {
  sessionListeners.forEach((fn) => fn());
}

export function useCustomizerSessionStore() {
  const [state, setState] = useState<CustomizerSessionState>(globalSessionState);

  useEffect(() => {
    const handleChange = () => setState({ ...globalSessionState });
    sessionListeners.add(handleChange);
    return () => {
      sessionListeners.delete(handleChange);
    };
  }, []);

  /**
   * Initializes a customer's editing session with an immutable, read-only master template.
   * Master template document in Firestore is NEVER mutated.
   */
  const initSession = (template: UniversalFrameTemplate) => {
    if (!template) return;
    // Only reset if switching to a different template
    if (globalSessionState.template?.id !== template.id) {
      globalSessionState = {
        template: Object.freeze({ ...template }), // Enforce client-side immutability
        customerInputs: {},
        photoValues: {},
        textValues: {},
        selectedSize: 'A4',
        selectedFrame: 'Solid Synthetic Black Wood',
        isUploadingPhoto: false,
        uploadError: null,
        compiledPreviewUrl: null,
      };
      notifySessionListeners();
    }
  };

  /**
   * Updates a single text zone in the client's local session.
   */
  const setTextValue = (zoneId: string, text: string) => {
    globalSessionState = {
      ...globalSessionState,
      customerInputs: {
        ...globalSessionState.customerInputs,
        [zoneId]: text,
      },
      textValues: {
        ...globalSessionState.textValues,
        [zoneId]: text,
      },
    };
    notifySessionListeners();
  };

  /**
   * Directly sets a photo slot URL (e.g. from existing URL or cropped preview).
   */
  const setPhotoValue = (slotId: string, photoUrl: string) => {
    globalSessionState = {
      ...globalSessionState,
      customerInputs: {
        ...globalSessionState.customerInputs,
        [slotId]: photoUrl,
      },
      photoValues: {
        ...globalSessionState.photoValues,
        [slotId]: photoUrl,
      },
    };
    notifySessionListeners();
  };

  /**
   * Uploads a customer photo to Cloudinary immediately upon file selection.
   * Stores the returned HTTPS URL in the local session state.
   * Never mutates the UniversalFrameTemplate document in Firestore.
   */
  const uploadCustomerPhoto = async (slotId: string, fileOrBlob: Blob | File | string): Promise<string> => {
    globalSessionState.isUploadingPhoto = true;
    globalSessionState.uploadError = null;
    notifySessionListeners();

    try {
      const fileName = `customer_photo_${slotId}_${Date.now()}.jpg`;
      const cloudUrl = await uploadOrderArtwork('customer_sessions', fileOrBlob, fileName);
      if (!cloudUrl) {
        throw new Error('Cloudinary photo upload did not return a valid URL.');
      }

      globalSessionState = {
        ...globalSessionState,
        customerInputs: {
          ...globalSessionState.customerInputs,
          [slotId]: cloudUrl,
        },
        photoValues: {
          ...globalSessionState.photoValues,
          [slotId]: cloudUrl,
        },
        isUploadingPhoto: false,
      };
      notifySessionListeners();
      return cloudUrl;
    } catch (err: any) {
      console.error('Customer photo upload error:', err);
      globalSessionState.isUploadingPhoto = false;
      globalSessionState.uploadError = err?.message || 'Failed to upload photo to Cloudinary.';
      notifySessionListeners();
      throw err;
    }
  };

  const setSelectedSize = (size: string) => {
    globalSessionState.selectedSize = size;
    notifySessionListeners();
  };

  const setSelectedFrame = (frame: string) => {
    globalSessionState.selectedFrame = frame;
    notifySessionListeners();
  };

  const setCompiledPreviewUrl = (url: string | null) => {
    globalSessionState.compiledPreviewUrl = url;
    notifySessionListeners();
  };

  const resetSession = () => {
    globalSessionState = {
      template: null,
      customerInputs: {},
      photoValues: {},
      textValues: {},
      selectedSize: 'A4 (8x12 in)',
      selectedFrame: 'Solid Synthetic Black Wood',
      isUploadingPhoto: false,
      uploadError: null,
      compiledPreviewUrl: null,
    };
    notifySessionListeners();
  };

  return {
    template: state.template,
    customerInputs: state.customerInputs,
    photoValues: state.photoValues,
    textValues: state.textValues,
    selectedSize: state.selectedSize,
    selectedFrame: state.selectedFrame,
    isUploadingPhoto: state.isUploadingPhoto,
    uploadError: state.uploadError,
    compiledPreviewUrl: state.compiledPreviewUrl,
    initSession,
    setTextValue,
    setPhotoValue,
    uploadCustomerPhoto,
    setSelectedSize,
    setSelectedFrame,
    setCompiledPreviewUrl,
    resetSession,
  };
}
