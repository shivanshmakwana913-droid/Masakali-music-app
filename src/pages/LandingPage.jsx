import React from 'react';
import Navbar from '../components/Navbar';
import Hero from '../components/Hero';
import FeatureCards from '../components/FeatureCards';
import Footer from '../components/Footer';
import { ArrowRight, Play, Sparkles, Sliders, Volume2, Shield } from 'lucide-react';

export default function LandingPage({ onNavigate }) {
  return (
    <div className="min-h-screen bg-[#050507] text-white flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Top sticky navigation bar */}
      <Navbar onNavigate={onNavigate} />

      {/* Main hero showcase with live interactive preview */}
      <main className="flex-1">
        <Hero onLaunch={() => onNavigate('/app')} />

        {/* 4 Core Features section */}
        <FeatureCards />

        {/* Performance Callout / Speed Benchmark Section */}
        <section id="performance" className="py-20 bg-gradient-to-b from-[#050507] via-pitch-surface to-[#030304] border-y border-white/[0.06]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="p-8 sm:p-12 rounded-3xl glass-panel relative overflow-hidden border border-white/10">
              {/* Background ambient lighting */}
              <div className="absolute -top-24 -right-24 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                <div className="lg:col-span-8 space-y-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-xs font-semibold text-cyan-400">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Extreme Optimization</span>
                  </div>
                  <h3 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
                    Why Bloat Your Device with 200MB Apps?
                  </h3>
                  <p className="text-zinc-400 text-sm sm:text-base leading-relaxed max-w-2xl">
                    Standard music applications bundle gigabytes of trackers, analytics, and sluggish web-views. <strong className="text-white">Masakali</strong> delivers a razor-sharp, native 60fps audio workstation in under <strong className="text-cyan-300">1MB total bundle size</strong>. Instant load, zero telemetry, full audio freedom.
                  </p>
                  
                  {/* Speed Metrics Comparison */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4">
                    <div className="p-3.5 rounded-xl bg-pitch-deep/80 border border-white/[0.06]">
                      <div className="text-xs text-zinc-400">Initial Load (TTI)</div>
                      <div className="text-xl font-bold text-cyan-400 font-mono mt-1">&lt; 0.2s</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Near instantaneous</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-pitch-deep/80 border border-white/[0.06]">
                      <div className="text-xs text-zinc-400">Total Bundle Size</div>
                      <div className="text-xl font-bold text-violet-400 font-mono mt-1">~ 0.84 MB</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Strict &lt; 1MB budget</div>
                    </div>

                    <div className="p-3.5 rounded-xl bg-pitch-deep/80 border border-white/[0.06] col-span-2 sm:col-span-1">
                      <div className="text-xs text-zinc-400">Audio Latency</div>
                      <div className="text-xl font-bold text-emerald-400 font-mono mt-1">~ 0 ms</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5">Hardware Web Audio API</div>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-4 flex flex-col items-center justify-center p-6 rounded-2xl bg-pitch-deep/90 border border-white/[0.08] text-center space-y-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 p-[1px]">
                    <div className="w-full h-full bg-[#0B0B10] rounded-[15px] flex items-center justify-center">
                      <Play className="w-7 h-7 text-cyan-300 fill-cyan-400/20 translate-x-0.5" />
                    </div>
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-white">Experience Masakali 🕊️ Now</h4>
                    <p className="text-xs text-zinc-400 mt-1">Ready to stream with zero setup or sign-in.</p>
                  </div>
                  <button
                    onClick={() => onNavigate('/app')}
                    className="w-full py-3 px-5 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-400 text-black font-bold text-sm hover:opacity-90 transition-all shadow-[0_0_20px_rgba(6,182,212,0.4)] flex items-center justify-center gap-2"
                  >
                    <span>Launch Web Player</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer onNavigate={onNavigate} />
    </div>
  );
}
