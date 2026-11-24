import express from 'express';
import cors from 'cors';
import dns from 'node:dns';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { Readable } from 'node:stream';
import { Innertube, UniversalCache } from 'youtubei.js';
import { Ytdl } from '@distube/ytdl-core';

// Resolve static dist directory for unified standalone 24/7 serving
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.resolve(__dirname, '../dist');

// Force IPv4 lookup first to prevent connect timeout errors on Windows
try {
  dns.setDefaultResultOrder('ipv4first');
} catch (_) {}

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize Ytdl client for robust, zero-cipher audio streaming
const ytdl = new Ytdl();

// In-memory cache for direct audio stream URLs (2-hour TTL) for instant 0ms seeks and replays
const streamUrlCache = new Map();
const STREAM_CACHE_TTL = 2 * 60 * 60 * 1000; // 2 hours in ms

// In-memory cache for lyrics to enable instant 0ms responses
const lyricsMemoryCache = new Map();

// Blocked keywords regex to eliminate full movies, trailers, teasers, episodes, and jukeboxes
const BLOCKED_KEYWORDS_REGEX = /\b(full\s*movie|trailer|teaser|episode|jukebox|movie\s*scene)\b/i;

/**
 * Fetch YouTube built-in Captions / TimedText or YouTube Music lyrics as a high-fidelity fallback
 */
async function fetchYouTubeTranscript(videoId, client, estDuration) {
  if (!videoId || !client) return null;
  try {
    const info = await client.getInfo(videoId);
    const captionTracks = info.captions?.caption_tracks || [];

    if (captionTracks.length > 0) {
      // Preferred language order: Hindi / Hindi-Latin -> English -> first available
      const preferredTrack = captionTracks.find(t => t.language_code === 'hi' || t.language_code === 'hi-Latn') ||
                             captionTracks.find(t => t.language_code?.startsWith('en')) ||
                             captionTracks[0];

      if (preferredTrack?.base_url) {
        const jsonUrl = preferredTrack.base_url + '&fmt=json3';
        const capRes = await fetch(jsonUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          signal: AbortSignal.timeout(3500)
        });

        if (capRes.ok) {
          const data = await capRes.json();
          if (Array.isArray(data.events)) {
            const parsed = data.events
              .filter(ev => ev.segs && ev.segs.some(s => s.utf8 && s.utf8.trim()))
              .map(ev => ({
                time: parseFloat((ev.tStartMs / 1000).toFixed(2)),
                text: ev.segs.map(s => s.utf8).join('').replace(/\n/g, ' ').trim()
              }))
              .filter(p => p.text.length > 0);

            if (parsed.length > 0) {
              return {
                synced: true,
                source: `YouTube Captions (${preferredTrack.name?.text || preferredTrack.language_code})`,
                lyrics: parsed
              };
            }
          }
        }
      }
    }

    // Check official YouTube Music lyrics via client.music.getLyrics(videoId)
    if (client.music && typeof client.music.getLyrics === 'function') {
      try {
        const mLyrics = await client.music.getLyrics(videoId);
        const rawText = mLyrics?.description?.text;
        if (rawText && rawText.trim().length > 0) {
          const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);
          const duration = estDuration > 0 ? estDuration : 180;
          const step = duration / (lines.length || 1);
          const parsed = lines.map((text, i) => ({
            time: parseFloat((i * step).toFixed(1)),
            text
          }));
          return {
            synced: false,
            source: 'YouTube Music (LyricFind)',
            lyrics: parsed
          };
        }
      } catch (_) {}
    }
  } catch (e) {
    console.warn(`YouTube transcript fallback error for ${videoId}:`, e.message);
  }
  return null;
}

/**
 * Robust track & artist sanitization helper
 * Strips YouTube clutter like (Official Video), [Full Song], | Pritam, - Topic, etc.
 */
