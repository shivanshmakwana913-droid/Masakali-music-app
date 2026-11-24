import React, { useState, useEffect, useRef } from 'react';
import { 
  X, Camera, Download, Share2, Sparkles, Check, 
  Layers, Palette, Music, Image as ImageIcon, RefreshCw 
} from 'lucide-react';
import { getHighResThumbnail, FALLBACK_COVER_SVG } from '../../services/musicApi';

const THEMES = [
  { id: 'neon', name: 'OLED Dark Neon', desc: 'Deep black with cyan & violet glow' },
  { id: 'blurred', name: 'Blurred Artwork', desc: 'Atmospheric cover art background' },
  { id: 'frosted', name: 'Frosted Glass', desc: 'Minimalist dark glassmorphism' }
];

export default function LyricStatusCardModal({
  isOpen,
  onClose,
  track,
  lyrics = [],
  initialLineIndex = -1,
  showToast
}) {
  const [selectedIndices, setSelectedIndices] = useState([]);
  const [theme, setTheme] = useState('neon');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const canvasRef = useRef(null);

  // Initialize selected lines on open
  useEffect(() => {
    if (!isOpen || !lyrics.length) return;
    const startIndex = initialLineIndex >= 0 ? initialLineIndex : 0;
    const initial = [];
    for (let i = startIndex; i < Math.min(startIndex + 2, lyrics.length); i++) {
      initial.push(i);
    }
    setSelectedIndices(initial);
    setTheme('neon');
  }, [isOpen, initialLineIndex, lyrics]);

  // Toggle selection of a lyric line (max 4 lines)
  const toggleLyricLine = (index) => {
    setSelectedIndices((prev) => {
      if (prev.includes(index)) {
        if (prev.length === 1) return prev; // keep at least 1
        return prev.filter((i) => i !== index);
      }
      if (prev.length >= 4) {
        showToast('Max 4 lines for story cards');
        return prev;
      }
      return [...prev, index].sort((a, b) => a - b);
    });
  };

  // Render 1080x1920 (9:16) Canvas whenever theme, track, or selected lines change
  useEffect(() => {
    if (!isOpen || !track || !canvasRef.current || !lyrics.length || !selectedIndices.length) return;

    let isCancelled = false;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const width = 1080;
    const height = 1920;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    const logoImg = new Image();
    let loadedCount = 0;

    const tryRender = () => {
      loadedCount++;
      if (loadedCount >= 2) {
        drawCard();
      }
    };

    img.crossOrigin = 'anonymous';
    img.src = getHighResThumbnail(track.cover, track.id);
    img.onload = tryRender;
    img.onerror = () => {
      if (img.src !== FALLBACK_COVER_SVG) {
        img.removeAttribute('crossorigin');
        img.src = FALLBACK_COVER_SVG;
        img.onload = tryRender;
      } else {
        tryRender();
      }
    };

    logoImg.src = '/logo.png';
    logoImg.onload = tryRender;
    logoImg.onerror = tryRender;

    const drawCard = () => {
      if (isCancelled) return;

      // 1. Draw Background based on Theme
      if (theme === 'neon') {
        // OLED Pitch Black with neon cyan and violet gradients
        ctx.fillStyle = '#050507';
        ctx.fillRect(0, 0, width, height);

        // Top cyan radial glow
        const topGlow = ctx.createRadialGradient(200, 200, 20, 200, 200, 700);
        topGlow.addColorStop(0, 'rgba(6, 182, 212, 0.28)');
        topGlow.addColorStop(1, 'rgba(5, 5, 7, 0)');
        ctx.fillStyle = topGlow;
        ctx.fillRect(0, 0, width, height);

        // Bottom violet radial glow
        const botGlow = ctx.createRadialGradient(880, 1600, 20, 880, 1600, 800);
        botGlow.addColorStop(0, 'rgba(139, 92, 246, 0.25)');
        botGlow.addColorStop(1, 'rgba(5, 5, 7, 0)');
        ctx.fillStyle = botGlow;
        ctx.fillRect(0, 0, width, height);

        // Neon border container
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 3;
        ctx.strokeRect(60, 60, width - 120, height - 120);
      } else if (theme === 'blurred') {
        // Blurred Album Cover Art Background
        ctx.save();
        ctx.filter = 'blur(60px) brightness(0.35)';
        ctx.drawImage(img, -80, -80, width + 160, height + 160);
        ctx.restore();

        // Dark gradient overlay
        const darkGrad = ctx.createLinearGradient(0, 0, 0, height);
        darkGrad.addColorStop(0, 'rgba(5, 5, 7, 0.4)');
        darkGrad.addColorStop(0.5, 'rgba(5, 5, 7, 0.7)');
        darkGrad.addColorStop(1, 'rgba(5, 5, 7, 0.95)');
        ctx.fillStyle = darkGrad;
        ctx.fillRect(0, 0, width, height);
      } else {
        // Frosted Glass Dark Minimalist
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0B0B14');
        bgGrad.addColorStop(0.5, '#12121E');
        bgGrad.addColorStop(1, '#08080E');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Subtle decorative circles
        ctx.fillStyle = 'rgba(6, 182, 212, 0.12)';
        ctx.beginPath();
        ctx.arc(880, 360, 300, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = 'rgba(139, 92, 246, 0.12)';
        ctx.beginPath();
        ctx.arc(200, 1500, 350, 0, Math.PI * 2);
        ctx.fill();
      }

      // 2. Draw Album Artwork with rounded corners & shadow
      const artSize = 480;
      const artX = (width - artSize) / 2;
      const artY = 280;
      const radius = 40;

      ctx.save();
      ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
      ctx.shadowBlur = 40;
      ctx.shadowOffsetY = 20;

      // Rounded rect clip path
      ctx.beginPath();
      ctx.moveTo(artX + radius, artY);
      ctx.lineTo(artX + artSize - radius, artY);
      ctx.quadraticCurveTo(artX + artSize, artY, artX + artSize, artY + radius);
      ctx.lineTo(artX + artSize, artY + artSize - radius);
      ctx.quadraticCurveTo(artX + artSize, artY + artSize, artX + artSize - radius, artY + artSize);
      ctx.lineTo(artX + radius, artY + artSize);
      ctx.quadraticCurveTo(artX, artY + artSize, artX, artY + artSize - radius);
      ctx.lineTo(artX, artY + radius);
      ctx.quadraticCurveTo(artX, artY, artX + radius, artY);
      ctx.closePath();
      ctx.clip();

      ctx.drawImage(img, artX, artY, artSize, artSize);
      ctx.restore();

      // Border around artwork
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
      ctx.lineWidth = 4;
      ctx.stroke();

      // 3. Track Title & Artist Text
      ctx.textAlign = 'center';

      // Song Title
      ctx.font = 'bold 50px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.8)';
      ctx.shadowBlur = 10;
      const displayTitle = track.title.length > 28 ? track.title.slice(0, 28) + '...' : track.title;
      ctx.fillText(displayTitle, width / 2, 850);

      // Artist Name
      ctx.font = '500 34px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#A1A1AA';
      ctx.fillText(track.artist, width / 2, 905);

      // 4. Quotation Mark Icon
      ctx.font = 'bold 80px serif';
      ctx.fillStyle = 'rgba(6, 182, 212, 0.7)';
      ctx.fillText('“', width / 2, 1020);

      // 5. Selected Lyric Lines
      const selectedLines = selectedIndices.map((i) => lyrics[i]?.text || '').filter(Boolean);
      ctx.font = 'bold 44px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#FFFFFF';
      ctx.shadowColor = 'rgba(6, 182, 212, 0.6)';
      ctx.shadowBlur = 20;

      let currentY = 1100;
      const lineHeight = 75;

      selectedLines.forEach((line) => {
        // Text wrapping for long lines
        const words = line.split(' ');
        let currentLine = '';

        for (let n = 0; n < words.length; n++) {
          const testLine = currentLine + words[n] + ' ';
          const metrics = ctx.measureText(testLine);
          if (metrics.width > 860 && n > 0) {
            ctx.fillText(currentLine.trim(), width / 2, currentY);
            currentLine = words[n] + ' ';
            currentY += lineHeight;
          } else {
            currentLine = testLine;
          }
        }
        ctx.fillText(currentLine.trim(), width / 2, currentY);
        currentY += lineHeight + 20;
      });

      // 6. Bottom Branding Watermark Badge with Masakali Logo
      ctx.shadowBlur = 0;
      const badgeY = 1750;
      const badgeWidth = 430;
      const badgeHeight = 64;
      const badgeX = (width - badgeWidth) / 2;

      ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
      ctx.strokeStyle = 'rgba(6, 182, 212, 0.35)';
      ctx.lineWidth = 2;

      ctx.beginPath();
      ctx.roundRect(badgeX, badgeY, badgeWidth, badgeHeight, 32);
      ctx.fill();
      ctx.stroke();

      // Draw small Masakali logo badge next to "Made with Masakali"
      const logoSize = 42;
      const logoX = badgeX + 32;
      const logoY = badgeY + (badgeHeight - logoSize) / 2;

      if (logoImg && logoImg.naturalWidth > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.roundRect(logoX, logoY, logoSize, logoSize, 12);
        ctx.clip();
        ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
        ctx.restore();
      }

      ctx.font = 'bold 24px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
      ctx.fillStyle = '#22D3EE';
      ctx.textAlign = 'left';
      ctx.fillText('Made with Masakali', logoX + logoSize + 16, badgeY + 41);

      // Export preview data URL
      setPreviewUrl(canvas.toDataURL('image/png'));
    };

    return () => {
      isCancelled = true;
    };
  }, [isOpen, track, theme, selectedIndices, lyrics]);

  if (!isOpen || !track) return null;

  // Download Story Image
  const handleDownloadImage = () => {
    if (!previewUrl) return;
    const a = document.createElement('a');
    a.href = previewUrl;
    a.download = `Masakali-Story-${(track.title || 'Lyrics').replace(/[^a-zA-Z0-9_-]/g, '_')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast('Story card downloaded in 1080x1920 HD!');
  };

  // Share Image via Web Share API
  const handleShareStory = async () => {
    if (!canvasRef.current) return;
    setIsGenerating(true);

    try {
      canvasRef.current.toBlob(async (blob) => {
        if (!blob) return;
        const file = new File([blob], `${track.title}-lyrics.png`, { type: 'image/png' });

        if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
          try {
            await navigator.share({
              files: [file],
              title: `${track.title} - ${track.artist}`,
              text: `Check out these lyrics from "${track.title}" • Made with Masakali 🕊️`
            });
            showToast('Story shared!');
            onClose();
            return;
          } catch (err) {
            if (err.name === 'AbortError') return;
          }
        }

        // Fallback: download image
        handleDownloadImage();
      }, 'image/png');
    } catch {
      handleDownloadImage();
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-200 select-none">
      
      {/* Backdrop */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Hidden Render Canvas */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Main Dialog */}
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-[#0E0E14] border border-white/10 rounded-3xl p-5 sm:p-6 shadow-2xl z-10 flex flex-col md:flex-row gap-6 overflow-hidden text-white">
        
        {/* Left Side: Live Phone Preview (9:16 Aspect Ratio) */}
        <div className="w-full md:w-5/12 flex flex-col items-center justify-center">
          <div className="relative w-56 sm:w-64 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10 bg-black">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Story Preview"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500">
                <RefreshCw className="w-5 h-5 animate-spin" />
              </div>
            )}
            <div className="absolute top-2 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-black/50 text-[9px] font-mono text-zinc-400 backdrop-blur-md">
              1080 × 1920 Story
            </div>
          </div>
        </div>

        {/* Right Side: Theme & Lyrics Line Selector */}
        <div className="w-full md:w-7/12 flex flex-col justify-between overflow-y-auto space-y-5">
          
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                <Camera className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <span>Lyric Story Card</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-300 border border-violet-500/30">
                    INSTA / WHATSAPP
                  </span>
                </h3>
                <p className="text-xs text-zinc-400 truncate max-w-[260px]">
                  {track.title} • {track.artist}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Theme Selector */}
          <div className="space-y-2">
            <span className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5" />
              <span>Choose Story Theme:</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => setTheme(th.id)}
                  className={`p-2.5 rounded-2xl border text-left transition-all ${
                    theme === th.id
                      ? 'bg-white text-black border-white font-bold shadow-sm'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white'
                  }`}
                >
                  <p className="text-xs font-bold truncate">{th.name}</p>
                  <p className="text-[10px] opacity-70 truncate mt-0.5">{th.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Lyric Line Selector (Select 1 to 4 lines) */}
          <div className="space-y-2 flex-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-zinc-300 font-semibold flex items-center gap-1.5">
                <Music className="w-3.5 h-3.5" />
                <span>Select Lines ({selectedIndices.length}/4):</span>
              </span>
              <span className="text-[10px] text-zinc-500">Tap to toggle</span>
            </div>

            <div className="max-h-52 overflow-y-auto space-y-1.5 p-1 rounded-2xl bg-zinc-900/60 border border-zinc-800">
              {lyrics.length === 0 ? (
                <div className="p-6 text-center text-xs text-zinc-500">
                  No lyrics available to select.
                </div>
              ) : (
                lyrics.map((line, idx) => {
                  const isSelected = selectedIndices.includes(idx);
                  return (
                    <div
                      key={idx}
                      onClick={() => toggleLyricLine(idx)}
                      className={`p-2.5 rounded-xl cursor-pointer text-xs font-medium transition-all flex items-center justify-between gap-2 ${
                        isSelected
                          ? 'bg-zinc-800 border border-zinc-700 text-white font-bold'
                          : 'hover:bg-zinc-900 text-zinc-400'
                      }`}
                    >
                      <span className="truncate">{line.text}</span>
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                        isSelected ? 'bg-white border-white text-black' : 'border-zinc-700'
                      }`}>
                        {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Download & Share Action Buttons */}
          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleDownloadImage}
              className="flex-1 py-3 px-4 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-white font-semibold text-xs flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <Download className="w-4 h-4" />
              <span>Download Story (HD)</span>
            </button>

            <button
              onClick={handleShareStory}
              disabled={isGenerating}
              className="flex-1 py-3 px-4 rounded-2xl bg-white hover:bg-zinc-200 text-black font-bold text-xs flex items-center justify-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
            >
              <Share2 className="w-4 h-4" />
              <span>Share to Stories</span>
            </button>
          </div>

        </div>

      </div>
    </div>
  );
}
