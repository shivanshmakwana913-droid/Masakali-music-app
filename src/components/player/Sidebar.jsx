import React from 'react';
import { 
  Home, Search, Library, Sliders, ListMusic, 
  FolderOpen, Share2, Heart, BarChart2, Download, Settings, Disc
} from 'lucide-react';
import { quickPlaylists } from '../../data/mockTracks';
import { useTheme } from '../../context/ThemeContext';
import MasakaliLogo from '../common/MasakaliLogo';

export default function Sidebar({ 
  currentTab, 
  setCurrentTab, 
  onOpenStudio, 
  onOpenQueue,
  onOpenStats,
  onOpenSettings,
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
  const { isDark } = useTheme();

  const navItems = [
    { id: 'home', label: 'Home', icon: Home },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'library', label: 'Your Library', icon: Library, badge: likedCount > 0 ? `${likedCount}` : null },
  ];

  return (
    <aside className={`hidden md:flex flex-col w-64 border-r p-4 select-none shrink-0 justify-between h-[calc(100vh-80px)] overflow-y-auto transition-colors duration-200 ${
      isDark ? 'bg-[#0A0A0A] border-zinc-800/80 text-white' : 'bg-[#FAFAFA] border-zinc-200 text-zinc-950'
    }`}>
      {/* Top Branding & Main Navigation */}
      <div className="space-y-5">
        
        {/* Clean Logo */}
        <div className="flex items-center gap-2.5 px-2 py-1">
          <MasakaliLogo className="w-8 h-8 rounded-xl object-contain bg-black border border-zinc-800" />
          <div>
            <div className={`font-black text-lg tracking-tight ${isDark ? 'text-white' : 'text-zinc-950'}`}>
              Masakali
            </div>
            <p className={`text-[10px] font-medium tracking-tight ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Free Your Music
            </p>
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
                    ? isDark
                      ? 'bg-white text-black shadow-sm font-bold'
                      : 'bg-black text-white shadow-sm font-bold'
                    : isDark
                      ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/60'
                      : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? (isDark ? 'text-black' : 'text-white') : ''}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                    isActive
                      ? isDark
                        ? 'bg-zinc-200 text-black border-zinc-300'
                        : 'bg-zinc-800 text-white border-zinc-700'
                      : isDark
                        ? 'bg-zinc-800 text-zinc-300 border-zinc-700'
                        : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}

          {/* Play Local Audio File Trigger */}
          {onLocalFilesSelect && (
            <label className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all cursor-pointer ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/60' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
            }`}>
              <div className="flex items-center gap-3">
                <FolderOpen className="w-4 h-4" />
                <span>Play Local Audio</span>
              </div>
              {localCount > 0 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                }`}>
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
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/60' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
            }`}
          >
            <div className="flex items-center gap-3">
              <ListMusic className="w-4 h-4" />
              <span>Queue</span>
            </div>
            {queueCount > 0 && (
              <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-700 border-zinc-300'
              }`}>
                {queueCount}
              </span>
            )}
          </button>

          {/* Audio Studio Trigger */}
          <button
            onClick={onOpenStudio}
            className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all border ${
              isDark 
                ? 'bg-zinc-900/60 border-zinc-800 hover:bg-zinc-850 hover:border-zinc-700 text-zinc-200' 
                : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800'
            }`}
          >
            <div className="flex items-center gap-3">
              <Sliders className="w-4 h-4" />
              <span>Audio Studio</span>
            </div>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
            }`}>
              10-Band EQ
            </span>
          </button>

          {/* Listening Stats Trigger */}
          {onOpenStats && (
            <button
              onClick={onOpenStats}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/60' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <BarChart2 className="w-4 h-4" />
                <span>Listening Stats</span>
              </div>
            </button>
          )}

          {/* Settings Trigger */}
          {onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/60' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/60'
              }`}
            >
              <div className="flex items-center gap-3">
                <Settings className="w-4 h-4" />
                <span>Settings</span>
              </div>
            </button>
          )}

          {/* Download App Trigger */}
          {!isInstalled && onOpenDownload && (
            <button
              onClick={onOpenDownload}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-semibold border transition-all ${
                isDark 
                  ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-white' 
                  : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <Download className="w-4 h-4" />
                <span>Download App</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}>
                APK
              </span>
            </button>
          )}
        </nav>

        {/* Playlists */}
        <div className={`pt-3 border-t space-y-1.5 ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
          <div className={`text-[11px] font-bold uppercase tracking-wider px-2 flex items-center justify-between ${
            isDark ? 'text-zinc-500' : 'text-zinc-400'
          }`}>
            <span>Vibe Mixes</span>
            <Disc className="w-3.5 h-3.5" />
          </div>
          <div className="space-y-0.5">
            {quickPlaylists.slice(0, 4).map((pl) => (
              <button
                key={pl.id}
                onClick={() => onSelectPlaylist(pl)}
                className={`w-full text-left px-3 py-1.5 rounded-lg text-xs truncate flex items-center gap-2 transition-colors ${
                  isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900/40' : 'text-zinc-600 hover:text-zinc-950 hover:bg-zinc-200/50'
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isDark ? 'bg-zinc-500' : 'bg-zinc-400'}`}></span>
                <span className="truncate">{pl.title}</span>
              </button>
            ))}
          </div>
        </div>

      </div>

      {/* Bottom Actions: Share App & Support Creator */}
      <div className={`pt-4 border-t space-y-2 mt-auto ${isDark ? 'border-zinc-800/60' : 'border-zinc-200'}`}>
        <div className="grid grid-cols-2 gap-1.5">
          {onShareApp && (
            <button
              onClick={onShareApp}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isDark 
                  ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border-zinc-200'
              }`}
              title="Share Masakali with Friends"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          )}

          {onOpenSupport && (
            <button
              onClick={onOpenSupport}
              className={`py-2 px-2.5 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                isDark 
                  ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-800' 
                  : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-zinc-950 border-zinc-200'
              }`}
              title="Support Masakali via UPI"
            >
              <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500" />
              <span>Support</span>
            </button>
          )}
        </div>

        {/* Status */}
        <div className={`p-2.5 rounded-xl border flex items-center justify-between text-[11px] ${
          isDark ? 'bg-zinc-950 border-zinc-800/80 text-zinc-400' : 'bg-zinc-100 border-zinc-200 text-zinc-600'
        }`}>
          <span className="flex items-center gap-1.5 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            100% Offline Ready
          </span>
          <span className={isDark ? 'text-zinc-500' : 'text-zinc-400'}>{offlineCount + localCount} Ready</span>
        </div>
      </div>
    </aside>
  );
}
