import React, { useState, useEffect, useRef } from 'react';
import { 
  ChevronDown, Heart, Play, Pause, SkipBack, SkipForward, 
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Mic2, Sliders, 
  Disc3, Waves, Radio, Moon, FastForward, Clock, Activity, 
  MoreVertical, Scissors, Camera, Sparkles, Search, Loader2 
} from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../hooks/useAudioEngine';
import { fetchLyrics, getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';
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
        gradient.addColorStop(0, '#06B6D4');
        gradient.addColorStop(1, '#8B5CF6');
        ctx.fillStyle = gradient;
        ctx.fillRect(x, height - barHeight, barWidth - 2, barHeight);
        x += barWidth;
      }
    };

    render();

    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isOpen, activeTab, analyserNode, isPlaying]);

  if (!isOpen || !currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#050507] text-white flex flex-col justify-between overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-bottom-8">
      
      {/* Dynamic Ambient Background Glow */}
      <div 
        className="absolute inset-0 pointer-events-none transition-all duration-1000 -z-10 opacity-70"
        style={{
          background: `radial-gradient(circle at 50% 30%, ${ambientGlow?.primary || 'rgba(6,182,212,0.2)'} 0%, ${ambientGlow?.secondary || 'rgba(139,92,246,0.15)'} 50%, #050507 90%)`
        }}
      />

      {/* 1. Top Header Bar */}
      <header className="px-4 sm:px-6 py-4 flex items-center justify-between border-b border-white/[0.06] backdrop-blur-md bg-black/20 shrink-0">
        
        {/* Left: Minimize Arrow */}
        <button
          onClick={onClose}
          className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-all active:scale-95"
          title="Minimize to mini player"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        {/* View Switcher Tabs (Cover, Lyrics, Studio) */}
        <div className="flex items-center gap-1 bg-white/[0.06] p-1 rounded-full border border-white/10">
          <button
            onClick={() => setActiveTab('cover')}
            className={`px-3 py-1 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'cover' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Art
          </button>
          <button
            onClick={() => setActiveTab('lyrics')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'lyrics' ? 'bg-cyan-500 text-black shadow-md' : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Mic2 className="w-3 h-3" />
            <span>Lyrics</span>
          </button>
          <button
            onClick={() => setActiveTab('studio')}
            className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 transition-all ${
              activeTab === 'studio' ? 'bg-violet-500 text-white shadow-md' : 'text-zinc-400 hover:text-white'
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
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-cyan-400 transition-all active:scale-95"
            title="Search Next Song"
          >
            <Search className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsActionSheetOpen(true)}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-300 hover:text-white transition-all active:scale-95"
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
            <div className="relative w-64 h-64 sm:w-80 sm:h-80 rounded-3xl overflow-hidden shadow-2xl border border-white/10 group">
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

            {/* Song Title & Artist with Like & 3-Dot Options */}
            <div className="w-full flex items-center justify-between px-2">
              <div className="text-left min-w-0 flex-1 pr-4">
                <h2 className="text-xl sm:text-2xl font-extrabold text-white truncate">
                  {currentTrack.title}
                </h2>
                <p className="text-sm sm:text-base text-zinc-400 truncate mt-1">
                  {currentTrack.artist}
                </p>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => onToggleLike(currentTrack.id)}
                  className="p-3 rounded-full hover:bg-white/10 transition-transform active:scale-125"
                >
                  <Heart
                    className={`w-7 h-7 ${
                      isLiked ? 'fill-cyan-400 text-cyan-400' : 'text-zinc-400 hover:text-white'
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
            <div className="flex items-center justify-between pb-3 px-2 border-b border-white/[0.06] text-xs">
              <button
                onClick={toggleKaraoke}
                className={`px-3 py-1.5 rounded-xl font-semibold border flex items-center gap-1.5 transition-all ${
                  isKaraokeMode
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.4)]'
                    : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:text-white'
                }`}
                title="Toggle Live Vocal Remover"
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>{isKaraokeMode ? 'Vocal Muted (Karaoke)' : 'Karaoke Mode'}</span>
              </button>

              {onOpenLyricCard && (
                <button
                  onClick={() => onOpenLyricCard(activeLyricIndex >= 0 ? activeLyricIndex : 0)}
                  className="px-3 py-1.5 rounded-xl font-bold bg-gradient-to-r from-cyan-400 to-violet-500 text-black flex items-center gap-1.5 shadow hover:scale-105 active:scale-95 transition-all"
                  title="Generate 9:16 Story Card for WhatsApp & Instagram"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Share Story Card</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-center scroll-smooth px-2">
              {lyricsList.length === 0 ? (
                <div className="py-20 text-zinc-500 text-sm">
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
                            ? 'text-2xl sm:text-3xl font-black bg-gradient-to-r from-cyan-300 via-white to-violet-300 bg-clip-text text-transparent scale-105 drop-shadow-[0_0_20px_rgba(6,182,212,0.5)]'
                            : 'text-base sm:text-lg text-zinc-500 hover:text-zinc-300 font-medium'
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
                          className="absolute right-0 top-1/2 -translate-y-1/2 p-1.5 text-zinc-600 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
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
            <div className="p-3 rounded-2xl bg-pitch-deep/90 border border-white/[0.06]">
              <canvas ref={canvasRef} width={400} height={60} className="w-full h-14 rounded-lg bg-[#050507]" />
            </div>

            {/* EQ Presets */}
            <div className="flex flex-wrap gap-1.5 justify-center">
              {Object.keys(EQ_PRESETS).map((pName) => (
                <button
                  key={pName}
                  onClick={() => applyPreset(pName)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    activePreset === pName
                      ? 'bg-cyan-500 text-black border-cyan-400'
                      : 'bg-white/[0.04] text-zinc-400 border-white/[0.06] hover:text-white'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>

            {/* 10-Band EQ Horizontal Sliders Grid */}
            <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06]">
              <div className="grid grid-cols-10 gap-1 sm:gap-2 items-center">
                {EQ_FREQUENCIES.map((freq, idx) => {
                  const gain = eqGains[idx] || 0;
                  const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                  return (
                    <div key={freq} className="flex flex-col items-center gap-1.5">
                      <span className="text-[9px] font-mono text-zinc-400">{gain > 0 ? `+${gain}` : gain}</span>
                      <div className="h-24 flex items-center justify-center">
                        <input
                          type="range"
                          min="-12"
                          max="12"
                          step="1"
                          value={gain}
                          onChange={(e) => setEqBand(idx, parseFloat(e.target.value))}
                          className="w-20 -rotate-90 cursor-pointer accent-cyan-400"
                        />
                      </div>
                      <span className="text-[9px] font-mono font-medium text-zinc-400">{label}</span>
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
                  isKaraokeMode ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400' : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                }`}
              >
                <Mic2 className="w-4 h-4 text-emerald-400" />
                <span>Karaoke Mode</span>
              </button>

              <button
                onClick={toggleSlowedReverb}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  isSlowedReverb ? 'bg-violet-500/20 text-violet-200 border-violet-400' : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                }`}
              >
                <Waves className="w-4 h-4 text-violet-400" />
                <span>Slowed + Reverb</span>
              </button>

              <button
                onClick={toggle8D}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  is8DActive ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400' : 'bg-white/[0.04] text-zinc-400 border-white/[0.06]'
                }`}
              >
                <Radio className="w-4 h-4 text-cyan-400" />
                <span>8D Spatial</span>
              </button>
            </div>

            {/* Playback Speed Slider */}
            <div className="p-3.5 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] flex items-center justify-between gap-4 text-xs">
              <span className="text-zinc-400 font-semibold flex items-center gap-1.5">
                <FastForward className="w-4 h-4 text-cyan-400" /> Speed
              </span>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.05"
                value={playbackSpeed}
                onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
                className="flex-1 cursor-pointer accent-cyan-400"
              />
              <span className="font-mono text-cyan-300 font-bold">{playbackSpeed.toFixed(2)}x</span>
            </div>

            {/* 1-Tap Ringtone Clipper Card in Studio */}
            {onOpenClipper && (
              <button
                onClick={() => onOpenClipper(currentTrack)}
                className="w-full p-3.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 border border-cyan-400/40 text-white font-bold text-xs flex items-center justify-between hover:scale-[1.01] transition-all shadow-md"
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4 text-cyan-400" />
                  <span>Cut Ringtone / 30s Status Clip</span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-400 text-black font-extrabold">
                  CUT 30s
                </span>
              </button>
            )}

          </div>
        )}

      </main>

      {/* 3. Bottom Playback Controls Strip */}
      <footer className="p-6 max-w-xl mx-auto w-full space-y-4 shrink-0">
        
        {/* Large Progress Seekbar with accurate BoundingClientRect coordinate math */}
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
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden pointer-events-none">
              <div
                className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full transition-all pointer-events-none"
                style={{ width: `${displayPercent}%` }}
              />
            </div>
            
            {/* Glowing scrubber thumb indicator on hover/drag */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full bg-white shadow-[0_0_12px_rgba(6,182,212,0.9)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{ left: `${displayPercent}%`, opacity: isDragging ? 1 : undefined }}
            />
          </div>

          <div className="flex justify-between text-xs font-mono text-zinc-400">
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
              isShuffle ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          {/* Previous */}
          <button
            onClick={prevTrack}
            className="p-3 text-zinc-300 hover:text-white transition-colors"
            title="Previous"
          >
            <SkipBack className="w-7 h-7" />
          </button>

          {/* Large Main Play/Pause Button */}
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(6,182,212,0.5)]"
            title={isBuffering && isPlaying ? "Buffering..." : isPlaying ? "Pause" : "Play"}
          >
            {isBuffering && isPlaying ? (
              <Loader2 className="w-8 h-8 text-black animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-8 h-8 fill-black" />
            ) : (
              <Play className="w-8 h-8 fill-black translate-x-0.5" />
            )}
          </button>

          {/* Next */}
          <button
            onClick={nextTrack}
            className="p-3 text-zinc-300 hover:text-white transition-colors"
            title="Next"
          >
            <SkipForward className="w-7 h-7" />
          </button>

          {/* Repeat */}
          <button
            onClick={cycleRepeat}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off' ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Volume Slider Row */}
        <div className="flex items-center justify-center gap-3 pt-2 text-zinc-400">
          <button onClick={toggleMute} className="hover:text-white">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-40 cursor-pointer accent-cyan-400"
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
