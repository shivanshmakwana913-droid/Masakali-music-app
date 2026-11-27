// AS Music (Masakali) - 4-Factor Behavioral & Vibe-Matched Recommendation Engine
// Pure zero-dependency client-side scoring engine (keeps bundle < 1MB)

const STORAGE_KEY_AFFINITY = 'as_music_artist_affinity';
const STORAGE_KEY_HISTORY = 'as_music_history';
const STORAGE_KEY_RECENT = 'as_music_recently_played';
const MAX_RECENT_EXCLUSIONS = 25;

// Vibe keyword dictionaries for lightweight zero-ML classification
const VIBE_KEYWORDS = {
  lofi: ['lo-fi', 'lofi', 'slowed', 'reverb', 'chill', 'study', 'ambient', 'sleep', 'night', 'rain'],
  sad: ['sad', 'dard', 'tanhai', 'heartbreak', 'broken', 'judai', 'bewafa', 'cry', 'alone', 'emotional', 'unplugged'],
  romantic: ['romantic', 'love', 'ishq', 'pyar', 'mohabbat', 'dil', 'jaan', 'crush', 'valentine', 'melody'],
  party: ['party', 'bass', 'dj', 'remix', 'club', 'dance', 'trap', 'edm', 'bhangra', 'workout', 'hype', 'phonk', 'upbeat'],
  acoustic: ['acoustic', 'unplugged', 'mtv', 'coke studio', 'instrumental', 'guitar', 'piano', 'cover', 'live'],
  '8d': ['8d', 'spatial', 'surround', 'binaural', 'dolby']
};

/**
 * Parse primary and featured/co-artists from an artist string.
 * e.g. "Arijit Singh, Pritam feat. Shilpa Rao" -> ["arijit singh", "pritam", "shilpa rao"]
 */
export function extractArtists(artistStr) {
  if (!artistStr || typeof artistStr !== 'string') return [];
  return artistStr
    .split(/,|&|\bfeat\.?\b|\bft\.?\b|\bx\b|\bvs\.?\b|\bwith\b|\//i)
    .map((a) => a.trim().toLowerCase())
    .filter((a) => a.length > 1 && a !== 'various artists' && a !== 'unknown');
}

/**
 * Load user's artist affinity map from localStorage.
 */
export function getArtistAffinityMap() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_AFFINITY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === 'object' ? parsed : {};
  } catch {
    return {};
  }
}

/**
 * Update affinity score for all artists on a track in localStorage.
 */
export function recordArtistAffinity(track, delta) {
  if (!track || !delta) return;
  const artists = extractArtists(track.artist);
  if (artists.length === 0) return;

  try {
    const map = getArtistAffinityMap();
    for (const artist of artists) {
      const current = Number(map[artist] || 0);
      // Clamp between -40 and +100 so no single artist permanently monopolizes
      map[artist] = Math.max(-40, Math.min(100, current + delta));
    }
    localStorage.setItem(STORAGE_KEY_AFFINITY, JSON.stringify(map));
  } catch (_) {}
}

/** +5 affinity for full listen */
export function recordFullListen(track) {
  recordArtistAffinity(track, 5);
}

/** +8 affinity for Like or Ringtone cut */
export function recordLikeOrRingtone(track) {
  recordArtistAffinity(track, 8);
}

/** -4 affinity for early skip (<12s) */
export function recordEarlySkip(track, elapsedSeconds) {
  if (typeof elapsedSeconds === 'number' && elapsedSeconds > 0.5 && elapsedSeconds < 12) {
    recordArtistAffinity(track, -4);
  }
}

/**
 * Classify a track into vibe/mood tags using title, genre, album, and tags.
 * Returns a Set of matched vibe keys (e.g. 'lofi', 'sad', 'romantic', 'party', 'acoustic', '8d').
 */
export function classifyTrackVibe(track) {
  const vibes = new Set();
  if (!track) return vibes;

  const haystack = [
    track.title || '',
    track.genre || '',
    track.album || '',
    Array.isArray(track.tags) ? track.tags.join(' ') : ''
  ]
    .join(' ')
    .toLowerCase();

  for (const [vibe, keywords] of Object.entries(VIBE_KEYWORDS)) {
    for (const kw of keywords) {
      if (haystack.includes(kw)) {
        vibes.add(vibe);
        break;
      }
    }
  }

  return vibes;
}

