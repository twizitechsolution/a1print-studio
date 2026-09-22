import React, { useState, useEffect } from 'react';
import {
  ExternalLink,
  RefreshCw,
  Loader2,
  CheckCircle2,
  AlertCircle,
  X,
  Sparkles,
  Info,
  ShieldAlert,
} from 'lucide-react';

interface CanvaSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId: string;
  templateTitle: string;
  currentBaseImageUrl: string;
  canvaDesignId?: string;
  canvaLastSyncedAt?: string;
  onSyncSuccess: (
    newBaseImageUrl: string,
    canvaLastSyncedAt: string,
    photoSlots?: any[],
    textZones?: any[]
  ) => void;
}

type ModalStep = 'idle' | 'importing' | 'editing' | 'exporting' | 'success' | 'error';

export const CanvaSyncModal: React.FC<CanvaSyncModalProps> = ({
  isOpen,
  onClose,
  templateId,
  templateTitle,
  currentBaseImageUrl,
  canvaDesignId,
  canvaLastSyncedAt,
  onSyncSuccess,
}) => {
  const [step, setStep] = useState<ModalStep>('idle');
  const [editUrl, setEditUrl] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLicenseError, setIsLicenseError] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isCheckingAuth, setIsCheckingAuth] = useState(false);
  const [activeDesignId, setActiveDesignId] = useState<string>(canvaDesignId || '');

  // Check Canva authentication status when modal opens or URL parameters change
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('canvaConnected') === 'true') {
      setIsAuthenticated(true);
    }
  }, []);

  useEffect(() => {
    if (canvaDesignId) {
      setActiveDesignId(canvaDesignId);
    }
  }, [canvaDesignId]);

  useEffect(() => {
    if (isOpen) {
      checkAuthStatus();
    } else {
      setStep('idle');
      setErrorMessage(null);
      setIsLicenseError(false);
    }
  }, [isOpen]);

  const checkAuthStatus = async () => {
    setIsCheckingAuth(true);
    try {
      const res = await fetch('/api/canva?action=auth-status');
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(Boolean(data.isAuthenticated));
      } else {
        setIsAuthenticated(false);
      }
    } catch {
      setIsAuthenticated(false);
    } finally {
      setIsCheckingAuth(false);
    }
  };

  const handleConnectCanva = () => {
    const returnUrl = window.location.pathname + window.location.search;
    window.location.href = `/api/canva?action=auth-start&returnUrl=${encodeURIComponent(returnUrl)}`;
  };

  const handleStartEditing = async () => {
    setStep('importing');
    setErrorMessage(null);
    setIsLicenseError(false);

    try {
      let finalImageUrl = currentBaseImageUrl;

      // If currentBaseImageUrl is a local base64 Data URL or blob, upload directly to Cloudinary first
      if (finalImageUrl && (finalImageUrl.startsWith('data:') || finalImageUrl.startsWith('blob:'))) {
        try {
          const cloudFormData = new FormData();
          cloudFormData.append('file', finalImageUrl);
          cloudFormData.append('upload_preset', 'a1print_products');
          cloudFormData.append('folder', 'a1print/canva_imports');

          const cRes = await fetch('https://api.cloudinary.com/v1_1/dcnnn0ogm/image/upload', {
            method: 'POST',
            body: cloudFormData,
          });

          if (cRes.ok) {
            const cData = await cRes.json();
            if (cData.secure_url) {
              finalImageUrl = cData.secure_url;
            }
          }
        } catch (cErr) {
          console.warn('Direct Cloudinary pre-upload failed, falling back to server handler:', cErr);
        }
      }

      const res = await fetch('/api/canva?action=import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          imageUrl: finalImageUrl,
          title: templateTitle,
          canvaDesignId: activeDesignId || canvaDesignId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.code === 'CANVA_NOT_AUTHENTICATED' || res.status === 401) {
          setIsAuthenticated(false);
          setStep('idle');
          return;
        }
        throw new Error(data.error || 'Failed to open template in Canva.');
      }

      if (data.designId) {
        setActiveDesignId(data.designId);
      }

      if (!data.editUrl) {
        throw new Error('Canva did not return an edit URL.');
      }

      setEditUrl(data.editUrl);
      setStep('editing');

      // Open Canva editor in a real new browser tab
      window.open(data.editUrl, '_blank', 'noopener,noreferrer');
    } catch (err: any) {
      console.error('Canva import error:', err);
      setErrorMessage(err.message || 'An error occurred while opening in Canva.');
      setStep('error');
    }
  };

  const handleSyncNow = async () => {
    setStep('exporting');
    setErrorMessage(null);
    setIsLicenseError(false);

    try {
      const res = await fetch('/api/canva?action=export', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          templateId,
          canvaDesignId: activeDesignId || canvaDesignId,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.isLicenseError) {
          setIsLicenseError(true);
        }
        throw new Error(data.error || 'Failed to export artwork from Canva.');
      }

      if (!data.baseImageUrl) {
        throw new Error('Sync succeeded but no updated image URL was returned.');
      }

      setStep('success');
      onSyncSuccess(
        data.baseImageUrl,
        data.canvaLastSyncedAt || new Date().toISOString(),
        data.photoSlots,
        data.textZones
      );
    } catch (err: any) {
      console.error('Canva export error:', err);
      setErrorMessage(err.message || 'Failed to pull changes from Canva.');
      setStep('error');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700/80 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl text-slate-100 flex flex-col font-sans">
        
        {/* Header with Canva Brand Colors */}
        <div className="bg-gradient-to-r from-[#7D2AE8] via-[#00C4CC] to-[#0074E4] p-5 flex items-center justify-between text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black text-lg shadow-inner">
              C
            </div>
            <div>
              <h3 className="font-bold text-base tracking-wide flex items-center gap-2">
                Canva Template Studio
              </h3>
              <p className="text-xs text-white/80 font-medium">Edit template artwork directly in Canva</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={step === 'importing' || step === 'exporting'}
            className="p-1.5 rounded-full hover:bg-white/20 text-white/90 hover:text-white transition-colors cursor-pointer disabled:opacity-40"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-5">
          {/* Template Info Card */}
          <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-3.5 flex items-center gap-3">
            {currentBaseImageUrl ? (
              <img
                src={currentBaseImageUrl}
                alt={templateTitle}
                className="w-14 h-14 rounded-xl object-cover bg-slate-900 border border-slate-700 shrink-0"
              />
            ) : (
              <div className="w-14 h-14 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-purple-400" />
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h4 className="font-bold text-sm text-slate-100 truncate">{templateTitle}</h4>
              <p className="text-[11px] text-slate-400 font-mono truncate">ID: {templateId}</p>
              {canvaLastSyncedAt && (
                <p className="text-[10px] text-emerald-400 font-medium mt-0.5">
                  Last synced: {new Date(canvaLastSyncedAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          </div>

          {/* STATE 1: Checking Auth */}
          {isCheckingAuth && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-8 h-8 text-purple-400 animate-spin" />
              <p className="text-xs text-slate-400">Verifying Canva connection...</p>
            </div>
          )}

          {/* STATE 2: Not Authenticated */}
          {!isCheckingAuth && isAuthenticated === false && (
            <div className="space-y-4 py-2 text-center">
              <div className="w-12 h-12 rounded-full bg-purple-500/20 text-purple-400 flex items-center justify-center mx-auto">
                <ExternalLink className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">Connect Your Canva Account</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Authorize A1Print Studio to open designs and export artwork from your Canva account. This is a one-time connection.
                </p>
              </div>
              <button
                onClick={handleConnectCanva}
                className="w-full py-3 px-4 bg-gradient-to-r from-[#7D2AE8] to-[#00C4CC] hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-purple-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4" />
                <span>Authorize & Connect Canva</span>
              </button>
            </div>
          )}

          {/* STATE 3: Ready to Launch / Idle */}
          {!isCheckingAuth && isAuthenticated === true && step === 'idle' && (
            <div className="space-y-4">
              <div className="bg-purple-950/30 border border-purple-800/40 rounded-2xl p-4 text-xs text-slate-300 space-y-2">
                <div className="flex items-center gap-2 text-purple-300 font-bold">
                  <Info className="w-4 h-4 shrink-0" />
                  <span>How Canva Editing Works</span>
                </div>
                <p className="text-slate-400 leading-relaxed text-[11px]">
                  1. Clicking below opens the template artwork directly in the native Canva editor in a new browser tab.
                  <br />
                  2. Make any graphic or artwork edits inside Canva.
                  <br />
                  3. Return here and click <strong>"Sync now"</strong> to pull the updated artwork straight into this product.
                </p>
              </div>

              {/* Automatic Field Sync Guidance */}
              <div className="bg-purple-950/40 border border-purple-800/40 rounded-2xl p-3.5 text-xs space-y-2.5">
                <div className="flex items-center justify-between text-purple-300 font-bold">
                  <span className="flex items-center gap-1.5 text-xs">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                    Automatic Layer Sync (Inside Canva)
                  </span>
                  <a
                    href={`/canva-app?templateId=${encodeURIComponent(templateId)}&designId=${encodeURIComponent(activeDesignId || '')}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-purple-400 hover:text-purple-300 underline flex items-center gap-1"
                  >
                    Preview App <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Inside Canva: Add any photo frames or text boxes freely. Then click <strong>Apps</strong> on Canva's left dock &rarr; <strong>A1Print Layer Sync</strong> &rarr; <strong>Sync Layers to A1Print</strong>. All elements will automatically appear as editable layers in Admin!
                </p>
              </div>

              <button
                onClick={handleStartEditing}
                className="w-full py-3.5 px-4 bg-gradient-to-r from-[#7D2AE8] via-[#00C4CC] to-[#0074E4] hover:opacity-95 text-white font-bold rounded-2xl text-xs flex items-center justify-center gap-2.5 shadow-xl shadow-purple-600/30 transition-all cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" />
                <span>{canvaDesignId ? 'Open Existing Canva Design' : 'Import & Open in Canva'}</span>
              </button>
            </div>
          )}

          {/* STATE 4: Importing / Preparing */}
          {step === 'importing' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-9 h-9 text-purple-400 animate-spin" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">Preparing Canva Design...</h4>
                <p className="text-xs text-slate-400">Importing template artwork into Canva and generating edit session.</p>
              </div>
            </div>
          )}

          {/* STATE 5: Active Editing in Canva */}
          {step === 'editing' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto animate-pulse">
                <ExternalLink className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-slate-100">Editing in Canva</h4>
                <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                  Your Canva design is open in a new tab. When you finish modifying colors, elements, or artwork, click below to pull the changes back.
                </p>
              </div>

              {editUrl && (
                <button
                  type="button"
                  onClick={() => window.open(editUrl, '_blank', 'noopener,noreferrer')}
                  className="text-xs font-semibold text-purple-400 hover:text-purple-300 underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <span>Reopen Canva Editor Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              <div className="bg-purple-950/40 border border-purple-800/40 rounded-xl p-3 text-left text-xs space-y-1">
                <span className="font-bold text-purple-300 flex items-center gap-1.5 text-[11px]">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  Sync Layers directly from Canva:
                </span>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Before clicking below, open <strong>Apps &rarr; A1Print Layer Sync</strong> in Canva's left sidebar and click <strong>Sync Layers to A1Print</strong> to automatically pull in all photo frames and texts!
                </p>
              </div>

              <div className="pt-2 space-y-2">
                <button
                  onClick={handleSyncNow}
                  className="w-full py-3.5 px-4 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold rounded-2xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>I've Finished Editing — Sync Now</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-full py-2.5 text-xs text-slate-400 hover:text-slate-200 cursor-pointer"
                >
                  Keep editing (Sync later)
                </button>
              </div>
            </div>
          )}

          {/* STATE 6: Exporting / Syncing */}
          {step === 'exporting' && (
            <div className="py-8 flex flex-col items-center justify-center space-y-3 text-center">
              <Loader2 className="w-9 h-9 text-emerald-400 animate-spin" />
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-200">Exporting High-Res Artwork...</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Generating PNG from Canva and uploading to Cloudinary storage. This takes 3–5 seconds.
                </p>
              </div>
            </div>
          )}

          {/* STATE 7: Success */}
          {step === 'success' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-6 h-6" />
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-emerald-400">Artwork Updated from Canva!</h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  The new artwork has been pulled into your template.
                </p>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 text-left text-xs text-amber-300 space-y-1">
                <div className="flex items-center gap-1.5 font-bold">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Review Slot Alignment</span>
                </div>
                <p className="text-[11px] text-amber-200/80 leading-relaxed">
                  Because artwork elements may have moved or resized in Canva, please review your existing photo slots and text zones on the canvas to ensure perfect alignment.
                </p>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-2xl text-xs transition-colors cursor-pointer"
              >
                Back to Template Editor
              </button>
            </div>
          )}

          {/* STATE 8: Error */}
          {step === 'error' && (
            <div className="space-y-4 text-center py-2">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto">
                {isLicenseError ? <ShieldAlert className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-rose-400">
                  {isLicenseError ? 'Premium Canva Elements Detected' : 'Canva Action Failed'}
                </h4>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {errorMessage || 'An error occurred while connecting to Canva.'}
                </p>
              </div>

              {isLicenseError && (
                <div className="bg-rose-950/40 border border-rose-800/60 rounded-2xl p-3 text-left text-[11px] text-rose-200 leading-relaxed">
                  Canva requires a license to export designs with premium stock photos or paid graphics. Please open the design in Canva, remove the premium elements, and try syncing again.
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  onClick={() => setStep('idle')}
                  className="flex-1 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Try Again
                </button>
                {editUrl && (
                  <button
                    onClick={handleSyncNow}
                    className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl text-xs transition-colors cursor-pointer"
                  >
                    Retry Sync
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer info note */}
        <div className="px-6 py-3 bg-slate-950/80 border-t border-slate-800 text-[10px] text-slate-500 flex items-center justify-between">
          <span>Canva REST API v1 Integration</span>
          <span>A1Print Studio</span>
        </div>

      </div>
    </div>
  );
};
