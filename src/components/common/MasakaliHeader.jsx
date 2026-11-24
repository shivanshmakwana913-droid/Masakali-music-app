import React, { useState } from 'react';
import { Mic, Share2, Heart, Download, Settings } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import MasakaliLogo from './MasakaliLogo';

export default function MasakaliHeader({
  onSearch,
  onFocusSearch,
  onShareApp,
  onOpenSupport,
  onOpenDownload,
  onOpenSettings,
  isInstalled = false,
  showToast
}) {
  const [isListening, setIsListening] = useState(false);
  const { isDark } = useTheme();

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
      if (showToast) showToast('Listening... Speak song or artist name');

      recognition.onresult = (event) => {
        setIsListening(false);
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          if (onSearch) onSearch(transcript);
          if (showToast) showToast(`Searching for: "${transcript}"`);
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
    <header className="w-full flex items-center justify-between py-1.5 select-none">
      {/* Left: Clean Minimal Masakali Logo & Wordmark (Human-Designed, No Flashy Gradients) */}
      <div className="flex items-center gap-2.5">
        <div className={`p-1 rounded-xl border shrink-0 ${
          isDark ? 'bg-black border-zinc-800' : 'bg-white border-zinc-200'
        }`}>
          <MasakaliLogo className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg object-contain bg-black" />
        </div>

        {/* Brand Wordmark */}
        <div className="flex items-center gap-1.5">
          <span className={`font-black text-xl sm:text-2xl tracking-tight ${
            isDark ? 'text-white' : 'text-zinc-950'
          }`}>
            Masakali
          </span>
        </div>
      </div>

      {/* Right: Quick-Action Buttons (Download, Voice, Share, Support, Settings) */}
      <div className="flex items-center gap-1.5 sm:gap-2">
        {/* 0. Smart Download / Install App Button */}
        {!isInstalled && onOpenDownload && (
          <button
            onClick={onOpenDownload}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-900 border-zinc-800 hover:bg-zinc-800 text-zinc-200 hover:text-white'
                : 'bg-zinc-100 border-zinc-200 hover:bg-zinc-200 text-zinc-800 hover:text-zinc-950'
            }`}
            title="Download Masakali App (Android APK / 1-Tap Install)"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline font-bold">Download App</span>
            <span className="sm:hidden font-bold text-[11px]">App</span>
          </button>
        )}

        {/* 1. Voice Search Button */}
        <button
          onClick={handleVoiceSearch}
          className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
            isListening
              ? isDark 
                ? 'bg-white text-black border-white animate-pulse' 
                : 'bg-black text-white border-black animate-pulse'
              : isDark
                ? 'bg-zinc-900/60 hover:bg-zinc-850 text-zinc-300 hover:text-white border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border-zinc-200'
          }`}
          title="Voice Search Songs"
        >
          <Mic className="w-4 h-4" />
          <span className="hidden md:inline">Voice</span>
        </button>

        {/* 2. Quick Share App Button */}
        {onShareApp && (
          <button
            onClick={onShareApp}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border-zinc-200'
            }`}
            title="Share Masakali with Friends"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden md:inline">Share</span>
          </button>
        )}

        {/* 3. Support Button */}
        {onOpenSupport && (
          <button
            onClick={onOpenSupport}
            className={`p-2 sm:px-3 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-900/60 hover:bg-zinc-800 text-zinc-200 hover:text-white border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-800 hover:text-zinc-950 border-zinc-200'
            }`}
            title="Support Masakali via UPI"
          >
            <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
            <span className="hidden sm:inline font-bold">Support</span>
          </button>
        )}

        {/* 4. Settings Button */}
        {onOpenSettings && (
          <button
            onClick={onOpenSettings}
            className={`p-2 sm:px-2.5 sm:py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 ${
              isDark
                ? 'bg-zinc-900 hover:bg-zinc-800 text-zinc-300 hover:text-white border-zinc-800'
                : 'bg-zinc-100 hover:bg-zinc-200 text-zinc-700 hover:text-zinc-950 border-zinc-200'
            }`}
            title="Settings (Theme, Profile, Apps, Data)"
          >
            <Settings className="w-4 h-4" />
          </button>
        )}
      </div>
    </header>
  );
}
