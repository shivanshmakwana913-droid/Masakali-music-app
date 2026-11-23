import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Scissors, Play, Pause, Download, RefreshCw, 
  Sparkles, Music, Waves, Sliders, Check, Volume2 
} from 'lucide-react';
import { renderClippedAudio } from '../../utils/audioClipper';

export default function RingtoneClipperModal({
  isOpen,
  onClose,
  track,
  engine
}) {
  const {
    currentTime,
    duration,
    formatTime,
    eqGains,
    activePreset,
    isSlowedReverb,
    playbackSpeed,
    showToast
  } = engine;

  // Clip parameters
  const [startTime, setStartTime] = useState(0);
  const [clipDuration, setClipDuration] = useState(30); // 5 to 45 seconds (default 30s)
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const previewTimerRef = useRef(null);

  // Initialize start time near current playback position on open
  useEffect(() => {
    if (isOpen && track) {
      const maxStart = Math.max(0, (duration || track.duration || 180) - 30);
      const initialStart = Math.min(Math.floor(currentTime || 0), maxStart);
      setStartTime(initialStart);
      setClipDuration(30);
      setIsPreviewing(false);
    }
  }, [isOpen, track]);

  // Clean up preview timer on unmount or close
  useEffect(() => {
    return () => {
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    };
  }, []);

  if (!isOpen || !track) return null;

  const totalDuration = duration > 0 ? duration : (track.duration || 180);
  const endTime = Math.min(startTime + clipDuration, totalDuration);

  // Preview the selected 30s clip using the engine's seek & play
  const handleTogglePreview = () => {
    if (isPreviewing) {
      engine.togglePlay();
      setIsPreviewing(false);
      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
    } else {
      engine.seek(startTime);
      if (!engine.isPlaying) engine.togglePlay();
      setIsPreviewing(true);

      if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
      previewTimerRef.current = setTimeout(() => {
        if (engine.isPlaying) engine.togglePlay();
        setIsPreviewing(false);
      }, clipDuration * 1000);
    }
  };

  // Render & Download Ringtone with active live effects baked in
  const handleExportRingtone = async () => {
    setIsExporting(true);
    showToast('Rendering ringtone with studio effects...');

    try {
      const wavBlob = await renderClippedAudio({
        audioUrl: track.audioUrl,
        startTime,
        duration: clipDuration,
        eqGains,
        playbackSpeed,
        isSlowedReverb
      });

      // Trigger native download
      const cleanTitle = (track.title || 'Ringtone').replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `Masakali-${cleanTitle}-Ringtone.wav`;
      const url = URL.createObjectURL(wavBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      showToast(`Saved "${filename}" (Ready for Ringtone/Status)`);
      onClose();
    } catch (err) {
      console.error('Ringtone render error:', err);
      showToast('Could not clip ringtone. Check audio connection.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-lg bg-[#0F0F14] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-5 text-white">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center">
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Ringtone & Status Clipper</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  30s HD
                </span>
              </h3>
              <p className="text-xs text-zinc-400 truncate max-w-[240px]">
                {track.title} • {track.artist}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Studio Effects Baked-In Notification */}
        <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-500/10 to-cyan-500/10 border border-white/[0.08] flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span className="font-semibold text-zinc-300">Effects included:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isSlowedReverb && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-violet-500/20 text-violet-300 border border-violet-500/30">
                Slowed + Reverb
              </span>
            )}
            {playbackSpeed !== 1.0 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                {playbackSpeed}x
              </span>
            )}
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-zinc-300 border border-white/10">
              EQ: {activePreset}
            </span>
          </div>
        </div>

        {/* Visual Timeline Selection Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono text-zinc-400">
            <span>Start: <strong className="text-cyan-400">{formatTime(startTime)}</strong></span>
            <span>Duration: <strong className="text-white">{clipDuration}s</strong></span>
            <span>End: <strong className="text-violet-400">{formatTime(endTime)}</strong></span>
          </div>

          <div className="relative w-full h-8 bg-zinc-900 rounded-xl overflow-hidden border border-white/10 flex items-center">
            {/* Range highlight window */}
            <div
              className="absolute top-0 bottom-0 bg-gradient-to-r from-cyan-500/40 via-violet-500/40 to-cyan-500/40 border-l-2 border-r-2 border-cyan-400 transition-all rounded"
              style={{
                left: `${(startTime / totalDuration) * 100}%`,
                width: `${(clipDuration / totalDuration) * 100}%`
              }}
            />
            {/* Waveform deco dots */}
            <div className="w-full flex justify-between px-3 pointer-events-none opacity-30">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className="w-0.5 h-4 bg-white rounded-full" />
              ))}
            </div>
          </div>
        </div>

        {/* Sliders Control */}
        <div className="space-y-4 p-4 rounded-2xl bg-white/[0.02] border border-white/[0.06]">
          
          {/* Start Position Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Start Position:</span>
              <span className="font-mono text-cyan-300 font-semibold">{formatTime(startTime)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0, totalDuration - clipDuration)}
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(parseFloat(e.target.value))}
              className="w-full cursor-pointer accent-cyan-400"
            />
          </div>

          {/* Clip Length Slider (5s to 45s) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-zinc-400">Clip Length:</span>
              <span className="font-mono text-violet-300 font-semibold">{clipDuration} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={clipDuration}
              onChange={(e) => setClipDuration(parseInt(e.target.value, 10))}
              className="w-full cursor-pointer accent-violet-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-500 font-mono">
              <span>5s (Notification)</span>
              <span>30s (Default Ringtone)</span>
              <span>45s (Story Status)</span>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3 pt-2">
          
          {/* Preview Button */}
          <button
            onClick={handleTogglePreview}
            className="flex-1 py-3 px-4 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
          >
            {isPreviewing ? (
              <>
                <Pause className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>Stop Preview</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 text-cyan-400 fill-cyan-400" />
                <span>Preview ({clipDuration}s)</span>
              </>
            )}
          </button>

          {/* Cut & Export Button */}
          <button
            onClick={handleExportRingtone}
            disabled={isExporting}
            className="flex-1 py-3 px-4 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-extrabold text-xs flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(6,182,212,0.4)] hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin text-black" />
                <span>Rendering...</span>
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                <span>Download Ringtone</span>
              </>
            )}
          </button>

        </div>

      </div>
    </div>
  );
}
