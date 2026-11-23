import React from 'react';
import { 
  X, ListMusic, Play, Trash2, ArrowUp, ArrowDown, Radio, 
  Sparkles, Music, Disc3, PlusCircle 
} from 'lucide-react';
import { getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';

export default function SmartQueueDrawer({
  isOpen,
  onClose,
  engine,
  autoPlayRadio,
  toggleAutoPlayRadio
}) {
  const {
    currentTrack,
    queue = [],
    playTrack,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    isPlaying
  } = engine;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Sliding Drawer Container */}
      <div className="w-full sm:w-[460px] h-full bg-[#0B0B10] border-l border-white/[0.08] shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden select-none">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Play Queue</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  {queue.length} UP NEXT
                </span>
              </h3>
              <p className="text-xs text-zinc-400">Smart Up-Next & Auto-Radio</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-Play Radio / Continuous Auto-Mix Switch Strip */}
        <div className="my-4 p-3.5 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] flex items-center justify-between shrink-0">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold text-white">
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>∞ Auto-Mix Radio</span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                autoPlayRadio 
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/30' 
                  : 'bg-white/[0.04] text-zinc-500 border-white/[0.06]'
              }`}>
                {autoPlayRadio ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400">
              Continuously discovers & queues similar vibe tracks
            </p>
          </div>

          <button
            onClick={toggleAutoPlayRadio}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              autoPlayRadio ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'bg-zinc-800'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-black transition-transform ${
                autoPlayRadio ? 'translate-x-5' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Now Playing Section */}
        {currentTrack && (
          <div className="mb-4 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span>Now Playing</span>
            </div>

            <div className="p-3 rounded-2xl bg-gradient-to-r from-cyan-500/15 via-violet-500/10 to-transparent border border-cyan-500/30 flex items-center gap-3">
              <img
                src={getHighResThumbnail(currentTrack.cover, currentTrack.id)}
                alt={currentTrack.title}
                onError={handleCoverImageError}
                className="w-12 h-12 rounded-xl object-cover border border-white/10 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-white truncate text-cyan-200">
                  {currentTrack.title}
                </h4>
                <p className="text-xs text-zinc-400 truncate mt-0.5">{currentTrack.artist}</p>
              </div>

              {/* Animated wave */}
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-4 shrink-0 pr-1">
                  <span className="w-1 bg-cyan-400 rounded-full h-2 animate-[wave_0.8s_ease-in-out_infinite]" />
                  <span className="w-1 bg-cyan-300 rounded-full h-4 animate-[wave_1.2s_ease-in-out_infinite_0.2s]" />
                  <span className="w-1 bg-violet-400 rounded-full h-3 animate-[wave_0.9s_ease-in-out_infinite_0.4s]" />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Up Next List */}
        <div className="flex items-center justify-between mb-2 shrink-0">
          <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
            Up Next ({queue.length})
          </span>
          {queue.length > 0 && (
            <button
              onClick={clearQueue}
              className="text-[11px] text-zinc-400 hover:text-red-400 flex items-center gap-1 transition-colors"
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {queue.length === 0 ? (
            <div className="p-8 text-center rounded-2xl bg-pitch-deep/60 border border-white/[0.04] space-y-2 my-4">
              <Disc3 className="w-8 h-8 text-zinc-600 mx-auto" />
              <h5 className="text-xs font-bold text-zinc-400">Queue is empty</h5>
              <p className="text-[11px] text-zinc-500 max-w-xs mx-auto">
                Click "Play Next" or "Add to Queue" on any track in the feed to build your custom set.
              </p>
            </div>
          ) : (
            queue.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                className="p-2.5 rounded-xl bg-pitch-deep/90 hover:bg-white/[0.05] border border-white/[0.05] flex items-center justify-between gap-3 group transition-colors"
              >
                {/* Track info */}
                <div 
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-zinc-500 w-4 text-center">
                    {idx + 1}
                  </span>
                  <img
                    src={getHighResThumbnail(track.cover, track.id)}
                    alt={track.title}
                    onError={handleCoverImageError}
                    className="w-9 h-9 rounded-lg object-cover border border-white/10 shrink-0"
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className="text-xs font-bold text-white truncate group-hover:text-cyan-300">
                      {track.title}
                    </h5>
                    <p className="text-[10px] text-zinc-400 truncate">{track.artist}</p>
                  </div>
                </div>

                {/* Queue Reorder & Remove Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveQueueItem(idx, idx - 1)}
                    className="p-1 text-zinc-500 hover:text-white disabled:opacity-20"
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={idx === queue.length - 1}
                    onClick={() => moveQueueItem(idx, idx + 1)}
                    className="p-1 text-zinc-500 hover:text-white disabled:opacity-20"
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="p-1 text-zinc-500 hover:text-red-400"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Close Button */}
        <div className="pt-3 border-t border-white/[0.08] shrink-0">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs transition-colors"
          >
            Close Queue
          </button>
        </div>

      </div>
    </div>
  );
}
