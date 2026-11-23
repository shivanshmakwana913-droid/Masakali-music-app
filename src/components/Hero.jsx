import React from 'react';
import { Play, Zap, Sliders, ShieldCheck, ArrowRight, Disc3, Sparkles } from 'lucide-react';
import InteractivePreview from './InteractivePreview';

export default function Hero({ onLaunch }) {
  return (
    <section className="relative pt-12 pb-20 md:pt-20 md:pb-32 overflow-hidden">
      {/* Background radial gradient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-tr from-cyan-500/15 via-violet-600/15 to-transparent rounded-full blur-[140px] pointer-events-none -z-10" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          
          {/* Left Column: Headline, Value Proposition & CTAs */}
          <div className="lg:col-span-7 text-center lg:text-left space-y-6">
            
            {/* Pill Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-pitch-glass border border-white/10 text-xs font-medium text-zinc-300 shadow-inner">
              <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-cyan-400 font-semibold">Masakali 🕊️ v1.0</span>
              <span className="text-zinc-600">•</span>
              <span>Free Your Music. Fly Without Ads.</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold tracking-tight text-white leading-[1.08]">
              Free Your Music. <br />
              <span className="bg-gradient-to-r from-cyan-400 via-cyan-200 to-violet-400 bg-clip-text text-transparent drop-shadow-sm">
                Fly Without Ads.
              </span>
            </h1>

            {/* Subheadline */}
            <p className="text-base sm:text-lg text-zinc-400 max-w-2xl mx-auto lg:mx-0 leading-relaxed font-normal">
              An ultra-lightweight (<span className="text-cyan-300 font-medium">&lt;1MB bundle size</span>) ad-free music haven and real-time audio studio. Stream seamlessly without ads, sculpt beats with a <strong className="text-zinc-200">10-band EQ</strong>, remove vocals with <strong className="text-zinc-200">Live Karaoke</strong>, and immerse in <strong className="text-zinc-200">Slowed + Reverb</strong> & <strong className="text-zinc-200">8D Spatial Audio</strong>.
            </p>

            {/* CTA Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onLaunch}
                className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gradient-to-r from-cyan-400 via-cyan-300 to-violet-400 text-black font-bold text-sm hover:opacity-95 transition-all shadow-[0_0_25px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2 group hover:scale-[1.02] active:scale-[0.98]"
              >
                <Play className="w-4 h-4 fill-black" />
                <span>Launch Masakali 🕊️</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <a
                href="#features"
                className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-pitch-glass hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/10 text-sm font-semibold transition-all flex items-center justify-center gap-2"
              >
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Explore Studio Features</span>
              </a>
            </div>

            {/* Key Micro-Specs Strip */}
            <div className="pt-6 border-t border-white/[0.06] grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-xl mx-auto lg:mx-0 text-left">
              <div className="space-y-0.5">
                <div className="text-lg sm:text-xl font-bold text-white font-mono">&lt; 0.9 MB</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1">
                  <Zap className="w-3 h-3 text-cyan-400" /> Total Bundle
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg sm:text-xl font-bold text-white font-mono">10-Band</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-violet-400" /> Studio EQ
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg sm:text-xl font-bold text-white font-mono">60 FPS</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1">
                  <Disc3 className="w-3 h-3 text-cyan-400" /> GPU Accelerated
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="text-lg sm:text-xl font-bold text-white font-mono">0 Ads</div>
                <div className="text-xs text-zinc-400 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" /> Pure Audio
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Interactive Live Preview Card */}
          <div className="lg:col-span-5 w-full">
            <InteractivePreview onLaunch={onLaunch} />
          </div>

        </div>
      </div>
    </section>
  );
}
