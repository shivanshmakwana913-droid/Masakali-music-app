// AS Music - Music & Lyrics API Service
// Connects to local Express backend (/api/search, /api/trending, /api/related, /api/lyrics) with zero-failure fallback to mockTracks

import { mockTracks } from '../data/mockTracks';

// Dynamic API_BASE resolution:
// Connects to Render backend (https://masakali-music-app.onrender.com/api) when running on Vercel,
// or http://localhost:5000/api during local development.
const getApiBase = () => {
  if (import.meta.env.VITE_API_BASE) {
    return import.meta.env.VITE_API_BASE.replace(/\/+$/, '');
  }
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    if (host === 'localhost' || host === '127.0.0.1') {
      return 'http://localhost:5000/api';
    }
    if (host.includes('onrender.com')) {
      return '/api';
    }
    // Remote client deployment (e.g. https://masakalimusicapp.vercel.app/)
    return 'https://masakali-music-app.onrender.com/api';
  }
  return 'http://localhost:5000/api';
};

export const API_BASE = getApiBase();

// Soft-blurred, dreamy monochrome/frosted Masakali Dove + Musical Note cover art fallback (zero network overhead, 0ms load, zero grey ... boxes)
export const FALLBACK_COVER_SVG = 'data:image/svg+xml;utf8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400" width="400" height="400">
  <defs>
    <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="9" result="blur" />
      <feMerge>
        <feMergeNode in="blur" />
        <feMergeNode in="SourceGraphic" />
      </feMerge>
    </filter>
    <radialGradient id="cardBg" cx="50%" cy="45%" r="65%">
      <stop offset="0%" stop-color="#141420" />
      <stop offset="55%" stop-color="#09090D" />
      <stop offset="100%" stop-color="#050507" />
    </radialGradient>
    <radialGradient id="ambientCyan" cx="30%" cy="30%" r="50%">
      <stop offset="0%" stop-color="#06B6D4" stop-opacity="0.22" />
      <stop offset="100%" stop-color="#050507" stop-opacity="0" />
    </radialGradient>
    <radialGradient id="ambientViolet" cx="70%" cy="70%" r="50%">
      <stop offset="0%" stop-color="#8B5CF6" stop-opacity="0.18" />
      <stop offset="100%" stop-color="#050507" stop-opacity="0" />
    </radialGradient>
  </defs>
  <rect width="400" height="400" fill="url(#cardBg)" />
  <rect width="400" height="400" fill="url(#ambientCyan)" />
  <rect width="400" height="400" fill="url(#ambientViolet)" />
  <rect width="398" height="398" x="1" y="1" rx="20" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="2" />
  <g transform="translate(60, 60) scale(2.8)" opacity="0.45" filter="url(#softGlow)">
    <path d="M 27 32 C 25 32, 24 33, 27 34 C 29 35, 30 38, 30 42 C 30 49, 34 57, 40 62 C 38 61, 35 61, 32 63 C 27 66, 24 72, 26 77 C 29 82, 36 84, 42 81 C 46 78, 48 73, 46 67 L 46 45 C 46 41, 50 37, 56 34 C 62 31, 70 26, 76 21 C 74 27, 68 36, 60 43 C 65 42, 70 41, 73 39 C 67 47, 58 53, 50 54 C 51 57, 54 62, 59 66 C 61 68, 63 70, 63 70 C 60 67, 55 62, 51 61 C 48 61, 46 62, 45 64 L 44 47 C 41 39, 36 33, 31 29 C 29 27, 28 26, 27 28 C 26 29, 26 31, 27 32 Z" fill="#FFFFFF" />
    <circle cx="32" cy="28" r="2.2" fill="#050507" />
  </g>
  <g transform="translate(135, 130) scale(1.3)" opacity="0.95">
    <path d="M 27 32 C 25 32, 24 33, 27 34 C 29 35, 30 38, 30 42 C 30 49, 34 57, 40 62 C 38 61, 35 61, 32 63 C 27 66, 24 72, 26 77 C 29 82, 36 84, 42 81 C 46 78, 48 73, 46 67 L 46 45 C 46 41, 50 37, 56 34 C 62 31, 70 26, 76 21 C 74 27, 68 36, 60 43 C 65 42, 70 41, 73 39 C 67 47, 58 53, 50 54 C 51 57, 54 62, 59 66 C 61 68, 63 70, 63 70 C 60 67, 55 62, 51 61 C 48 61, 46 62, 45 64 L 44 47 C 41 39, 36 33, 31 29 C 29 27, 28 26, 27 28 C 26 29, 26 31, 27 32 Z" fill="#FFFFFF" />
    <circle cx="32" cy="28" r="2.2" fill="#050507" />
  </g>
  <text x="200" y="325" text-anchor="middle" font-family="-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif" font-weight="700" font-size="14" fill="rgba(255,255,255,0.45)" letter-spacing="4">MASAKALI</text>
