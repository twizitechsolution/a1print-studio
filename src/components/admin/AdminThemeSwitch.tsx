import React, { useState, useRef, useEffect } from 'react';
import { Sun, Moon, Laptop, Check } from 'lucide-react';
import { useAdminTheme, AdminTheme } from '../../context/AdminThemeContext';

export const AdminThemeSwitch: React.FC = () => {
  const { theme, resolvedTheme, setTheme } = useAdminTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (t: AdminTheme) => {
    setTheme(t);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="p-1.5 rounded-lg border dark:border-zinc-800 border-slate-200 dark:bg-zinc-900 bg-white dark:hover:bg-zinc-800 hover:bg-slate-100 dark:text-zinc-300 text-slate-700 transition-colors flex items-center justify-center cursor-pointer shadow-xs"
        title="Switch Admin Color Theme"
      >
        {resolvedTheme === 'dark' ? (
          <Moon className="w-4 h-4 text-amber-400" />
        ) : (
          <Sun className="w-4 h-4 text-amber-500" />
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-36 rounded-xl border dark:border-zinc-800 border-slate-200 dark:bg-zinc-950 bg-white shadow-xl py-1 z-50 text-xs font-medium dark:text-zinc-200 text-slate-800 animate-fadeIn">
          <button
            type="button"
            onClick={() => handleSelect('light')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left dark:hover:bg-zinc-900 hover:bg-slate-100 transition-colors cursor-pointer ${
              theme === 'light' ? 'font-bold text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <Sun className="w-3.5 h-3.5 text-amber-500" /> Light
            </span>
            {theme === 'light' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('dark')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left dark:hover:bg-zinc-900 hover:bg-slate-100 transition-colors cursor-pointer ${
              theme === 'dark' ? 'font-bold text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <Moon className="w-3.5 h-3.5 text-indigo-400" /> Dark
            </span>
            {theme === 'dark' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleSelect('system')}
            className={`w-full flex items-center justify-between px-3 py-2 text-left dark:hover:bg-zinc-900 hover:bg-slate-100 transition-colors cursor-pointer ${
              theme === 'system' ? 'font-bold text-blue-600 dark:text-blue-400' : ''
            }`}
          >
            <span className="flex items-center gap-2">
              <Laptop className="w-3.5 h-3.5 text-emerald-500" /> System
            </span>
            {theme === 'system' && <Check className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
