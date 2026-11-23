import React, { useEffect, useRef } from 'react';
import { 
  X, Sliders, Waves, Radio, RotateCcw, Activity, Gauge, 
  Moon, FastForward, Clock, Zap, Mic2, Scissors, Sparkles 
} from 'lucide-react';
import { EQ_FREQUENCIES, EQ_PRESETS } from '../../hooks/useAudioEngine';

export default function AudioStudioDrawer({ isOpen, onClose, engine, onOpenClipper }) {
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
    sleepTimerSetting,
    sleepTimerRemaining,
    setSleepTimer,
    clearSleepTimer,
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
        gradient.addColorStop(0, '#06B6D4');
        gradient.addColorStop(0.5, '#8B5CF6');
        gradient.addColorStop(1, '#22D3EE');

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
  }, [isOpen, analyserNode, isPlaying]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity">
      {/* Sliding Drawer Container */}
      <div className="w-full sm:w-[480px] h-full bg-[#0B0B10] border-l border-white/[0.08] shadow-2xl flex flex-col p-5 sm:p-6 overflow-y-auto selection:bg-cyan-500/30">
        
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <span>Audio Studio</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                  DSP ENGINE
                </span>
              </h3>
              <p className="text-xs text-zinc-400">10-Band EQ, Speed & Spatial DSP</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Real-time Spectrum Analyser Display */}
        <div className="my-5 p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] space-y-2">
          <div className="flex items-center justify-between text-xs text-zinc-400">
            <span className="flex items-center gap-1.5 text-cyan-400 font-semibold font-mono text-[11px]">
              <Activity className="w-3.5 h-3.5" /> FFT SPECTRUM ANALYZER
            </span>
            <span className="text-[10px] font-mono text-zinc-400">
              {isPlaying ? 'ACTIVE STREAM' : 'PAUSED'}
            </span>
          </div>
          <canvas
            ref={canvasRef}
            width={400}
            height={70}
            className="w-full h-[70px] rounded-lg bg-[#050507]"
          />
        </div>

        {/* Presets Row */}
        <div className="space-y-2.5 mb-5">
          <div className="flex items-center justify-between text-xs font-semibold text-zinc-300">
            <span>EQ Presets:</span>
            <button
              onClick={() => applyPreset('Flat')}
              className="text-[11px] text-zinc-400 hover:text-cyan-400 flex items-center gap-1 transition-colors"
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
                    ? 'bg-gradient-to-r from-violet-600/30 to-cyan-600/30 text-white border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-pitch-surface/60 text-zinc-400 border-white/[0.06] hover:text-white hover:bg-white/[0.05]'
                }`}
              >
                {presetName}
              </button>
            ))}
          </div>
        </div>

        {/* 10-Band Equalizer Sliders */}
        <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] mb-5">
          <div className="flex items-center justify-between text-xs font-semibold text-white mb-4">
            <span className="flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-violet-400" /> 10-Band Surgical EQ
            </span>
            <span className="text-[11px] font-mono text-cyan-400">Range: -12dB to +12dB</span>
          </div>

          <div className="grid grid-cols-10 gap-1 sm:gap-2 items-center">
            {EQ_FREQUENCIES.map((freq, idx) => {
              const gain = eqGains[idx] || 0;
              const label = freq >= 1000 ? `${freq / 1000}k` : `${freq}`;
              return (
                <div key={freq} className="flex flex-col items-center gap-2">
                  <span className="text-[9px] font-mono text-zinc-400">
                    {gain > 0 ? `+${gain}` : gain}
                  </span>
                  
                  <div className="h-28 flex items-center justify-center">
                    <input
                      type="range"
                      min="-12"
                      max="12"
                      step="1"
                      value={gain}
                      onChange={(e) => setEqBand(idx, parseFloat(e.target.value))}
                      className="w-24 -rotate-90 cursor-pointer accent-cyan-400"
                    />
                  </div>

                  <span className="text-[9px] font-mono font-medium text-zinc-400">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Playback Speed & Pitch Fine-Tuning */}
        <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <FastForward className="w-4 h-4 text-cyan-400" /> Playback Speed / Pitch
            </span>
            <span className="font-mono text-cyan-300 font-semibold">{playbackSpeed.toFixed(2)}x</span>
          </div>

          <input
            type="range"
            min="0.5"
            max="2.0"
            step="0.05"
            value={playbackSpeed}
            onChange={(e) => setPlaybackSpeed(parseFloat(e.target.value))}
            className="w-full cursor-pointer accent-cyan-400"
          />

          <div className="flex items-center justify-between gap-2">
            {[
              { label: 'Slow (0.8x)', val: 0.8 },
              { label: 'Normal (1.0x)', val: 1.0 },
              { label: 'Nightcore (1.25x)', val: 1.25 },
              { label: 'Speed (1.5x)', val: 1.5 }
            ].map((s) => (
              <button
                key={s.label}
                onClick={() => setPlaybackSpeed(s.val)}
                className={`flex-1 py-1 px-1.5 rounded-lg text-[10px] font-mono border transition-all ${
                  playbackSpeed === s.val
                    ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Sleep Timer Section */}
        <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] mb-5 space-y-3">
          <div className="flex items-center justify-between text-xs font-bold text-white">
            <span className="flex items-center gap-1.5">
              <Moon className="w-4 h-4 text-amber-400" /> Sleep Timer
            </span>
            {sleepTimerRemaining ? (
              <span className="font-mono text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full text-[10px] border border-amber-500/30">
                {Math.floor(sleepTimerRemaining / 60)}:{(sleepTimerRemaining % 60).toString().padStart(2, '0')} remaining
              </span>
            ) : (
              <span className="text-[10px] text-zinc-400">Off</span>
            )}
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-5 gap-1.5">
            {[
              { label: '15m', val: 15 },
              { label: '30m', val: 30 },
              { label: '45m', val: 45 },
              { label: '60m', val: 60 },
              { label: 'End of Track', val: 'end_of_track' }
            ].map((timer) => (
              <button
                key={timer.label}
                onClick={() => {
                  if (sleepTimerSetting === timer.val) {
                    clearSleepTimer();
                  } else {
                    setSleepTimer(timer.val);
                  }
                }}
                className={`py-1.5 px-2 rounded-xl text-xs font-mono border transition-all text-center ${
                  sleepTimerSetting === timer.val
                    ? 'bg-amber-500/20 text-amber-300 border-amber-400'
                    : 'bg-white/[0.03] text-zinc-400 border-white/[0.06] hover:text-white'
                }`}
              >
                {timer.label}
              </button>
            ))}
          </div>
        </div>

        {/* 1-Tap Vibe Modes */}
        <div className="space-y-4 mb-6">
          <h4 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
            Spatial, Vocal & Analog Transforms
          </h4>

          {/* Karaoke Vocal Remover Switch */}
          <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Mic2 className="w-4 h-4 text-emerald-400" />
                <span>Karaoke Mode (Vocal Remover)</span>
              </div>
              <p className="text-xs text-zinc-400">
                Phase cancellation + 900–2400Hz band-stop for panned duets & punchy bass
              </p>
            </div>

            <button
              onClick={toggleKaraoke}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                isKaraokeMode ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.6)]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-black transition-transform ${
                  isKaraokeMode ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Slowed + Reverb Switch */}
          <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] flex items-center justify-between">
            <div className="space-y-0.5">
              <div className="flex items-center gap-2 text-sm font-bold text-white">
                <Waves className="w-4 h-4 text-violet-400" />
                <span>Slowed + Reverb</span>
              </div>
              <p className="text-xs text-zinc-400">
                0.85x speed + analog delay feedback reverberation
              </p>
            </div>

            <button
              onClick={toggleSlowedReverb}
              className={`w-12 h-6 rounded-full transition-colors relative p-0.5 ${
                isSlowedReverb ? 'bg-violet-500 shadow-[0_0_12px_rgba(139,92,246,0.6)]' : 'bg-zinc-800'
              }`}
            >
              <div
                className={`w-5 h-5 rounded-full bg-white transition-transform ${
                  isSlowedReverb ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* 8D Spatial Audio Orbit Switch */}
          <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] space-y-3">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 text-sm font-bold text-white">
                  <Radio className="w-4 h-4 text-cyan-400" />
                  <span>8D Spatial Audio</span>
                </div>
                <p className="text-xs text-zinc-400">
                  Continuous 360° binaural head orbit panning (wear headphones)
                </p>
              </div>

              <button
                onClick={toggle8D}
                className={`w-12 h-6 rounded-full transition-colors relative p-0.5 shrink-0 ${
                  is8DActive ? 'bg-cyan-500 shadow-[0_0_12px_rgba(6,182,212,0.6)]' : 'bg-zinc-800'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full bg-black transition-transform ${
                    is8DActive ? 'translate-x-6' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {is8DActive && (
              <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between text-xs font-mono text-zinc-400">
                <span>Left Ear (L)</span>
                <div className="relative w-32 h-3 bg-zinc-800 rounded-full overflow-hidden flex items-center justify-center">
                  <div
                    className="w-3 h-3 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,1)] transition-transform"
                    style={{ transform: `translateX(${panPosition * 48}px)` }}
                  />
                </div>
                <span>Right Ear (R)</span>
              </div>
            )}
          </div>

          {/* Crossfade Duration Slider */}
          <div className="p-4 rounded-2xl bg-pitch-deep/90 border border-white/[0.06] space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-cyan-400" /> Track Crossfade
              </span>
              <span className="text-cyan-400 font-mono font-semibold">
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
              className="w-full cursor-pointer accent-cyan-400"
            />
            <div className="flex justify-between text-[10px] text-zinc-400 font-mono">
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
              className="w-full p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-violet-500/20 to-transparent border border-cyan-400/40 text-white font-bold text-xs flex items-center justify-between hover:scale-[1.01] active:scale-95 transition-all shadow-md group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-xl bg-cyan-400/20 text-cyan-300 border border-cyan-400/30">
                  <Scissors className="w-4 h-4" />
                </div>
                <div className="text-left">
                  <span className="text-xs font-bold block text-white group-hover:text-cyan-300 transition-colors">
                    Cut Ringtone / Status Clip
                  </span>
                  <span className="text-[11px] text-zinc-400 font-normal">
                    Export 30s with active EQ & Reverb
                  </span>
                </div>
              </div>
              <span className="text-[10px] font-mono px-2.5 py-1 rounded-xl bg-cyan-400 text-black font-extrabold shadow">
                CLIP
              </span>
            </button>
          )}
        </div>

        {/* Close Button */}
        <div className="mt-auto pt-4 border-t border-white/[0.08]">
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold text-xs hover:opacity-90 transition-opacity"
          >
            Apply & Close Studio
          </button>
        </div>

      </div>
    </div>
  );
}
