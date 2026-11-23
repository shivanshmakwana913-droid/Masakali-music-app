// AS Music - Zero-Dependency Album Art Dominant Color & Ambient Glow Extractor
// Samples dominant colors from cover art to create SimpMusic-style ambient backdrops

const colorCache = new Map();

/**
 * Generate a deterministic rich aesthetic fallback palette based on track title/artist
 */
function getDeterministicPalette(str = '') {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }

  const palettes = [
    { primary: 'rgba(6, 182, 212, 0.22)', secondary: 'rgba(139, 92, 246, 0.18)', hex: '#06B6D4' }, // Cyan & Violet
    { primary: 'rgba(236, 72, 153, 0.20)', secondary: 'rgba(99, 102, 241, 0.18)', hex: '#EC4899' }, // Pink & Indigo
    { primary: 'rgba(16, 185, 129, 0.20)', secondary: 'rgba(6, 182, 212, 0.18)', hex: '#10B981' }, // Emerald & Cyan
    { primary: 'rgba(245, 158, 11, 0.20)', secondary: 'rgba(239, 68, 68, 0.18)', hex: '#F59E0B' }, // Amber & Rose
    { primary: 'rgba(139, 92, 246, 0.22)', secondary: 'rgba(59, 130, 246, 0.18)', hex: '#8B5CF6' }, // Violet & Blue
  ];

  const index = Math.abs(hash) % palettes.length;
  return palettes[index];
}

/**
 * Extracts dominant glow colors from an image URL using a 4x4 canvas sample
 */
export function extractCoverGlowColor(imageUrl, trackName = '') {
  if (!imageUrl) return getDeterministicPalette(trackName);
  if (colorCache.has(imageUrl)) return colorCache.get(imageUrl);

  // Return deterministic fallback first, then try sampling asynchronously
  const fallback = getDeterministicPalette(trackName);
  colorCache.set(imageUrl, fallback);

  try {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        canvas.width = 4;
        canvas.height = 4;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, 4, 4);
        const data = ctx.getImageData(0, 0, 4, 4).data;

        let r = 0, g = 0, b = 0, count = 0;
        for (let i = 0; i < data.length; i += 4) {
          // Filter out very dark or washed out white pixels
          const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
          if (brightness > 25 && brightness < 235) {
            r += data[i];
            g += data[i + 1];
            b += data[i + 2];
            count++;
          }
        }

        if (count > 0) {
          r = Math.round(r / count);
          g = Math.round(g / count);
          b = Math.round(b / count);

          const primary = `rgba(${r}, ${g}, ${b}, 0.28)`;
          const secondary = `rgba(${Math.min(255, r + 40)}, ${Math.max(0, g - 20)}, ${Math.min(255, b + 60)}, 0.18)`;
          const hex = `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;

          colorCache.set(imageUrl, { primary, secondary, hex });
        }
      } catch (err) {
        // Silent catch for CORS image restriction, fallback remains active
      }
    };
  } catch (e) {}

  return fallback;
}
