import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Mic2, Edit3, Check, Plus, Trash2, Clock, Sparkles, 
  RotateCcw, Save, Camera, Share2, Search, RefreshCw 
} from 'lucide-react';
import { fetchLyrics } from '../../services/musicApi';

export default function SyncedLyricsDrawer({ isOpen, onClose, engine, onOpenLyricCard }) {
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

    // Fetch from backend with YouTube Captions fallback
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration, currentTrack.id, false, currentTrack.id).then((res) => {
      if (res && res.lyrics && res.lyrics.length > 0) {
        setLyricsList(res.lyrics);
        currentTrack.lyrics = res.lyrics;
        if (res.source) setLyricsSource(res.source);
      }
    }).catch(() => {});
  }, [currentTrack]);

  // Handle Manual Custom Lyrics Search
  const handleManualSearch = async (e) => {
    if (e) e.preventDefault();
    if (!manualSearchQuery.trim()) return;

    setIsManualSearching(true);
    try {
      const res = await fetchLyrics(
        manualSearchQuery.trim(), 
        '', 
        engine.duration || currentTrack?.duration || 0, 
        currentTrack?.id, 
        true, // forceRefresh
        currentTrack?.id
      );

      if (res && res.lyrics && res.lyrics.length > 0) {
        setLyricsList(res.lyrics);
        if (currentTrack) currentTrack.lyrics = res.lyrics;
        if (res.source) setLyricsSource(res.source);
        localStorage.setItem(`as_music_lyrics_${currentTrack?.id}`, JSON.stringify(res.lyrics));
        if (showToast) showToast(`Found ${res.lyrics.length} lyrics from ${res.source || 'LRCLIB'}`);
        setIsManualSearchOpen(false);
      } else {
        if (showToast) showToast(`No matching lyrics found for "${manualSearchQuery}"`);
      }
    } catch (err) {
      if (showToast) showToast('Failed to fetch manual lyrics');
    } finally {
      setIsManualSearching(false);
    }
  };

  // Sync active line based on current playback time
  useEffect(() => {
    if (!lyricsList || lyricsList.length === 0) return;
    
    // Find the current active line
    let foundIndex = -1;
    for (let i = 0; i < lyricsList.length; i++) {
      if (currentTime >= lyricsList[i].time) {
        foundIndex = i;
      } else {
        break;
      }
    }

    if (foundIndex !== activeLineIndex) {
      setActiveLineIndex(foundIndex);
    }
  }, [currentTime, lyricsList, activeLineIndex]);

  // Auto-scroll active line into view smoothly
  useEffect(() => {
    if (isEditMode || !isOpen) return;
    if (activeLineRef.current) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
  }, [activeLineIndex, isEditMode, isOpen]);

  // Handle Editing Actions
  const handleTimeChange = (index, delta) => {
    setLyricsList((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        time: Math.max(0, parseFloat((copy[index].time + delta).toFixed(1)))
      };
      return copy.sort((a, b) => a.time - b.time);
    });
  };

  const handleStampCurrentTime = (index) => {
    setLyricsList((prev) => {
      const copy = [...prev];
      copy[index] = {
        ...copy[index],
        time: parseFloat(currentTime.toFixed(1))
      };
      return copy.sort((a, b) => a.time - b.time);
    });
  };

  const handleTextChange = (index, newText) => {
    setLyricsList((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], text: newText };
      return copy;
    });
  };

  const handleAddLine = () => {
    const newLine = {
      time: parseFloat(currentTime.toFixed(1)),
      text: "New lyric line..."
    };
    setLyricsList((prev) => [...prev, newLine].sort((a, b) => a.time - b.time));
  };

  const handleDeleteLine = (index) => {
    setLyricsList((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSaveLyrics = () => {
    if (currentTrack) {
      localStorage.setItem(`as_music_lyrics_${currentTrack.id}`, JSON.stringify(lyricsList));
    }
    setIsEditMode(false);
  };

  const handleResetDefault = () => {
    if (currentTrack) {
      localStorage.removeItem(`as_music_lyrics_${currentTrack.id}`);
      setLyricsList(currentTrack.lyrics || []);
    }
    setIsEditMode(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Sliding Drawer Container */}
      <div className="w-full sm:w-[500px] h-full bg-[#0B0B10] border-l border-white/[0.08] shadow-2xl flex flex-col p-5 sm:p-6 select-none overflow-hidden selection:bg-cyan-500/30">
        
        {/* Manual Lyrics Search Bar & Subheader */}
        {isManualSearchOpen ? (
          <form onSubmit={handleManualSearch} className="my-2.5 p-2 rounded-xl bg-pitch-deep border border-cyan-500/40 flex items-center gap-2 animate-in fade-in slide-in-from-top-1 shrink-0">
            <Search className="w-4 h-4 text-cyan-400 shrink-0 ml-1" />
            <input
              type="text"
              autoFocus
              placeholder="Search exact song name or artist..."
              value={manualSearchQuery}
              onChange={(e) => setManualSearchQuery(e.target.value)}
              className="bg-transparent text-xs text-white placeholder-zinc-500 flex-1 focus:outline-none"
            />
            <button
              type="submit"
              disabled={isManualSearching}
              className="px-3 py-1 bg-cyan-400 text-black text-xs font-bold rounded-lg hover:scale-105 active:scale-95 transition-all flex items-center gap-1 disabled:opacity-50 shrink-0"
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
          <div className="flex items-center justify-between py-2 text-xs border-b border-white/[0.06] shrink-0">
            <span className="text-[11px] text-zinc-400">
              Source: <span className="text-zinc-200 font-medium">{lyricsSource}</span>
            </span>
            <button
              onClick={() => {
                setManualSearchQuery(currentTrack?.title || '');
                setIsManualSearchOpen(true);
              }}
              className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1.5 transition-colors"
            >
              <Search className="w-3 h-3" />
              <span>Wrong lyrics? Search manually</span>
            </button>
          </div>
        )}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <Mic2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Karaoke Lyrics</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LRC SYNC
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-[200px]">
                {currentTrack?.title} • {currentTrack?.artist}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Live Karaoke Mode Vocal Remover Toggle */}
            <button
              onClick={toggleKaraoke}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                isKaraokeMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:text-white'
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
                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-black flex items-center gap-1.5 shadow hover:scale-105 active:scale-95 transition-all"
                title="Generate 1080x1920 Story Card for WhatsApp / Instagram"
              >
                <Camera className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Story Card</span>
              </button>
            )}

            {/* Edit / Sync Mode Toggle */}
            <button
              onClick={() => {
                if (isEditMode) {
                  handleSaveLyrics();
                } else {
                  setIsEditMode(true);
                }
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                isEditMode
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400'
                  : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:text-white'
              }`}
            >
              {isEditMode ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Done</span>
                </>
              ) : (
                <>
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>Sync</span>
                </>
              )}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sync Editor Controls Bar (When in Edit Mode) */}
        {isEditMode && (
          <div className="p-3 bg-pitch-deep/90 border border-white/[0.06] rounded-xl my-3 flex items-center justify-between text-xs shrink-0">
            <span className="text-zinc-400">
              Current: <strong className="text-cyan-400 font-mono">{formatTime(currentTime)}</strong>
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleAddLine}
                className="px-2.5 py-1 rounded-lg bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Line</span>
              </button>
              <button
                onClick={handleResetDefault}
                className="px-2.5 py-1 rounded-lg bg-white/5 text-zinc-400 hover:text-white text-xs flex items-center gap-1"
                title="Reset to default lyrics"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>
        )}

        {/* Lyrics Scrollable Area */}
        <div 
          ref={scrollContainerRef}
          className="flex-1 overflow-y-auto py-6 space-y-5 px-1 scroll-smooth"
        >
          {lyricsList.length === 0 ? (
            <div className="text-center py-20 text-zinc-400 text-sm">
              No synced lyrics available for this track. Click "Sync Editor" to add!
            </div>
          ) : (
            lyricsList.map((line, idx) => {
              const isActive = idx === activeLineIndex;
              return (
                <div
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => !isEditMode && seek(line.time)}
                  className={`transition-all duration-300 rounded-xl p-2.5 cursor-pointer ${
                    isActive && !isEditMode
                      ? 'bg-gradient-to-r from-cyan-500/20 via-violet-500/15 to-transparent border-l-4 border-cyan-400 pl-4 scale-[1.02]'
                      : 'hover:bg-white/[0.03]'
                  }`}
                >
                  {isEditMode ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5 font-mono text-xs text-cyan-400">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(line.time)}</span>
                          <span className="text-[10px] text-zinc-400">({line.time}s)</span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleTimeChange(idx, -0.5)}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] hover:text-white"
                          >
                            -0.5s
                          </button>
                          <button
                            onClick={() => handleTimeChange(idx, 0.5)}
                            className="px-1.5 py-0.5 rounded bg-zinc-800 text-[10px] hover:text-white"
                          >
                            +0.5s
                          </button>
                          <button
                            onClick={() => handleStampCurrentTime(idx)}
                            className="px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 text-[10px] hover:bg-cyan-500/30 font-semibold"
                            title="Stamp current playback time to this line"
                          >
                            Stamp Now
                          </button>
                          <button
                            onClick={() => handleDeleteLine(idx)}
                            className="p-1 text-red-400 hover:text-red-300"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="text"
                        value={line.text}
                        onChange={(e) => handleTextChange(idx, e.target.value)}
                        className="w-full bg-pitch-deep border border-white/10 rounded-lg px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-between group">
                      <div className="flex-1 pr-3">
                        <p
                          className={`text-base sm:text-lg font-bold transition-all leading-relaxed ${
                            isActive
                              ? 'bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent font-extrabold text-xl sm:text-2xl drop-shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                              : 'text-zinc-400 hover:text-zinc-200'
                          }`}
                        >
                          {line.text}
                        </p>
                        <span className="text-[10px] font-mono text-zinc-400 mt-0.5 block">
                          {formatTime(line.time)}
                        </span>
                      </div>

                      {onOpenLyricCard && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLyricCard(idx);
                          }}
                          className="p-2 rounded-xl text-zinc-500 hover:text-cyan-400 hover:bg-white/[0.06] opacity-0 group-hover:opacity-100 transition-all shrink-0"
                          title="Generate story card for this line"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info */}
        <div className="pt-3 border-t border-white/[0.08] text-[11px] text-zinc-400 flex items-center justify-between shrink-0">
          <span>Click any line to seek instantly</span>
          <span className="font-mono text-cyan-400">Auto-Scroll Active</span>
        </div>

      </div>
    </div>
  );
}
