import React from 'react';
import { Zap, Sliders, Waves, Mic2, Cpu, Sparkles, Activity, Music, Radio, Volume2 } from 'lucide-react';

export default function FeatureCards() {
  const features = [
    {
      id: "performance",
      title: "Ultra-Light & Fast (<1MB)",
      tagline: "Instant load on any network with sub-second TTI.",
      description: "Zero heavy UI kits, zero Framer Motion or GSAP bloat. Engineered with tree-shaken React 18, pure CSS transitions, and hardware-accelerated Tailwind utilities for a buttery 60fps experience that installs seamlessly as a tiny PWA.",
      icon: Zap,
      gradient: "from-cyan-500 to-blue-500",
      accentBg: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/20",
      accentText: "text-cyan-400",
      visual: (
        <div className="mt-5 p-4 rounded-xl bg-pitch-deep/90 border border-white/[0.06] space-y-3 font-mono text-xs">
          <div className="flex items-center justify-between text-zinc-400">
            <span>Bundle Budget:</span>
            <span className="text-cyan-400 font-semibold">&lt; 1,000 KB (Strict)</span>
          </div>
          <div className="w-full bg-zinc-800/80 rounded-full h-2 overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-violet-400 h-full w-[24%]" />
          </div>
          <div className="flex justify-between text-[11px] text-zinc-400">
            <span>Core JS: ~118 KB gzip</span>
            <span>Vendor: ~32 KB gzip</span>
            <span className="text-emerald-400 font-semibold">Pass: 0.15s TTI</span>
          </div>
        </div>
      )
    },
    {
      id: "studio-eq",
      title: "Studio 10-Band EQ",
      tagline: "Real-time frequency & bass control with zero latency.",
      description: "Direct hardware audio sculpting powered by the browser's native Web Audio API BiquadFilterNodes. Dial in sub-bass at 32Hz, punchy mids, and sparkling highs up to 16kHz, or switch presets in one click (Bass Boost, Vocal, Pop, Rock).",
      icon: Sliders,
      gradient: "from-violet-500 to-purple-500",
      accentBg: "bg-violet-500/10",
      accentBorder: "border-violet-500/20",
      accentText: "text-violet-400",
      visual: (
        <div className="mt-5 p-4 rounded-xl bg-pitch-deep/90 border border-white/[0.06]">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 mb-2.5">
            <span className="font-mono text-violet-300">PRESET: BASS BOOST (+9dB)</span>
            <span className="text-zinc-400">32Hz - 16kHz</span>
          </div>
          <div className="grid grid-cols-10 gap-1.5 items-end h-16 pt-2">
            {[9, 8, 6, 3, 1, 0, 2, 4, 6, 7].map((db, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1">
                <div 
                  className="w-full rounded-t-sm bg-gradient-to-t from-violet-600 to-cyan-400 transition-all duration-300"
                  style={{ height: `${(db + 10) * 4}%` }}
                />
                <span className="text-[8px] font-mono text-zinc-400">
                  {['32', '64', '125', '250', '500', '1k', '2k', '4k', '8k', '16k'][idx]}
                </span>
              </div>
            ))}
          </div>
        </div>
      )
    },
    {
      id: "slowed-reverb",
      title: "Slowed + Reverb & 8D Audio",
      tagline: "One-tap live vibe transformation with zero re-encoding.",
      description: "Experience your favorite tracks with dreamy algorithmic pitch reduction, lush convolution-style stereo delay reflection, and hypnotic 8D spatial panning that rotates the stereo soundstage 360° around your headphones.",
      icon: Waves,
      gradient: "from-cyan-400 to-violet-500",
      accentBg: "bg-cyan-500/10",
      accentBorder: "border-cyan-500/20",
      accentText: "text-cyan-400",
      visual: (
        <div className="mt-5 p-4 rounded-xl bg-pitch-deep/90 border border-white/[0.06] space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="flex items-center gap-1.5 text-zinc-300 font-medium">
              <Radio className="w-3.5 h-3.5 text-cyan-400" /> 8D Orbit Mode
            </span>
            <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              ACTIVE
            </span>
          </div>
          <div className="flex items-center justify-between text-[11px] text-zinc-400 font-mono">
            <span>Speed: 0.85x</span>
            <span>Pitch: -2 Semitones</span>
            <span>Decay: 2.4s</span>
          </div>
          <div className="relative w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="absolute h-full w-1/3 bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full animate-[wave_2.5s_ease-in-out_infinite_alternate]" />
          </div>
        </div>
      )
    },
    {
      id: "karaoke-lyrics",
      title: "Karaoke Synced Lyrics",
      tagline: "Real-time line-by-line highlighting with dynamic auto-scrolling.",
      description: "Sing along with precision time-stamped `.lrc` playback. Masakali tracks milliseconds seamlessly, dynamically enlarging and coloring the current active line in glowing electric cyan while dimming preceding and upcoming lyrics.",
      icon: Mic2,
      gradient: "from-violet-400 to-pink-500",
      accentBg: "bg-violet-500/10",
      accentBorder: "border-violet-500/20",
      accentText: "text-violet-400",
      visual: (
        <div className="mt-5 p-4 rounded-xl bg-pitch-deep/90 border border-white/[0.06] space-y-2 text-xs">
          <p className="text-zinc-400 text-[11px] line-through decoration-zinc-700">Walking through neon shadows on the avenue</p>
          <div className="p-2 rounded-lg bg-gradient-to-r from-cyan-500/15 via-violet-500/15 to-transparent border-l-2 border-cyan-400">
            <p className="text-white font-bold text-sm bg-gradient-to-r from-cyan-300 to-violet-300 bg-clip-text text-transparent">
              City lights reflect the rhythm inside of you ♪
            </p>
          </div>
          <p className="text-zinc-400 text-[11px]">Electric cyan waves pulse in the midnight air</p>
        </div>
      )
    }
  ];

  return (
    <section id="features" className="py-20 bg-[#050507] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Pure Innovation. Zero Compromise.</span>
          </div>

          <h2 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Engineered for Audiophiles. <br />
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-200 to-violet-400 bg-clip-text text-transparent">
              Built for Blazing Speed.
            </span>
          </h2>

          <p className="text-sm sm:text-base text-zinc-400 leading-relaxed">
            Every byte was scrutinized. Experience high-fidelity audio processing that usually takes gigabyte-heavy desktop software, right in a sub-1MB browser tab.
          </p>
        </div>

        {/* 4 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.id}
                className="group relative rounded-2xl p-6 sm:p-8 glass-card flex flex-col justify-between overflow-hidden"
              >
                {/* Subtle hover gradient ring */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-bl from-cyan-500/10 via-violet-500/10 to-transparent rounded-full blur-3xl pointer-events-none group-hover:scale-125 transition-transform duration-500" />

                <div>
                  {/* Icon & Title */}
                  <div className="flex items-center gap-3.5 mb-4">
                    <div className={`p-3 rounded-xl ${feature.accentBg} ${feature.accentBorder} border`}>
                      <Icon className={`w-5 h-5 ${feature.accentText}`} />
                    </div>
                    <div>
                      <h3 className="text-lg sm:text-xl font-bold text-white group-hover:text-cyan-200 transition-colors">
                        {feature.title}
                      </h3>
                      <p className="text-xs text-zinc-400 font-medium">{feature.tagline}</p>
                    </div>
                  </div>

                  {/* Body description */}
                  <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                {/* Feature Visual / Micro-Widget */}
                {feature.visual}
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
