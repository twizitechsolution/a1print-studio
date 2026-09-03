import React, { useState, useEffect } from 'react';
import { Database, Download, RotateCcw, ShieldCheck, Clock, CheckCircle2, AlertTriangle, X } from 'lucide-react';
import { CollectionSnapshot, fetchAllSnapshots, createCollectionSnapshot } from '../../services/backupService';
import { useCartStore } from '../../store/useCartStore';

interface AdminBackupRestoreModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AdminBackupRestoreModal: React.FC<AdminBackupRestoreModalProps> = ({ isOpen, onClose }) => {
  const { products, orders, categories, addProduct } = useCartStore();
  const [snapshots, setSnapshots] = useState<CollectionSnapshot[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [selectedSnapshot, setSelectedSnapshot] = useState<CollectionSnapshot | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSnapshots();
    }
  }, [isOpen]);

  const loadSnapshots = async () => {
    setIsLoading(true);
    const list = await fetchAllSnapshots();
    setSnapshots(list);
    setIsLoading(false);
  };

  const handleCreateSnapshot = async () => {
    setIsLoading(true);
    const snap = await createCollectionSnapshot(products, orders, categories, `Manual Backup ${new Date().toLocaleTimeString()}`);
    setStatusMsg(`✅ Created new backup snapshot #${snap.id} with ${snap.productCount} products!`);
    await loadSnapshots();
    setIsLoading(false);
    setTimeout(() => setStatusMsg(null), 4000);
  };

  const handleRestoreSnapshot = (snap: CollectionSnapshot) => {
    if (!window.confirm(`Are you sure you want to restore ${snap.productCount} products from snapshot dated ${new Date(snap.timestamp).toLocaleString()}?`)) {
      return;
    }

    setIsLoading(true);
    let restoredCount = 0;

    snap.products.forEach((p) => {
      if (p && p.id) {
        addProduct({
          ...p,
          isDeleted: false,
          deletedAt: null,
          syncStatus: 'pending',
        });
        restoredCount++;
      }
    });

    setStatusMsg(`🎉 Successfully restored ${restoredCount} products from backup!`);
    setIsLoading(false);
    setTimeout(() => {
      setStatusMsg(null);
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 font-jost">
      <div className="bg-[#121829] border border-[#262E4A] w-full max-w-3xl rounded-3xl p-6 text-white space-y-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-[#1A2238] hover:bg-[#262E4A] transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 border-b border-[#262E4A] pb-4">
          <div className="p-3 bg-pink-500/10 text-[#F82BA9] rounded-2xl border border-pink-500/20">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="font-playfair text-xl font-bold">Catalog Backup & Restore Center</h2>
            <p className="text-xs text-gray-400">Timestamped snapshot backups & 1-click catalog restoration engine</p>
          </div>
        </div>

        {statusMsg && (
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-2xl text-xs font-bold flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" /> {statusMsg}
          </div>
        )}

        <div className="flex items-center justify-between bg-[#1A2238] p-4 rounded-2xl border border-[#262E4A]">
          <div>
            <span className="text-xs font-bold text-gray-300 block">Current Catalog Snapshot</span>
            <span className="text-xs text-gray-400">Active Live Products: <strong className="text-emerald-400">{products.length}</strong> | Total Orders: <strong className="text-pink-400">{orders.length}</strong></span>
          </div>
          <button
            onClick={handleCreateSnapshot}
            disabled={isLoading}
            className="px-4 py-2 bg-[#F82BA9] hover:bg-[#D61B90] text-white font-bold text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> Create Instant Backup
          </button>
        </div>

        <div className="space-y-3">
          <h3 className="font-bold text-sm text-gray-300 flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" /> Available Recovery Snapshots ({snapshots.length})
          </h3>

          {snapshots.length === 0 ? (
            <div className="p-8 text-center bg-[#1A2238] rounded-2xl border border-dashed border-[#262E4A] text-xs text-gray-400">
              No snapshots created yet. Click "Create Instant Backup" above to capture a snapshot!
            </div>
          ) : (
            <div className="space-y-2">
              {snapshots.map((snap) => (
                <div
                  key={snap.id}
                  className="p-4 bg-[#1A2238] hover:bg-[#1E2846] rounded-2xl border border-[#262E4A] flex items-center justify-between transition-all"
                >
                  <div className="space-y-0.5">
                    <span className="font-bold text-xs text-white block">{snap.label || 'Timestamped Backup'}</span>
                    <span className="text-[11px] text-gray-400 block">
                      {new Date(snap.timestamp).toLocaleString()} • {snap.productCount} Products • {snap.orderCount} Orders
                    </span>
                  </div>
                  <button
                    onClick={() => handleRestoreSnapshot(snap)}
                    disabled={isLoading}
                    className="px-3.5 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 font-bold text-xs rounded-xl border border-emerald-500/30 flex items-center gap-1.5 transition-all cursor-pointer"
                  >
                    <RotateCcw className="w-3.5 h-3.5" /> Restore This Backup
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
