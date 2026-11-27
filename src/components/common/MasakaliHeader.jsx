import React from 'react';
import { Search, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import MasakaliLogo from './MasakaliLogo';

export default function MasakaliHeader({
  onOpenSearch,
  onOpenSettings
}) {
  const { isDark } = useTheme();

  return (
    <header className="w-full flex items-center justify-between py-2 select-none">
      {/* Left: Masakali Logo & Wordmark */}
      <div className="flex items-center gap-2.5">
        <div className={`p-1 rounded-xl border shrink-0 ${isDark ? 'bg-black border-white/10' : 'bg-white border-zinc-200'
          }`}>
          <MasakaliLogo className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-black" />
        </div>
        <span className={`font-black text-xl sm:text-2xl tracking-tight ${isDark ? 'text-white' : 'text-zinc-950'
          }`}>
          Masakali
        </span>
      </div>

      {/* Right: Search & Settings Only */}
      <div className="flex items-center gap-2">
        {onOpenSearch && (
          <button
            onClick={onOpenSearch}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isDark
                ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
            title="Search Songs"
            aria-label="Search"
          >
            <Search className="w-4.5 h-4.5" />
          </button>
        )}

        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all active:scale-95 ${isDark
                ? 'bg-zinc-900/80 hover:bg-zinc-800 text-zinc-200 hover:text-white'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950'
              }`}
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        )}
      </div>
    </header>
  );
}
