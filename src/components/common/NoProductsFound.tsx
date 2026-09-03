import React from 'react';
import { PackageX, Sparkles, PlusCircle } from 'lucide-react';

interface NoProductsFoundProps {
  isAdmin?: boolean;
  onOpenAddProduct?: () => void;
}

export const NoProductsFound: React.FC<NoProductsFoundProps> = ({
  isAdmin = false,
  onOpenAddProduct,
}) => {
  return (
    <div className="py-16 px-4 max-w-xl mx-auto text-center font-jost animate-fadeIn select-none">
      <div className="p-8 bg-white dark:bg-[#121829] rounded-3xl border border-slate-200 dark:border-[#262E4A] shadow-xl space-y-5">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-pink-50 dark:bg-pink-950/40 text-[#F82BA9] flex items-center justify-center border border-pink-200 dark:border-pink-800/40 shadow-inner">
          <PackageX className="w-8 h-8" />
        </div>

        <div className="space-y-1.5">
          <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            No Products Found
          </h3>
          <p className="text-xs text-slate-500 dark:text-gray-400 max-w-md mx-auto leading-relaxed">
            {isAdmin
              ? 'Your store catalog is currently empty. Click the button below to publish your first photo frame product to Cloud Firestore!'
              : 'There are currently no custom photo frames published in this store catalog. Please check back soon!'}
          </p>
        </div>

        {isAdmin && onOpenAddProduct && (
          <button
            onClick={onOpenAddProduct}
            className="px-6 py-3 bg-gradient-to-r from-[#F82BA9] to-purple-600 hover:from-[#d01c8b] hover:to-purple-700 text-white font-extrabold text-xs rounded-xl shadow-lg transition-all transform hover:scale-105 cursor-pointer flex items-center justify-center gap-2 mx-auto"
          >
            <PlusCircle className="w-4 h-4" /> Add First Product Frame
          </button>
        )}
      </div>
    </div>
  );
};