</svg>`);

/**
 * Upgrade low-resolution YouTube / YouTube Music / Google CDN thumbnails to crisp 544x544 HD
 * Avoids maxresdefault.jpg which causes 404 console errors on YouTube Music tracks
 */
export function getHighResThumbnail(url, videoId) {
  if (!url && !videoId) {
    return '/logo.png';
  }

  // Only valid 11-char YouTube video IDs should ever query ytimg.com
  const isValidYouTubeId = typeof videoId === 'string' && /^[a-zA-Z0-9_-]{11}$/.test(videoId);

  if (!url && isValidYouTubeId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }
  if (!url) {
    return '/logo.png';
  }

  let u = String(url).trim();

  // If URL points to ytimg with non-youtube ID (e.g. track-1), return /logo.png
  if (u.includes('ytimg.com/vi/track-')) {
    return '/logo.png';
  }

  // 1. Google user content & ggpht thumbnails (YouTube Music HD square covers)
  // Rewrite size parameter to =w544-h544-l90-rj which always exists on Google CDN and is crisp HD
  if (u.includes('googleusercontent.com') || u.includes('ggpht.com')) {
    if (/=w\d+-h\d+/i.test(u)) {
      return u.replace(/=w\d+-h\d+[^?#]*/i, '=w544-h544-l90-rj');
    }
    if (/=s\d+/i.test(u)) {
      return u.replace(/=s\d+[^?#]*/i, '=w544-h544-l90-rj');
    }
    return u.includes('?') ? `${u}&size=w544-h544-l90-rj` : `${u}=w544-h544-l90-rj`;
  }

  // 2. ytimg.com thumbnails: use hqdefault.jpg directly (never maxresdefault.jpg to avoid 404s)
  if (u.includes('ytimg.com')) {
    return u.replace(/\/(default|mqdefault|maxresdefault|sddefault)\.jpg/i, '/hqdefault.jpg');
  }

  // 3. Fallback: only if valid 11-char YouTube ID and URL is too short/generic
  if (isValidYouTubeId && u.length < 15) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  // 4. JioSaavn HD thumbnail upgrade: upgrade 150x150 or 50x50 to 500x500 HD
  if (u.includes('saavncdn.com')) {
    return u.replace(/(150x150|50x50)\.jpg/i, '500x500.jpg');
  }

  // 5. Unsplash HD upgrade: ensure minimum 800px width
  if (u.includes('unsplash.com')) {
    return u.replace(/w=\d+/, 'w=800');
  }

  return u;
}

/**
 * Robust image error handler to prevent broken images and 404s:
 * Falls back immediately to the zero-overhead SVG music note placeholder
 */
export function handleCoverImageError(e) {
  const img = e.currentTarget || e.target;
  if (!img) return;
  img.onerror = null;
  img.src = '/logo.png';
  img.className = 'w-full h-full object-contain p-2 bg-gradient-to-tr from-[#050507] via-[#0B0B14] to-[#050507] drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]';
}

/**
 * Check if the real streaming backend server is running
 */
export async function checkBackendStatus() {
  try {
    const res = await fetch(`${API_BASE}/health`, { signal: AbortSignal.timeout(1500) });
    if (res.ok) {
      const data = await res.json();
      return { online: true, engine: data.engine };
    }
    return { online: false };
  } catch {
    return { online: false };
  }
}

/**
 * Search real tracks via YouTube Music backend, falling back to mockTracks on error or offline
 */
export async function searchMusic(query) {
  if (!query || !query.trim()) {
    return { tracks: mockTracks, correctedQuery: null, isRealBackend: false };
  }

  try {
    const res = await fetch(`${API_BASE}/search?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(6000)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        return { 
          tracks: data.tracks.map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) })), 
          correctedQuery: data.correctedQuery || null, 
          isRealBackend: true 
        };
      }
    }
  } catch (err) {
    console.info('Backend search unavailable, searching local catalog:', err.message);
  }

  // Fallback: search local mock catalog
  const q = query.toLowerCase();
  const filtered = mockTracks.filter((t) => 
    t.title.toLowerCase().includes(q) ||
    t.artist.toLowerCase().includes(q) ||
    t.album.toLowerCase().includes(q) ||
    t.genre.toLowerCase().includes(q) ||
    (t.tags && t.tags.some(tag => tag.toLowerCase().includes(q)))
  ).map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) }));

  return { tracks: filtered.length > 0 ? filtered : mockTracks.map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) })), correctedQuery: null, isRealBackend: false };
}

