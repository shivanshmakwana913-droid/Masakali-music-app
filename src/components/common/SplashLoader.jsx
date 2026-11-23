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
      sm: { ring: 'p-[1.5px] rounded-xl', logo: 'w-6 h-6 rounded-[10px]', text: 'text-xs', eqH: 'h-4', barW: 'w-0.5' },
      md: { ring: 'p-[2px] rounded-2xl', logo: 'w-8 h-8 rounded-[14px]', text: 'text-sm', eqH: 'h-5', barW: 'w-1' },
      lg: { ring: 'p-[2.5px] rounded-2xl', logo: 'w-12 h-12 rounded-[18px]', text: 'text-base', eqH: 'h-6', barW: 'w-1' }
    };
    const s = sizeMap[size] || sizeMap.md;

    return (
      <div className={`flex items-center gap-3 select-none ${className}`}>
        {/* Glowing Mini Masakali Emblem */}
        <div className={`relative ${s.ring} bg-gradient-to-tr from-cyan-400 via-violet-500 to-cyan-300 shadow-[0_0_15px_rgba(6,182,212,0.4)] shrink-0 animate-splash-float`}>
          <MasakaliLogo className={`${s.logo} object-cover bg-black`} />
        </div>

        {/* Dancing Equalizer Bars + Status Message */}
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-0.5 ${s.eqH}`}>
            {[0.1, 0.35, 0.0, 0.45, 0.2].map((delay, idx) => (
              <span
                key={idx}
                className={`${s.barW} rounded-full bg-gradient-to-t from-cyan-400 to-violet-400`}
                style={{
                  animation: 'eqDance 1.1s ease-in-out infinite',
                  animationDelay: `${delay}s`,
                  height: '6px'
                }}
              />
            ))}
          </div>
          {message && (
            <span className={`font-medium ${s.text} text-zinc-300 font-display tracking-wide`}>
              {message}
            </span>
          )}
        </div>
      </div>
    );
  }

  // FULL-SCREEN INITIAL SPLASH SCREEN
  return (
    <div
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050507] select-none transition-opacity duration-350 ease-out ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      } ${className}`}
      style={{
        backgroundColor: '#050507',
        backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(6, 182, 212, 0.25) 0%, rgba(139, 92, 246, 0.15) 35%, transparent 70%)'
      }}
    >
      {/* Central Content Container */}
      <div className="flex flex-col items-center gap-7 text-center animate-in fade-in zoom-in-95 duration-500">
        
        {/* 1. Centerpiece Masakali Dove Logo in Glowing Halo */}
        <div className="relative group animate-splash-float mb-1">
          {/* Breathing Radial Halo Glow */}
          <div className="absolute -inset-6 rounded-full bg-gradient-to-tr from-cyan-500/40 via-violet-500/30 to-cyan-400/40 blur-2xl animate-pulse pointer-events-none" />

          {/* Precision Glowing Gradient Ring */}
          <div className="relative p-[3px] rounded-[30px] bg-gradient-to-tr from-cyan-400 via-violet-500 to-cyan-300 shadow-[0_0_45px_rgba(6,182,212,0.5),0_0_90px_rgba(139,92,246,0.3)]">
            <MasakaliLogo
              className="w-24 h-24 sm:w-28 sm:h-28 rounded-[27px] object-cover bg-black"
              fallbackClassName="w-24 h-24 sm:w-28 sm:h-28 rounded-[27px]"
            />
            {/* Emerald Online / Live Dot */}
            <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-400 border-[3px] border-[#050507] shadow-[0_0_12px_rgba(52,211,153,0.8)] animate-pulse" />
          </div>
        </div>

        {/* 2. Stylish Animated Brand Typography */}
        <div className="space-y-3 flex flex-col items-center">
          <div className="flex items-center gap-2.5">
            <h1 className="font-display font-black text-4xl sm:text-5xl tracking-tight bg-gradient-to-r from-white via-cyan-100 to-cyan-400 bg-clip-text text-transparent animate-text-shimmer drop-shadow-[0_0_25px_rgba(6,182,212,0.4)]">
              Masakali
            </h1>
            <span className="text-[10px] font-black tracking-widest uppercase px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/50 shadow-[0_0_12px_rgba(52,211,153,0.4)]">
              AD-FREE
            </span>
          </div>

          {/* 3. Mini Equalizer Soundwave & Tagline */}
          <div className="flex items-center gap-3 pt-1">
            {/* 5 Animated Equalizer Bars */}
            <div className="flex items-center gap-1 h-6">
              {[0.1, 0.35, 0.0, 0.45, 0.2].map((delay, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-gradient-to-t from-cyan-400 to-violet-400 shadow-[0_0_10px_rgba(6,182,212,0.6)]"
                  style={{
                    animation: 'eqDance 1.1s ease-in-out infinite',
                    animationDelay: `${delay}s`,
                    height: '6px'
                  }}
                />
              ))}
            </div>

            <span className="text-xs font-bold tracking-[0.25em] uppercase text-zinc-300 font-display">
              {message}
            </span>

            {/* Mirror Equalizer Bars */}
            <div className="flex items-center gap-1 h-6">
              {[0.2, 0.45, 0.0, 0.35, 0.1].map((delay, idx) => (
                <span
                  key={idx}
                  className="w-1 rounded-full bg-gradient-to-t from-violet-400 to-cyan-400 shadow-[0_0_10px_rgba(139,92,246,0.6)]"
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
      <div className="absolute bottom-7 flex items-center gap-2 text-[10px] text-zinc-500 font-mono tracking-widest uppercase">
        <span>PURE SOUND</span>
        <span>•</span>
        <span>ZERO ADS</span>
        <span>•</span>
        <span>100% OFFLINE</span>
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
