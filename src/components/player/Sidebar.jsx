import React from 'react';
import { Home, Search, Library, Sliders, ListMusic, Sparkles, FolderOpen, Share2, Heart, BarChart2, Download } from 'lucide-react';
import { quickPlaylists } from '../../data/mockTracks';
import MasakaliLogo from '../common/MasakaliLogo';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  onOpenStudio, 
  onOpenQueue,
  onOpenStats,
  likedCount = 0, 
  offlineCount = 0,
  localCount = 0,
  queueCount = 0,
  onSelectPlaylist,
  onLocalFilesSelect,
  onShareApp,
  onOpenSupport,
  onOpenDownload,
  isInstalled = false
}) {
  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library, badge: likedCount > 0 ? `${likedCount}` : null },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-[#0B0B10]/95 border-r border-white/[0.06] p-4 select-none shrink-0 justify-between h-[calc(100vh-80px)] overflow-y-auto">
      {/* Top Branding & Main Navigation */}
      <div className="space-y-5">
        
        {/* Clean Logo */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <MasakaliLogo className="w-8 h-8 rounded-xl object-cover" />
          <div>
            <div className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
              <span>Masakali</span>
            </div>
            <p className="text-[10px] text-zinc-400 font-medium tracking-tight">Free Your Music</p>
          </div>
        </div>

        {/* Primary Menu */}
        <nav className="space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setCurrentTab(item.id)}
                className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-transparent text-white border-l-2 border-cyan-400 shadow-sm'
                    : 'text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-cyan-400' : 'text-zinc-400'}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Play Local Audio File Trigger */}
          {onLocalFilesSelect && (
            <label className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-all cursor-pointer">
              <div className="flex items-center gap-3">
                <FolderOpen className="w-4 h-4 text-cyan-400" />
                <span>Play Local Audio</span>
              </div>
              {localCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300">
                  {localCount}
                </span>
              )}
              <input
                type="file"
                accept="audio/*"
                multiple
                onChange={onLocalFilesSelect}
                className="hidden"
              />
            </label>
          )}

          {/* Smart Queue Trigger */}
          <button
            onClick={onOpenQueue}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-zinc-300 hover:text-white hover:bg-white/[0.04] transition-all"
          >
            <div className="flex items-center gap-3">
              <ListMusic className="w-4 h-4 text-cyan-400" />
              <span>Queue</span>
            </div>
            {queueCount > 0 && (
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {queueCount}
              </span>
            )}
          </button>

          {/* Audio Studio Trigger */}
          <button
            onClick={onOpenStudio}
            className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-violet-300 hover:text-white bg-violet-500/10 hover:bg-violet-500/20 border border-violet-500/20 transition-all group"
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4 text-violet-400 group-hover:rotate-45 transition-transform" />
              <span>Audio Studio</span>
            </div>
            <span className="text-[10px] font-bold bg-violet-500/30 text-violet-200 px-2 py-0.5 rounded">
              EQ
            </span>
          </button>

          {/* Listening Stats & Wrapped Trigger */}
          {onOpenStats && (
            <button
              onClick={onOpenStats}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-cyan-300 hover:text-white hover:bg-white/[0.04] transition-all group"
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Listening Stats</span>
              </div>
              <span className="text-[10px] font-bold bg-cyan-500/20 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-500/30">
                Stats
              </span>
            </button>
          )}

          {/* Download App Trigger (Only when not running as installed app) */}
          {!isInstalled && onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold text-cyan-300 hover:text-white bg-gradient-to-r from-cyan-500/10 via-blue-500/10 to-violet-500/10 hover:from-cyan-500/20 hover:to-violet-500/20 border border-cyan-500/30 transition-all shadow-[0_0_12px_rgba(6,182,212,0.15)] group"
              title="Download Masakali App (Android APK / 1-Tap Install)"
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
                <span>Download App</span>
              </div>
              <span className="text-[10px] font-extrabold bg-gradient-to-r from-cyan-500 to-blue-500 text-black px-2 py-0.5 rounded shadow-sm">
                APK / PWA
              </span>
            </button>
          )}
        </nav>

        {/* Playlists */}
        <div className="pt-3 border-t border-white/[0.06] space-y-1.5">
          <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-500 px-2 flex items-center justify-between">
            <span>Vibe Mixes</span>
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          </div>
          <div className="space-y-0.5">
            {quickPlaylists.slice(0, 4).map((pl) => (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className="w-full text-left px-3 py-1.5 rounded-lg text-xs text-zinc-400 hover:text-cyan-300 hover:bg-white/[0.03] transition-colors truncate flex items-center gap-2"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-400/60 shrink-0"></span>
                <span className="truncate">{pl.title}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Actions: Share App & Support Creator */}
      <div className="pt-4 border-t border-white/[0.06] space-y-2 mt-auto">
        <div className="grid grid-cols-2 gap-1.5">
          {onShareApp && (
            <button
              onClick={onShareApp}
              className="py-2 px-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-xs font-semibold text-zinc-300 hover:text-white border border-white/[0.06] flex items-center justify-center gap-1.5 transition-all"
              title="Share Masakali 🕊️ with Friends"
            >
              <Share2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Share</span>
            </button>
          )}

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className="py-2 px-2.5 rounded-xl bg-gradient-to-r from-rose-500/15 to-violet-500/15 hover:from-rose-500/25 hover:to-violet-500/25 text-xs font-semibold text-rose-300 hover:text-rose-200 border border-rose-500/30 flex items-center justify-center gap-1.5 transition-all"
              title="Keep Masakali Flying Free 🕊️ via UPI"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-400 text-rose-400" />
              <span>Support</span>
            </button>
          )}
        </div>

        {/* Ready status */}
        <div className="p-2.5 rounded-xl bg-pitch-deep/90 border border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            100% Offline Ready
          </span>
          <span className="text-zinc-500">{offlineCount + localCount} Ready</span>
        </div>
      </div>
    </aside>
  );
}
