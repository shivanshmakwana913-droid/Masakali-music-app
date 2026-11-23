import React, { useState } from 'react';

/**
 * High-precision vector silhouette of the Masakali Dove + Musical Note emblem
 * Rendered as an exact fallback if /logo.png is ever missing or blocked.
 */
export function MasakaliLogoSvg({ className = "w-full h-full", ...props }) {
  return (
    <svg 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      {...props}
    >
      {/* Pure Black Pitch Background */}
      <rect width="100" height="100" fill="#050507" rx="22" />
      
      {/* Minimalist White Dove fused with Musical Note */}
      <path
        d="M 27 32 
           C 25 32, 24 33, 27 34
           C 29 35, 30 38, 30 42
           C 30 49, 34 57, 40 62
           C 38 61, 35 61, 32 63
           C 27 66, 24 72, 26 77
           C 29 82, 36 84, 42 81
           C 46 78, 48 73, 46 67
           L 46 45
           C 46 41, 50 37, 56 34
           C 62 31, 70 26, 76 21
           C 74 27, 68 36, 60 43
           C 65 42, 70 41, 73 39
           C 67 47, 58 53, 50 54
           C 51 57, 54 62, 59 66
           C 61 68, 63 70, 63 70
           C 60 67, 55 62, 51 61
           C 48 61, 46 62, 45 64
           L 44 47
           C 41 39, 36 33, 31 29
           C 29 27, 28 26, 27 28
           C 26 29, 26 31, 27 32 Z"
        fill="#FFFFFF"
      />
      {/* Dove Eye Cutout */}
      <circle cx="32" cy="28" r="2.2" fill="#050507" />
    </svg>
  );
}

/**
 * Universal Masakali App Logo Component with Image + Crisp SVG Fallback
 */
export default function MasakaliLogo({ 
  className = "w-8 h-8 rounded-xl object-cover", 
  fallbackClassName = "w-8 h-8 rounded-xl", 
  alt = "Masakali" 
}) {
  const [hasError, setHasError] = useState(false);

  if (hasError) {
    return (
      <div className={`${fallbackClassName} bg-black flex items-center justify-center overflow-hidden shrink-0 border border-white/10 shadow-md`}>
        <MasakaliLogoSvg className="w-full h-full" />
      </div>
    );
  }

  return (
    <img
      src="/logo.png"
      alt={alt}
      onError={() => setHasError(true)}
      className={`${className} shrink-0 bg-black border border-white/10 shadow-md`}
    />
  );
}
