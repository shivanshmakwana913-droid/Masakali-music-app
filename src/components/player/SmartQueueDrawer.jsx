import React from 'react';
import { 
  X, ListMusic, Trash2, ArrowUp, ArrowDown, Radio, 
  Disc3 
} from 'lucide-react';
import { getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';
import { useTheme } from '../../context/ThemeContext';

export default function SmartQueueDrawer({
  isOpen,
  onClose,
  engine,
  autoPlayRadio,
  toggleAutoPlayRadio
}) {
  const { isDark } = useTheme();

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
      <div className={`w-full sm:w-[460px] h-full border-l shadow-2xl flex flex-col p-5 sm:p-6 overflow-hidden select-none transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-black'
            }`}>
              <ListMusic className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Play Queue</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  {queue.length} UP NEXT
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Smart Up-Next & Auto-Radio</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Auto-Play Radio Switch Strip */}
        <div className={`my-4 p-3.5 rounded-2xl border flex items-center justify-between shrink-0 ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <div className="space-y-0.5">
            <div className="flex items-center gap-2 text-xs font-bold">
              <Radio className="w-3.5 h-3.5" />
              <span>Auto-Mix Radio</span>
              <span className={`text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border ${
                autoPlayRadio 
                  ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                  : isDark ? 'bg-zinc-800 text-zinc-400 border-zinc-700' : 'bg-zinc-200 text-zinc-600 border-zinc-300'
              }`}>
                {autoPlayRadio ? 'ON' : 'OFF'}
              </span>
            </div>
            <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              Continuously discovers & queues similar vibe tracks
            </p>
          </div>

          <button
            onClick={toggleAutoPlayRadio}
            className={`w-11 h-6 rounded-full transition-colors relative p-0.5 ${
              autoPlayRadio 
                ? isDark ? 'bg-white' : 'bg-black' 
                : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
            }`}
          >
            <div
              className={`w-5 h-5 rounded-full transition-transform ${
                autoPlayRadio 
                  ? isDark ? 'bg-black translate-x-5' : 'bg-white translate-x-5'
                  : isDark ? 'bg-zinc-400 translate-x-0' : 'bg-zinc-600 translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Now Playing Section */}
        {currentTrack && (
          <div className="mb-4 shrink-0">
            <div className="text-[11px] font-bold uppercase tracking-wider text-zinc-400 mb-2 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
              <span>Now Playing</span>
            </div>

            <div className={`p-3 rounded-2xl border flex items-center gap-3 ${
              isDark ? 'bg-zinc-900/80 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <img
                src={getHighResThumbnail(currentTrack.cover, currentTrack.id)}
                alt={currentTrack.title}
                onError={handleCoverImageError}
                className={`w-12 h-12 rounded-xl object-cover border shrink-0 ${
                  isDark ? 'border-zinc-800' : 'border-zinc-200'
                }`}
              />
              <div className="flex-1 min-w-0">
                <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                  {currentTrack.title}
                </h4>
                <p className={`text-xs truncate mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{currentTrack.artist}</p>
              </div>

              {/* Minimal Equalizer Wave */}
              {isPlaying && (
                <div className="flex items-end gap-[2px] h-4 shrink-0 pr-1">
                  <span className={`w-1 rounded-full h-2 animate-[wave_0.8s_ease-in-out_infinite] ${isDark ? 'bg-white' : 'bg-black'}`} />
                  <span className={`w-1 rounded-full h-4 animate-[wave_1.2s_ease-in-out_infinite_0.2s] ${isDark ? 'bg-zinc-400' : 'bg-zinc-600'}`} />
                  <span className={`w-1 rounded-full h-3 animate-[wave_0.9s_ease-in-out_infinite_0.4s] ${isDark ? 'bg-white' : 'bg-black'}`} />
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
              className={`text-[11px] flex items-center gap-1 transition-colors ${
                isDark ? 'text-zinc-400 hover:text-rose-400' : 'text-zinc-500 hover:text-rose-600'
              }`}
            >
              <Trash2 className="w-3 h-3" />
              <span>Clear All</span>
            </button>
          )}
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {queue.length === 0 ? (
            <div className={`p-8 text-center rounded-2xl border space-y-2 my-4 ${
              isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <Disc3 className="w-8 h-8 text-zinc-400 mx-auto" />
              <h5 className={`text-xs font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>Queue is empty</h5>
              <p className={`text-[11px] max-w-xs mx-auto ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                Click "Play Next" or "Add to Queue" on any track in the feed to build your custom set.
              </p>
            </div>
          ) : (
            queue.map((track, idx) => (
              <div
                key={`${track.id}-${idx}`}
                className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 group transition-colors ${
                  isDark ? 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                }`}
              >
                {/* Track info */}
                <div 
                  onClick={() => playTrack(track)}
                  className="flex items-center gap-3 flex-1 min-w-0 cursor-pointer"
                >
                  <span className="text-[11px] font-mono text-zinc-400 w-4 text-center">
                    {idx + 1}
                  </span>
                  <img
                    src={getHighResThumbnail(track.cover, track.id)}
                    alt={track.title}
                    onError={handleCoverImageError}
                    className={`w-9 h-9 rounded-lg object-cover border shrink-0 ${
                      isDark ? 'border-zinc-800' : 'border-zinc-200'
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <h5 className={`text-xs font-bold truncate ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                      {track.title}
                    </h5>
                    <p className={`text-[10px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{track.artist}</p>
                  </div>
                </div>

                {/* Queue Reorder & Remove Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    disabled={idx === 0}
                    onClick={() => moveQueueItem(idx, idx - 1)}
                    className={`p-1 disabled:opacity-20 ${
                      isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'
                    }`}
                    title="Move Up"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>

                  <button
                    disabled={idx === queue.length - 1}
                    onClick={() => moveQueueItem(idx, idx + 1)}
                    className={`p-1 disabled:opacity-20 ${
                      isDark ? 'text-zinc-500 hover:text-white' : 'text-zinc-400 hover:text-black'
                    }`}
                    title="Move Down"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="p-1 text-zinc-400 hover:text-red-500"
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
        <div className={`pt-3 border-t shrink-0 ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={onClose}
            className={`w-full py-2.5 rounded-xl font-bold text-xs transition-colors ${
              isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-black'
            }`}
          >
            Close Queue
          </button>
        </div>

      </div>
    </div>
  );
}