/**
 * Fetch smart typo & Hinglish search suggestions
 */
export async function fetchSearchSuggestions(query) {
  if (!query || !query.trim() || query.trim().length < 2) {
    return [];
  }

  try {
    const res = await fetch(`${API_BASE}/suggest?q=${encodeURIComponent(query)}`, {
      signal: AbortSignal.timeout(2500)
    });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.suggestions)) {
        return data.suggestions;
      }
    }
  } catch (_) {}

  return [];
}

/**
 * Fetch top trending songs from backend
 */
export async function fetchTrendingMusic() {
  try {
    const res = await fetch(`${API_BASE}/trending`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        return data.tracks.map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) }));
      }
    }
  } catch (err) {
    console.info('Backend trending unavailable, using mock tracks:', err.message);
  }
  return mockTracks.map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) }));
}

/**
 * Fetch smart related tracks for continuous auto-play
 */
export async function fetchRelatedTracks(videoId, title, artist) {
  try {
    const params = new URLSearchParams();
    if (videoId) params.append('videoId', videoId);
    if (title) params.append('title', title);
    if (artist) params.append('artist', artist);

    const res = await fetch(`${API_BASE}/related?${params.toString()}`, { signal: AbortSignal.timeout(4000) });
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.tracks) && data.tracks.length > 0) {
        return data.tracks.map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) }));
      }
    }
  } catch (err) {
    console.info('Backend related tracks unavailable:', err.message);
  }

  // Fallback: pick other mock tracks
  return mockTracks.filter(t => t.id !== videoId).map(t => ({ ...t, cover: getHighResThumbnail(t.cover, t.id) }));
}

// Client-side in-memory cache for instant 0ms lyric lookups
const clientLyricsCache = new Map();

/**
 * Fetch real time-synced LRC lyrics via backend LRCLIB bridge with YouTube Captions fallback
 * Cached in-memory and localStorage for instant 0ms reopening
 */
export async function fetchLyrics(trackTitle, artist, duration = 0, trackId = null, forceRefresh = false, videoId = null) {
  if (!trackTitle) return null;

  const vid = videoId || (trackId && !trackId.startsWith('track-') ? trackId : null);
  const cacheKey = (trackId || `${trackTitle}___${artist || ''}`).toLowerCase().trim();

  // 1. Check in-memory cache first (unless forceRefresh)
  if (!forceRefresh && clientLyricsCache.has(cacheKey)) {
    return clientLyricsCache.get(cacheKey);
  }

  // 2. Check localStorage cache next (unless forceRefresh)
  if (!forceRefresh) {
    try {
      const storageKey = `as_music_lyrics_${cacheKey}`;
      const cachedItem = localStorage.getItem(storageKey);
      if (cachedItem) {
        const parsed = JSON.parse(cachedItem);
        if (parsed && Array.isArray(parsed.lyrics) && parsed.lyrics.length > 0) {
          clientLyricsCache.set(cacheKey, parsed);
          return parsed;
        }
      }
    } catch (_) {}
  }

  // 3. Fetch from backend with 4500ms abort timeout
  try {
    let url = `${API_BASE}/lyrics?track=${encodeURIComponent(trackTitle)}&artist=${encodeURIComponent(artist || '')}&duration=${duration}`;
    if (vid) {
      url += `&videoId=${encodeURIComponent(vid)}`;
    }

    const res = await fetch(url, { signal: AbortSignal.timeout(4500) });

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data.lyrics) && data.lyrics.length > 0) {
        const result = {
          lyrics: data.lyrics,
          isSynced: Boolean(data.synced),
          source: data.source || 'LRCLIB'
        };

        // Cache in memory
        clientLyricsCache.set(cacheKey, result);

        // Cache in localStorage under trackId and title-artist
        try {
          localStorage.setItem(`as_music_lyrics_${cacheKey}`, JSON.stringify(result));
          if (trackId && trackId !== cacheKey) {
            localStorage.setItem(`as_music_lyrics_${trackId}`, JSON.stringify(result));
          }
        } catch (_) {}

        return result;
      }
    }
  } catch (err) {
    console.info('Backend lyrics fetch unavailable, using embedded track lyrics:', err.message);
  }

  return null;
}

/**
 * Pre-warm the next track's direct stream URL in server RAM for instant <1s startup
 */
export async function warmTrack(videoId) {
  if (!videoId || videoId.startsWith('track-') || videoId.startsWith('local-')) return;
  try {
    fetch(`${API_BASE}/warm/${encodeURIComponent(videoId)}`, {
      headers: { 'Accept': 'application/json' },
      signal: AbortSignal.timeout(3500)
    }).catch(() => {});
  } catch (_) {}
}