function sanitizeTrackInfo(rawTitle, rawArtist) {
  let title = rawTitle ? String(rawTitle).trim() : '';
  let artist = rawArtist ? String(rawArtist).trim() : '';

  // 1. Clean artist string
  artist = artist.replace(/\s*-\s*Topic\b/gi, '')
                 .replace(/\bTopic\b/gi, '')
                 .replace(/\bOfficial\s*(Channel|Artist|Music)?\b/gi, '')
                 .replace(/\bVEVO\b/gi, '')
                 .trim();

  const isGenericArtist = !artist || /^(various artists|youtube stream|unknown|as music)$/i.test(artist);

  // 2. If artist is generic, check if title is formatted as "Artist - Title"
  if (isGenericArtist && title.includes(' - ')) {
    const parts = title.split(' - ');
    if (parts.length >= 2) {
      artist = parts[0].trim();
      title = parts.slice(1).join(' - ').trim();
    }
  }

  // 3. Remove pipes and extra credits after pipe: e.g. "Channa Mereya | Full Song | Ae Dil Hai Mushkil"
  if (title.includes('|')) {
    const segments = title.split('|').map(s => s.trim());
    title = segments[0];
    if (isGenericArtist && segments.length > 1) {
      const candidateArtist = segments.slice(1).find(s => !/(official|video|audio|full song|lyric|remix|hd|4k)/i.test(s));
      if (candidateArtist) artist = candidateArtist;
    }
  }

  // 4. Strip parentheses, square brackets, curly braces and their content
  title = title.replace(/\([^)]*\)/g, ' ');
  title = title.replace(/\[[^\]]*\]/g, ' ');
  title = title.replace(/\{[^}]*\)/g, ' ');

  // 5. Strip common clutter keywords
  title = title.replace(/\b(official\s*(music\s*)?video|official\s*audio|lyric\s*video|lyrical|full\s*song|audio|video|remix|slowed\s*reverb|slowed|hd|4k)\b/gi, ' ');

  // 6. Clean punctuation & collapse extra spaces
  title = title.replace(/[^\w\s\u0600-\u06FF\u0900-\u097F\u4e00-\u9fa5'-]/gi, ' ').replace(/\s+/g, ' ').trim();
  artist = artist.replace(/[^\w\s\u0600-\u06FF\u0900-\u097F\u4e00-\u9fa5'-]/gi, ' ').replace(/\s+/g, ' ').trim();

  return { title, artist };
}

// Enable full CORS & Media Streaming headers for Web Audio API & HTML5 Audio
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'OPTIONS'],
  allowedHeaders: ['Range', 'Accept-Ranges', 'Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length', 'Content-Type']
}));

app.use(express.json());

let yt = null;

// Initialize YouTube Innertube client singleton for search
async function getYouTubeClient() {
  if (!yt) {
    try {
      yt = await Innertube.create({
        cache: new UniversalCache(false),
        generate_session_locally: true
      });
      console.log('Innertube search client ready');
    } catch (err) {
      console.error('Innertube search initialization error:', err);
    }
  }
  return yt;
}

