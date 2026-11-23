import React, { useState } from 'react';
import {
  X, Download, Smartphone, Apple, Check, ExternalLink,
  Sparkles, ArrowRight, Layers, ShieldCheck, Zap
} from 'lucide-react';
import MasakaliLogo from '../common/MasakaliLogo';

export default function DownloadAppModal({
  isOpen,
  onClose,
  onInstallNative,
  canInstallNative,
  isInstalled,
  isIOS
}) {
  const [activeTab, setActiveTab] = useState(isIOS ? 'ios' : 'android');
  const [downloadTriggered, setDownloadTriggered] = useState(false);

  if (!isOpen) return null;

  // Direct APK link (GitHub release direct download or repo)
  const APK_DOWNLOAD_URL = 'https://github.com/shivanshmakwana913-droid/Masakali-music-app/releases/latest/download/Masakali.apk';
  const GITHUB_REPO_URL = 'https://github.com/shivanshmakwana913-droid/Masakali-music-app';

  const handleNativeInstallClick = async () => {
    if (onInstallNative) {
      const res = await onInstallNative();
      if (res && res.outcome === 'accepted') {
        onClose();
      }
    }
  };

  const handleApkDownload = () => {
    setDownloadTriggered(true);
    // Create hidden download trigger
    const a = document.createElement('a');
    a.href = APK_DOWNLOAD_URL;
    a.setAttribute('download', 'Masakali.apk');
    a.target = '_blank';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setDownloadTriggered(false), 4000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-[#0E0E14] border border-white/10 rounded-3xl p-5 sm:p-7 shadow-[0_0_50px_rgba(6,182,212,0.15)] text-white overflow-hidden max-h-[92vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-64 h-32 bg-gradient-to-r from-cyan-500/25 to-violet-500/25 blur-3xl pointer-events-none rounded-full" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/[0.08] relative z-10 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-1 rounded-2xl bg-gradient-to-tr from-cyan-400 to-violet-500 shadow-[0_0_15px_rgba(6,182,212,0.4)]">
              <MasakaliLogo className="w-8 h-8 rounded-xl object-cover bg-black" />
            </div>
            <div>
              <h2 className="font-black text-lg sm:text-xl tracking-tight flex items-center gap-2">
                <span>Download Masakali</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v1.0
                </span>
              </h2>
              <p className="text-xs text-zinc-400">Free Your Music • Fly Without Ads</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] text-zinc-400 hover:text-white transition-all active:scale-95"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 relative z-10 pr-0.5">

          {/* Already Installed Banner */}
          {isInstalled && (
            <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-3 text-emerald-300 text-xs">
              <Check className="w-5 h-5 text-emerald-400 shrink-0" />
              <span>
                <strong>Masakali is installed!</strong> You can launch it anytime from your home screen or desktop apps.
              </span>
            </div>
          )}

          {/* 1-Tap Quick Native Install Action (Chromium / Supported browsers) */}
          {canInstallNative && (
            <div className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/20 via-blue-500/15 to-violet-500/20 border border-cyan-500/40 shadow-[0_0_20px_rgba(6,182,212,0.25)] flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-left w-full sm:w-auto">
                <div className="flex items-center gap-1.5 font-bold text-sm text-cyan-200">
                  <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
                  <span>1-Tap Instant Install</span>
                </div>
                <p className="text-[11px] text-zinc-300">
                  Add full-screen app to home screen with 0 browser address bars
                </p>
              </div>
              <button
                onClick={handleNativeInstallClick}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-black font-extrabold text-xs shadow-lg shadow-cyan-500/30 flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0"
              >
                <Zap className="w-3.5 h-3.5 fill-black" />
                <span>Install Now</span>
              </button>
            </div>
          )}

          {/* Platform Selector Tabs */}
          <div className="flex items-center rounded-2xl bg-white/[0.04] p-1 border border-white/[0.06]">
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'android'
                  ? 'bg-gradient-to-r from-emerald-500/25 to-cyan-500/25 text-emerald-300 border border-emerald-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'ios'
                  ? 'bg-gradient-to-r from-violet-500/25 to-pink-500/25 text-violet-300 border border-violet-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iOS</span>
            </button>
            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'pwa'
                  ? 'bg-gradient-to-r from-cyan-500/25 to-blue-500/25 text-cyan-300 border border-cyan-500/40 shadow-sm'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Web PWA</span>
            </button>
          </div>

          {/* TAB 1: Android APK Download */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-bold text-sm text-white flex items-center gap-2">
                      <span>Masakali for Android</span>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        Direct APK
                      </span>
                    </h3>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Install native standalone app. 100% ad-free, 10-Band EQ, and offline playback.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-[11px] text-zinc-300 py-1">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Zero Ads & Trackers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-cyan-400" />
                    <span>Works Offline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-violet-400" />
                    <span>10-Band Studio EQ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-pink-400" />
                    <span>Lightweight (&lt; 25MB)</span>
                  </div>
                </div>

                {/* Primary APK Download Button */}
                <button
                  onClick={handleApkDownload}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 hover:opacity-95 text-black font-black text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.3)] transition-all active:scale-[0.98]"
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadTriggered ? 'Starting Download...' : 'Download Masakali.apk'}</span>
                </button>
              </div>

              {/* Android Alternative: Add to Home Screen in Chrome */}
              <div className="p-3.5 rounded-2xl bg-white/[0.02] border border-white/[0.06] text-xs text-zinc-300 space-y-2">
                <span className="font-bold text-zinc-200">Alternative: Install via Chrome (0 Download)</span>
                <ol className="list-decimal list-inside space-y-1 text-zinc-400 text-[11px]">
                  <li>Tap the <strong>3 dots (⋮)</strong> menu in the top-right corner of Chrome.</li>
                  <li>Tap <strong>"Install app"</strong> or <strong>"Add to Home screen"</strong>.</li>
                  <li>Enjoy full-screen Masakali right from your app drawer!</li>
                </ol>
              </div>
            </div>
          )}

          {/* TAB 2: iPhone / iPad (iOS Safari) Instructions */}
          {activeTab === 'ios' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <div className="flex items-center gap-2">
                  <Apple className="w-4 h-4 text-white" />
                  <h3 className="font-bold text-sm text-white">How to Install on iPhone & iPad</h3>
                </div>
                <p className="text-xs text-zinc-400">
                  Apple Safari allows 1-tap installation with full-screen audio and background playback:
                </p>

                <div className="space-y-2.5 pt-1">
                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-300 font-bold text-xs flex items-center justify-center shrink-0">
                      1
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-zinc-200">Tap the Share Button</p>
                      <p className="text-zinc-400 text-[11px]">
                        At the bottom bar of Safari, tap the <strong>Share</strong> icon (square with arrow pointing up <span className="text-cyan-400">⬆️</span>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="w-6 h-6 rounded-full bg-violet-500/20 text-violet-300 font-bold text-xs flex items-center justify-center shrink-0">
                      2
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-zinc-200">Select "Add to Home Screen"</p>
                      <p className="text-zinc-400 text-[11px]">
                        Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong> (with a plus icon <span className="text-violet-400">➕</span>).
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05]">
                    <span className="w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-xs flex items-center justify-center shrink-0">
                      3
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold text-zinc-200">Tap "Add" in Top Right</p>
                      <p className="text-zinc-400 text-[11px]">
                        The Masakali icon will appear on your iPhone home screen and open without any Safari address bars!
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Desktop PWA & Web App */}
          {activeTab === 'pwa' && (
            <div className="space-y-3">
              <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] space-y-3">
                <h3 className="font-bold text-sm text-white">Desktop & Laptop Installation</h3>
                <p className="text-xs text-zinc-400">
                  Run Masakali in its own independent desktop window with keyboard media keys and taskbar pin:
                </p>

                <div className="space-y-2 text-xs text-zinc-300">
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                    <span className="text-cyan-400 font-mono font-bold">Chrome / Edge:</span>
                    <span className="text-zinc-300 text-[11px]">Click the <strong>Install icon (💻/⊕)</strong> on the right side of the URL bar.</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.05] flex items-center gap-3">
                    <span className="text-violet-400 font-mono font-bold">Brave / Opera:</span>
                    <span className="text-zinc-300 text-[11px]">Click <strong>Install Masakali</strong> from the address bar or main menu.</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs text-zinc-400">
                  <span>Open Source on GitHub</span>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:text-cyan-300 font-semibold"
                  >
                    <span>View Repository</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="pt-3 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-zinc-500 relative z-10 shrink-0">
          <span>100% Free & Open Source</span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-zinc-300 hover:text-white font-semibold transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
