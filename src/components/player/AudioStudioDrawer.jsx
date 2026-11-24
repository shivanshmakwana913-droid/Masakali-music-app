import React, { useEffect, useRef } from 'react';
import { 
  X, Sliders, Waves, Radio, RotateCcw, Activity, Gauge, 
  FastForward, Mic2, Scissors 
} from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../hooks/useAudioEngine';
import { useTheme } from '../../context/ThemeContext';

export default function AudioStudioDrawer({ isOpen, onClose, engine, onOpenClipper }) {
  const { isDark } = useTheme();

  const {
    eqGains,
    setEqBand,
    activePreset,
    applyPreset,
    isSlowedReverb,
    toggleSlowedReverb,
    playbackSpeed,
    setPlaybackSpeed,
    is8DActive,
    toggle8D,
    isKaraokeMode,
    toggleKaraoke,
    panPosition,
    crossfadeDuration,
    setCrossfadeDuration,
    analyserNode,
    isPlaying
  } = engine;

  const canvasRef = useRef(null);
  const animationRef = useRef(null);

  // Real-time Visualizer Canvas using AnalyserNode
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
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
          dataArray[i] = Math.max(8, Math.sin((i / bufferLength) * Math.PI) * 20);
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
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isOpen, analyserNode, isPlaying, isDark]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Sliding Drawer Container */}
      <div className={`w-full sm:w-[480px] h-full border-l shadow-2xl flex flex-col p-5 sm:p-6 overflow-y-auto transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Drawer Header */}
        <div className={`flex items-center justify-between pb-4 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2 rounded-xl border ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-black'
            }`}>
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold flex items-center gap-2">
                <span>Audio Studio</span>
                <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  DSP ENGINE
                </span>
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>10-Band EQ, Speed & Spatial DSP</p>
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

        {/* Real-time Spectrum Analyser Display */}
        <div className={`my-5 p-4 rounded-2xl border space-y-2 ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <div className="flex items-center justify-between text-xs">
            <span className={`flex items-center gap-1.5 font-bold font-mono text-[11px] ${
              isDark ? 'text-white' : 'text-zinc-900'
            }`}>
              <Activity className="w-3.5 h-3.5" /> SPECTRUM ANALYZER
            </span>
            <span className={`text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              {isPlaying ? 'ACTIVE STREAM' : 'PAUSED'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={400}
            height={70}
            className={`w-full h-[70px] rounded-lg ${isDark ? 'bg-black' : 'bg-white'}`}
          />
        </div>

        {/* Presets Row */}
        <div className="space-y-2.5 mb-5">
          <div className={`flex items-center justify-between text-xs font-semibold ${
            isDark ? 'text-zinc-300' : 'text-zinc-700'
          }`}>
            <span>EQ Presets:</span>
            <button
              onClick={() => applyPreset('Flat')}
              className={`text-[11px] flex items-center gap-1 transition-colors ${
                isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Flat</span>
            </button>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {Object.keys(EQ_PRESETS).map((presetName) => (
              <button
                key={presetName}
                onClick={() => applyPreset(presetName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                  activePreset === presetName
                    ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                    : isDark ? 'bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:text-black'
                }`}
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Equalizer Sliders */}
        <div className={`p-4 rounded-2xl border mb-5 ${
          isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
        }`}>
          <div className="flex items-center justify-between text-xs font-semibold mb-4">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5" /> 10-Band Precision EQ
            </span>
            <span className={`text-[11px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Range: -12dB to +12dB</span>
          </div>

          <div className="grid grid-cols-10 gap-1 sm:gap-2 items-center">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = eqGains[idx] || 0;
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              return (
                <div key={freq} className="flex flex-col items-center gap-2">
                  <span className={`text-[9px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{gain > 0 ? `+${gain}` : gain}</span>
                  <div className="h-28 flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) => setEqBand(idx, parseFloat(e.target.value))}
                      className={`w-24 -rotate-90 cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
                    />
                  </div>
                  <span className={`text-[9px] font-mono font-medium ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>{label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Studio Processing Modules */}
        <div className="space-y-3 mb-5">
          {/* Playback Speed Slider */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <FastForward className="w-3.5 h-3.5" /> Speed & Pitch Rate
              </span>
              <span className="font-mono font-semibold">
                {playbackSpeed.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={playbackSpeed}
              onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
              className={`w-full cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <span>0.5x</span>
              <span>1.0x (Normal)</span>
              <span>2.0x</span>
            </div>
          </div>

          {/* Karaoke Mode Switch */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Mic2 className="w-4 h-4" />
                <span>Karaoke Mode (Vocal Remover)</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Center-channel vocal suppression for instrumental sing-along
              </p>
            </div>

            <button
              onClick={toggleKaraoke}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                isKaraokeMode 
                  ? isDark ? 'bg-white' : 'bg-black' 
                  : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  isKaraokeMode 
                    ? isDark ? 'bg-black translate-x-6' : 'bg-white translate-x-6'
                    : isDark ? 'bg-zinc-400 translate-x-0' : 'bg-zinc-600 translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Slowed + Reverb Switch */}
          <div className={`p-4 rounded-2xl border flex items-center justify-between ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-bold">
                <Waves className="w-4 h-4" />
                <span>Slowed + Reverb</span>
              </div>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                0.85x speed + atmospheric spatial reverberation
              </p>
            </div>

            <button
              onClick={toggleSlowedReverb}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isSlowedReverb 
                  ? isDark ? 'bg-white' : 'bg-black' 
                  : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full transition-transform ${
                  isSlowedReverb 
                    ? isDark ? 'bg-black translate-x-6' : 'bg-white translate-x-6'
                    : isDark ? 'bg-zinc-400 translate-x-0' : 'bg-zinc-600 translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 8D Spatial Audio Orbit Switch */}
          <div className={`p-4 rounded-2xl border space-y-3 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-bold">
                  <Radio className="w-4 h-4" />
                  <span>8D Spatial Audio</span>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Continuous 360° binaural head orbit panning (wear headphones)
                </p>
              </div>

              <button
                onClick={toggle8D}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  is8DActive 
                    ? isDark ? 'bg-white' : 'bg-black' 
                    : isDark ? 'bg-zinc-800' : 'bg-zinc-300'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full transition-transform ${
                    is8DActive 
                      ? isDark ? 'bg-black translate-x-6' : 'bg-white translate-x-6'
                      : isDark ? 'bg-zinc-400 translate-x-0' : 'bg-zinc-600 translate-x-0'
                  }`}
                />
              </button>
            </div>

            {is8DActive && (
              <div className={`pt-2 border-t flex items-center justify-between text-xs font-mono ${
                isDark ? 'border-zinc-800 text-zinc-400' : 'border-zinc-200 text-zinc-500'
              }`}>
                <span>Left Ear (L)</span>
                <div className={`relative w-32 h-3 rounded-full overflow-hidden flex items-center justify-center ${
                  isDark ? 'bg-zinc-800' : 'bg-zinc-300'
                }`}>
                  <div
                    className={`w-3 h-3 rounded-full transition-transform ${isDark ? 'bg-white' : 'bg-black'}`}
                    style={{ transform: `translateX(${panPosition * 48}px)` }}
                  />
                </div>
                <span>Right Ear (R)</span>
              </div>
            )}
          </div>

          {/* Crossfade Duration Slider */}
          <div className={`p-4 rounded-2xl border space-y-2 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5" /> Track Crossfade
              </span>
              <span className="font-mono font-semibold">
                {crossfadeDuration}s
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="12"
              step="1"
              value={crossfadeDuration}
              onChange={(e) => setCrossfadeDuration(parseInt(e.target.value))}
              className={`w-full cursor-pointer ${isDark ? 'accent-white' : 'accent-black'}`}
            />
            <div className={`flex justify-between text-[10px] font-mono ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
              <span>0s (Instant)</span>
              <span>6s (Studio)</span>
              <span>12s (Club Mix)</span>
            </div>
          </div>

          {/* 1-Tap Ringtone Clipper Launcher */}
          {onOpenClipper && (
            <button
              onClick={() => {
                onClose();
                onOpenClipper(engine.currentTrack);
              }}
              className={`w-full p-4 rounded-2xl border font-bold text-xs flex items-center justify-between hover:scale-[1.01] active:scale-95 transition-all shadow-sm group ${
                isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-200 border-zinc-300 text-black'
                }`}>
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block">
                    Cut Ringtone / Status Clip
                  </span>
                  <span className={`text-[11px] font-normal ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Export 30s with active EQ & Reverb
                  </span>
                </div>
              </div>
              <span className={`text-[10px] font-mono px-2.5 py-1 rounded-xl font-bold shadow-sm ${
                isDark ? 'bg-white text-black' : 'bg-black text-white'
              }`}>
                CLIP
              </span>
            </button>
          )}
        </div>

        {/* Close Button */}
        <div className={`mt-auto pt-4 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'}`}>
          <button
            onClick={onClose}
            className={`w-full py-3 rounded-xl font-bold text-xs transition-transform hover:scale-[1.01] active:scale-95 shadow-sm ${
              isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            Apply & Close Studio
          </button>
        </div>

      </div>
    </div>
  );
}
