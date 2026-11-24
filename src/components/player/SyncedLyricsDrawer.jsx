import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic2, Edit3, Check, Plus, Trash2, Clock, 
  RotateCcw, Save, Camera, Search, RefreshCw 
} from 'lucide-react';
import { fetchLyrics } from '../../services/musicApi';
import { useTheme } from '../../context/ThemeContext';

export default function SyncedLyricsDrawer({ isOpen, onClose, engine, onOpenLyricCard }) {
  const { isDark } = useTheme();
  const { currentTrack, currentTime, seek, formatTime, isKaraokeMode, toggleKaraoke, showToast } = engine;
  
  const [lyricsList, setLyricsList] = useState([]);
  const [isEditMode, setIsEditMode] = useState(false);
  const [activeLineIndex, setActiveLineIndex] = useState(-1);
  const [isManualSearchOpen, setIsManualSearchOpen] = useState(false);
  const [manualSearchQuery, setManualSearchQuery] = useState('');
  const [isManualSearching, setIsManualSearching] = useState(false);
  const [lyricsSource, setLyricsSource] = useState('LRCLIB');

  const activeLineRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Load lyrics from current track, with instant localStorage and background fetch
  useEffect(() => {
    if (!currentTrack) return;
    setManualSearchQuery(currentTrack.title || '');
    const storageKey = `as_music_lyrics_${currentTrack.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const list = Array.isArray(parsed) ? parsed : (parsed.lyrics || []);
        if (list.length > 0) {
          setLyricsList(list);
          currentTrack.lyrics = list;
          if (parsed.source) setLyricsSource(parsed.source);
          return;
        }
      } catch (e) {}
    }
    if (currentTrack.lyrics && currentTrack.lyrics.length > 0) {
      setLyricsList(currentTrack.lyrics);
      return;
    }

    // Auto-fetch if not cached
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration, currentTrack.id, false, currentTrack.id)
      .then((res) => {
        if (res && res.lyrics && res.lyrics.length > 0) {
          setLyricsList(res.lyrics);
          currentTrack.lyrics = res.lyrics;
          if (res.source) setLyricsSource(res.source);
          localStorage.setItem(storageKey, JSON.stringify(res));
        }
      })
      .catch(() => {});
  }, [currentTrack]);

  // Track active line according to currentTime
  useEffect(() => {
    if (!lyricsList.length) return;
    let found = -1;
    for (let i = 0; i < lyricsList.length; i++) {
      if (currentTime >= lyricsList[i].time) {
        found = i;
      } else {
        break;
      }
    }
    if (found !== activeLineIndex) {
      setActiveLineIndex(found);
    }
  }, [currentTime, lyricsList, activeLineIndex]);

  // Auto-scroll active line to center
  useEffect(() => {
    if (!isEditMode && activeLineRef.current) {
      activeLineRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLineIndex, isEditMode]);

  if (!isOpen) return null;

  // Manual Lyrics Search Form
  const handleManualSearch = async (e) => {
    e.preventDefault();
    if (!manualSearchQuery.trim()) return;
    setIsManualSearching(true);
    try {
      const res = await fetchLyrics(manualSearchQuery.trim(), currentTrack?.artist || '', currentTrack?.duration, currentTrack?.id, false, currentTrack?.id);
      if (res && res.lyrics && res.lyrics.length > 0) {
        setLyricsList(res.lyrics);
        if (currentTrack) currentTrack.lyrics = res.lyrics;
        setLyricsSource(res.source || 'LRCLIB');
        const storageKey = `as_music_lyrics_${currentTrack?.id}`;
        localStorage.setItem(storageKey, JSON.stringify(res));
        if (showToast) showToast('Synced lyrics updated!');
        setIsManualSearchOpen(false);
      } else {
        if (showToast) showToast('No lyrics found for this query');
      }
    } catch (_) {
      if (showToast) showToast('Search failed');
    } finally {
      setIsManualSearching(false);
    }
  };

  // Lyric Editor Line Controls
  const handleTextChange = (idx, text) => {
    const updated = [...lyricsList];
    updated[idx].text = text;
    setLyricsList(updated);
  };

  const handleTimeChange = (idx, delta) => {
    const updated = [...lyricsList];
    updated[idx].time = Math.max(0, parseFloat((updated[idx].time + delta).toFixed(2)));
    setLyricsList(updated);
  };

  const handleStampCurrentTime = (idx) => {
    const updated = [...lyricsList];
    updated[idx].time = parseFloat(currentTime.toFixed(2));
    setLyricsList(updated);
  };

  const handleDeleteLine = (idx) => {
    const updated = lyricsList.filter((_, i) => i !== idx);
    setLyricsList(updated);
  };

  const handleAddLine = () => {
    const newLine = { time: parseFloat(currentTime.toFixed(2)), text: 'New Lyric Line' };
    const updated = [...lyricsList, newLine].sort((a, b) => a.time - b.time);
    setLyricsList(updated);
  };

  const handleSaveLyrics = () => {
    if (currentTrack) {
      currentTrack.lyrics = lyricsList;
      const storageKey = `as_music_lyrics_${currentTrack.id}`;
      localStorage.setItem(storageKey, JSON.stringify({ lyrics: lyricsList, source: 'Custom (User Edited)' }));
      setLyricsSource('Custom (User Edited)');
    }
    setIsEditMode(false);
    if (showToast) showToast('Custom synced lyrics saved!');
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Sliding Drawer Container */}
      <div className={`w-full sm:w-[500px] h-full border-l shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden select-none transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Manual search bar */}
        {isManualSearchOpen ? (
          <form onSubmit={handleManualSearch} className="flex items-center gap-2 pb-3 border-b border-zinc-800 shrink-0">
            <input
              type="text"
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              placeholder="Search song title or lyrics..."
              className={`flex-1 rounded-xl px-3 py-1.5 text-xs border focus:outline-none ${
                isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-black'
              }`}
              autoFocus
            />
            <button
              type="submit"
              disabled={isManualSearching}
              className={`px-3 py-1.5 rounded-xl font-bold text-xs ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}
            >
              {isManualSearching ? <RefreshCw className="w-3 h-3 animate-spin" /> : <span>Search</span>}
            </button>
            <button
              type="button"
              onClick={() => setIsManualSearchOpen(false)}
              className="p-1 text-zinc-400 hover:text-white shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        ) : (
          <div className={`flex items-center justify-between py-2 text-xs border-b shrink-0 ${
            isDark ? 'border-zinc-800' : 'border-zinc-200'
          }`}>
            <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Source: <span className="font-semibold">{lyricsSource}</span>
            </span>
            <button
              onClick={() => {
                setManualSearchQuery(currentTrack?.title || '');
                setIsManualSearchOpen(true);
              }}
              className={`text-[11px] font-bold flex items-center gap-1.5 hover:underline ${
                isDark ? 'text-zinc-300' : 'text-zinc-700'
              }`}
            >
              <Search className="w-3 h-3" />
              <span>Search manually</span>
            </button>
          </div>
        )}

        {/* Drawer Header */}
        <div className={`flex items-center justify-between py-3 border-b shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-black'
            }`}>
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Lyrics</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  SYNC
                </span>
              </h3>
              <p className={`text-xs truncate max-w-[200px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {currentTrack?.title} • {currentTrack?.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Karaoke Mode Vocal Remover Toggle */}
            <button
              onClick={toggleKaraoke}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold border flex items-center gap-1.5 transition-all ${
                isKaraokeMode
                  ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                  : isDark ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-black'
              }`}
              title="Cancel Lead Vocals (Real-Time Vocal Remover)"
            >
              <Mic2 className="w-3.5 h-3.5" />
              <span>{isKaraokeMode ? 'Vocal Muted' : 'Karaoke'}</span>
            </button>

            {/* Share Lyric Card Generator Button */}
            {onOpenLyricCard && (
              <button
                onClick={() => onOpenLyricCard(activeLineIndex >= 0 ? activeLineIndex : 0)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all ${
                  isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                }`}
                title="Generate 9:16 Story Card for WhatsApp / Instagram"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Story Card</span>
              </button>
            )}

            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
              }`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Lyrics Scrollable Body */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto py-4 space-y-2 pr-1 scroll-smooth"
        >
          {lyricsList.length === 0 ? (
            <div className={`text-center py-20 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
              No synced lyrics available for this track. Use "Search manually" above!
            </div>
          ) : (
            lyricsList.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => !isEditMode && seek(line.time)}
                  className={`transition-all duration-300 rounded-xl p-3 cursor-pointer ${
                    isActive && !isEditMode
                      ? isDark 
                        ? 'bg-zinc-900 border-l-4 border-white pl-4' 
                        : 'bg-zinc-100 border-l-4 border-black pl-4'
                      : isDark ? 'hover:bg-zinc-900/50' : 'hover:bg-zinc-50'
                  }`}
                >
                  <div className="flex items-center justify-between group">
                    <div className="flex-1 pr-3">
                      <p
                        className={`text-base sm:text-lg font-bold transition-all leading-relaxed ${
                          isActive
                            ? isDark
                              ? 'text-white font-black text-xl sm:text-2xl drop-shadow'
                              : 'text-black font-black text-xl sm:text-2xl'
                            : isDark
                              ? 'text-zinc-500 hover:text-zinc-300'
                              : 'text-zinc-400 hover:text-zinc-600'
                        }`}
                      >
                        {line.text}
                      </p>
                      <span className={`text-[10px] font-mono mt-0.5 block ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        {formatTime(line.time)}
                      </span>
                    </div>

                    {onOpenLyricCard && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenLyricCard(idx);
                        }}
                        className={`p-2 rounded-xl opacity-0 group-hover:opacity-100 transition-all shrink-0 ${
                          isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-800' : 'text-zinc-600 hover:text-black hover:bg-zinc-200'
                        }`}
                        title="Generate story card for this line"
                      >
                        <Camera className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className={`pt-3 border-t text-[11px] flex items-center justify-between shrink-0 ${
          isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-500'
        }`}>
          <span>Click any line to seek instantly</span>
          <span className="font-mono font-bold">Auto-Scroll Active</span>
        </div>

      </div>
    </div>
  );
}
