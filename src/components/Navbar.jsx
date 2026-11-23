import React from 'react';
import { Sparkles, ArrowRight, Music2 } from 'lucide-react';
import MasakaliLogo from './common/MasakaliLogo';

export default function Navbar({ onNavigate }) {
  return (
    <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-[#050507]/80 border-b border-white/[0.06] transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Wordmark */}
        <div 
          onClick={() => onNavigate('/')} 
          className="flex items-center gap-3 cursor-pointer group select-none"
        >
          {/* Masakali App Logo */}
          <MasakaliLogo className="w-9 h-9 rounded-xl object-cover" />

          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-xl tracking-tight text-white group-hover:text-cyan-200 transition-colors flex items-center gap-1.5">
                <span>Masakali</span>
                <span className="text-base">🕊️</span>
              </span>
              <span className="text-[10px] font-semibold tracking-wider uppercase px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                &lt;1MB
              </span>
            </div>
          </div>
        </div>

        {/* Center Nav Links (Desktop) */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-zinc-400">
          <a href="#features" className="hover:text-white transition-colors">Features</a>
          <a href="#studio" className="hover:text-white transition-colors flex items-center gap-1.5">
            <span>Audio Studio</span>
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping"></span>
          </a>
          <a href="#lyrics" className="hover:text-white transition-colors">Synced Lyrics</a>
          <a href="#performance" className="hover:text-white transition-colors">Benchmark</a>
        </nav>

        {/* High-Contrast "Open AS Music" Button */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/app')}
            className="relative group overflow-hidden rounded-full p-[1px] focus:outline-none focus:ring-2 focus:ring-cyan-400/50"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-cyan-500 via-violet-500 to-cyan-500 rounded-full animate-pulse-slow"></span>
            <span className="relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-full bg-[#050507] hover:bg-[#0B0B10] transition-colors text-xs sm:text-sm font-semibold text-white">
              <span>Open Masakali 🕊️</span>
              <ArrowRight className="w-3.5 h-3.5 text-cyan-400 group-hover:translate-x-0.5 transition-transform" />
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