// Helper to format duration in seconds to "m:ss"
function formatDuration(seconds) {
  if (!seconds || isNaN(seconds)) return '3:00';
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

/**
 * Upgrade low-resolution YouTube / YouTube Music / Google CDN thumbnails to crisp 544x544 HD
 * Uses hqdefault.jpg to avoid 404 console errors caused by missing maxresdefault.jpg
 */
function getHighResThumbnail(url, videoId) {
  if (!url && !videoId) {
    return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
  }
  if (!url && videoId) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  let u = String(url).trim();

  // 1. Google user content & ggpht thumbnails (YouTube Music HD square covers)
  // Rewrite size parameter to =w544-h544-l90-rj which always exists on Google CDN
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

  // 3. Fallback: if videoId is given and URL is generic Unsplash placeholder
  if (videoId && (u.includes('unsplash.com') || u.length < 15)) {
    return `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
  }

  // 4. Unsplash HD upgrade: ensure minimum 800px width
  if (u.includes('unsplash.com')) {
    return u.replace(/w=\d+/, 'w=800');
  }

  return u;
}

// 1. Health & Status Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    engine: 'Masakali 🕊️ Real Music & Synced Lyrics Engine',
    port: PORT,
    timestamp: new Date().toISOString()
  });
});

// 2. Smart Search Suggestions & Typo / Hinglish Correction (/api/suggest)
app.get('/api/suggest', async (req, res) => {
  const query = req.query.q;
  if (!query || !query.trim()) {
    return res.json({ query: '', suggestions: [] });
  }

  try {
    const client = await getYouTubeClient();
    let suggestions = [];

    if (client && typeof client.getSearchSuggestions === 'function') {
      try {
        const results = await client.getSearchSuggestions(query);
        if (Array.isArray(results)) {
          suggestions = results.map(s => (typeof s === 'string' ? s : s.text || s.query)).filter(Boolean);
        }
      } catch (e) {
        console.warn('Innertube suggestions error:', e.message);
      }
    }

    // Google / YouTube suggestions fallback if innertube returned empty
    if (!suggestions || suggestions.length === 0) {
      try {
        const gUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
        const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(2000) });
        if (gRes.ok) {
          const gData = await gRes.json();
          if (Array.isArray(gData?.[1])) {
            suggestions = gData[1];
          }
        }
      } catch (_) {}
    }

    res.json({
      query,
      suggestions: suggestions.slice(0, 8)
    });
  } catch (error) {
    res.status(500).json({ error: 'Suggestions failed', details: error.message });
  }
});

// 3. Music-Only Search (YouTube Music yt.music.search with Strict Duration & Keyword Filtering)
app.get('/api/search', async (req, res) => {
  const query = req.query.q;
  if (!query || !query.trim()) {
    return res.status(400).json({ error: 'Search query parameter "q" is required' });
  }

  try {
    const client = await getYouTubeClient();
    if (!client) {
      return res.status(503).json({ error: 'Search engine not ready' });
    }

    const searchMusicTracks = async (searchQuery) => {
      let rawItems = [];

      // 1. Primary: YouTube Music Song Search (Music-only, no movies or trailers)
      if (client.music && typeof client.music.search === 'function') {
        try {
          const musicRes = await client.music.search(searchQuery, { type: 'song' });
          rawItems = musicRes.songs?.contents || musicRes.contents?.[0]?.contents || [];
        } catch (mErr) {
          console.warn('yt.music.search failed, will fallback:', mErr.message);
        }
      }

      // 2. Secondary fallback: YouTube Music broad search
      if ((!rawItems || rawItems.length === 0) && client.music) {
        try {
          const broadMusic = await client.music.search(searchQuery);
          rawItems = broadMusic.songs?.contents || broadMusic.contents?.[0]?.contents || [];
        } catch (_) {}
      }

      // 3. Tertiary fallback: regular YouTube search filtered to audio/songs
      if (!rawItems || rawItems.length === 0) {
        try {
          const genRes = await client.search(`${searchQuery} song`);
          rawItems = genRes.videos || genRes.results || [];
        } catch (_) {}
      }

      const results = [];
      for (const item of rawItems) {
        const videoId = item.id || item.video_id;
        if (!videoId) continue;

        const title = item.title?.text || (typeof item.title === 'string' ? item.title : 'Untitled Track');

        // Strict keyword filter: block full movie, trailer, teaser, episode, jukebox
        if (BLOCKED_KEYWORDS_REGEX.test(title)) continue;

        let durationSeconds = 180;
        let durationFormatted = '3:00';
        if (item.duration?.seconds) {
          durationSeconds = item.duration.seconds;
          durationFormatted = item.duration.text || formatDuration(durationSeconds);
        } else if (item.length_text?.text) {
          durationFormatted = item.length_text.text;
          const parts = durationFormatted.split(':').map(Number);
          if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
          if (parts.length === 3) durationSeconds = parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (typeof item.duration === 'string') {
          durationFormatted = item.duration;
          const parts = durationFormatted.split(':').map(Number);
          if (parts.length === 2) durationSeconds = parts[0] * 60 + parts[1];
        }

        // Strict duration filter: 30s to 720s (12 mins)
        if (durationSeconds < 30 || durationSeconds > 720) continue;

        let artist = 'Various Artists';
        if (Array.isArray(item.artists)) {
          artist = item.artists.map(a => a.name).filter(Boolean).join(', ');
        } else if (item.author?.name) {
          artist = item.author.name;
        } else if (typeof item.author === 'string') {
          artist = item.author;
        }

        let cover = 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
        if (Array.isArray(item.thumbnail)) {
          cover = item.thumbnail[item.thumbnail.length - 1]?.url || item.thumbnail[0]?.url || cover;
        } else if (item.thumbnails && item.thumbnails.length > 0) {
          cover = item.thumbnails[item.thumbnails.length - 1]?.url || item.thumbnails[0]?.url || cover;
        }
        cover = getHighResThumbnail(cover, videoId);

        const album = item.album?.name || 'YouTube Music';

        results.push({
          id: videoId,
          title,
          artist,
          album,
          duration: durationSeconds,
          durationFormatted,
          cover,
          audioUrl: `http://localhost:${PORT}/api/stream/${videoId}`,
          source: 'youtube',
          genre: 'Song',
          tags: ['Music', 'HQ Audio'],
          lyrics: []
        });
      }

      return results;
    };

    let tracks = await searchMusicTracks(query);
    let correctedQuery = null;

    // Smart typo fallback: if query returned 0 results, check suggestions and retry with top suggestion
    if (tracks.length === 0) {
      try {
        let suggestions = [];
        if (typeof client.getSearchSuggestions === 'function') {
          suggestions = await client.getSearchSuggestions(query);
        }
        if (!suggestions || suggestions.length === 0) {
          const gUrl = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
          const gRes = await fetch(gUrl, { signal: AbortSignal.timeout(2000) });
          if (gRes.ok) {
            const gData = await gRes.json();
            if (Array.isArray(gData?.[1])) suggestions = gData[1];
          }
        }

        if (Array.isArray(suggestions) && suggestions.length > 0) {
          const top = typeof suggestions[0] === 'string' ? suggestions[0] : (suggestions[0].text || suggestions[0].query);
          if (top && top.toLowerCase() !== query.toLowerCase()) {
            console.log(`Auto-correcting typo "${query}" -> "${top}"`);
            tracks = await searchMusicTracks(top);
            if (tracks.length > 0) {
              correctedQuery = top;
            }
          }
        }
      } catch (sugErr) {
        console.warn('Typo correction error:', sugErr.message);
      }
    }

    res.json({
      query,
      correctedQuery,
      count: tracks.length,
      tracks: tracks.slice(0, 25)
    });
  } catch (error) {
    console.error('Search error:', error);
    res.status(500).json({ error: 'Search failed', details: error.message });
  }
});

