import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Scissors, Play, Pause, Download, RefreshCw, 
  Sparkles, Music, Waves, Sliders, Check, Volume2 
} from 'lucide-react';
import { renderClippedAudio } from '../../utils/audioClipper';
import { useTheme } from '../../context/ThemeContext';

export default function RingtoneClipperModal({
  isOpen,
  onClose,
  track,
  engine
}) {
  const { isDark } = useTheme();

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
      <div className={`relative w-full max-w-lg border rounded-3xl p-5 sm:p-6 shadow-2xl z-10 space-y-5 transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-black'
            }`}>
              <Scissors className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Ringtone & Status Clipper</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  30s HD
                </span>
              </h3>
              <p className={`text-xs truncate max-w-[240px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                {track.title} • {track.artist}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Studio Effects Baked-In Notification */}
        <div className={`p-3 rounded-2xl border flex items-center justify-between text-xs ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <div className="flex items-center gap-2">
            <span className="font-semibold">Effects included:</span>
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {isSlowedReverb && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-200 border-zinc-300 text-black'
              }`}>
                Slowed + Reverb
              </span>
            )}
            {playbackSpeed !== 1.0 && (
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-200 border-zinc-300 text-black'
              }`}>
                {playbackSpeed}x
              </span>
            )}
            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
              isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
            }`}>
              EQ: {activePreset}
            </span>
          </div>
        </div>

        {/* Visual Timeline Selection Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span>Start: <strong className={isDark ? 'text-white' : 'text-black'}>{formatTime(startTime)}</strong></span>
            <span>Duration: <strong>{clipDuration}s</strong></span>
            <span>End: <strong className={isDark ? 'text-white' : 'text-black'}>{formatTime(endTime)}</strong></span>
          </div>

          <div className={`relative w-full h-8 rounded-xl overflow-hidden border flex items-center ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            {/* Range highlight window */}
            <div
              className={`absolute top-0 bottom-0 border-l-2 border-r-2 transition-all rounded ${
                isDark ? 'bg-white/20 border-white' : 'bg-black/20 border-black'
              }`}
              style={{
                left: `${(startTime / totalDuration) * 100}%`,
                width: `${(clipDuration / totalDuration) * 100}%`
              }}
            />
            {/* Waveform dots */}
            <div className="w-full flex justify-between px-3 pointer-events-none opacity-20">
              {Array.from({ length: 24 }).map((_, i) => (
                <div key={i} className={`w-0.5 h-4 rounded-full ${isDark ? 'bg-white' : 'bg-black'}`} />
              ))}
            </div>
          </div>
        </div>

        {/* Sliders Control */}
        <div className={`space-y-4 p-4 rounded-2xl border ${
          isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
        }`}>
          
          {/* Start Position Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Start Position:</span>
              <span className="font-mono font-semibold">{formatTime(startTime)}</span>
            </div>
            <input
              type="range"
              min="0"
              max={Math.max(0, totalDuration - clipDuration)}
              step="1"
              value={startTime}
              onChange={(e) => setStartTime(parseFloat(e.target.value))}
              className={`w-full cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
            />
          </div>

          {/* Clip Length Slider (5s to 45s) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className={isDark ? 'text-zinc-400' : 'text-zinc-500'}>Clip Length:</span>
              <span className="font-mono font-semibold">{clipDuration} seconds</span>
            </div>
            <input
              type="range"
              min="5"
              max="45"
              step="1"
              value={clipDuration}
              onChange={(e) => setClipDuration(parseInt(e.target.value, 10))}
              className={`w-full cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
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
            className={`flex-1 py-3 px-4 rounded-2xl border font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-95 ${
              isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900'
            }`}
          >
            {isPreviewing ? (
              <>
                <Pause className="w-4 h-4 fill-current" />
                <span>Stop Preview</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" />
                <span>Preview ({clipDuration}s)</span>
              </>
            )}
          </button>

          {/* Cut & Export Button */}
          <button
            onClick={handleExportRingtone}
            disabled={isExporting}
            className={`flex-1 py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 ${
              isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            {isExporting ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
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
