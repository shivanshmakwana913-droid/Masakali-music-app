import React from 'react';
import { Home, Search, Library, Sliders, ListMusic } from 'lucide-react';

export default function MobileTabBar({ 
  currentTab, 
  setCurrentTab, 
  onOpenStudio, 
  onOpenQueue,
  likedCount,
  queueCount 
}) {
  return (
    <nav className="md:hidden fixed bottom-[80px] left-0 right-0 z-40 bg-[#0B0B10]/95 backdrop-blur-xl border-t border-white/[0.08] px-4 py-2.5 flex items-center justify-around shadow-2xl">
      <button
        onClick={() => setCurrentTab('home')}
        className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          currentTab === 'home' ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Home className="w-5 h-5" />
        <span>Home</span>
      </button>

      <button
        onClick={() => setCurrentTab('search')}
        className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors ${
          currentTab === 'search' ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Search className="w-5 h-5" />
        <span>Search</span>
      </button>

      <button
        onClick={() => setCurrentTab('library')}
        className={`flex flex-col items-center gap-1 text-xs font-semibold transition-colors relative ${
          currentTab === 'library' ? 'text-cyan-400' : 'text-zinc-400 hover:text-zinc-200'
        }`}
      >
        <Library className="w-5 h-5" />
        <span>Library</span>
        {likedCount > 0 && (
          <span className="absolute -top-1 right-2 w-4 h-4 bg-cyan-500 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
            {likedCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenQueue}
        className="flex flex-col items-center gap-1 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors relative"
      >
        <ListMusic className="w-5 h-5 text-cyan-400" />
        <span>Queue</span>
        {queueCount > 0 && (
          <span className="absolute -top-1 right-2 w-4 h-4 bg-cyan-400 text-black text-[9px] font-bold rounded-full flex items-center justify-center">
            {queueCount}
          </span>
        )}
      </button>

      <button
        onClick={onOpenStudio}
        className="flex flex-col items-center gap-1 text-xs font-semibold text-violet-400 hover:text-violet-300 transition-colors"
      >
        <Sliders className="w-5 h-5 text-violet-400" />
        <span>Studio</span>
      </button>
    </nav>
  );
}