/**
 * Get the last N played track IDs from localStorage + in-memory ref.
 */
export function getRecentPlayedIds(extraIds = [], limit = MAX_RECENT_EXCLUSIONS) {
  const ids = [];
  const seen = new Set();

  const pushId = (id) => {
    if (id && !seen.has(id)) {
      seen.add(id);
      ids.push(id);
    }
  };

  // Prioritize most recent in-memory IDs
  if (Array.isArray(extraIds)) {
    for (let i = extraIds.length - 1; i >= 0; i--) {
      pushId(extraIds[i]);
      if (ids.length >= limit) return new Set(ids);
    }
  }

  try {
    const rawRecent = localStorage.getItem(STORAGE_KEY_RECENT);
    if (rawRecent) {
      const list = JSON.parse(rawRecent);
      if (Array.isArray(list)) {
        for (const item of list) {
          pushId(item?.id);
          if (ids.length >= limit) return new Set(ids);
        }
      }
    }
  } catch (_) {}

  try {
    const rawHist = localStorage.getItem(STORAGE_KEY_HISTORY);
    if (rawHist) {
      const list = JSON.parse(rawHist);
      if (Array.isArray(list)) {
        for (const item of list) {
          pushId(item?.id);
          if (ids.length >= limit) return new Set(ids);
        }
      }
    }
  } catch (_) {}

  return new Set(ids);
}

/**
 * Score a single candidate track using the 4-Factor Weighted Scoring Formula:
 * 1. Artist & Co-Artist Affinity (35%)
 * 2. Vibe & Mood Similarity (30%)
 * 3. Time-of-Day Context Boost (15%)
 * 4. 80/20 Discovery & Anti-Repeat Guard (20%)
 */
export function scoreCandidateTrack(candidate, context = {}) {
  if (!candidate || !candidate.id) return -Infinity;

  const {
    currentTrack = null,
    affinityMap = getArtistAffinityMap(),
    hour = new Date().getHours(),
    isDiscovery = false
  } = context;

  // --- Factor 1: Artist & Co-Artist Affinity (35% weight, max 100 raw -> 35 weighted) ---
  const currentArtists = new Set(extractArtists(currentTrack?.artist));
  const candArtists = extractArtists(candidate.artist);

  let artistMatchScore = 0;
  let storedAffinitySum = 0;

  if (candArtists.length > 0) {
    let overlapCount = 0;
    for (const a of candArtists) {
      if (currentArtists.has(a)) overlapCount += 1;
      storedAffinitySum += Number(affinityMap[a] || 0);
    }
    const overlapRatio = overlapCount / Math.max(1, currentArtists.size);
    // Normalize stored affinity (-40..100) into 0..50
    const normalizedStored = Math.max(0, Math.min(50, (storedAffinitySum / candArtists.length) + 10));
    artistMatchScore = Math.min(100, overlapRatio * 50 + normalizedStored);
  }
  const factor1 = artistMatchScore * 0.35;

  // --- Factor 2: Vibe & Mood Similarity (30% weight, max 100 raw -> 30 weighted) ---
  const currentVibes = classifyTrackVibe(currentTrack);
  const candVibes = classifyTrackVibe(candidate);
  let vibeScore = 35; // neutral baseline when either track has no explicit mood tags

  if (currentVibes.size > 0 && candVibes.size > 0) {
    let matches = 0;
    for (const v of candVibes) {
      if (currentVibes.has(v)) matches += 1;
    }
    vibeScore = matches > 0
      ? Math.min(100, 60 + (matches / Math.max(currentVibes.size, candVibes.size)) * 40)
      : 15;
  } else if (currentVibes.size === 0 && candVibes.size === 0) {
    vibeScore = 50;
  }
  const factor2 = vibeScore * 0.30;

  // --- Factor 3: Time-of-Day Context Boost (15% weight, +15 direct context boost) ---
  // Late night (10 PM - 5 AM): boost Lo-Fi / Chill / Acoustic
  // Evening (5 PM - 10 PM): boost Upbeat / Party / Bass
  let timeBoost = 0;
  const isLateNight = hour >= 22 || hour < 5;
  const isEveningPeak = hour >= 17 && hour < 22;

  if (isLateNight && (candVibes.has('lofi') || candVibes.has('acoustic'))) {
    timeBoost = 15;
  } else if (isEveningPeak && candVibes.has('party')) {
    timeBoost = 15;
  }
  // Factor 3 contributes up to 15 points directly (15% of 100-point scale)
  const factor3 = timeBoost;

  // --- Factor 4: 80/20 Discovery & Anti-Repeat Guard (20% weight, max 20 points) ---
  // Reward fresh/unfamiliar artists slightly to prevent echo-chamber loops
  let discoveryScore = 50;
  if (isDiscovery) {
    discoveryScore = 100;
  } else if (candArtists.length > 0 && currentArtists.size > 0) {
    const isExactSameArtist = candArtists.every((a) => currentArtists.has(a));
    discoveryScore = isExactSameArtist ? 40 : 75;
  }
  const factor4 = discoveryScore * 0.20;

  return Number((factor1 + factor2 + factor3 + factor4).toFixed(2));
}

