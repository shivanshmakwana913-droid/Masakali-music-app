import React from 'react';
import { Home, Search, Library } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function MobileTabBar({
  currentTab,
  setCurrentTab,
  likedCount
}) {
  const { isDark } = useTheme();

  return (
    <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-40 h-16 backdrop-blur-2xl border-t px-6 pb-1 flex items-center justify-around transition-colors duration-200 ${
      isDark ? 'bg-black/90 border-white/10 text-white' : 'bg-white/90 border-zinc-200 text-zinc-950'
    }`}>
      <button
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors px-4 py-1 ${
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
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors px-4 py-1 ${
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
        className={`flex flex-col items-center gap-1 text-[11px] font-semibold transition-colors relative px-4 py-1 ${
          currentTab === 'library'
            ? isDark ? 'text-white' : 'text-zinc-950 font-bold'
            : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
        }`}
      >
        <Library className={`w-5 h-5 ${currentTab === 'library' ? 'stroke-[2.5]' : 'stroke-[1.75]'}`} />
        <span>Library</span>
        {likedCount > 0 && (
          <span className={`absolute top-0 right-2 w-4 h-4 text-[9px] font-bold rounded-full flex items-center justify-center border ${
            isDark ? 'bg-white text-black border-black' : 'bg-black text-white border-white'
          }`}>
            {likedCount}
          </span>
        )}
      </button>
    </nav>
  );
}
