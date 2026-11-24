import React, { useState, useEffect } from 'react';
import MasakaliLogo from './MasakaliLogo';

/**
 * Animated Splash Loader (SplashLoader)
 * Sleek, ultra-fast, pure-CSS splash screen and inline loader for Masakali.
 * 
 * Features:
 * - 0 heavy animation libraries (100% pure CSS keyframes, 60fps)
 * - OLED pitch-black background with central cyan/violet radial ambient glow
 * - Softly pulsing halo ring with floating/scale-in Masakali Dove logo
 * - Modern typography ('Outfit' / 'Syne') with shimmering cyan-white gradient text
 * - 5 dancing equalizer soundwave bars alongside "Free Your Music" tagline
 * - Supports both full-screen initial splash (1.3s non-blocking) and inline loading modes
 */
export default function SplashLoader({
  duration = 1300,
  onFinish,
  inline = false,
  message = "Free Your Music",
  size = "md",
  className = ""
}) {
  const [isFading, setIsFading] = useState(false);
  const [isMounted, setIsMounted] = useState(true);

  useEffect(() => {
    if (inline) return;

    // Begin silky fade-out at specified duration (default 1.3s)
    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, duration);

    // Completely unmount after fade transition (350ms duration)
    const unmountTimer = setTimeout(() => {
      setIsMounted(false);
      if (onFinish) onFinish();
    }, duration + 350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(unmountTimer);
    };
  }, [duration, inline, onFinish]);

  if (!isMounted && !inline) return null;

  // COMPACT INLINE MODE (for Search, Buffering, or List loading)
  if (inline) {
    const sizeMap = {
      sm: { ring: 'p-0.5 rounded-xl border border-zinc-800', logo: 'w-6 h-6 rounded-[10px]', text: 'text-xs', eqH: 'h-4', barW: 'w-0.5' },
      md: { ring: 'p-0.5 rounded-2xl border border-zinc-800', logo: 'w-8 h-8 rounded-[14px]', text: 'text-sm', eqH: 'h-5', barW: 'w-1' },
      lg: { ring: 'p-0.5 rounded-2xl border border-zinc-800', logo: 'w-12 h-12 rounded-[18px]', text: 'text-base', eqH: 'h-6', barW: 'w-1' }
    };
    const s = sizeMap[size] || sizeMap.md;

    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Minimal Masakali Emblem */}
        <div className={`relative ${s.ring} bg-zinc-900 shrink-0`}>
          <MasakaliLogo className={`${s.logo} object-cover bg-black`} />
        </div>

        {/* Minimal Equalizer Bars + Status Message */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-0.5 ${s.eqH}`}>
            {[0.1, 0.35, 0.0, 0.45, 0.2].map((delay, idx) => (
              <span
                key={idx}
                className={`${s.barW} rounded-full bg-white`}
                style={{
                  animation: 'eqDance 1.1s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  height: '6px'
                }}
              />
            ))}
          </div>
          {message && (
            <span className={`font-medium ${s.text} text-zinc-400 font-display tracking-wide`}>
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  // FULL-SCREEN INITIAL SPLASH SCREEN (MINIMALIST BLACK & WHITE)
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black select-none transition-opacity duration-350 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${className}`}
    >
      {/* Central Content Container */}
      <div className="flex flex-col items-center gap-6 text-center animate-in fade-in duration-500">
        
        {/* 1. Centerpiece Masakali Dove Logo */}
        <div className="relative group mb-1">
          <div className="p-1 rounded-3xl border border-zinc-800 bg-zinc-950 shadow-2xl">
            <MasakaliLogo
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px] object-cover bg-black"
              fallbackClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-[22px]"
            />
          </div>
        </div>

        {/* 2. Minimalist Brand Typography */}
        <div className="space-y-3 flex flex-col items-center">
          <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight text-white">
            Masakali
          </h1>

          {/* 3. Mini Equalizer Soundwave & Tagline */}
          <div className="flex items-center gap-3 pt-1">
            {/* 5 Animated Equalizer Bars */}
            <div className="flex items-center gap-1 h-5">
              {[0.1, 0.35, 0.0, 0.45, 0.2].map((delay, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-white"
                  style={{
                    animation: 'eqDance 1.1s ease-in-out infinite',
                    animationDelay: `${delay}s`,
                    height: '6px'
                  }}
                />
              ))}
            </div>

            <span className="text-xs font-semibold tracking-widest uppercase text-zinc-400 font-display">
              {message}
            </span>

            {/* Mirror Equalizer Bars */}
            <div className="flex items-center gap-1 h-5">
              {[0.2, 0.45, 0.0, 0.35, 0.1].map((delay, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-zinc-500"
                  style={{
                    animation: 'eqDance 1.1s ease-in-out infinite',
                    animationDelay: `${delay}s`,
                    height: '6px'
                  }}
                />
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* Subtle Bottom Credit / Version */}
      <div className="absolute bottom-7 flex items-center gap-2 text-[10px] text-zinc-600 font-mono tracking-widest uppercase">
        <span>MINIMALIST AUDIO</span>
        <span>•</span>
        <span>ZERO ADS</span>
        <span>•</span>
        <span>OFFLINE</span>
      </div>
    </div>
  );
}

/**
 * Compact Inline Loader for search queries, song buffering, and list loads
 */
export function MasakaliInlineLoader({
  message = "Searching catalog...",
  size = "md",
  className = ""
}) {
  return (
    <SplashLoader
      inline={true}
      message={message}
      size={size}
      className={className}
    />
  );
}
