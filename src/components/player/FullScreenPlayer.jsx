import React, { useState, useEffect, useRef } from 'react';
import {
  ChevronDown, Heart, Play, Pause, SkipBack, SkipForward,
  Shuffle, Repeat, Repeat1, Volume2, VolumeX, Mic2, Sliders,
  Waves, Radio, FastForward, MoreVertical, Scissors, Camera,
  Search, Loader2, ListMusic, Disc3, Trash2
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
    eqGains,
    setEqBand,
    activePreset,
    applyPreset,
    analyserNode,
    queue = [],
    playTrack,
    removeFromQueue,
    clearQueue
  } = engine;

  // 'cover' | 'lyrics' | 'studio' | 'queue'
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
    setLyricsList([]);
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration, currentTrack.id, false, currentTrack.id).then((res) => {
      if (res && res.lyrics && res.lyrics.length > 0) {
        setLyricsList(res.lyrics);
        currentTrack.lyrics = res.lyrics;
      }
    }).catch(() => {});
  }, [currentTrack]);

  const handleSeekByPointer = (clientX) => {
    const rect = seekbarRef.current?.getBoundingClientRect();
    if (!rect || rect.width === 0) return;
    const ratio = Math.min(1, Math.max(0, (clientX - rect.left) / rect.width));
    setDragPercent(ratio * 100);
    seek(ratio * effectiveDuration);
  };

  const handlePointerDown = (e) => {
    e.stopPropagation();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch (_) {}
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
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch (_) {}
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
          gradient.addColorStop(1, 'rgba(255,255,255,0.25)');
        } else {
          gradient.addColorStop(0, '#09090B');
          gradient.addColorStop(1, 'rgba(9,9,11,0.25)');
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

  const coverUrl = getHighResThumbnail(currentTrack.cover, currentTrack.id);
  const isLongTitle = currentTrack.title && currentTrack.title.length > 26;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col justify-between overflow-hidden select-none transition-colors duration-300 animate-in fade-in slide-in-from-bottom-8 ${
        isDark ? 'bg-[#050507] text-white' : 'bg-[#FAFAFA] text-zinc-950'
      }`}
    >
      {/* Dynamic Album-Art Mesh Backdrop */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-10">
        <img
          src={coverUrl}
          alt=""
          aria-hidden="true"
          onError={(e) => { e.currentTarget.style.display = 'none'; }}
          className="w-full h-full object-cover scale-125 transition-all duration-1000"
          style={{
            filter: isDark
              ? 'blur(70px) saturate(180%) brightness(0.45)'
              : 'blur(70px) saturate(150%) brightness(1.1)',
            opacity: isDark ? 0.95 : 0.22
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: isDark
              ? 'linear-gradient(180deg, rgba(0,0,0,0.25) 0%, rgba(0,0,0,0.45) 55%, rgba(0,0,0,0.82) 100%)'
              : 'linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.65) 60%, rgba(255,255,255,0.92) 100%)'
          }}
        />
      </div>

      {/* 1. Top Header Bar */}
      <header className="px-4 sm:px-6 pt-4 pb-2 flex items-center justify-between shrink-0 z-10">
        <button
          onClick={onClose}
          className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
            isDark
              ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
              : 'bg-black/5 border-black/10 text-zinc-900 hover:bg-black/10'
          }`}
          title="Minimize to mini player"
        >
          <ChevronDown className="w-5 h-5" />
        </button>

        <div className="text-center min-w-0 px-3">
          <p className={`text-[10px] font-bold tracking-[0.2em] uppercase ${
            isDark ? 'text-white/60' : 'text-zinc-500'
          }`}>
            Now Playing
          </p>
          <p className={`text-xs font-semibold truncate max-w-[180px] sm:max-w-xs ${
            isDark ? 'text-white/90' : 'text-zinc-800'
          }`}>
            {currentTrack.album || currentTrack.artist}
          </p>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => {
              onClose();
              if (onOpenSearch) onOpenSearch();
            }}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
              isDark
                ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                : 'bg-black/5 border-black/10 text-zinc-900 hover:bg-black/10'
            }`}
            title="Search Songs"
          >
            <Search className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsActionSheetOpen(true)}
            className={`w-10 h-10 rounded-full flex items-center justify-center backdrop-blur-md border transition-all active:scale-90 ${
              isDark
                ? 'bg-white/10 border-white/10 text-white hover:bg-white/20'
                : 'bg-black/5 border-black/10 text-zinc-900 hover:bg-black/10'
            }`}
            title="Track Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. Middle Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-2 overflow-y-auto min-h-0">

        {/* TAB 1: Hero Player View */}
        {activeTab === 'cover' && (
          <div className="w-full max-w-sm sm:max-w-md flex flex-col items-center my-auto space-y-7">
            {/* Hero Album Artwork */}
            <div
              className={`relative w-64 h-64 sm:w-80 sm:h-80 rounded-2xl overflow-hidden transition-transform duration-700 ease-out ${
                isPlaying
                  ? 'scale-105 shadow-[0_28px_70px_-12px_rgba(0,0,0,0.85)]'
                  : 'scale-95 shadow-[0_16px_40px_-12px_rgba(0,0,0,0.55)]'
              }`}
            >
              <img
                src={coverUrl}
                alt={currentTrack.title}
                onError={handleCoverImageError}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 ring-1 ring-inset ring-white/15 rounded-2xl pointer-events-none" />
            </div>

            {/* Editorial Typography & Quick Like */}
            <div className="w-full flex items-center justify-between gap-3 pt-1">
              <div className="min-w-0 flex-1 overflow-hidden text-left">
                <div className="overflow-hidden whitespace-nowrap">
                  <h2
                    className={`text-xl sm:text-2xl font-black tracking-tight ${
                      isLongTitle ? 'animate-marquee' : 'truncate'
                    } ${isDark ? 'text-white' : 'text-zinc-950'}`}
                  >
                    {currentTrack.title}
                  </h2>
                </div>
                <p className={`text-sm sm:text-base font-medium truncate mt-0.5 ${
                  isDark ? 'text-white/65' : 'text-zinc-600'
                }`}>
                  {currentTrack.artist}
                </p>
              </div>

              <button
                onClick={() => onToggleLike(currentTrack.id)}
                className={`p-2.5 rounded-full transition-all active:scale-125 shrink-0 ${
                  isDark ? 'hover:bg-white/10' : 'hover:bg-black/5'
                }`}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <Heart
                  className={`w-6 h-6 transition-colors ${
                    isLiked
                      ? 'fill-rose-500 text-rose-500'
                      : isDark ? 'text-white/70 hover:text-white' : 'text-zinc-500 hover:text-black'
                  }`}
                />
              </button>
            </div>
          </div>
        )}

        {/* TAB 2: Synced Lyrics (Karaoke) */}
        {activeTab === 'lyrics' && (
          <div className="w-full max-w-xl h-full flex flex-col py-2">
            <div className={`flex items-center justify-between pb-3 px-1 border-b text-xs ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}>
              <button
                onClick={toggleKaraoke}
                className={`px-3.5 py-1.5 rounded-full font-bold border flex items-center gap-1.5 transition-all ${
                  isKaraokeMode
                    ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                    : isDark ? 'bg-white/10 text-white/85 border-white/15 hover:bg-white/15' : 'bg-black/5 text-zinc-800 border-black/10'
                }`}
                title="Toggle Live Vocal Remover"
              >
                <Mic2 className="w-3.5 h-3.5" />
                <span>{isKaraokeMode ? 'Vocals Muted (Karaoke)' : 'Karaoke Mode'}</span>
              </button>

              {onOpenLyricCard && (
                <button
                  onClick={() => onOpenLyricCard(activeLyricIndex >= 0 ? activeLyricIndex : 0)}
                  className={`px-3.5 py-1.5 rounded-full font-bold flex items-center gap-1.5 shadow-sm hover:scale-105 active:scale-95 transition-all ${
                    isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                  title="Generate 9:16 Story Card"
                >
                  <Camera className="w-3.5 h-3.5" />
                  <span>Share Lyric Card</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-6 text-center scroll-smooth px-2 scrollbar-none">
              {lyricsList.length === 0 ? (
                <div className={`py-20 text-sm ${isDark ? 'text-white/50' : 'text-zinc-500'}`}>
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
                              ? 'text-2xl sm:text-3xl font-black text-white scale-105 drop-shadow-md'
                              : 'text-2xl sm:text-3xl font-black text-black scale-105'
                            : isDark
                              ? 'text-base sm:text-lg text-white/40 hover:text-white/75 font-semibold'
                              : 'text-base sm:text-lg text-zinc-400 hover:text-zinc-700 font-semibold'
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
                            isDark ? 'text-white/50 hover:text-white' : 'text-zinc-400 hover:text-black'
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

        {/* TAB 3: Audio Studio (EQ, Slowed+Reverb, 8D, Speed, Karaoke, Ringtone) */}
        {activeTab === 'studio' && (
          <div className="w-full max-w-lg space-y-4 my-auto py-2">
            <div className={`p-3 rounded-2xl border backdrop-blur-md ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
            }`}>
              <canvas
                ref={canvasRef}
                width={400}
                height={56}
                className="w-full h-14 rounded-lg"
              />
            </div>

            <div className="flex flex-wrap gap-1.5 justify-center">
              {Object.keys(EQ_PRESETS).map((pName) => (
                <button
                  key={pName}
                  onClick={() => applyPreset(pName)}
                  className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${
                    activePreset === pName
                      ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                      : isDark ? 'bg-white/10 text-white/75 border-white/10 hover:text-white' : 'bg-black/5 text-zinc-700 border-black/10 hover:text-black'
                  }`}
                >
                  {pName}
                </button>
              ))}
            </div>

            <div className={`p-4 rounded-2xl border backdrop-blur-md ${
              isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
            }`}>
              <div className="grid grid-cols-10 gap-1 sm:gap-2 items-center">
                {EQ_FREQUENCIES.map((freq, idx) => {
                  const gain = eqGains[idx] || 0;
                  const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
                  return (
                    <div key={freq} className="flex flex-col items-center gap-1.5">
                      <span className={`text-[9px] font-mono tabular-nums ${isDark ? 'text-white/60' : 'text-zinc-600'}`}>
                        {gain > 0 ? `+${gain}` : gain}
                      </span>
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
                      <span className={`text-[9px] font-mono font-medium ${isDark ? 'text-white/60' : 'text-zinc-600'}`}>{label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={toggleKaraoke}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  isKaraokeMode
                    ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                    : isDark ? 'bg-white/10 text-white/80 border-white/10 hover:bg-white/15' : 'bg-black/5 text-zinc-700 border-black/10'
                }`}
              >
                <Mic2 className="w-4 h-4" />
                <span>Karaoke</span>
              </button>

              <button
                onClick={toggleSlowedReverb}
                className={`p-3 rounded-2xl border text-xs font-semibold flex flex-col items-center justify-center gap-1.5 text-center transition-all ${
                  isSlowedReverb
                    ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                    : isDark ? 'bg-white/10 text-white/80 border-white/10 hover:bg-white/15' : 'bg-black/5 text-zinc-700 border-black/10'
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
                    : isDark ? 'bg-white/10 text-white/80 border-white/10 hover:bg-white/15' : 'bg-black/5 text-zinc-700 border-black/10'
                }`}
              >
                <Radio className="w-4 h-4" />
                <span>8D Spatial</span>
              </button>
            </div>

            <div className={`p-3.5 rounded-2xl border flex items-center justify-between gap-4 text-xs backdrop-blur-md ${
              isDark ? 'bg-white/5 border-white/10 text-white/85' : 'bg-black/5 border-black/10 text-zinc-800'
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
              <span className="font-mono font-bold tabular-nums">{playbackSpeed.toFixed(2)}x</span>
            </div>

            {onOpenClipper && (
              <button
                onClick={() => onOpenClipper(currentTrack)}
                className={`w-full p-3.5 rounded-2xl border font-bold text-xs flex items-center justify-between hover:scale-[1.01] transition-all shadow-sm ${
                  isDark ? 'bg-white/10 hover:bg-white/15 border-white/15 text-white' : 'bg-black/5 hover:bg-black/10 border-black/10 text-zinc-900'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Scissors className="w-4 h-4" />
                  <span>Cut Ringtone / 30s Status Clip</span>
                </div>
                <span className={`text-[10px] font-mono px-2.5 py-0.5 rounded-full font-bold ${
                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                }`}>
                  CUT 30s
                </span>
              </button>
            )}
          </div>
        )}

        {/* TAB 4: Up Next Queue */}
        {activeTab === 'queue' && (
          <div className="w-full max-w-xl h-full flex flex-col py-2">
            <div className={`flex items-center justify-between pb-3 px-1 border-b ${
              isDark ? 'border-white/10' : 'border-black/10'
            }`}>
              <div className="flex items-center gap-2">
                <ListMusic className="w-4 h-4 opacity-75" />
                <span className="text-sm font-bold">Up Next ({queue.length})</span>
              </div>
              {queue.length > 0 && clearQueue && (
                <button
                  onClick={clearQueue}
                  className={`text-xs font-semibold flex items-center gap-1 px-2.5 py-1 rounded-full ${
                    isDark ? 'bg-white/10 text-white/80 hover:bg-white/20' : 'bg-black/5 text-zinc-700 hover:bg-black/10'
                  }`}
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              )}
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-none">
              {queue.length === 0 ? (
                <div className={`py-16 text-center text-sm ${isDark ? 'text-white/50' : 'text-zinc-500'}`}>
                  Queue is empty. Auto-Mix will keep playing similar vibes next.
                </div>
              ) : (
                queue.map((qTrack, idx) => (
                  <div
                    key={`${qTrack.id}-${idx}`}
                    onClick={() => playTrack && playTrack(qTrack)}
                    className={`flex items-center gap-3 p-2.5 rounded-2xl cursor-pointer transition-colors ${
                      isDark ? 'hover:bg-white/10 bg-white/5' : 'hover:bg-black/10 bg-black/5'
                    }`}
                  >
                    <img
                      src={getHighResThumbnail(qTrack.cover, qTrack.id)}
                      alt={qTrack.title}
                      onError={handleCoverImageError}
                      className="w-11 h-11 rounded-xl object-cover shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-bold truncate">{qTrack.title}</p>
                      <p className={`text-xs truncate ${isDark ? 'text-white/60' : 'text-zinc-500'}`}>{qTrack.artist}</p>
                    </div>
                    {removeFromQueue && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeFromQueue(idx);
                        }}
                        className={`p-2 rounded-full ${isDark ? 'text-white/50 hover:text-white' : 'text-zinc-400 hover:text-black'}`}
                        title="Remove from queue"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </main>

      {/* 3. Bottom Scrubber, Pro Control Deck & Clean Glass Pill Switcher */}
      <footer className="px-6 pb-5 pt-2 max-w-xl mx-auto w-full space-y-4 shrink-0 z-10">
        {/* Tactile Progress Scrubber */}
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
            className="relative w-full h-6 flex items-center cursor-pointer group touch-none"
          >
            <div className={`w-full h-1.5 group-hover:h-2.5 rounded-full overflow-hidden transition-all duration-150 pointer-events-none ${
              isDragging ? 'h-2.5' : ''
            } ${isDark ? 'bg-white/20' : 'bg-black/15'}`}>
              <div
                className={`h-full rounded-full pointer-events-none ${isDark ? 'bg-white' : 'bg-black'}`}
                style={{ width: `${displayPercent}%` }}
              />
            </div>

            <div
              className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg ${
                isDark ? 'bg-white' : 'bg-black'
              }`}
              style={{ left: `${displayPercent}%`, opacity: isDragging ? 1 : undefined }}
            />
          </div>

          <div className={`flex justify-between text-[11px] font-medium tabular-nums ${
            isDark ? 'text-white/60' : 'text-zinc-500'
          }`}>
            <span>{formatTime(isDragging ? (dragPercent / 100) * effectiveDuration : currentTime)}</span>
            <span>{formatTime(effectiveDuration)}</span>
          </div>
        </div>

        {/* Pro Playback Control Deck */}
        <div className="flex items-center justify-between px-2">
          <button
            onClick={toggleShuffle}
            className={`p-2.5 rounded-full transition-colors ${
              isShuffle
                ? isDark ? 'text-white bg-white/15' : 'text-black bg-black/10'
                : isDark ? 'text-white/50 hover:text-white' : 'text-zinc-400 hover:text-black'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-5 h-5" />
          </button>

          <button
            onClick={prevTrack}
            className={`p-3 rounded-full active:scale-90 transition-all ${
              isDark ? 'text-white/85 hover:text-white' : 'text-zinc-700 hover:text-black'
            }`}
            title="Previous"
          >
            <SkipBack className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={togglePlay}
            className={`w-16 h-16 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-2xl ${
              isDark ? 'bg-white text-black' : 'bg-black text-white'
            }`}
            title={isBuffering && isPlaying ? 'Buffering...' : isPlaying ? 'Pause' : 'Play'}
          >
            {isBuffering && isPlaying ? (
              <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-black' : 'text-white'}`} />
            ) : isPlaying ? (
              <Pause className={`w-7 h-7 ${isDark ? 'fill-black' : 'fill-white'}`} />
            ) : (
              <Play className={`w-7 h-7 translate-x-0.5 ${isDark ? 'fill-black' : 'fill-white'}`} />
            )}
          </button>

          <button
            onClick={nextTrack}
            className={`p-3 rounded-full active:scale-90 transition-all ${
              isDark ? 'text-white/85 hover:text-white' : 'text-zinc-700 hover:text-black'
            }`}
            title="Next"
          >
            <SkipForward className="w-7 h-7 fill-current" />
          </button>

          <button
            onClick={cycleRepeat}
            className={`p-2.5 rounded-full transition-colors ${
              repeatMode !== 'off'
                ? isDark ? 'text-white bg-white/15' : 'text-black bg-black/10'
                : isDark ? 'text-white/50 hover:text-white' : 'text-zinc-400 hover:text-black'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
          </button>
        </div>

        {/* Desktop Volume Slider */}
        <div className={`hidden sm:flex items-center justify-center gap-3 ${isDark ? 'text-white/60' : 'text-zinc-600'}`}>
          <button onClick={toggleMute} className={isDark ? 'hover:text-white' : 'hover:text-black'}>
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-rose-500" /> : <Volume2 className="w-4 h-4" />}
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

        {/* Bottom Minimal Bar: Only 3 Clean Triggers (Lyrics, Audio Effects, Up Next Queue) */}
        <div className="flex items-center justify-center gap-6 sm:gap-8 pt-2">
          {[
            { id: 'lyrics', label: 'Lyrics', icon: Mic2 },
            { id: 'studio', label: 'Audio Effects', icon: Sliders },
            { id: 'queue', label: queue.length > 0 ? `Up Next (${queue.length})` : 'Up Next', icon: ListMusic }
          ].map((tab) => {
            const Icon = tab.icon;
            const isSelected = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(isSelected ? 'cover' : tab.id)}
                className={`flex items-center gap-1.5 text-xs font-semibold py-1.5 px-3 rounded-full transition-all ${
                  isSelected
                    ? isDark ? 'bg-white text-black font-bold' : 'bg-black text-white font-bold'
                    : isDark ? 'text-white/65 hover:text-white' : 'text-zinc-500 hover:text-black'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
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
        onOpenStudio={() => setActiveTab('studio')}
        onOpenClipper={onOpenClipper}
        onOpenLyricCard={onOpenLyricCard}
        onShareApp={onShareApp}
        onOpenSupport={onOpenSupport}
      />
    </div>
  );
}