// 3. Trending Now endpoint (/api/trending)
app.get('/api/trending', async (req, res) => {
  try {
    const searchRes = await ytdl.search('top trending songs global hits');
    const items = searchRes?.items || searchRes || [];

    const tracks = items.slice(0, 16).map((item) => {
      const durationSeconds = item.lengthSeconds || 180;
      const durationFormatted = formatDuration(durationSeconds);
      const rawCover = item.thumbnails?.[item.thumbnails.length - 1]?.url || 
                       item.thumbnails?.[0]?.url || 
                       'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
      const cover = getHighResThumbnail(rawCover, item.id);

      return {
        id: item.id,
        title: item.title,
        artist: item.author?.name || 'Various Artists',
        album: 'Trending Now',
        duration: durationSeconds,
        durationFormatted,
        cover,
        audioUrl: `http://localhost:${PORT}/api/stream/${item.id}`,
        source: 'youtube',
        genre: 'Trending',
        tags: ['Trending', 'Top Hit'],
        lyrics: []
      };
    }).filter(t => t.id);

    res.json({
      count: tracks.length,
      tracks
    });
  } catch (error) {
    console.warn('Trending search error, fallback to general search:', error.message);
    try {
      const client = await getYouTubeClient();
      const searchRes = await client.search('trending music hits');
      const videoItems = searchRes.videos || searchRes.results || [];
      const tracks = videoItems.slice(0, 16).map((item) => {
        const videoId = item.id || item.video_id;
        const durationSeconds = item.duration?.seconds || 180;
        const rawCover = item.thumbnails?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
        const cover = getHighResThumbnail(rawCover, videoId);
        return {
          id: videoId,
          title: item.title?.text || item.title || 'Trending Song',
          artist: item.author?.name || 'Various Artists',
          album: 'Trending',
          duration: durationSeconds,
          durationFormatted: formatDuration(durationSeconds),
          cover,
          audioUrl: `http://localhost:${PORT}/api/stream/${videoId}`,
          source: 'youtube',
          genre: 'Trending',
          tags: ['Trending'],
          lyrics: []
        };
      }).filter(t => t.id);

      res.json({ count: tracks.length, tracks });
    } catch (fallbackErr) {
      res.status(500).json({ error: 'Failed to fetch trending', details: fallbackErr.message });
    }
  }
});

// 4. Smart Related Auto-Play endpoint (/api/related)
app.get('/api/related', async (req, res) => {
  const { videoId, title, artist } = req.query;

  if (!videoId && !title) {
    return res.status(400).json({ error: 'videoId or title query parameter is required' });
  }

  try {
    const client = await getYouTubeClient();
    let relatedItems = [];

    // 1. Primary: YouTube Music search for related / similar tracks
    if (client) {
      const q = artist ? `${artist} songs` : `${title} song`;
      if (client.music) {
        try {
          const mRes = await client.music.search(q, { type: 'song' });
          const mItems = mRes.songs?.contents || mRes.contents?.[0]?.contents || [];
          if (mItems.length > 0) {
            relatedItems = mItems.map(item => ({
              id: item.id || item.video_id,
              title: item.title?.text || item.title || 'Song',
              author: { name: (Array.isArray(item.artists) ? item.artists.map(a => a.name).join(', ') : item.author?.name) || artist || 'Various Artists' },
              lengthSeconds: item.duration?.seconds || 180,
              thumbnails: item.thumbnail || item.thumbnails || []
            }));
          }
        } catch (_) {}
      }

      // Secondary fallback: general search via Innertube
      if (!relatedItems || relatedItems.length === 0) {
        try {
          const sRes = await client.search(q);
          const sItems = sRes.videos || sRes.results || [];
          relatedItems = sItems.map(item => ({
            id: item.id || item.video_id,
            title: item.title?.text || item.title || 'Song',
            author: { name: item.author?.name || artist || 'Various Artists' },
            lengthSeconds: item.duration?.seconds || 180,
            thumbnails: item.thumbnails || []
          }));
        } catch (_) {}
      }
    }

    const tracks = relatedItems
      .filter((item) => item.id && item.id !== videoId)
      .slice(0, 15)
      .map((item) => {
        const durationSeconds = item.lengthSeconds || 180;
        const rawCover = item.thumbnails?.[item.thumbnails.length - 1]?.url ||
                      item.thumbnails?.[0]?.url ||
                      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800&auto=format&fit=crop&q=80';
        const cover = getHighResThumbnail(rawCover, item.id);

        return {
          id: item.id,
          title: item.title,
          artist: item.author?.name || artist || 'Various Artists',
          album: 'Smart Auto-Play',
          duration: durationSeconds,
          durationFormatted: formatDuration(durationSeconds),
          cover,
          audioUrl: `http://localhost:${PORT}/api/stream/${item.id}`,
          source: 'youtube',
          genre: 'Related Mix',
          tags: ['Smart Auto-Play', 'Related'],
          lyrics: []
        };
      });

    res.json({
      targetVideoId: videoId,
      count: tracks.length,
      tracks
    });
  } catch (error) {
    console.error('Related tracks error:', error.message);
    res.status(500).json({ error: 'Failed to fetch related tracks', details: error.message });
  }
});