/**
 * Rank candidate tracks and enforce:
 * - Strict exclusion of the last 25 played videoIds (+ current & already queued)
 * - Deduplication by videoId and normalized title
 * - 80/20 Discovery injection: 1 fresh trending track every 4 songs
 */
export function rankNextTracks({
  currentTrack = null,
  candidates = [],
  trendingCandidates = [],
  recentIds = [],
  queueIds = [],
  songsSinceDiscovery = 0,
  limit = 10,
  now = new Date()
} = {}) {
  const excludedIds = getRecentPlayedIds(
    [...(Array.isArray(recentIds) ? recentIds : []), currentTrack?.id, ...(Array.isArray(queueIds) ? queueIds : [])],
    MAX_RECENT_EXCLUSIONS + 20
  );
  if (currentTrack?.id) excludedIds.add(currentTrack.id);
  if (Array.isArray(queueIds)) {
    for (const qid of queueIds) {
      if (qid) excludedIds.add(qid);
    }
  }

  const affinityMap = getArtistAffinityMap();
  const hour = now.getHours();

  const seenIds = new Set();
  const seenTitles = new Set();

  const dedupeAndFilter = (list) => {
    const out = [];
    for (const track of list || []) {
      if (!track || !track.id) continue;
      if (excludedIds.has(track.id) || seenIds.has(track.id)) continue;
      const normTitle = (track.title || '').toLowerCase().replace(/[^a-z0-9]/g, '');
      if (normTitle && seenTitles.has(normTitle)) continue;

      seenIds.add(track.id);
      if (normTitle) seenTitles.add(normTitle);
      out.push(track);
    }
    return out;
  };

  const cleanCandidates = dedupeAndFilter(candidates);
  const scored = cleanCandidates
    .map((track) => ({
      track,
      score: scoreCandidateTrack(track, { currentTrack, affinityMap, hour, isDiscovery: false })
    }))
    .sort((a, b) => b.score - a.score)
    .map((entry) => entry.track);

  // Inject 1 fresh trending discovery track every 4 songs (80/20 rule)
  const cleanTrending = dedupeAndFilter(trendingCandidates);
  const result = [];
  let trendIdx = 0;
  let counter = songsSinceDiscovery;

  for (const track of scored) {
    if (result.length >= limit) break;
    counter += 1;
    if (counter >= 4 && trendIdx < cleanTrending.length) {
      result.push({ ...cleanTrending[trendIdx], isDiscoveryPick: true });
      trendIdx += 1;
      counter = 0;
      if (result.length >= limit) break;
    }
    result.push(track);
  }

  // If primary candidates were fewer than limit, top up with remaining discovery tracks
  while (result.length < limit && trendIdx < cleanTrending.length) {
    result.push({ ...cleanTrending[trendIdx], isDiscoveryPick: true });
    trendIdx += 1;
  }

  return result;
}
