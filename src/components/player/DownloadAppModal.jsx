import React, { useState } from 'react';
import {
  X, Download, Smartphone, Apple, Check, ExternalLink,
  Layers, ShieldCheck, Zap
} from 'lucide-react';
import MasakaliLogo from '../common/MasakaliLogo';
import { useTheme } from '../../context/ThemeContext';

export default function DownloadAppModal({
  isOpen,
  onClose,
  onInstallNative,
  canInstallNative,
  isInstalled,
  isIOS
}) {
  const { isDark } = useTheme();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className={`relative w-full max-w-lg border rounded-3xl p-5 sm:p-7 shadow-2xl overflow-hidden max-h-[92vh] flex flex-col transition-colors ${
          isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={`flex items-center justify-between pb-4 border-b shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-1 rounded-2xl border ${
              isDark ? 'border-zinc-800 bg-zinc-900' : 'border-zinc-200 bg-zinc-100'
            }`}>
              <MasakaliLogo className="w-8 h-8 rounded-xl object-cover bg-black" />
            </div>
            <div>
              <h2 className="font-bold text-lg sm:text-xl tracking-tight flex items-center gap-2">
                <span>Download Masakali</span>
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  v1.0
                </span>
              </h2>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Free Your Music • Minimalist & Ad-Free</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-2 rounded-xl border transition-colors ${
              isDark ? 'border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900' : 'border-zinc-200 text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="overflow-y-auto py-4 space-y-4 pr-0.5">

          {/* Already Installed Banner */}
          {isInstalled && (
            <div className={`p-3 rounded-2xl border flex items-center gap-3 text-xs ${
              isDark ? 'bg-zinc-900/80 border-zinc-800 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-800'
            }`}>
              <Check className="w-5 h-5 shrink-0" />
              <span>
                <strong>Masakali is installed!</strong> You can launch it anytime from your home screen or desktop apps.
              </span>
            </div>
          )}

          {/* 1-Tap Quick Native Install Action (Chromium / Supported browsers) */}
          {canInstallNative && (
            <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-3 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
            }`}>
              <div className="text-left w-full sm:w-auto">
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  <Zap className="w-4 h-4" />
                  <span>1-Tap Instant Install</span>
                </div>
                <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Add full-screen app to home screen with 0 browser address bars
                </p>
              </div>
              <button
                onClick={handleNativeInstallClick}
                className={`w-full sm:w-auto px-4 py-2.5 rounded-xl font-bold text-xs shadow-sm flex items-center justify-center gap-2 active:scale-95 transition-all shrink-0 ${
                  isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Install Now</span>
              </button>
            </div>
          )}

          {/* Platform Selector Tabs */}
          <div className={`flex items-center rounded-2xl p-1 border ${
            isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
          }`}>
            <button
              onClick={() => setActiveTab('android')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'android'
                  ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>Android APK</span>
            </button>
            <button
              onClick={() => setActiveTab('ios')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'ios'
                  ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <Apple className="w-3.5 h-3.5" />
              <span>iPhone / iOS</span>
            </button>
            <button
              onClick={() => setActiveTab('pwa')}
              className={`flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                activeTab === 'pwa'
                  ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                  : isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Web PWA</span>
            </button>
          </div>

          {/* TAB 1: Android APK Download */}
          {activeTab === 'android' && (
            <div className="space-y-3">
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div>
                  <h3 className="font-bold text-sm flex items-center gap-2">
                    <span>Masakali for Android</span>
                    <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                      isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                    }`}>
                      Direct APK
                    </span>
                  </h3>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Install native standalone app. 100% ad-free, 10-Band EQ, and offline playback.
                  </p>
                </div>

                <div className={`grid grid-cols-2 gap-2 text-[11px] py-1 ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    <span>Zero Ads & Trackers</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Works Offline</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>10-Band Studio EQ</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                    <span>Lightweight (&lt; 25MB)</span>
                  </div>
                </div>

                {/* Primary APK Download Button */}
                <button
                  onClick={handleApkDownload}
                  className={`w-full py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-transform hover:scale-[1.01] active:scale-[0.98] ${
                    isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  <Download className="w-4 h-4" />
                  <span>{downloadTriggered ? 'Starting Download...' : 'Download Masakali.apk'}</span>
                </button>
              </div>

              {/* Android Alternative: Add to Home Screen in Chrome */}
              <div className={`p-3.5 rounded-2xl border text-xs space-y-2 ${
                isDark ? 'bg-zinc-900/30 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
              }`}>
                <span className="font-bold">Alternative: Install via Chrome (0 Download)</span>
                <ol className={`list-decimal list-inside space-y-1 text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <div className="flex items-center gap-2">
                  <Apple className="w-4 h-4" />
                  <h3 className="font-bold text-sm">How to Install on iPhone & iPad</h3>
                </div>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Apple Safari allows 1-tap installation with full-screen audio and background playback:
                </p>

                <div className="space-y-2.5 pt-1">
                  <div className={`flex items-start gap-3 p-2.5 rounded-xl border ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'
                    }`}>
                      1
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold">Tap the Share Button</p>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        At the bottom bar of Safari, tap the <strong>Share</strong> icon (square with arrow pointing up).
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 p-2.5 rounded-xl border ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'
                    }`}>
                      2
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold">Select "Add to Home Screen"</p>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        Scroll down the share sheet and tap <strong>"Add to Home Screen"</strong>.
                      </p>
                    </div>
                  </div>

                  <div className={`flex items-start gap-3 p-2.5 rounded-xl border ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className={`w-6 h-6 rounded-full font-bold text-xs flex items-center justify-center shrink-0 ${
                      isDark ? 'bg-zinc-800 text-white' : 'bg-zinc-200 text-black'
                    }`}>
                      3
                    </span>
                    <div className="text-xs">
                      <p className="font-semibold">Tap "Add" in Top Right</p>
                      <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
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
              <div className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
              }`}>
                <h3 className="font-bold text-sm">Desktop & Laptop Installation</h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Run Masakali in its own independent desktop window with keyboard media keys and taskbar pin:
                </p>

                <div className={`space-y-2 text-xs ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className="font-bold font-mono">Chrome / Edge:</span>
                    <span className="text-[11px]">Click the <strong>Install icon</strong> on the right side of the URL bar.</span>
                  </div>
                  <div className={`p-2.5 rounded-xl border flex items-center gap-3 ${
                    isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-white border-zinc-200'
                  }`}>
                    <span className="font-bold font-mono">Brave / Opera:</span>
                    <span className="text-[11px]">Click <strong>Install Masakali</strong> from the address bar or main menu.</span>
                  </div>
                </div>

                <div className={`pt-2 flex items-center justify-between text-xs ${
                  isDark ? 'text-zinc-400' : 'text-zinc-500'
                }`}>
                  <span>Open Source on GitHub</span>
                  <a
                    href={GITHUB_REPO_URL}
                    target="_blank"
                    rel="noreferrer"
                    className={`inline-flex items-center gap-1.5 font-bold hover:underline ${
                      isDark ? 'text-white' : 'text-black'
                    }`}
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
        <div className={`pt-3 border-t flex items-center justify-between text-[11px] shrink-0 ${
          isDark ? 'border-zinc-800 text-zinc-500' : 'border-zinc-200 text-zinc-500'
        }`}>
          <span>100% Free & Open Source</span>
          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-xl font-bold transition-all ${
              isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 text-black'
            }`}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}
