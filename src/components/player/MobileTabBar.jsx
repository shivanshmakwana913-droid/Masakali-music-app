import React from 'react';
import { Home, Search, Library, Sliders, ListMusic } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function MobileTabBar({ 
  currentTab, 
  setCurrentTab, 
  onOpenStudio, 
  onOpenQueue,
  likedCount,
  queueCount 
}) {
  const { isDark } = useTheme();

  return (
    <nav className={`md:hidden fixed bottom-[80px] left-0 right-0 z-40 backdrop-blur-xl border-t px-4 py-2 flex items-center justify-around shadow-lg transition-colors duration-200 ${
      isDark ? 'bg-black/95 border-zinc-800 text-white' : 'bg-white/95 border-zinc-200 text-zinc-950'
    }`}>
      <button
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
          currentTab === 'home'
            ? isDark ? 'text-white' : 'text-zinc-950 font-bold'
            : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
        }`}
      >
        <Home className={`w-5 h-5 ${currentTab === 'home' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span>Home</span>
      </button>

      <button
        onClick={() => setCurrentTab('search')}
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
          currentTab === 'search'
            ? isDark ? 'text-white' : 'text-zinc-950 font-bold'
            : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
        }`}
      >
        <Search className={`w-5 h-5 ${currentTab === 'search' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span>Search</span>
      </button>

      <button
        onClick={() => setCurrentTab('library')}
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors relative ${
          currentTab === 'library'
            ? isDark ? 'text-white' : 'text-zinc-950 font-bold'
            : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
        }`}
      >
        <Library className={`w-5 h-5 ${currentTab === 'library' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span>Library</span>
        {likedCount > 0 && (
          <span className={`absolute -top-1 right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center border ${
            isDark ? 'bg-white text-black border-black' : 'bg-black text-white border-white'
          }`}>
            {likedCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenQueue}
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors relative ${
          isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
        }`}
      >
        <ListMusic className="w-5 h-5 stroke-[1.75]" />
        <span>Queue</span>
        {queueCount > 0 && (
          <span className={`absolute -top-1 right-1.5 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center border ${
            isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-800 border-zinc-300'
          }`}>
            {queueCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenStudio}
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors ${
          isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-zinc-950'
        }`}
      >
        <Sliders className="w-5 h-5 stroke-[1.75]" />
        <span>Studio</span>
      </button>
    </nav>
  );
}