// Fast-load format selector: prioritizes 128kbps Opus/M4A (~96-160kbps) for instant <1s startup
function pickFastAudioFormat(formats) {
  if (!formats || formats.length === 0) return null;

  // Filter to valid audio formats with direct playable URL
  const audioOnly = formats.filter(f => f.has_audio && !f.has_video && f.url);
  if (audioOnly.length === 0) return formats[0];

  // Scoring function: prioritize 128kbps M4A (itag 140) and Opus (itag 251 / 250)
  const scored = audioOnly.map(f => {
    let score = 0;
    const itag = Number(f.itag);
    const bitrate = Number(f.bitrate || f.average_bitrate || 0);

    // 1. Itag 140 (128kbps AAC M4A) is universal across iOS, Android, Chrome, Safari, Firefox
    if (itag === 140) score += 100;
    // 2. Itag 251 (160kbps Opus) / Itag 250 (70kbps Opus)
    else if (itag === 251) score += 95;
    else if (itag === 250) score += 85;
    // 3. Bitrate sweet spot: 96kbps - 160kbps (starts instantly without stutter)
    else if (bitrate >= 96000 && bitrate <= 165000) score += 80;
    else if (bitrate > 0 && bitrate < 96000) score += 60;
    else score += 40; // High bitrate files (>200kbps) get lower priority to prevent buffer stalls

    return { format: f, score, bitrate };
  });

  scored.sort((a, b) => b.score - a.score);
  return scored[0].format;
}

