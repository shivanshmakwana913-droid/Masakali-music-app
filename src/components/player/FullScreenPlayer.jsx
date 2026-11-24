import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Heart, Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Mic2, Sliders, 
  Disc3, Waves, Radio, FastForward, 
  MoreVertical, Scissors, Camera, Search, Loader2 
} from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../hooks/useAudioEngine';
import { fetchLyrics, getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';
import { useTheme } from '../../context/ThemeContext';
import TrackActionSheet from './TrackActionSheet';

export default function FullScreenPlayer({
  isOpen,
  onClose,
  engine,
  likedTrackIds,
  onToggleLike,
  ambientGlow,
  onOpenClipper,
  onOpenLyricCard,
  onShareApp,
  onOpenSupport,
  onOpenSearch
}) {
  const { isDark } = useTheme();

  const {
    currentTrack,
    isPlaying,
    isBuffering,
    togglePlay,
    nextTrack,
    prevTrack,
    currentTime,
    duration,
    seek,
    volume,
    setVolume,
    isMuted,
    toggleMute,
    isShuffle,
    toggleShuffle,
    repeatMode,
    cycleRepeat,
    formatTime,
    isSlowedReverb,
    toggleSlowedReverb,
    playbackSpeed,
    setPlaybackSpeed,
    is8DActive,
    toggle8D,
    isKaraokeMode,
    toggleKaraoke,
    panPosition,
    eqGains,
    setEqBand,
    activePreset,
    applyPreset,
    analyserNode
  } = engine;

  // Active view tab inside Full-Screen player: 'cover' | 'lyrics' | 'studio'
  const [activeTab, setActiveTab] = useState('cover');
  const [activeLyricIndex, setActiveLyricIndex] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(0);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const [lyricsList, setLyricsList] = useState(currentTrack?.lyrics || []);

  const activeLyricRef = useRef(null);
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const seekbarRef = useRef(null);

  // Safe duration guard: prevents Infinity, NaN, or 0 from breaking seek calculations
  const effectiveDuration = (duration && Number.isFinite(duration) && duration > 0)
    ? duration
    : (currentTrack?.duration && Number.isFinite(currentTrack.duration) && currentTrack.duration > 0 ? currentTrack.duration : 180);

  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false;
  const actualPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const displayPercent = isDragging ? dragPercent : actualPercent;

  // Sync lyrics list from track or instant cache / background fetch
  useEffect(() => {
    if (!currentTrack) return;
    const storageKey = `as_music_lyrics_${currentTrack.id}`;
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const list = Array.isArray(parsed) ? parsed : (parsed.lyrics || []);
        if (list.length > 0) {
          setLyricsList(list);
          currentTrack.lyrics = list;
          return;
        }
      } catch (_) {}
    }
    if (currentTrack.lyrics && currentTrack.lyrics.length > 0) {
      setLyricsList(currentTrack.lyrics);
      return;
    }
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration, currentTrack.id, false, currentTrack.id).then((res) => {
      if (res && res.lyrics && res.lyrics.length > 0) {
        setLyricsList(res.lyrics);
        currentTrack.lyrics = res.lyrics;
      }
    }).catch(() => {});
  }, [currentTrack]);

  // Accurate coordinate-based seek on click or scrub using getBoundingClientRect()
  const handleSeekByPointer = (clientX) => {
    const rect = seekbarRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setDragPercent(ratio * 100);
    const targetTime = ratio * effectiveDuration;
    seek(targetTime);
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(true);
    handleSeekByPointer(e.clientX);
  };

  const handlePointerMove = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    handleSeekByPointer(e.clientX);
  };

  const handlePointerUp = (e) => {
    if (!isDragging) return;
    e.stopPropagation();
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (_) {}
    setIsDragging(false);
    handleSeekByPointer(e.clientX);
  };

  // Sync lyrics line
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
    if (found !== activeLyricIndex) {
      setActiveLyricIndex(found);
    }
  }, [currentTime, lyricsList, activeLyricIndex]);

  // Auto-scroll lyrics
  useEffect(() => {
    if (activeTab === 'lyrics' && activeLyricRef.current) {
      activeLyricRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [activeLyricIndex, activeTab]);

  // FFT Visualizer canvas in Studio tab
  useEffect(() => {
    if (!isOpen || activeTab !== 'studio' || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const bufferLength = analyserNode ? analyserNode.frequencyBinCount : 32;
    const dataArray = new Uint8Array(bufferLength);

    const render = () => {
      animationRef.current = requestAnimationFrame(render);
      const width = canvas.width;
      const height = canvas.height;
      ctx.clearRect(0, 0, width, height);

      if (analyserNode && isPlaying) {
        analyserNode.getByteFrequencyData(dataArray);
      } else {
        for (let i = 0; i < bufferLength; i++) {
          dataArray[i] = Math.max(6, Math.sin((i / bufferLength) * Math.PI) * 18);
        }
      }

      const barWidth = (width / bufferLength) * 2.2;
      let x = 0;

      for (let i = 0; i < bufferLength; i++) {
        const barHeight = (dataArray[i] / 255) * height * 0.9;
        const gradient = ctx.createLinearGradient(0, height, 0, height - barHeight);
        if (isDark) {
          gradient.addColorStop(0, '#FFFFFF');
          gradient.addColorStop(1, '#52525B');
        } else {
          gradient.addColorStop(0, '#09090B');
          gradient.addColorStop(1, '#A1A1AA');
        }
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isOpen, activeTab, analyserNode, isPlaying, isDark]);

  if (!isOpen || !currentTrack) return null;

  return (
    <div className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden transition-colors duration-300 animate-in fade-in slide-in-from-bottom-8 ${
      isDark ? 'bg-black text-white' : 'bg-white text-zinc-950'
    }`}>
      
      {/* Subtle Monochrome Vignette Background */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-700 -z-10"
        style={{
          background: isDark
            ? 'radial-gradient(circle at 50% 25%, rgba(255,255,255,0.04) 0%, rgba(0,0,0,0.6) 70%, #000000 100%)'
            : 'radial-gradient(circle at 50% 25%, rgba(0,0,0,0.02) 0%, rgba(255,255,255,0.6) 70%, #FFFFFF 100%)'
        }}
      />

      {/* 1. Top Header Bar */}
      <header className={`px-4 sm:px-6 py-4 flex items-center justify-between border-b backdrop-blur-md shrink-0 transition-colors ${
        isDark ? 'border-zinc-800/80 bg-black/40' : 'border-zinc-200/80 bg-white/60'
      }`}>
        
        {/* Left: Minimize Arrow */}
        <button
          onClick={onClose}
          className={`p-2 rounded-full transition-all active:scale-95 ${
            isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
          }`}
          title="Minimize to mini player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* View Switcher Tabs (Art, Lyrics, Studio) */}
        <div className={`flex items-center gap-1 p-1 rounded-full border transition-colors ${
          isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold transition-all ${
              activeTab === 'cover'
                ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
            }`}
          >
            Art
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
              activeTab === 'lyrics'
                ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Mic2 className="w-3 h-3" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1 transition-all ${
              activeTab === 'studio'
                ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
            }`}
          >
            <Sliders className="w-3 h-3" />
            <span>Studio</span>
          </button>
        </div>

        {/* Right: Search & 3-Dot Options */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            }}
            className={`p-2 rounded-full transition-all active:scale-95 ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
            title="Search Next Song"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActionSheetOpen(true)}
            className={`p-2 rounded-full transition-all active:scale-95 ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
            title="Track Options"
          >
            <MoreVertical className="w-6 h-6" />
          </button>
        </div>

      </header>

      {/* 2. Middle Content Area (Switches based on activeTab) */}
      <main className="flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto">
        
        {/* TAB 1: Large Cover Art */}
        {activeTab === 'cover' && (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center text-center space-y-6 my-auto">
            {/* Album Cover Art */}
            <div className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border transition-all ${
              isDark ? 'border-zinc-800' : 'border-zinc-200 shadow-zinc-200'
            }`}>
              <img
                src={getHighResThumbnail(currentTrack.cover, currentTrack.id)}
                alt={currentTrack.title}
                onError={handleCoverImageError}
                className={`w-full h-full object-cover transition-transform duration-700 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
              )}
            </div>

            {/* Song Title & Artist with Like */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="text-left min-w-0 flex-1 pr-4">
                <h2 className={`text-xl sm:text-2xl font-black truncate ${
                  isDark ? 'text-white' : 'text-zinc-950'
                }`}>
                  {currentTrack.title}
                </h2>
                <p className={`text-sm sm:text-base truncate mt-1 ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleLike(currentTrack.id)}
                  className={`p-3 rounded-full transition-transform active:scale-125 ${
                    isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
                  }`}
                  title={isLiked ? "Unlike" : "Like"}
                >
                  <Heart
                    className={`w-7 h-7 transition-colors ${
                      isLiked 
                        ? isDark ? 'fill-white text-white' : 'fill-black text-black' 
                        : isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Synced Lyrics View */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-xl h-full flex flex-col py-4">
            
            {/* Quick Karaoke & Story Card Top Bar */}
            <div className={`flex items-center justify-between pb-3 px-2 border-b text-xs ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <button
                onClick={toggleKaraoke}
                className={`px-3 py-1.5 rounded-xl font-bold border flex items-center gap-1.5 transition-all ${
                  isKaraokeMode
                    ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                    : isDark ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-black'
                }`}
                title="Toggle Live Vocal Remover"
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>{isKaraokeMode ? 'Vocal Muted (Karaoke)' : 'Karaoke Mode'}</span>
              </button>

              {onOpenLyricCard && (
                <button
                  onClick={() => onOpenLyricCard(activeLyricIndex >= 0 ? activeLyricIndex : 0)}
                  className={`px-3 py-1.5 rounded-xl font-bold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all ${
                    isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                  title="Generate 9:16 Story Card for WhatsApp & Instagram"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Share Story Card</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-center scroll-smooth px-2">
              {lyricsList.length === 0 ? (
                <div className={`py-20 text-sm ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                  Searching for synced lyrics...
                </div>
              ) : (
                lyricsList.map((line, idx) => {
                  const isActive = idx === activeLyricIndex;
                  return (
                    <div key={idx} className="relative group">
                      <p
                        ref={isActive ? activeLyricRef : null}
                        onClick={() => seek(line.time)}
                        className={`cursor-pointer transition-all duration-300 leading-relaxed ${
                          isActive
                            ? isDark
                              ? 'text-2xl sm:text-3xl font-black text-white scale-105 drop-shadow'
                              : 'text-2xl sm:text-3xl font-black text-black scale-105'
                            : isDark
                              ? 'text-base sm:text-lg text-zinc-500 hover:text-zinc-300 font-medium'
                              : 'text-base sm:text-lg text-zinc-400 hover:text-zinc-600 font-medium'
                        }`}
                      >
                        {line.text}
                      </p>

                      {onOpenLyricCard && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenLyricCard(idx);
                          }}
                          className={`absolute right-0 top-1/2 -translate-y-1/2 p-1.5 opacity-0 group-hover:opacity-100 transition-opacity ${
                            isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'
                          }`}
                          title="Generate story card from this line"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* TAB 3: Audio Studio (EQ, Slowed+Reverb, 8D, Speed, Karaoke) */}
        {activeTab === 'studio' && (
          <div className="w-full max-w-lg space-y-5 my-auto py-2">
            
            {/* Visualizer */}
            <div className={`p-3 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <canvas 
                ref={canvasRef} 
                width={400} 
                height={60} 
                className={`w-full h-14 rounded-lg ${isDark ? 'bg-black' : 'bg-white'}`} 
              />
            </div>

            {/* EQ Presets */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {Object.keys(EQ_PRESETS).map((pName) => (
                <button
                  key={pName}
                  onClick={() => applyPreset(pName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    activePreset === pName
                      ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                      : isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>

            {/* 10-Band EQ Sliders Grid */}
            <div className={`p-4 rounded-2xl border ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <div className="grid grid-cols-10 gap-1 sm:gap-2 items-center">
                {EQ_FREQUENCIES.map((freq, idx) => {
                  const gain = eqGains[idx] || 0;
                  const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                  return (
                    <div key={freq} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{gain > 0 ? `+${gain}` : gain}</span>
                      <div className="h-24 flex items-center justify-center">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={gain}
                          onChange={(e) => setEqBand(idx, parseFloat(e.target.value))}
                          className={`w-20 -rotate-90 cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
                        />
                      </div>
                      <span className={`text-[9px] font-mono font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Quick 1-Tap Vibe & Karaoke Toggles */}
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={toggleKaraoke}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  isKaraokeMode
                    ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                    : isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black'
                }`}
              >
                <Mic2 className="w-4 h-4" />
                <span>Karaoke Mode</span>
              </button>

              <button
                onClick={toggleSlowedReverb}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  isSlowedReverb
                    ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                    : isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black'
                }`}
              >
                <Waves className="w-4 h-4" />
                <span>Slowed + Reverb</span>
              </button>

              <button
                onClick={toggle8D}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  is8DActive
                    ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                    : isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>8D Spatial</span>
              </button>
            </div>

            {/* Playback Speed Slider */}
            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 text-xs ${
              isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
            }`}>
              <span className="font-semibold flex items-center gap-1.5">
                <FastForward className="w-4 h-4" /> Speed
              </span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className={`flex-1 cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
              />
              <span className="font-mono font-bold">{playbackSpeed.toFixed(2)}x</span>
            </div>

            {/* 1-Tap Ringtone Clipper Card in Studio */}
            {onOpenClipper && (
              <button
                onClick={() => onOpenClipper(currentTrack)}
                className={`w-full p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between hover:scale-[1.01] transition-all shadow-sm ${
                  isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4" />
                  <span>Cut Ringtone / 30s Status Clip</span>
                </div>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}>
                  CUT 30s
                </span>
              </button>
            )}

          </div>
        )}

      </main>

      {/* 3. Bottom Playback Controls Strip */}
      <footer className="p-6 max-w-xl mx-auto w-full space-y-4 shrink-0">
        
        {/* Large Progress Seekbar */}
        <div 
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
          onTouchStart={(e) => e.stopPropagation()}
          className="space-y-1.5"
        >
          <div 
            ref={seekbarRef}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            className="relative w-full h-5 flex items-center cursor-pointer group touch-none"
          >
            <div className={`w-full h-2 rounded-full overflow-hidden pointer-events-none ${
              isDark ? 'bg-zinc-800' : 'bg-zinc-200'
            }`}>
              <div
                className={`h-full rounded-full transition-all pointer-events-none ${
                  isDark ? 'bg-white' : 'bg-black'
                }`}
                style={{ width: `${displayPercent}%` }}
              />
            </div>
            
            {/* Scrubber thumb indicator on hover/drag */}
            <div 
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none ${
                isDark ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.8)]' : 'bg-black shadow-[0_0_10px_rgba(0,0,0,0.5)]'
              }`}
              style={{ left: `${displayPercent}%`, opacity: isDragging ? 1 : undefined }}
            />
          </div>

          <div className={`flex justify-between text-xs font-mono ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            <span>{formatTime(isDragging ? (dragPercent / 100) * effectiveDuration : currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Large Playback Controls */}
        <div className="flex items-center justify-between px-4 pt-2">
          {/* Shuffle Toggle */}
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffle 
                ? isDark ? 'text-white font-bold' : 'text-black font-bold' 
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            className={`p-3 transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
            }`}
            title="Previous"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          {/* Large Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className={`w-16 h-16 rounded-full font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-md ${
              isDark 
                ? 'bg-white text-black hover:bg-zinc-200 shadow-zinc-900' 
                : 'bg-black text-white hover:bg-zinc-800 shadow-zinc-300'
            }`}
            title={isBuffering && isPlaying ? "Buffering..." : isPlaying ? "Pause" : "Play"}
          >
            {isBuffering && isPlaying ? (
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-black' : 'text-white'}`} />
            ) : isPlaying ? (
              <Pause className={`w-8 h-8 ${isDark ? 'fill-black' : 'fill-white'}`} />
            ) : (
              <Play className={`w-8 h-8 translate-x-0.5 ${isDark ? 'fill-black' : 'fill-white'}`} />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className={`p-3 transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
            }`}
            title="Next"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off' 
                ? isDark ? 'text-white font-bold' : 'text-black font-bold' 
                : isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-700'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume Slider Row */}
        <div className={`flex items-center justify-center gap-3 pt-2 ${
          isDark ? 'text-zinc-400' : 'text-zinc-600'
        }`}>
          <button onClick={toggleMute} className={isDark ? 'hover:text-white' : 'hover:text-black'}>
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-500" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className={`w-40 cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
          />
        </div>

      </footer>

      {/* 3-Dot Action Sheet */}
      <TrackActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        track={currentTrack}
        engine={engine}
        isLiked={isLiked}
        onToggleLike={onToggleLike}
        onOpenStudio={() => {
          setActiveTab('studio');
        }}
        onOpenClipper={onOpenClipper}
        onShareApp={onShareApp}
        onOpenSupport={onOpenSupport}
      />

    </div>
  );
}
