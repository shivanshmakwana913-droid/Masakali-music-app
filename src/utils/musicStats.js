// AS Music - Listening History & Music Analytics (SimpMusic Style)
// Pure zero-bloat client-side tracking using localStorage with zero chart dependencies

const STORAGE_KEY_HISTORY = 'as_music_history';
const STORAGE_KEY_STATS = 'as_music_stats';

/**
 * Get the initial stats object structure
 */
function getInitialStats() {
  return {
    totalListeningSeconds: 0,
    totalPlays: 0,
    lastActiveDate: null,
    streakDays: 1,
    artistPlays: {},
    songPlays: {},
    vibePlays: {
      'Studio Clean': 0,
      'Bass Boost': 0,
      'Slowed + Reverb': 0,
      '8D Spatial Audio': 0,
      'Karaoke Mode': 0,
      'Acoustic Warmth': 0,
      'Vocal Clarity': 0,
      'Electronic Dance': 0
    }
  };
}

/**
 * Load stats from localStorage safely
 */
export function loadStoredStats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_STATS);
    if (!raw) return getInitialStats();
    const parsed = JSON.parse(raw);
    return {
      ...getInitialStats(),
      ...parsed,
      vibePlays: { ...getInitialStats().vibePlays, ...(parsed.vibePlays || {}) }
    };
  } catch {
    return getInitialStats();
  }
}

/**
 * Record a played track into listening history & update analytics
 */
export function recordTrackPlay(track, activeVibe = 'Studio Clean') {
  if (!track || !track.title) return;

  const now = Date.now();
  const todayStr = new Date().toISOString().slice(0, 10); // YYYY-MM-DD

  // 1. Update Listening History (Latest 100 entries)
  try {
    const rawHistory = localStorage.getItem(STORAGE_KEY_HISTORY);
    const historyList = rawHistory ? JSON.parse(rawHistory) : [];

    // Filter out identical plays within the last 30 seconds to prevent rapid double-clicks
    const cleanList = historyList.filter(
      (item) => !(item.id === track.id && now - (item.playedAt || 0) < 30000)
    );

    const newEntry = {
      id: track.id,
      title: track.title,
      artist: track.artist || 'Various Artists',
      album: track.album || 'Single',
      cover: track.cover,
      audioUrl: track.audioUrl,
      source: track.source || 'youtube',
      duration: track.duration || 180,
      durationFormatted: track.durationFormatted || '3:00',
      playedAt: now
    };

    const updatedHistory = [newEntry, ...cleanList].slice(0, 100);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(updatedHistory));
    // Also keep as_music_recently_played in sync for backwards compatibility
    localStorage.setItem('as_music_recently_played', JSON.stringify(updatedHistory.slice(0, 25)));
  } catch (e) {
    console.warn('Failed to record listening history:', e);
  }

  // 2. Update Aggregated Stats (Plays, Streak, Artists, Songs, Vibes)
  try {
    const stats = loadStoredStats();

    // Increment play count
    stats.totalPlays = (stats.totalPlays || 0) + 1;

    // Daily Streak Logic
    if (stats.lastActiveDate) {
      const last = new Date(stats.lastActiveDate);
      const current = new Date(todayStr);
      const diffDays = Math.round((current - last) / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Active on consecutive day
        stats.streakDays = (stats.streakDays || 1) + 1;
      } else if (diffDays > 1) {
        // Streak broken
        stats.streakDays = 1;
      }
      // If diffDays === 0, keep current streak
    } else {
      stats.streakDays = 1;
    }
    stats.lastActiveDate = todayStr;

    // Artist play count
    const artistKey = track.artist || 'Various Artists';
    stats.artistPlays[artistKey] = (stats.artistPlays[artistKey] || 0) + 1;

    // Song play count
    const songId = track.id || `${track.title}__${track.artist}`;
    if (!stats.songPlays[songId]) {
      stats.songPlays[songId] = {
        id: track.id,
        title: track.title,
        artist: track.artist || 'Various Artists',
        cover: track.cover,
        count: 1
      };
    } else {
      stats.songPlays[songId].count += 1;
      if (track.cover) stats.songPlays[songId].cover = track.cover;
    }

    // Audio Vibe count
    const vibeKey = activeVibe || 'Studio Clean';
    stats.vibePlays[vibeKey] = (stats.vibePlays[vibeKey] || 0) + 1;

    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));

    // Dispatch custom event for real-time reactive UI updates
    window.dispatchEvent(new CustomEvent('as_music_stats_updated'));
  } catch (e) {
    console.warn('Failed to update music stats:', e);
  }
}