// Helper to resolve high-speed, direct audio stream format with multi-tier fallback & 2-hour in-memory caching
async function getStreamFormat(videoId, songTitle = '') {
  // 1. Check in-memory stream URL cache (2-hour TTL)
  const cached = streamUrlCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return cached;
  }

  const client = await getYouTubeClient();

  // 2. Innertube clients in order: IOS -> TV_EMBEDDED -> ANDROID
  if (client) {
    const clientsToTry = ['IOS', 'TV_EMBEDDED', 'ANDROID'];
    for (const c of clientsToTry) {
      try {
        const info = await client.getInfo(videoId, { client: c });
        const formats = info.streaming_data?.adaptive_formats || [];
        const best = pickFastAudioFormat(formats);

        if (best && best.url) {
          const contentLength = parseInt(best.content_length, 10) || 3500000;
          const mimeType = best.mime_type || 'audio/mp4; codecs="mp4a.40.2"';
          const result = {
            url: best.url,
            contentLength,
            mimeType,
            itag: best.itag,
            bitrate: best.bitrate,
            expiresAt: Date.now() + STREAM_CACHE_TTL
          };

          // LRU Eviction: cap cache size at 500 items
          if (streamUrlCache.size >= 500) {
            const oldestKey = streamUrlCache.keys().next().value;
            streamUrlCache.delete(oldestKey);
          }
          streamUrlCache.set(videoId, result);
          return result;
        }
      } catch (err) {
        console.warn(`${c} client getInfo failed for ${videoId}:`, err.message);
      }
    }
  }

  // 3. Fallback: Public Piped instances
  const pipedInstances = [
    'https://pipedapi.kavin.rocks',
    'https://api.piped.private.coffee',
    'https://piped-api.lunar.icu'
  ];
  for (const instance of pipedInstances) {
    try {
      const pRes = await fetch(`${instance}/streams/${videoId}`, {
        headers: { 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(3000)
      });
      if (pRes.ok) {
        const pData = await pRes.json();
        const audioStreams = pData.audioStreams || [];
        if (audioStreams.length > 0) {
          const sorted = audioStreams.filter(s => s.url).sort((a, b) => Math.abs((a.bitrate || 128000) - 128000) - Math.abs((b.bitrate || 128000) - 128000));
          const best = sorted[0];
          if (best && best.url) {
            const result = {
              url: best.url,
              contentLength: best.contentLength || 3500000,
              mimeType: best.mimeType || 'audio/mp4',
              itag: 140,
              bitrate: best.bitrate || 128000,
              expiresAt: Date.now() + STREAM_CACHE_TTL
            };
            if (streamUrlCache.size >= 500) {
              const oldestKey = streamUrlCache.keys().next().value;
              streamUrlCache.delete(oldestKey);
            }
            streamUrlCache.set(videoId, result);
            return result;
          }
        }
      }
    } catch (_) {}
  }

  // 4. Fallback: JioSaavn Search by song title (if title provided)
  if (songTitle && songTitle.trim()) {
    try {
      const saavnRes = await fetch(`https://saavn.me/search/songs?query=${encodeURIComponent(songTitle)}&limit=1`, {
        signal: AbortSignal.timeout(3000)
      });
      if (saavnRes.ok) {
        const sData = await saavnRes.json();
        const candidate = sData?.data?.results?.[0];
        if (candidate?.downloadUrl && Array.isArray(candidate.downloadUrl)) {
          const bestDl = candidate.downloadUrl.find(d => d.quality === '160kbps') || candidate.downloadUrl[candidate.downloadUrl.length - 1];
          if (bestDl?.link) {
            const result = {
              url: bestDl.link,
              contentLength: 4000000,
              mimeType: 'audio/mp4',
              itag: 140,
              bitrate: 160000,
              expiresAt: Date.now() + STREAM_CACHE_TTL
            };
            if (streamUrlCache.size >= 500) {
              const oldestKey = streamUrlCache.keys().next().value;
              streamUrlCache.delete(oldestKey);
            }
            streamUrlCache.set(videoId, result);
            return result;
          }
        }
      }
    } catch (_) {}
  }

  throw new Error('No playable audio stream format found');
}

// 5. Pre-Warming Endpoint (/api/warm/:videoId) for instant 0ms next-song startup
app.get('/api/warm/:videoId', async (req, res) => {
  const { videoId } = req.params;
  const songTitle = req.query.title || '';
  if (!videoId) return res.status(400).json({ error: 'Missing videoId' });

  // If already in RAM, return 0ms confirmation
  const cached = streamUrlCache.get(videoId);
  if (cached && cached.expiresAt > Date.now()) {
    return res.json({
      status: 'cached',
      videoId,
      cached: true,
      mimeType: cached.mimeType,
      contentLength: cached.contentLength
    });
  }

  try {
    const format = await getStreamFormat(videoId, songTitle);
    res.json({
      status: 'warmed',
      videoId,
      cached: false,
      mimeType: format.mimeType,
      contentLength: format.contentLength
    });
  } catch (err) {
    res.status(500).json({ error: 'Pre-warm failed', details: err.message });
  }
});

