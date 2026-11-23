import React from 'react';
import { Github, Music2, Cpu, ExternalLink, Heart, Radio } from 'lucide-react';
import MasakaliLogo from './common/MasakaliLogo';

export default function Footer({ onNavigate }) {
  return (
    <footer className="w-full bg-[#030304] border-t border-white/[0.06] pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-white/[0.06]">
          
          {/* Brand & Wordmark */}
          <div className="space-y-4 md:col-span-1">
            <div 
              onClick={() => onNavigate('/')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <MasakaliLogo className="w-8 h-8 rounded-lg object-cover" />
              <span className="font-extrabold text-lg text-white">
                Masakali 🕊️
              </span>
            </div>

            <p className="text-xs text-zinc-400 leading-relaxed">
              Ultra-lightweight modern music streaming with real-time hardware EQ and 8D spatial audio processing. Built under 1MB.
            </p>

            <div className="flex items-center gap-2 text-xs text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>All Systems Operational • 0.84MB Bundle</span>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Experience</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li>
                <button onClick={() => onNavigate('/app')} className="hover:text-cyan-300 transition-colors">
                  Web Player
                </button>
              </li>
              <li><a href="#features" className="hover:text-cyan-300 transition-colors">10-Band Equalizer</a></li>
              <li><a href="#features" className="hover:text-cyan-300 transition-colors">Slowed + Reverb Studio</a></li>
              <li><a href="#features" className="hover:text-cyan-300 transition-colors">Karaoke Synced Lyrics</a></li>
            </ul>
          </div>

          {/* Technology */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Tech Specs</h4>
            <ul className="space-y-2 text-xs text-zinc-400">
              <li className="flex items-center gap-1.5">
                <span>React 18 + Vite</span>
                <span className="text-[10px] text-cyan-400 font-mono">Modern</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Tailwind CSS</span>
                <span className="text-[10px] text-zinc-400 font-mono">0 Run-time</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Native Web Audio API</span>
                <span className="text-[10px] text-violet-400 font-mono">Hardware DSP</span>
              </li>
              <li className="flex items-center gap-1.5">
                <span>Progressive Web App</span>
                <span className="text-[10px] text-emerald-400 font-mono">PWA Ready</span>
              </li>
            </ul>
          </div>

          {/* Community & Open Code */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Open Source</h4>
            <p className="text-xs text-zinc-400">
              Designed with zero telemetry and zero ads. Open for custom presets and lyrics contributions.
            </p>
            <div className="pt-1 flex items-center gap-3">
              <a
                href="https://github.com"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-pitch-glass hover:bg-white/[0.08] text-xs text-zinc-300 hover:text-white border border-white/10 transition-colors"
              >
                <Github className="w-3.5 h-3.5" />
                <span>GitHub Repository</span>
                <ExternalLink className="w-3 h-3 text-zinc-400" />
              </a>
            </div>
          </div>

        </div>

        {/* Bottom Bar */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>
            © {new Date().getFullYear()} Masakali 🕊️ • Free Your Music. Fly Without Ads.
          </div>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-zinc-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Terms of Audio</a>
            <a href="#" className="hover:text-zinc-400 transition-colors">Audio Latency Specs</a>
          </div>
        </div>

      </div>
    </footer>
  );
}
