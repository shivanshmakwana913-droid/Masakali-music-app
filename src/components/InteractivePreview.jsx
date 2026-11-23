import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipForward, SkipBack, Sliders, Volume2, Sparkles, Waves, Radio } from 'lucide-react';
import { mockTracks } from '../data/mockTracks';

export default function InteractivePreview({ onLaunch }) {
  const [isPlaying, setIsPlaying] = useState(true);
  const [activeVibe, setActiveVibe] = useState('slowed'); // 'slowed' | '8d' | 'bass'
  const [currentLineIndex, setCurrentLineIndex] = useState(1);
  const [progress, setProgress] = useState(24);

  const track = mockTracks[0];

  // Lightweight progress timer simulation for the mini preview
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setProgress((prev) => (prev >= 98 ? 0 : prev + 1));
    }, 400);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Rotate sample lyrics lines for preview demonstration
  useEffect(() => {
    if (!isPlaying) return;
    const lyricsInterval = setInterval(() => {
      setCurrentLineIndex((prev) => (prev + 1) % 5);
    }, 3200);
    return () => clearInterval(lyricsInterval);
  }, [isPlaying]);

  const previewLyrics = [
    { text: "Walking through neon shadows on the avenue", active: currentLineIndex === 0 },
    { text: "City lights reflect the rhythm inside of you", active: currentLineIndex === 1 },
    { text: "Electric cyan waves pulse in the midnight air", active: currentLineIndex === 2 },
    { text: "Lost in the frequency, weightless without a care", active: currentLineIndex === 3 },
    { text: "Hold on to the echo, let the violet wash away", active: currentLineIndex === 4 },
  ];

  return (
    <div className="relative w-full max-w-lg mx-auto">
      {/* Ambient background glow behind card */}
      <div className="absolute -inset-1.5 bg-gradient-to-r from-cyan-500/30 via-violet-600/30 to-cyan-500/30 rounded-3xl blur-xl opacity-75 group-hover:opacity-100 transition duration-1000 animate-pulse-slow"></div>

      <div className="relative rounded-2xl glass-panel p-5 sm:p-6 shadow-2xl border border-white/[0.08] overflow-hidden">
        {/* Top Mini Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.06]">
          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping"></span>
              Live Engine Preview
            </span>
            <span className="text-xs text-zinc-400 hidden sm:inline">Web Audio API</span>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400">
            <Radio className="w-3.5 h-3.5 text-violet-400" />
            <span>48kHz / 24-bit Lossless</span>
          </div>
        </div>

        {/* Track Info & Visualizer */}
        <div className="flex items-center gap-4 my-5">
          {/* Album Art with Glowing Ring */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-lg group">
            <img 
              src={track.cover} 
              alt={track.title} 
              className={`w-full h-full object-cover transition-transform duration-700 ${isPlaying ? 'scale-105' : 'scale-100'}`}
            />
            {isPlaying && (
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end justify-center pb-1">
                <span className="text-[10px] text-cyan-300 font-mono tracking-wider">PLAYING</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base sm:text-lg font-bold text-white truncate">{track.title}</h4>
              <span className="text-[10px] font-mono text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded border border-cyan-500/20">HQ</span>
            </div>
            <p className="text-xs sm:text-sm text-zinc-400 truncate mt-0.5">{track.artist} • {track.album}</p>

            {/* Simulated 10-Band EQ Visualizer Bars */}
            <div className="flex items-end gap-1.5 h-6 mt-3">
              {[40, 75, 55, 90, 60, 85, 45, 95, 70, 50, 80, 65].map((val, i) => (
                <div
                  key={i}
                  className={`w-1 rounded-full transition-all duration-300 ${
                    isPlaying 
                      ? 'bg-gradient-to-t from-cyan-500 to-violet-400' 
                      : 'bg-zinc-700'
                  }`}
                  style={{
                    height: isPlaying ? `${Math.max(15, (val * ((i % 3) + 1) * (progress % 4 + 1)) % 100)}%` : '15%',
                    transition: 'height 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Synced Lyrics Snippet Demonstration */}
        <div className="my-4 p-3 rounded-xl bg-pitch-deep/90 border border-white/[0.05] relative overflow-hidden">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2">
            <span className="font-semibold tracking-wider text-cyan-400/90 uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-cyan-400" /> Karaoke Synced Lyrics
            </span>
            <span className="text-zinc-400 text-[10px]">Real-Time Auto-Scroll</span>
          </div>

          <div className="space-y-1.5 text-xs text-left">
            {previewLyrics.map((line, idx) => (
              <p
                key={idx}
                className={`transition-all duration-300 line-clamp-1 ${
                  line.active 
                    ? 'text-cyan-300 font-bold text-sm bg-gradient-to-r from-cyan-400 to-violet-300 bg-clip-text text-transparent transform translate-x-1' 
                    : 'text-zinc-400 text-xs'
                }`}
              >
                {line.text}
              </p>
            ))}
          </div>
        </div>

        {/* Interactive 1-Tap Vibe Modes Selector */}
        <div className="my-4">
          <div className="text-[11px] text-zinc-400 font-medium mb-2 flex items-center justify-between">
            <span>Instant Audio Transforms:</span>
            <span className="text-[10px] text-violet-400 font-mono">0ms DSP Latency</span>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveVibe(activeVibe === 'slowed' ? '' : 'slowed')}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                activeVibe === 'slowed'
                  ? 'bg-violet-500/20 border-violet-400 text-violet-200 shadow-[0_0_15px_rgba(139,92,246,0.2)]'
                  : 'bg-pitch-surface/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Waves className="w-3.5 h-3.5 text-violet-400" />
              <span>Slowed + Reverb</span>
            </button>

            <button
              onClick={() => setActiveVibe(activeVibe === '8d' ? '' : '8d')}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                activeVibe === '8d'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-pitch-surface/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Radio className="w-3.5 h-3.5 text-cyan-400" />
              <span>8D Spatial</span>
            </button>

            <button
              onClick={() => setActiveVibe(activeVibe === 'bass' ? '' : 'bass')}
              className={`px-2.5 py-2 rounded-xl text-xs font-medium border flex flex-col items-center gap-1 transition-all ${
                activeVibe === 'bass'
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.2)]'
                  : 'bg-pitch-surface/60 border-white/[0.06] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>+12dB Bass Boost</span>
            </button>
          </div>
        </div>

        {/* Progress Bar & Seek Simulator */}
        <div className="space-y-1.5 pt-2">
          <div className="relative w-full h-1.5 bg-zinc-800 rounded-full overflow-hidden cursor-pointer group">
            <div 
              className="h-full bg-gradient-to-r from-cyan-400 via-violet-400 to-cyan-300 rounded-full transition-all duration-200"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono text-zinc-400">
            <span>0:{progress < 10 ? `0${progress}` : progress}</span>
            <span>{track.durationFormatted}</span>
          </div>
        </div>

        {/* Interactive Play Controls */}
        <div className="flex items-center justify-between pt-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-1 text-zinc-400">
            <Volume2 className="w-4 h-4 text-zinc-400" />
            <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
              <div className="w-4/5 h-full bg-cyan-400"></div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setProgress(0)}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Previous Track"
            >
              <SkipBack className="w-4 h-4" />
            </button>

            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 flex items-center justify-center text-black font-bold hover:scale-105 active:scale-95 transition-all shadow-[0_0_20px_rgba(6,182,212,0.5)]"
              title={isPlaying ? "Pause" : "Play"}
            >
              {isPlaying ? <Pause className="w-5 h-5 fill-black" /> : <Play className="w-5 h-5 fill-black translate-x-0.5" />}
            </button>

            <button 
              onClick={() => setProgress(0)}
              className="text-zinc-400 hover:text-white transition-colors"
              title="Next Track"
            >
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={onLaunch}
            className="text-xs text-cyan-400 hover:text-cyan-300 font-medium flex items-center gap-1"
          >
            <span>Full Studio</span>
            <span>→</span>
          </button>
        </div>
      </div>
    </div>
  );
}