// 6. High-Throughput Direct Audio Stream Proxy with FULL HTTP 206 Partial Content Range Support
app.all('/api/stream/:videoId', async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return res.status(405).end();
  }

  const { videoId } = req.params;
  const songTitle = req.query.title || '';
  if (!videoId) {
    return res.status(400).json({ error: 'Missing videoId' });
  }

  try {
    let streamFormat = await getStreamFormat(videoId, songTitle);

    // Support HEAD probes for fast metadata checks
    if (req.method === 'HEAD') {
      res.status(200);
      res.setHeader('Accept-Ranges', 'bytes');
      res.setHeader('Connection', 'keep-alive');
      res.setHeader('Cache-Control', 'public, max-age=7200, immutable');
      res.setHeader('Content-Type', streamFormat.mimeType);
      res.setHeader('Content-Length', streamFormat.contentLength);
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type');
      res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');
      return res.end();
    }

    const rangeHeader = req.headers.range;
    const abortController = new AbortController();

    req.on('close', () => {
      abortController.abort();
    });

    const upstreamHeaders = {
      'User-Agent': 'com.google.ios.youtube/19.29.1 (iPhone16,2; U; CPU iOS 17_5_1 like Mac OS X; en_US)',
      'Accept': '*/*'
    };
    if (rangeHeader) {
      upstreamHeaders['Range'] = rangeHeader;
    }

    let upstreamRes = await fetch(streamFormat.url, {
      headers: upstreamHeaders,
      signal: abortController.signal
    });

    // If upstream returns 403 (e.g. expired or IP restriction), evict from cache and retry once
    if (upstreamRes.status === 403) {
      console.warn(`Upstream 403 on stream for ${videoId}. Evicting cache and re-fetching...`);
      streamUrlCache.delete(videoId);
      streamFormat = await getStreamFormat(videoId, songTitle);
      upstreamRes = await fetch(streamFormat.url, {
        headers: upstreamHeaders,
        signal: abortController.signal
      });
    }

    if (!upstreamRes.ok && upstreamRes.status !== 206) {
      console.warn(`Upstream returned status ${upstreamRes.status} for ${videoId}`);
      return res.status(upstreamRes.status).json({ error: 'Upstream stream error', status: upstreamRes.status });
    }

    res.status(upstreamRes.status);
    res.setHeader('Accept-Ranges', 'bytes');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Cache-Control', 'public, max-age=7200, immutable');
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || streamFormat.mimeType);
    if (upstreamRes.headers.get('content-range')) {
      res.setHeader('Content-Range', upstreamRes.headers.get('content-range'));
    }
    if (upstreamRes.headers.get('content-length')) {
      res.setHeader('Content-Length', upstreamRes.headers.get('content-length'));
    }
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Range, Accept-Ranges, Content-Type');
    res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Accept-Ranges, Content-Length');

    if (!upstreamRes.body) {
      return res.end();
    }

    // High-throughput 64KB chunks to ensure smooth buffering without audio stalls
    const nodeStream = Readable.fromWeb(upstreamRes.body, { highWaterMark: 64 * 1024 });
    nodeStream.on('error', (err) => {
      console.warn(`Stream pipe error for ${videoId}:`, err.message);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Stream failed', details: err.message });
      }
    });

    nodeStream.pipe(res);
  } catch (error) {
    console.error(`Stream extraction error for ${videoId}:`, error.message);
    if (!res.headersSent) {
      res.status(500).json({ error: 'Stream extraction failed', details: error.message });
    }
  }
});

