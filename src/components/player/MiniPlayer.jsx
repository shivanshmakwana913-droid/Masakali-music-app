import React, { useState, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, Mic2, Sliders, Heart, ListMusic, Moon, Maximize2, MoreVertical, Radio, Loader2 
} from 'lucide-react';
import TrackActionSheet from './TrackActionSheet';
import { getHighResThumbnail, handleCoverImageError, FALLBACK_COVER_SVG } from '../../services/musicApi';

export default function MiniPlayer({
  engine,
  isLyricsOpen,
  setIsLyricsOpen,
  isStudioOpen,
  setIsStudioOpen,
  isQueueOpen,
  setIsQueueOpen,
  onOpenFullScreen,
  likedTrackIds,
  onToggleLike,
  onShareApp,
  onOpenSupport
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
    playbackSpeed,
    is8DActive,
    queue,
    sleepTimerRemaining,
    autoPlayRadio,
    toggleAutoPlayRadio
  } = engine;

  const [hoverTime, setHoverTime] = useState(null);
  const [hoverPosition, setHoverPosition] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [dragPercent, setDragPercent] = useState(0);
  const [isActionSheetOpen, setIsActionSheetOpen] = useState(false);
  const seekbarRef = useRef(null);

  // Default Initial State: shows "Masakali • Free Your Music" with soft-blurred dove artwork if no track is active
  const displayTrack = currentTrack || {
    id: 'masakali-init',
    title: 'Masakali',
    artist: 'Free Your Music',
    album: 'Pure Sound • Ad-Free',
    cover: FALLBACK_COVER_SVG,
    duration: 180
  };

  // Safe duration guard: prevents Infinity, NaN, or 0 from breaking seek calculations
  const effectiveDuration = (duration && Number.isFinite(duration) && duration > 0)
    ? duration
    : (displayTrack.duration && Number.isFinite(displayTrack.duration) && displayTrack.duration > 0 ? displayTrack.duration : 180);

  // Compute smooth progress percentage
  const actualPercent = effectiveDuration > 0 ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100)) : 0;
  const displayPercent = isDragging ? dragPercent : actualPercent;
  const isLiked = currentTrack ? likedTrackIds.includes(currentTrack.id) : false;

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
    e.stopPropagation();
    const rect = seekbarRef.current?.getBoundingClientRect();
    if (rect && rect.width > 0) {
      const ratio = Math.min(1, Math.max(0, (e.clientX - rect.left) / rect.width));
      setHoverPosition(ratio * 100);
      setHoverTime(ratio * effectiveDuration);
    }
    if (isDragging) {
      handleSeekByPointer(e.clientX);
    }
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

  return (
    <>
      <footer className="fixed bottom-0 left-0 right-0 z-50 h-20 bg-[#0B0B10]/95 backdrop-blur-2xl border-t border-white/[0.08] px-3 sm:px-6 flex items-center justify-between select-none shadow-[0_-10px_30px_rgba(0,0,0,0.8)]">
        
        {/* 1. Left: Track Info & Like Toggle (Click to open Full Screen) */}
        <div className="flex items-center gap-3 sm:gap-4 w-1/4 min-w-[140px] sm:min-w-[210px]">
          {/* Cover Art with subtle glow & tap to expand */}
          <div 
            onClick={onOpenFullScreen}
            className="relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-[0_0_12px_rgba(6,182,212,0.25)] cursor-pointer group bg-black flex items-center justify-center"
            title="Open Full-Screen Player"
          >
            {(!displayTrack.cover || displayTrack.cover === '/logo.png' || displayTrack.cover === FALLBACK_COVER_SVG || displayTrack.id === 'masakali-init' || String(displayTrack.cover).includes('track-')) ? (
              <div className="w-full h-full p-2 flex items-center justify-center bg-gradient-to-tr from-[#050507] via-[#0B0B14] to-[#050507]">
                <img
                  src="/logo.png"
                  alt="Masakali"
                  className="w-full h-full object-contain drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                />
              </div>
            ) : (
              <img
                src={getHighResThumbnail(displayTrack.cover, displayTrack.id)}
                alt={displayTrack.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                  e.currentTarget.className = 'w-full h-full object-contain p-2 bg-gradient-to-tr from-[#050507] via-[#0B0B14] to-[#050507] drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]';
                }}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ${
                  isPlaying ? 'scale-105' : 'scale-100'
                }`}
              />
            )}
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <Maximize2 className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Title & Artist */}
          <div 
            onClick={onOpenFullScreen}
            className="min-w-0 flex-1 cursor-pointer"
            title="Open Full-Screen Player"
          >
            <div className="flex items-center gap-2">
              <h4 className="text-xs sm:text-sm font-bold text-white truncate hover:text-cyan-300 transition-colors">
                {displayTrack.title}
              </h4>
              {isSlowedReverb && (
                <span className="hidden lg:inline text-[9px] font-medium px-1.5 py-0.2 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  Slowed
                </span>
              )}
              {playbackSpeed !== 1.0 && !isSlowedReverb && (
                <span className="hidden lg:inline text-[9px] font-medium px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {playbackSpeed}x
                </span>
              )}
              {is8DActive && (
                <span className="hidden lg:inline text-[9px] font-medium px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  8D
                </span>
              )}
              {sleepTimerRemaining && (
                <span className="hidden xl:inline-flex items-center gap-1 text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Moon className="w-2.5 h-2.5" />
                  <span>{Math.ceil(sleepTimerRemaining / 60)}m</span>
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
              {displayTrack.artist}
            </p>
          </div>

          {/* Heart Like Button */}
          <button
            onClick={() => currentTrack && onToggleLike(currentTrack.id)}
            className="p-2 rounded-full hover:bg-white/[0.08] transition-all active:scale-125"
            title={isLiked ? "Unlike Song" : "Like Song"}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isLiked ? 'fill-cyan-400 text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
            />
          </button>

          {/* 3-Dot Options Button */}
          <button
            onClick={() => currentTrack && setIsActionSheetOpen(true)}
            className="p-2 rounded-full hover:bg-white/[0.08] text-zinc-400 hover:text-white transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>

        {/* 2. Center: Controls & Interactive Progress Seekbar */}
        <div className="flex flex-col items-center justify-center max-w-xl w-2/4 px-2 sm:px-6">
          
          {/* Playback Buttons Row */}
          <div className="flex items-center gap-3 sm:gap-6 mb-1.5">
            <button
              onClick={toggleShuffle}
              className={`p-1.5 text-xs rounded transition-colors hidden sm:inline ${
                isShuffle ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
              title={isShuffle ? "Shuffle On" : "Shuffle Off"}
            >
              <Shuffle className="w-4 h-4" />
            </button>

            <button
              onClick={prevTrack}
              className="text-zinc-300 hover:text-white transition-colors p-1"
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_18px_rgba(6,182,212,0.4)]"
              title={isBuffering && isPlaying ? "Buffering..." : isPlaying ? "Pause" : "Play"}
            >
              {isBuffering && isPlaying ? (
                <Loader2 className="w-5 h-5 text-black animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-5 h-5 fill-black" />
              ) : (
                <Play className="w-5 h-5 fill-black translate-x-0.5" />
              )}
            </button>

            <button
              onClick={nextTrack}
              className="text-zinc-300 hover:text-white transition-colors p-1"
              title="Next Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-1.5 text-xs rounded transition-colors hidden sm:inline ${
                repeatMode !== 'off' ? 'text-cyan-400' : 'text-zinc-400 hover:text-white'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
            </button>
          </div>

          {/* Interactive Seek Bar (Isolated with accurate BoundingClientRect coordinate math) */}
          <div 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className="w-full flex items-center gap-2 text-[10px] sm:text-xs font-mono text-zinc-400"
          >
            <span className="w-9 text-right shrink-0">
              {formatTime(isDragging ? (dragPercent / 100) * effectiveDuration : currentTime)}
            </span>
            
            <div 
              ref={seekbarRef}
              className="relative flex-1 group py-2 cursor-pointer touch-none"
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              onMouseLeave={() => setHoverTime(null)}
            >
              {hoverTime !== null && !isDragging && (
                <div 
                  className="absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded bg-pitch-deep text-[9px] font-mono text-cyan-300 border border-white/10 shadow-lg pointer-events-none"
                  style={{ left: `${hoverPosition}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              <div className="w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden pointer-events-none">
                <div
                  className="h-full bg-gradient-to-r from-cyan-400 to-violet-400 rounded-full group-hover:from-cyan-300 group-hover:to-violet-300 transition-all pointer-events-none"
                  style={{ width: `${displayPercent}%` }}
                />
              </div>

              {/* Glowing scrubber thumb indicator on hover/drag */}
              <div 
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-white shadow-[0_0_10px_rgba(6,182,212,0.8)] opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                style={{ left: `${displayPercent}%`, opacity: isDragging ? 1 : undefined }}
              />
            </div>

            <span className="w-9 text-left shrink-0">{formatTime(effectiveDuration)}</span>
          </div>

        </div>

        {/* 3. Right: Queue, Lyrics, Studio & Full Screen */}
        <div className="flex items-center justify-end gap-1.5 sm:gap-2.5 w-1/4 min-w-[140px] sm:min-w-[210px]">
          
          {/* Continuous Auto-Mix Pill */}
          <button
            onClick={toggleAutoPlayRadio}
            className={`hidden md:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
              autoPlayRadio
                ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                : 'bg-white/[0.03] border-white/[0.06] text-zinc-500 hover:text-zinc-300'
            }`}
            title="Continuous Smart Auto-Mix: automatically queues matching tracks"
          >
            <Radio className={`w-3.5 h-3.5 ${autoPlayRadio ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
            <span className="text-[11px] font-mono">∞ Auto-Mix: {autoPlayRadio ? 'ON' : 'OFF'}</span>
          </button>

          {/* Play Queue Toggle */}
          <button
            onClick={() => {
              setIsQueueOpen(!isQueueOpen);
              if (isLyricsOpen) setIsLyricsOpen(false);
              if (isStudioOpen) setIsStudioOpen(false);
            }}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1 transition-all relative ${
              isQueueOpen
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Play Queue"
          >
            <ListMusic className="w-4 h-4 text-cyan-400" />
            {queue.length > 0 && (
              <span className="w-4 h-4 bg-cyan-400 text-black text-[9px] font-extrabold rounded-full flex items-center justify-center">
                {queue.length}
              </span>
            )}
          </button>

          {/* Synced Lyrics Toggle Button */}
          <button
            onClick={() => {
              setIsLyricsOpen(!isLyricsOpen);
              if (isStudioOpen) setIsStudioOpen(false);
              if (isQueueOpen) setIsQueueOpen(false);
            }}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isLyricsOpen
                ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400'
                : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4 text-cyan-400" />
            <span className="hidden xl:inline">Lyrics</span>
          </button>

          {/* Audio Studio Toggle Button */}
          <button
            onClick={() => {
              setIsStudioOpen(!isStudioOpen);
              if (isLyricsOpen) setIsLyricsOpen(false);
              if (isQueueOpen) setIsQueueOpen(false);
            }}
            className={`p-2.5 rounded-xl border text-xs font-medium flex items-center gap-1.5 transition-all ${
              isStudioOpen
                ? 'bg-violet-500/20 text-violet-200 border-violet-400'
                : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Equalizer & Sound Effects"
          >
            <Sliders className="w-4 h-4 text-violet-400" />
            <span className="hidden xl:inline">Studio</span>
          </button>

          {/* Full-Screen Player Button */}
          <button
            onClick={onOpenFullScreen}
            className="p-2.5 rounded-xl bg-white/[0.03] text-zinc-400 border border-white/[0.06] hover:text-white hover:bg-white/[0.06] transition-colors"
            title="Expand to Full Screen"
          >
            <Maximize2 className="w-4 h-4 text-zinc-300" />
          </button>

          {/* Volume Slider & Mute (Desktop) */}
          <div className="hidden 2xl:flex items-center gap-2 pl-2 border-l border-white/[0.08]">
            <button
              onClick={toggleMute}
              className="text-zinc-400 hover:text-white transition-colors"
              title={isMuted ? "Unmute" : "Mute"}
            >
              {isMuted || volume === 0 ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
            
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(parseFloat(e.target.value))}
              className="w-20 cursor-pointer accent-cyan-400"
            />
          </div>

        </div>

      </footer>

      {/* 3-Dot Options Bottom Sheet */}
      <TrackActionSheet
        isOpen={isActionSheetOpen}
        onClose={() => setIsActionSheetOpen(false)}
        track={currentTrack || displayTrack}
        engine={engine}
        isLiked={isLiked}
        onToggleLike={onToggleLike}
        onOpenStudio={() => setIsStudioOpen(true)}
        onShareApp={onShareApp}
        onOpenSupport={onOpenSupport}
      />
    </>
  );
}