/**
 * Increment accumulated listening time in seconds (called periodically during playback)
 */
export function recordListeningSeconds(seconds = 5) {
  if (!seconds || seconds <= 0) return;
  try {
    const stats = loadStoredStats();
    stats.totalListeningSeconds = (stats.totalListeningSeconds || 0) + seconds;
    localStorage.setItem(STORAGE_KEY_STATS, JSON.stringify(stats));
  } catch (_) {}
}

/**
 * Retrieve listening history list
 */
export function getListeningHistory() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/**
 * Group listening history into Today, Yesterday, and Earlier
 */
export function getGroupedListeningHistory() {
  const history = getListeningHistory();
  const now = new Date();

  // Start of today (00:00:00)
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
  // Start of yesterday (00:00:00)
  const startOfYesterday = startOfToday - 86400000;

  const grouped = {
    today: [],
    yesterday: [],
    earlier: []
  };

  history.forEach((track) => {
    const playedAt = track.playedAt || 0;
    if (playedAt >= startOfToday) {
      grouped.today.push(track);
    } else if (playedAt >= startOfYesterday) {
      grouped.yesterday.push(track);
    } else {
      grouped.earlier.push(track);
    }
  });

  return grouped;
}

/**
 * Clear listening history
 */
export function clearListeningHistory() {
  try {
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem('as_music_recently_played');
    window.dispatchEvent(new CustomEvent('as_music_stats_updated'));
  } catch (_) {}
}

/**
 * Format total listening seconds into human-readable hours and minutes
 */
export function formatListeningTime(totalSeconds = 0) {
  if (!totalSeconds || totalSeconds < 60) return `${Math.round(totalSeconds || 0)}s`;
  const totalMins = Math.floor(totalSeconds / 60);
  if (totalMins < 60) return `${totalMins}m`;
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Get comprehensive analytics summary for Listening Stats modal / Wrapped
 */
export function getListeningAnalytics() {
  const stats = loadStoredStats();
  const history = getListeningHistory();

  // 1. Total Listening Time
  const formattedTime = formatListeningTime(stats.totalListeningSeconds);

  // 2. Total Plays
  const totalPlays = Math.max(stats.totalPlays || 0, history.length);

  // 3. Daily Streak
  const streakDays = Math.max(1, stats.streakDays || 1);

  // 4. Top 5 Artists
  const artistEntries = Object.entries(stats.artistPlays || {});
  artistEntries.sort((a, b) => b[1] - a[1]);
  const maxArtistPlays = artistEntries[0]?.[1] || 1;
  const topArtists = artistEntries.slice(0, 5).map(([name, count]) => ({
    name,
    count,
    percent: Math.min(100, Math.round((count / maxArtistPlays) * 100))
  }));

  // 5. Top 5 Most Played Songs
  const songEntries = Object.values(stats.songPlays || {});
  songEntries.sort((a, b) => b.count - a.count);
  const maxSongPlays = songEntries[0]?.count || 1;
  const topSongs = songEntries.slice(0, 5).map((song) => ({
    ...song,
    percent: Math.min(100, Math.round((song.count / maxSongPlays) * 100))
  }));

  // 6. Favorite Audio Vibe
  const vibeEntries = Object.entries(stats.vibePlays || {});
  vibeEntries.sort((a, b) => b[1] - a[1]);
  const favoriteVibe = vibeEntries[0]?.[1] > 0 ? vibeEntries[0][0] : 'Studio Clean';
  const totalVibePlays = vibeEntries.reduce((acc, curr) => acc + curr[1], 0) || 1;
  const favoriteVibePercent = Math.round(((vibeEntries[0]?.[1] || 1) / totalVibePlays) * 100);

  return {
    totalListeningSeconds: stats.totalListeningSeconds || 0,
    formattedTime,
    totalPlays,
    streakDays,
    topArtists,
    topSongs,
    favoriteVibe,
    favoriteVibePercent
  };
}

/**
 * Clear all listening analytics stats
 */
export function clearAllStats() {
  try {
    localStorage.removeItem(STORAGE_KEY_STATS);
    localStorage.removeItem(STORAGE_KEY_HISTORY);
    localStorage.removeItem('as_music_recently_played');
    window.dispatchEvent(new CustomEvent('as_music_stats_updated'));
  } catch (_) {}
}
