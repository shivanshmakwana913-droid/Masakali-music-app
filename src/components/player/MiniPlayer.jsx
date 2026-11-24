import React, { useState, useRef } from 'react';
import { 
  Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Repeat1, 
  Volume2, VolumeX, Mic2, Sliders, Heart, ListMusic, Moon, Maximize2, MoreVertical, Radio, Loader2 
} from 'lucide-react';
import TrackActionSheet from './TrackActionSheet';
import { useTheme } from '../../context/ThemeContext';
import { getHighResThumbnail, FALLBACK_COVER_SVG } from '../../services/musicApi';

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

  // Default Initial State: shows "Masakali • Free Your Music" with dove artwork if no track is active
  const displayTrack = currentTrack || {
    id: 'masakali-init',
    title: 'Masakali',
    artist: 'Free Your Music',
    album: 'Pure Sound • Minimal',
    cover: '/logo.png',
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
      if (isDragging) {
        setDragPercent(ratio * 100);
      }
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
      <footer className={`fixed bottom-0 left-0 right-0 z-50 h-20 backdrop-blur-2xl border-t px-3 sm:px-6 flex items-center justify-between select-none shadow-lg transition-colors duration-200 ${
        isDark ? 'bg-[#0A0A0A]/95 border-zinc-800 text-white' : 'bg-white/95 border-zinc-200 text-zinc-950'
      }`}>
        
        {/* 1. Left: Track Info & Like Toggle (Click to open Full Screen) */}
        <div className="flex items-center gap-3 sm:gap-4 w-1/4 min-w-[140px] sm:min-w-[210px]">
          {/* Cover Art with subtle border & tap to expand */}
          <div 
            onClick={onOpenFullScreen}
            className={`relative w-12 h-12 rounded-xl overflow-hidden shrink-0 border cursor-pointer group flex items-center justify-center transition-colors ${
              isDark ? 'bg-black border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}
            title="Open Full-Screen Player"
          >
            {(!displayTrack.cover || displayTrack.cover === '/logo.png' || displayTrack.cover === FALLBACK_COVER_SVG || displayTrack.id === 'masakali-init' || String(displayTrack.cover).includes('track-')) ? (
              <div className={`w-full h-full p-2 flex items-center justify-center ${
                isDark ? 'bg-black' : 'bg-zinc-100'
              }`}>
                <img
                  src="/logo.png"
                  alt="Masakali"
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <img
                src={getHighResThumbnail(displayTrack.cover, displayTrack.id)}
                alt={displayTrack.title}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = '/logo.png';
                  e.currentTarget.className = 'w-full h-full object-contain p-2 bg-black';
                }}
                className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
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
            <div className="flex items-center gap-1.5">
              <h4 className={`text-xs sm:text-sm font-bold truncate transition-colors ${
                isDark ? 'text-white hover:text-zinc-300' : 'text-zinc-950 hover:text-zinc-700'
              }`}>
                {displayTrack.title}
              </h4>
              {isSlowedReverb && (
                <span className={`hidden lg:inline text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                }`}>
                  Slowed
                </span>
              )}
              {is8DActive && (
                <span className={`hidden lg:inline text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                }`}>
                  8D
                </span>
              )}
            </div>
            <p className={`text-[11px] sm:text-xs truncate mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              {displayTrack.artist}
            </p>
          </div>

          {/* Heart Like Button */}
          <button
            onClick={() => currentTrack && onToggleLike(currentTrack.id)}
            className={`p-2 rounded-full transition-all active:scale-125 ${
              isDark ? 'hover:bg-zinc-800' : 'hover:bg-zinc-100'
            }`}
            title={isLiked ? "Unlike Song" : "Like Song"}
          >
            <Heart
              className={`w-4 h-4 transition-transform ${
                isLiked 
                  ? 'fill-rose-500 text-rose-500' 
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
              }`}
            />
          </button>

          {/* 3-Dot Options Button */}
          <button
            onClick={() => currentTrack && setIsActionSheetOpen(true)}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'
            }`}
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
                isShuffle 
                  ? isDark ? 'text-white' : 'text-black' 
                  : isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'
              }`}
              title={isShuffle ? "Shuffle On" : "Shuffle Off"}
            >
              <Shuffle className={`w-4 h-4 ${isShuffle ? 'stroke-[2.5]' : ''}`} />
            </button>

            <button
              onClick={prevTrack}
              className={`transition-colors p-1 ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
              }`}
              title="Previous Track"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            {/* Crisp Minimal B&W Play/Pause Button */}
            <button
              onClick={togglePlay}
              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold hover:scale-105 active:scale-95 transition-all shadow-md ${
                isDark
                  ? 'bg-white text-black hover:bg-zinc-200'
                  : 'bg-black text-white hover:bg-zinc-800'
              }`}
              title={isBuffering && isPlaying ? "Buffering..." : isPlaying ? "Pause" : "Play"}
            >
              {isBuffering && isPlaying ? (
                <Loader2 className={`w-5 h-5 animate-spin ${isDark ? 'text-black' : 'text-white'}`} />
              ) : isPlaying ? (
                <Pause className={`w-5 h-5 ${isDark ? 'fill-black' : 'fill-white'}`} />
              ) : (
                <Play className={`w-5 h-5 translate-x-0.5 ${isDark ? 'fill-black' : 'fill-white'}`} />
              )}
            </button>

            <button
              onClick={nextTrack}
              className={`transition-colors p-1 ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
              }`}
              title="Next Track"
            >
              <SkipForward className="w-5 h-5" />
            </button>

            <button
              onClick={cycleRepeat}
              className={`p-1.5 text-xs rounded transition-colors hidden sm:inline ${
                repeatMode !== 'off'
                  ? isDark ? 'text-white' : 'text-black'
                  : isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'
              }`}
              title={`Repeat: ${repeatMode}`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-4 h-4 stroke-[2.5]" /> : <Repeat className={`w-4 h-4 ${repeatMode !== 'off' ? 'stroke-[2.5]' : ''}`} />}
            </button>
          </div>

          {/* Interactive Seek Bar */}
          <div 
            onClick={(e) => e.stopPropagation()}
            onMouseDown={(e) => e.stopPropagation()}
            onTouchStart={(e) => e.stopPropagation()}
            className={`w-full flex items-center gap-2 text-[10px] sm:text-xs font-mono ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}
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
                  className={`absolute -top-7 -translate-x-1/2 px-1.5 py-0.5 rounded text-[9px] font-mono border shadow-md pointer-events-none ${
                    isDark ? 'bg-black text-white border-zinc-700' : 'bg-white text-black border-zinc-300'
                  }`}
                  style={{ left: `${hoverPosition}%` }}
                >
                  {formatTime(hoverTime)}
                </div>
              )}

              {/* Progress Track */}
              <div className={`w-full h-1.5 rounded-full overflow-hidden pointer-events-none ${
                isDark ? 'bg-zinc-800' : 'bg-zinc-200'
              }`}>
                <div
                  className={`h-full rounded-full transition-all pointer-events-none ${
                    isDark ? 'bg-white' : 'bg-black'
                  }`}
                  style={{ width: `${displayPercent}%` }}
                />
              </div>

              {/* Minimal Scrubber thumb indicator on hover/drag */}
              <div 
                className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border ${
                  isDark ? 'bg-white border-zinc-300' : 'bg-black border-zinc-800'
                }`}
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
                ? isDark 
                  ? 'bg-zinc-800 text-white border-zinc-600' 
                  : 'bg-zinc-200 text-black border-zinc-300'
                : isDark 
                  ? 'bg-zinc-900/60 border-zinc-800 text-zinc-500 hover:text-zinc-300' 
                  : 'bg-zinc-100 border-zinc-200 text-zinc-500 hover:text-zinc-700'
            }`}
            title="Continuous Smart Auto-Mix: automatically queues matching tracks"
          >
            <Radio className="w-3.5 h-3.5" />
            <span className="text-[11px] font-mono">Auto-Mix: {autoPlayRadio ? 'ON' : 'OFF'}</span>
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
                ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                : isDark 
                  ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800' 
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black hover:bg-zinc-200'
            }`}
            title="Play Queue"
          >
            <ListMusic className="w-4 h-4" />
            {queue.length > 0 && (
              <span className={`w-4 h-4 text-[9px] font-extrabold rounded-full flex items-center justify-center border ${
                isQueueOpen
                  ? isDark ? 'bg-black text-white border-black' : 'bg-white text-black border-white'
                  : isDark ? 'bg-white text-black border-zinc-300' : 'bg-black text-white border-zinc-700'
              }`}>
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
                ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                : isDark 
                  ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800' 
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black hover:bg-zinc-200'
            }`}
            title="Lyrics"
          >
            <Mic2 className="w-4 h-4" />
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
                ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                : isDark 
                  ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800' 
                  : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black hover:bg-zinc-200'
            }`}
            title="Equalizer & Sound Effects"
          >
            <Sliders className="w-4 h-4" />
            <span className="hidden xl:inline">Studio</span>
          </button>

          {/* Full-Screen Player Button */}
          <button
            onClick={onOpenFullScreen}
            className={`p-2.5 rounded-xl border transition-colors ${
              isDark 
                ? 'bg-zinc-900/60 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800' 
                : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black hover:bg-zinc-200'
            }`}
            title="Expand to Full Screen"
          >
            <Maximize2 className="w-4 h-4" />
          </button>

          {/* Volume Slider & Mute (Desktop) */}
          <div className={`hidden 2xl:flex items-center gap-2 pl-2 border-l ${
            isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-600'
          }`}>
            <button
              onClick={toggleMute}
              className={`transition-colors ${isDark ? 'hover:text-white' : 'hover:text-black'}`}
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
              className={`w-20 cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
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