// 6. Real Synced Lyrics from LRCLIB with Strict Duration Match (±7s) & YouTube Captions Fallback
app.get('/api/lyrics', async (req, res) => {
  const { track, artist, duration, videoId } = req.query;

  if (!track) {
    return res.status(400).json({ error: 'track query parameter is required' });
  }

  // 1. Sanitize track and artist
  const sanitized = sanitizeTrackInfo(track, artist);
  const cleanTitle = sanitized.title || track;
  const cleanArtist = sanitized.artist || artist || '';
  const numDuration = duration ? parseFloat(duration) : 0;

  // Cache key based on videoId or sanitized title & artist
  const cacheKey = (videoId ? `vid_${videoId}___` : '') + `${cleanTitle.toLowerCase()}___${cleanArtist.toLowerCase()}`;
  if (lyricsMemoryCache.has(cacheKey)) {
    return res.json(lyricsMemoryCache.get(cacheKey));
  }

  try {
    // 2. Build fast parallel LRCLIB queries with a strict 4000ms timeout
    const fetchWithTimeout = async (url) => {
      try {
        const response = await fetch(url, {
          headers: { 'User-Agent': 'AS-Music-Player/1.0 (https://github.com/as-music)' },
          signal: AbortSignal.timeout(4000)
        });
        if (response.ok) {
          return await response.json();
        }
      } catch (e) {
        // Timeout or fetch error swallowed for graceful fallback
      }
      return null;
    };

    let exactUrl = `https://lrclib.net/api/get?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`;
    if (numDuration > 0) exactUrl += `&duration=${Math.round(numDuration)}`;

    const searchComboUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(`${cleanTitle} ${cleanArtist}`.trim())}`;
    const searchTitleOnlyUrl = `https://lrclib.net/api/search?q=${encodeURIComponent(cleanTitle)}`;

    // Query LRCLIB endpoints in parallel
    const [exactResult, searchComboResult, searchTitleResult] = await Promise.allSettled([
      fetchWithTimeout(exactUrl),
      fetchWithTimeout(searchComboUrl),
      cleanTitle !== `${cleanTitle} ${cleanArtist}`.trim() ? fetchWithTimeout(searchTitleOnlyUrl) : Promise.resolve(null)
    ]);

    const candidates = [];
    if (exactResult.status === 'fulfilled' && exactResult.value && !exactResult.value.error) {
      candidates.push(exactResult.value);
    }
    if (searchComboResult.status === 'fulfilled' && Array.isArray(searchComboResult.value)) {
      candidates.push(...searchComboResult.value);
    }
    if (searchTitleResult.status === 'fulfilled' && Array.isArray(searchTitleResult.value)) {
      candidates.push(...searchTitleResult.value);
    }

    // 3. Strict Scoring & Verification:
    // Reject any candidate whose duration differs by more than 7 seconds or has zero title similarity!
    const validCandidates = candidates.filter(c => {
      if (!c || (!c.syncedLyrics && !c.plainLyrics)) return false;

      // Duration tolerance: strictly within ±7 seconds of playing track
      if (numDuration > 0 && c.duration && Number.isFinite(c.duration)) {
        if (Math.abs(c.duration - numDuration) > 7) {
          return false;
        }
      }

      // Title similarity check: ensure at least one significant token matches or substrings overlap
      const cTitle = (c.trackName || '').toLowerCase().trim();
      const tTitle = cleanTitle.toLowerCase().trim();
      const tTokens = tTitle.split(/\s+/).filter(t => t.length > 2);
      const cTokens = cTitle.split(/\s+/).filter(t => t.length > 2);
      const hasOverlap = tTokens.some(tok => cTokens.includes(tok)) || cTitle.includes(tTitle) || tTitle.includes(cTitle);

      if (tTokens.length > 0 && !hasOverlap) {
        return false;
      }

      return true;
    });

    let best = validCandidates.find(c => c.syncedLyrics && c.syncedLyrics.trim().length > 0);
    if (!best) {
      best = validCandidates.find(c => c.plainLyrics && c.plainLyrics.trim().length > 0);
    }

    if (best) {
      let parsedLyrics = [];
      let isSynced = false;

      if (best.syncedLyrics) {
        isSynced = true;
        const lines = best.syncedLyrics.split('\n');
        for (const line of lines) {
          const match = line.match(/\[(\d{2}):(\d{2}(?:\.\d{2,3})?)\](.*)/);
          if (match) {
            const minutes = parseInt(match[1], 10);
            const seconds = parseFloat(match[2]);
            const text = match[3].trim();
            const totalSeconds = parseFloat((minutes * 60 + seconds).toFixed(2));
            if (text) {
              parsedLyrics.push({ time: totalSeconds, text });
            }
          }
        }
      } else if (best.plainLyrics) {
        const lines = best.plainLyrics.split('\n').filter(l => l.trim().length > 0);
        const estDuration = numDuration > 0 ? numDuration : (best.duration || 180);
        const step = estDuration / (lines.length || 1);
        parsedLyrics = lines.map((text, i) => ({
          time: parseFloat((i * step).toFixed(1)),
          text: text.trim()
        }));
      }

      if (parsedLyrics.length > 0) {
        const payload = {
          track: best.trackName || cleanTitle,
          artist: best.artistName || cleanArtist,
          synced: isSynced,
          source: 'LRCLIB',
          lyrics: parsedLyrics
        };

        lyricsMemoryCache.set(cacheKey, payload);
        if (lyricsMemoryCache.size > 500) {
          const firstKey = lyricsMemoryCache.keys().next().value;
          lyricsMemoryCache.delete(firstKey);
        }

        return res.json(payload);
      }
    }

    // 4. YouTube Transcript & Captions Fallback (SimpMusic Style)
    // If LRCLIB had no matching duration or lyrics, pull timed captions or LyricFind from YouTube
    if (videoId) {
      const client = await getYouTubeClient();
      if (client) {
        const ytTranscript = await fetchYouTubeTranscript(videoId, client, numDuration);
        if (ytTranscript && ytTranscript.lyrics && ytTranscript.lyrics.length > 0) {
          const payload = {
            track: cleanTitle,
            artist: cleanArtist,
            synced: ytTranscript.synced,
            source: ytTranscript.source,
            lyrics: ytTranscript.lyrics
          };

          lyricsMemoryCache.set(cacheKey, payload);
          return res.json(payload);
        }
      }
    }

    return res.status(404).json({ error: 'Lyrics not found' });
  } catch (error) {
    console.error('Lyrics error:', error);
    res.status(500).json({ error: 'Lyrics fetch failed', details: error.message });
  }
});

// Serve production frontend assets from dist (allows running 24/7 as a standalone unified service)
app.use(express.static(distPath));

// SPA catch-all fallback for client-side routing
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/')) {
    return next();
  }
  res.sendFile(path.join(distPath, 'index.html'), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🕊️ Masakali Backend running on http://localhost:${PORT}`);
  console.log(`📡 Real Music Search:   GET http://localhost:${PORT}/api/search?q=...`);
  console.log(`🔥 Trending Songs:      GET http://localhost:${PORT}/api/trending`);
  console.log(`✨ Smart Auto-Play:     GET http://localhost:${PORT}/api/related?videoId=...`);
  console.log(`🎧 206 Partial Stream:  GET http://localhost:${PORT}/api/stream/:videoId`);
  console.log(`🎤 Real Synced Lyrics:  GET http://localhost:${PORT}/api/lyrics?track=...&artist=...`);
  console.log(`======================================================\n`);
});
