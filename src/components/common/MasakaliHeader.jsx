import React, { useState } from 'react';
import { Mic, MicOff, Share2, Heart, Download, Sparkles } from 'lucide-react';
import MasakaliLogo from './MasakaliLogo';

export default function MasakaliHeader({
  onSearch,
  onFocusSearch,
  onShareApp,
  onOpenSupport,
  onOpenDownload,
  isInstalled = false,
  showToast
}) {
  const [isListening, setIsListening] = useState(false);

  // Web Speech API Voice Search
  const handleVoiceSearch = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      if (onFocusSearch) onFocusSearch();
      if (showToast) showToast('Voice search not supported in this browser. Try typing.');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-US, hi-IN';
      recognition.interimResults = false;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      if (showToast) showToast('🎙️ Listening... Speak song or artist name');

      recognition.onresult = (event) => {
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          if (onSearch) onSearch(transcript);
          if (showToast) showToast(`🎙️ Searching for: "${transcript}"`);
        }
      };

      recognition.onerror = (err) => {
        setIsListening(false);
        if (err.error !== 'no-speech') {
          if (showToast) showToast('Voice search cancelled or mic blocked');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      setIsListening(false);
      if (onFocusSearch) onFocusSearch();
    }
  };

  return (
    <header className="w-full flex items-center justify-between py-1 select-none">
      {/* Left: Masakali Dove Logo in Glowing Ring + Wordmark + AD-FREE Badge */}
      <div className="flex items-center gap-2.5">
        {/* Subtle Glowing Cyan/Violet Ring Container */}
        <div className="relative p-[1.5px] rounded-2xl bg-gradient-to-tr from-cyan-400 via-violet-500 to-cyan-300 shadow-[0_0_16px_rgba(6,182,212,0.35)] shrink-0 group">
          <MasakaliLogo className="w-8 h-8 sm:w-9 sm:h-9 rounded-[14px] object-cover bg-black" />
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-emerald-400 border-2 border-black animate-pulse" />
        </div>

        {/* Brand Wordmark & Tag */}
        <div className="flex items-center gap-2">
          <span className="font-black text-xl sm:text-2xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent">
            Masakali
          </span>
          <span className="text-[9px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-300 border border-emerald-400/40 shadow-[0_0_10px_rgba(52,211,153,0.3)]">
            AD-FREE
          </span>
        </div>
      </div>

      {/* Right: Quick-Action Buttons (Download, Voice Search, Share, Support) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 0. Smart Download / Install App Button (Only shown in browser when NOT running as an installed standalone app) */}
        {!isInstalled && onOpenDownload && (
          <button
            onClick={onOpenDownload}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-cyan-500/15 via-blue-500/15 to-violet-500/15 hover:from-cyan-500/25 hover:to-violet-500/25 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(6,182,212,0.2)] active:scale-95 group"
            title="Download Masakali App (Android APK / 1-Tap Install)"
          >
            <Download className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            <span className="hidden sm:inline font-bold">Download App</span>
            <span className="sm:hidden font-bold text-[11px]">App</span>
          </button>
        )}

        {/* 1. Voice Search Button */}
        <button
          onClick={handleVoiceSearch}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            isListening
              ? 'bg-cyan-500/25 border-cyan-400 text-cyan-200 shadow-[0_0_15px_rgba(6,182,212,0.6)] animate-pulse'
              : 'bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border-white/[0.08]'
          }`}
          title="Voice Search Songs (Tap & Speak)"
        >
          {isListening ? (
            <>
              <Mic className="w-4 h-4 text-cyan-300 animate-bounce" />
              <span className="hidden sm:inline font-mono text-cyan-300">Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-4 h-4 text-cyan-400" />
              <span className="hidden md:inline">Voice</span>
            </>
          )}
        </button>

        {/* 2. Quick Share App Button */}
        {onShareApp && (
          <button
            onClick={onShareApp}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-zinc-300 hover:text-white border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95"
            title="Share Masakali with Friends"
          >
            <Share2 className="w-4 h-4 text-violet-400" />
            <span className="hidden md:inline">Share</span>
          </button>
        )}

        {/* 3. 1-Tap Support Button */}
        {onOpenSupport && (
          <button
            onClick={onOpenSupport}
            className="p-2 sm:px-3 sm:py-1.5 rounded-xl bg-gradient-to-r from-rose-500/15 to-violet-500/15 hover:from-rose-500/25 hover:to-violet-500/25 text-rose-300 hover:text-rose-100 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)] active:scale-95"
            title="Keep Masakali Flying Free 🕊️ via UPI"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span className="hidden sm:inline font-bold">Support</span>
          </button>
        )}
      </div>
    </header>
  );
}
