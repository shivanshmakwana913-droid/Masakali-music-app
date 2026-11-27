import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Play, Pause, Heart, Sparkles, Sliders, Mic2,
  Disc3, Radio, Waves, Music, X, ListPlus, Download, Check,
  RefreshCw, Info, Maximize2, MoreVertical, Plus, FolderPlus,
  Clock, Flame, Headphones, Compass, Library as LibraryIcon,
  FolderOpen, Share2, BarChart2, Trash2, Zap, Moon
} from 'lucide-react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import {
  searchMusic,
  fetchLyrics,
  fetchTrendingMusic,
  wakeUpBackend,
  fetchSearchSuggestions,
  getHighResThumbnail,
  handleCoverImageError
} from '../services/musicApi';
import { extractCoverGlowColor } from '../utils/colorExtractor';
import { getAllOfflineTracks } from '../utils/offlineStorage';
import {
  getGroupedListeningHistory,
  getListeningHistory,
  clearListeningHistory
} from '../utils/musicStats';
import { recordLikeOrRingtone } from '../utils/nextSongAlgo';
import Sidebar from '../components/player/Sidebar';
import MobileTabBar from '../components/player/MobileTabBar';
import MiniPlayer from '../components/player/MiniPlayer';
import AudioStudioDrawer from '../components/player/AudioStudioDrawer';
import SyncedLyricsDrawer from '../components/player/SyncedLyricsDrawer';
import SmartQueueDrawer from '../components/player/SmartQueueDrawer';
import FullScreenPlayer from '../components/player/FullScreenPlayer';
import TrackActionSheet from '../components/player/TrackActionSheet';
import RingtoneClipperModal from '../components/player/RingtoneClipperModal';
import LyricStatusCardModal from '../components/player/LyricStatusCardModal';
import SupportDevModal from '../components/player/SupportDevModal';
import ListeningStatsModal from '../components/player/ListeningStatsModal';
import DownloadAppModal from '../components/player/DownloadAppModal';
import SettingsDrawer from '../components/player/SettingsDrawer';
import MasakaliLogo from '../components/common/MasakaliLogo';
import MasakaliHeader from '../components/common/MasakaliHeader';
import { MasakaliInlineLoader } from '../components/common/SplashLoader';
import { useInstallPrompt } from '../hooks/useInstallPrompt';
import { useTheme } from '../context/ThemeContext';

const VIBE_CATEGORIES = [
  { id: 'cat-trending', name: 'Trending Hits', query: 'top hits 2024 trending', color: 'from-amber-500/20 to-orange-500/10' },
  { id: 'cat-bollywood', name: 'Bollywood', query: 'bollywood latest hits songs', color: 'from-rose-500/20 to-pink-500/10' },
  { id: 'cat-lofi', name: 'Lo-Fi Chill', query: 'lofi hip hop chill beats study', color: 'from-violet-500/20 to-purple-500/10' },
  { id: 'cat-party', name: 'Party & Dance', query: 'party dance club remix', color: 'from-cyan-500/20 to-blue-500/10' },
  { id: 'cat-bass', name: 'Bass Boosted', query: 'bass boosted edm car music', color: 'from-emerald-500/20 to-teal-500/10' },
  { id: 'cat-acoustic', name: 'Acoustic Calm', query: 'acoustic guitar chill songs', color: 'from-yellow-500/20 to-amber-500/10' }
];

// Utility helper to safely deduplicate track arrays by unique ID
function deduplicateTracks(trackList) {
  if (!Array.isArray(trackList)) return [];
  const map = new Map();
  for (const track of trackList) {
    if (track && track.id && !map.has(track.id)) {
      map.set(track.id, track);
    }
  }
  return Array.from(map.values());
}

export default function PlayerApp() {
  const engine = useAudioEngine([]);
  const {
    currentTrack,
    isPlaying,
    togglePlay,
    playTrack,
    tracks,
    queue,
    playNextInQueue,
    autoPlayRadio,
    toggleAutoPlayRadio,
    cachedTrackIds,
    saveTrackOffline,
    removeOfflineTrack,
    toastMessage,
    formatTime
  } = engine;

  // Navigation & Drawer States
  const { isDark } = useTheme();
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'search' | 'library'
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  // Track 3-Dot Options Action Sheet Target
  const [actionTrack, setActionTrack] = useState(null);

  // Ringtone Clipper Modal State
  const [clipperTrack, setClipperTrack] = useState(null);

  // Lyric Status Card Modal State
  const [isLyricCardOpen, setIsLyricCardOpen] = useState(false);
  const [lyricCardInitialIndex, setLyricCardInitialIndex] = useState(0);

  // Home Screen Filters & Data
  const [homeFilter, setHomeFilter] = useState('All'); // 'All' | 'Chill' | 'Bollywood' | 'Lo-Fi' | 'Party'
  const [trendingTracks, setTrendingTracks] = useState([]);
  const [recentlyPlayed, setRecentlyPlayed] = useState([]);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [searchSuggestions, setSearchSuggestions] = useState([]);
  const [correctedSearchQuery, setCorrectedSearchQuery] = useState(null);
  const searchDebounceRef = useRef(null);
  const suggestionDebounceRef = useRef(null);
  const globalSearchInputRef = useRef(null);

  // Library State
  const [librarySubTab, setLibrarySubTab] = useState('liked'); // 'liked' | 'offline' | 'local' | 'history' | 'playlists'
  const [localTracks, setLocalTracks] = useState([]);
  const [customPlaylists, setCustomPlaylists] = useState([]);
  const [activePlaylistId, setActivePlaylistId] = useState(null);
  const [offlineTracksList, setOfflineTracksList] = useState([]);
  const [listeningHistory, setListeningHistory] = useState(() => getListeningHistory());

  // Support Developer & Listening Stats Modal States
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const [isStatsOpen, setIsStatsOpen] = useState(false);

  // PWA & Native App Installation
  const { canInstall, isInstalled, isIOS, isAndroid, promptInstall } = useInstallPrompt();
  const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

  const handleOpenDownload = async () => {
    if (canInstall) {
      const res = await promptInstall();
      if (res && res.outcome === 'accepted') {
        engine.showToast('🕊️ Masakali installed successfully!');
        return;
      }
    }
    setIsDownloadModalOpen(true);
  };

  // Backend Connectivity & Cold-Start Wake-Up State
  const [isBackendOnline, setIsBackendOnline] = useState(false);
  const [isWakingServer, setIsWakingServer] = useState(false);
  const [isLoadingTrending, setIsLoadingTrending] = useState(true);

  // Persisted Liked Songs state in localStorage
  const [likedTrackIds, setLikedTrackIds] = useState(() => {
    try {
      const saved = localStorage.getItem('as_music_liked_tracks');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('as_music_liked_tracks', JSON.stringify(likedTrackIds));
    } catch (e) { }
  }, [likedTrackIds]);

  const toggleLike = (trackId) => {
    const isAdding = !likedTrackIds.includes(trackId);
    if (isAdding) {
      const pool = [
        ...tracks,
        ...trendingTracks,
        ...recentlyPlayed,
        ...offlineTracksList,
        ...(engine.currentTrack ? [engine.currentTrack] : []),
        ...(engine.queue || [])
      ];
      const target = pool.find((t) => t && t.id === trackId);
      if (target) recordLikeOrRingtone(target);
    }
    setLikedTrackIds((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  // Greeting based on time of day
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  }, []);

  // Check Backend Server on Mount (with silent Render wake-up ping) & Fetch Trending Songs
  useEffect(() => {
    let active = true;
    wakeUpBackend((waking) => {
      if (active) setIsWakingServer(waking);
    }).then((status) => {
      if (!active) return;
      setIsBackendOnline(status.online);
      setIsWakingServer(false);
      if (status.online) {
        fetchTrendingMusic().then((data) => {
          if (active && Array.isArray(data) && data.length > 0) {
            setTrendingTracks(data);
          }
          if (active) setIsLoadingTrending(false);
        });
      } else {
        setIsLoadingTrending(false);
      }
    });

    fetchTrendingMusic().then((data) => {
      if (active && Array.isArray(data) && data.length > 0) {
        setTrendingTracks(data);
        setIsLoadingTrending(false);
      }
    });

    // Load recently played and listening history
    try {
      const hist = getListeningHistory();
      setListeningHistory(hist);
      setRecentlyPlayed(hist.slice(0, 10));
    } catch (e) { }

    // Load custom playlists
    try {
      const storedPl = localStorage.getItem('as_music_custom_playlists');
      if (storedPl) {
        setCustomPlaylists(JSON.parse(storedPl));
      } else {
        const defaults = [
          { id: 'pl-favs', title: 'Favorites', trackIds: [] },
          { id: 'pl-vibes', title: 'Night Vibes', trackIds: [] }
        ];
        localStorage.setItem('as_music_custom_playlists', JSON.stringify(defaults));
        setCustomPlaylists(defaults);
      }
    } catch (e) { }

    return () => {
      active = false;
    };
  }, []);

  // Sync listening history & recently played when currentTrack changes or stats event fires
  useEffect(() => {
    const syncHistory = () => {
      const hist = getListeningHistory();
      setListeningHistory(hist);
      setRecentlyPlayed(hist.slice(0, 10));
    };

    syncHistory();
    window.addEventListener('as_music_stats_updated', syncHistory);
    return () => window.removeEventListener('as_music_stats_updated', syncHistory);
  }, [currentTrack?.id]);

  // Grouped Listening History: Today, Yesterday, Earlier
  const groupedHistory = useMemo(() => {
    return getGroupedListeningHistory();
  }, [listeningHistory]);

  // Clear listening history
  const handleClearHistory = () => {
    if (window.confirm('Clear all your listening history?')) {
      clearListeningHistory();
      setListeningHistory([]);
      setRecentlyPlayed([]);
      if (engine.showToast) engine.showToast('Listening history cleared');
    }
  };

  // Refresh offline tracks list when cached IDs change
  useEffect(() => {
    getAllOfflineTracks().then((list) => {
      setOfflineTracksList(list);
    }).catch(() => { });
  }, [cachedTrackIds]);

  // Dynamic Cover Art Ambient Glow Colors
  const ambientGlow = useMemo(() => {
    return extractCoverGlowColor(currentTrack?.cover, currentTrack?.title);
  }, [currentTrack?.cover, currentTrack?.title]);

  // Background prefetch real synced lyrics as soon as track starts playing or changes
  useEffect(() => {
    if (!currentTrack) return;
    fetchLyrics(currentTrack.title, currentTrack.artist, currentTrack.duration, currentTrack.id, false, currentTrack.id).then((res) => {
      if (res && res.lyrics && res.lyrics.length > 0) {
        currentTrack.lyrics = res.lyrics;
      }
    }).catch(() => { });
  }, [currentTrack?.id, currentTrack?.title]);

  // Live Instant Search with Debouncing & Smart Suggestions
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setSearchSuggestions([]);
      setCorrectedSearchQuery(null);
      return;
    }

    // Fetch search suggestions quickly
    if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    suggestionDebounceRef.current = setTimeout(async () => {
      if (searchQuery.trim().length >= 2) {
        const sugs = await fetchSearchSuggestions(searchQuery.trim());
        setSearchSuggestions(sugs);
      }
    }, 150);

    // Debounce full music search
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setIsSearching(true);
      const res = await searchMusic(searchQuery);
      setSearchResults(res.tracks);
      setCorrectedSearchQuery(res.correctedQuery || null);
      setIsSearching(false);
    }, 350);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
      if (suggestionDebounceRef.current) clearTimeout(suggestionDebounceRef.current);
    };
  }, [searchQuery]);

  // Handle Home Filter Chip click
  const handleHomeFilterClick = async (chip) => {
    setHomeFilter(chip);
    if (chip === 'All') return;

    setIsSearching(true);
    const query = chip === 'Chill' ? 'chill acoustic songs'
      : chip === 'Bollywood' ? 'bollywood latest top songs'
        : chip === 'Lo-Fi' ? 'lofi beats relax'
          : chip === 'Party' ? 'party club dance music'
            : 'bass boosted hits';
    const res = await searchMusic(query);
    setSearchResults(res.tracks);
    setIsSearching(false);
  };

  // Play Local Device Audio Files (Offline Native Web Audio)
  const handleLocalFilesSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const newItems = files.map((file, idx) => {
      const rawName = file.name.replace(/\.[^/.]+$/, '');
      let title = rawName;
      let artist = 'Local Audio';
      if (rawName.includes(' - ')) {
        const parts = rawName.split(' - ');
        artist = parts[0].trim();
        title = parts.slice(1).join(' - ').trim();
      }

      const blobUrl = URL.createObjectURL(file);
      const id = `local-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 7)}`;

      return {
        id,
        title,
        artist,
        album: 'Local Device Audio',
        duration: 180,
        durationFormatted: 'Local',
        cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&auto=format&fit=crop&q=80',
        audioUrl: blobUrl,
        source: 'local',
        genre: 'Local Audio',
        tags: ['Local Audio', 'Offline'],
        file,
        lyrics: []
      };
    });

    setLocalTracks((prev) => [...newItems, ...prev]);
    engine.setTracks((prev) => [...newItems, ...prev]);
    engine.playTrack(newItems[0]);
    setLibrarySubTab('local');
    engine.showToast(`Loaded ${newItems.length} local audio track${newItems.length > 1 ? 's' : ''}`);
    e.target.value = '';
  };

  // Native Share App Handler
  const handleShareApp = async () => {
    const shareData = {
      title: 'Masakali 🕊️',
      text: '🕊️ Free Your Music. Fly Without Ads. Listen to music & edit audio live with Masakali — 10-Band EQ, Slowed + Reverb, 8D Spatial Audio, Live Karaoke & Synced Lyrics! Zero ads, <1MB app:',
      url: window.location.origin || window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        engine.showToast('Thanks for sharing Masakali 🕊️!');
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${shareData.text} ${shareData.url}`);
      engine.showToast('Masakali invite link copied to clipboard!');
    } catch {
      engine.showToast('Unable to copy link');
    }
  };

  // Handle Quick Playlist / Mood click - dynamically fetches real matching songs & queues them
  const handlePlaylistClick = async (playlist) => {
    // 1. Configure matching Audio Studio DSP Preset
    if (playlist.vibe.toLowerCase().includes('slowed')) {
      if (!engine.isSlowedReverb) engine.toggleSlowedReverb();
    } else if (playlist.vibe.toLowerCase().includes('8d')) {
      if (!engine.is8DActive) engine.toggle8D();
    } else if (playlist.vibe.toLowerCase().includes('bass')) {
      engine.applyPreset('Bass Boost');
    } else {
      engine.applyPreset('Flat');
    }

    if (engine.showToast) {
      engine.showToast(`Loading "${playlist.title}" mix...`);
    }

    // 2. Fetch real matching songs from /api/search
    try {
      const res = await searchMusic(playlist.searchQuery || playlist.title);
      if (res && res.tracks && res.tracks.length > 0) {
        // Play first track immediately
        playTrack(res.tracks[0]);
        // Queue the rest for endless continuous listening
        if (res.tracks.length > 1 && engine.setQueue) {
          engine.setQueue(res.tracks.slice(1, 15));
        }
        if (engine.showToast) {
          engine.showToast(`Playing "${playlist.title}" (${res.tracks.length} songs)`);
        }
        return;
      }
    } catch (err) {
      console.warn('Playlist search error:', err);
    }

    // Fallback: local mock track matching vibe
    const match = tracks.find(t => t.tags?.some(tag => tag.toLowerCase().includes(playlist.vibe.split(' ')[0].toLowerCase()))) || tracks[0];
    if (match) playTrack(match);
  };

  // All custom playlists tracks resolution for Library tab
  const activeCustomPlaylist = useMemo(() => {
    if (!activePlaylistId) return null;
    return customPlaylists.find(pl => pl.id === activePlaylistId) || null;
  }, [activePlaylistId, customPlaylists]);

  const activeCustomPlaylistTracks = useMemo(() => {
    if (!activeCustomPlaylist) return [];
    const idSet = new Set(activeCustomPlaylist.trackIds || []);
    const fromAll = [...tracks, ...trendingTracks, ...recentlyPlayed, ...offlineTracksList];
    const unique = [];
    const seen = new Set();
    for (const t of fromAll) {
      if (idSet.has(t.id) && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }
    return unique;
  }, [activeCustomPlaylist, tracks, trendingTracks, recentlyPlayed, offlineTracksList]);

  // Liked tracks full objects
  const likedTracksList = useMemo(() => {
    const idSet = new Set(likedTrackIds);
    const fromAll = [...tracks, ...trendingTracks, ...recentlyPlayed, ...offlineTracksList];
    const unique = [];
    const seen = new Set();
    for (const t of fromAll) {
      if (idSet.has(t.id) && !seen.has(t.id)) {
        seen.add(t.id);
        unique.push(t);
      }
    }
    return unique;
  }, [likedTrackIds, tracks, trendingTracks, recentlyPlayed, offlineTracksList]);

  // Guaranteed Unique & Deduplicated Track Lists across Views to eliminate duplicate React keys
  const uniqueSearchResults = useMemo(() => deduplicateTracks(searchResults), [searchResults]);
  const uniqueTrendingTracks = useMemo(() => deduplicateTracks(trendingTracks), [trendingTracks]);
  const uniqueRecentlyPlayed = useMemo(() => deduplicateTracks(recentlyPlayed), [recentlyPlayed]);
  const uniqueLikedTracks = useMemo(() => deduplicateTracks(likedTracksList), [likedTracksList]);
  const uniqueOfflineTracks = useMemo(() => deduplicateTracks(offlineTracksList), [offlineTracksList]);
  const uniqueLocalTracks = useMemo(() => deduplicateTracks(localTracks), [localTracks]);
  const uniqueActiveCustomPlaylistTracks = useMemo(() => deduplicateTracks(activeCustomPlaylistTracks), [activeCustomPlaylistTracks]);
  const uniqueGroupedHistory = useMemo(() => ({
    today: deduplicateTracks(groupedHistory.today),
    yesterday: deduplicateTracks(groupedHistory.yesterday),
    earlier: deduplicateTracks(groupedHistory.earlier)
  }), [groupedHistory]);

  // Helper render track item with clean minimalist styling
  const renderTrackItem = (track, idx, extraClass = '', prefix = 'trk') => {
    const isCurrent = currentTrack?.id === track.id;
    const isTrackLiked = likedTrackIds.includes(track.id);
    const isOffline = cachedTrackIds.includes(track.id);

    return (
      <div
        key={`${prefix}-${track.id}-${idx}`}
        onClick={() => {
          playTrack(track);
          setIsFullScreenOpen(true);
        }}
        className={`flex items-center justify-between p-3 sm:p-3.5 transition-colors cursor-pointer group rounded-2xl border ${
          isCurrent 
            ? isDark ? 'bg-zinc-900 border-zinc-700' : 'bg-zinc-100 border-zinc-300'
            : isDark ? 'border-transparent hover:bg-zinc-900/60' : 'border-transparent hover:bg-zinc-100/80'
        } ${extraClass}`}
      >
        {/* Left: # or Soundwave + Cover + Title */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-3">
          <div className="w-6 text-center text-xs font-mono shrink-0">
            {isCurrent && isPlaying ? (
              <div className="flex items-end justify-center gap-[2px] h-4">
                <span className={`w-1 rounded-full h-2 animate-[wave_0.8s_ease-in-out_infinite] ${isDark ? 'bg-white' : 'bg-black'}`} />
                <span className={`w-1 rounded-full h-4 animate-[wave_1.2s_ease-in-out_infinite_0.2s] ${isDark ? 'bg-zinc-300' : 'bg-zinc-700'}`} />
                <span className={`w-1 rounded-full h-3 animate-[wave_0.9s_ease-in-out_infinite_0.4s] ${isDark ? 'bg-zinc-400' : 'bg-zinc-500'}`} />
              </div>
            ) : (
              <span className={`group-hover:hidden ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>{idx + 1}</span>
            )}
            <Play className={`w-4 h-4 hidden group-hover:block mx-auto ${isDark ? 'text-white fill-white' : 'text-black fill-black'}`} />
          </div>

          <div className={`w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border shadow-sm ${
            isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-zinc-100'
          }`}>
            <img
              src={getHighResThumbnail(track.cover, track.id)}
              alt={track.title}
              onError={handleCoverImageError}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className={`text-xs sm:text-sm font-bold truncate ${
                isCurrent 
                  ? isDark ? 'text-white font-extrabold' : 'text-black font-extrabold'
                  : isDark ? 'text-zinc-200 group-hover:text-white' : 'text-zinc-800 group-hover:text-black'
              }`}>
                {track.title}
              </h4>
              {isOffline && (
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                }`}>
                  SAVED
                </span>
              )}
              {track.source === 'local' && (
                <span className={`shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                  isDark ? 'bg-zinc-800 text-zinc-300 border-zinc-700' : 'bg-zinc-200 text-zinc-700 border-zinc-300'
                }`}>
                  LOCAL
                </span>
              )}
            </div>
            <p className={`text-[11px] sm:text-xs truncate mt-0.5 ${
              isDark ? 'text-zinc-400' : 'text-zinc-500'
            }`}>
              {track.artist}
            </p>
          </div>
        </div>

        {/* Middle: Album Name */}
        <div className={`hidden md:block w-1/4 text-xs truncate pr-4 ${
          isDark ? 'text-zinc-400' : 'text-zinc-500'
        }`}>
          {track.album || 'Masakali'}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">

          {/* Like Heart */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              toggleLike(track.id);
            }}
            className={`p-2 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
            title="Like"
          >
            <Heart
              className={`w-4 h-4 ${isTrackLiked ? 'fill-rose-500 text-rose-500' : 'opacity-60 hover:opacity-100'}`}
            />
          </button>

          {/* 3-Dot Options Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionTrack(track);
            }}
            className={`p-2 transition-colors ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <span className={`text-xs font-mono w-10 text-right hidden sm:inline ${
            isDark ? 'text-zinc-400' : 'text-zinc-500'
          }`}>
            {track.durationFormatted}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className={`relative min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-zinc-950'} flex flex-col overflow-x-hidden transition-colors duration-200`}>

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className={`fixed top-5 left-1/2 -translate-x-1/2 z-50 text-xs font-semibold px-4 py-2.5 rounded-full border shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 ${
          isDark ? 'bg-zinc-900 text-white border-zinc-700' : 'bg-white text-black border-zinc-300'
        }`}>
          <span className={`w-2 h-2 rounded-full ${isDark ? 'bg-white' : 'bg-black'} animate-pulse`} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Main App Layout: Left Sidebar + Central Feed */}
      <div className="flex-1 flex overflow-hidden">

        {/* Desktop Left Sidebar */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={(tab) => {
            setCurrentTab(tab);
            if (tab === 'library') setActivePlaylistId(null);
          }}
          onOpenStudio={() => setIsStudioOpen(true)}
          onOpenQueue={() => setIsQueueOpen(true)}
          onOpenStats={() => setIsStatsOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          likedCount={likedTrackIds.length}
          offlineCount={cachedTrackIds.length}
          localCount={localTracks.length}
          queueCount={queue.length}
          onSelectPlaylist={handlePlaylistClick}
          onLocalFilesSelect={handleLocalFilesSelect}
          onShareApp={handleShareApp}
          onOpenSupport={() => setIsSupportModalOpen(true)}
          onOpenDownload={() => setIsDownloadModalOpen(true)}
          isInstalled={isInstalled}
        />

        {/* Central Scrollable Feed */}
        <main className="flex-1 overflow-y-auto pb-40 md:pb-28 px-4 sm:px-6 lg:px-8 pt-2 sm:pt-4 space-y-8">

          {/* Minimal Sticky Top Header: Logo + Search + Settings */}
          <div className={`sticky top-0 z-30 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 backdrop-blur-2xl border-b transition-colors ${
            isDark ? 'bg-black/85 border-white/5' : 'bg-white/85 border-zinc-200/80'
          }`}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex-1">
                <MasakaliHeader
                  onOpenSearch={() => {
                    setCurrentTab('search');
                    setTimeout(() => globalSearchInputRef.current?.focus(), 120);
                  }}
                  onOpenSettings={() => setIsSettingsOpen(true)}
                />
              </div>

              {/* Render Cold-Start Wake-Up Status Pill */}
              {isWakingServer && (
                <div
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium shrink-0 animate-pulse ${
                    isDark
                      ? 'bg-zinc-900/90 border-zinc-700 text-zinc-300'
                      : 'bg-zinc-100 border-zinc-300 text-zinc-700'
                  }`}
                  role="status"
                  aria-live="polite"
                >
                  <RefreshCw className="w-3 h-3 animate-spin" />
                  <span className="hidden sm:inline">Waking up music server...</span>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. DEDICATED HOME VIEW (Airy, Spacious 3-Section Layout) */}
          {/* ========================================================= */}
          {currentTab === 'home' && (
            <div className="space-y-8 animate-in fade-in duration-300">

              {/* 1. Your Artists (Clean Horizontal Circular Avatars) */}
              {uniqueTrendingTracks.length > 0 && (
                <section className="space-y-3.5">
                  <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                    Your Artists
                  </h3>

                  <div className="flex items-center gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {Array.from(
                      new Map(
                        uniqueTrendingTracks
                          .filter((t) => t.artist)
                          .map((t) => [t.artist.split(',')[0].trim(), t])
                      ).entries()
                    )
                      .slice(0, 10)
                      .map(([artistName, track]) => {
                        const isArtistPlaying =
                          isPlaying &&
                          currentTrack?.artist &&
                          currentTrack.artist.toLowerCase().includes(artistName.toLowerCase());
                        return (
                          <button
                            key={`artist-${artistName}`}
                            onClick={() => {
                              setSearchQuery(artistName);
                              setCurrentTab('search');
                            }}
                            className="group shrink-0 flex flex-col items-center gap-2 w-20 sm:w-24 snap-start text-center focus:outline-none"
                          >
                            <div
                              className={`relative w-20 h-20 sm:w-24 sm:h-24 rounded-full overflow-hidden transition-all duration-300 shadow-md ${
                                isArtistPlaying
                                  ? isDark
                                    ? 'ring-2 ring-white ring-offset-2 ring-offset-black'
                                    : 'ring-2 ring-black ring-offset-2 ring-offset-white'
                                  : isDark
                                    ? 'ring-1 ring-white/10 group-hover:ring-white/30'
                                    : 'ring-1 ring-black/10 group-hover:ring-black/30'
                              }`}
                            >
                              <img
                                src={getHighResThumbnail(track.cover, track.id)}
                                alt={artistName}
                                onError={handleCoverImageError}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              {isArtistPlaying && (
                                <div className="absolute inset-0 bg-black/35 flex items-end justify-center gap-1 pb-3">
                                  <span className="w-1 h-3 bg-white rounded-full animate-eq-1" />
                                  <span className="w-1 h-4 bg-white rounded-full animate-eq-2" />
                                  <span className="w-1 h-2.5 bg-white rounded-full animate-eq-3" />
                                </div>
                              )}
                            </div>
                            <span className={`text-xs font-semibold truncate w-full transition-colors ${
                              isDark ? 'text-zinc-300 group-hover:text-white' : 'text-zinc-700 group-hover:text-black'
                            }`}>
                              {artistName}
                            </span>
                          </button>
                        );
                      })}
                  </div>
                </section>
              )}

              {/* 2. Made For You (2-Column Clean Song Cards) */}
              {(isLoadingTrending || uniqueRecentlyPlayed.length > 0 || uniqueTrendingTracks.length > 0) && (
                <section className="space-y-3.5">
                  <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                    Made For You
                  </h3>

                  {isLoadingTrending && uniqueRecentlyPlayed.length === 0 && uniqueTrendingTracks.length === 0 ? (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                      {[0, 1, 2, 3].map((i) => (
                        <div
                          key={`skeleton-card-${i}`}
                          className={`p-2.5 rounded-2xl border space-y-2.5 animate-pulse ${
                            isDark ? 'bg-zinc-900/40 border-white/5' : 'bg-zinc-100/70 border-zinc-200/70'
                          }`}
                        >
                          <div className={`aspect-square w-full rounded-xl ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                          <div className={`h-3.5 w-3/4 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                          <div className={`h-3 w-1/2 rounded ${isDark ? 'bg-zinc-800/70' : 'bg-zinc-200/70'}`} />
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4">
                      {(uniqueRecentlyPlayed.length > 0 ? uniqueRecentlyPlayed : uniqueTrendingTracks)
                        .slice(0, 4)
                        .map((track, idx) => (
                          <div
                            key={`made-for-you-${track.id}-${idx}`}
                            onClick={() => {
                              playTrack(track);
                              setIsFullScreenOpen(true);
                            }}
                            className={`group p-2.5 rounded-2xl border cursor-pointer transition-all duration-300 space-y-2.5 ${
                              isDark
                                ? 'bg-zinc-900/50 hover:bg-zinc-900 border-white/5 hover:border-white/15'
                                : 'bg-white hover:bg-zinc-50 border-zinc-200/80 hover:border-zinc-300 shadow-sm'
                            }`}
                          >
                            <div className="aspect-square w-full rounded-xl overflow-hidden relative shadow-md">
                              <img
                                src={getHighResThumbnail(track.cover, track.id)}
                                alt={track.title}
                                onError={handleCoverImageError}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                loading="lazy"
                              />
                              <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center shadow-xl ${
                                  isDark ? 'bg-white text-black' : 'bg-black text-white'
                                }`}>
                                  <Play className={`w-4 h-4 translate-x-0.5 ${isDark ? 'fill-black' : 'fill-white'}`} />
                                </div>
                              </div>
                            </div>
                            <div className="px-0.5">
                              <h4 className={`text-xs sm:text-sm font-bold truncate ${
                                isDark ? 'text-white' : 'text-zinc-950'
                              }`}>
                                {track.title}
                              </h4>
                              <p className={`text-[11px] sm:text-xs truncate mt-0.5 ${
                                isDark ? 'text-zinc-400' : 'text-zinc-500'
                              }`}>
                                {track.artist}
                              </p>
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </section>
              )}

              {/* 3. Trending Now (Clean Spacious Rows: Cover, Title, Artist, Single ⋮ Icon) */}
              <section className="space-y-3.5">
                <h3 className={`text-lg font-bold tracking-tight ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                  Trending Now
                </h3>

                {isLoadingTrending && uniqueTrendingTracks.length === 0 ? (
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-zinc-950/60 border-white/5 divide-white/5' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                  }`}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={`skeleton-row-${i}`} className="flex items-center gap-3.5 px-3.5 py-3 animate-pulse">
                        <div className={`w-12 h-12 rounded-xl shrink-0 ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                        <div className="flex-1 space-y-2">
                          <div className={`h-3.5 w-2/3 rounded ${isDark ? 'bg-zinc-800' : 'bg-zinc-200'}`} />
                          <div className={`h-3 w-1/3 rounded ${isDark ? 'bg-zinc-800/70' : 'bg-zinc-200/70'}`} />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : uniqueTrendingTracks.length === 0 ? (
                  <div className={`rounded-2xl border p-6 text-center space-y-3 ${
                    isDark ? 'bg-zinc-950/60 border-white/5 text-zinc-400' : 'bg-white border-zinc-200 text-zinc-500'
                  }`}>
                    <p className="text-sm">Unable to load trending tracks right now.</p>
                    <button
                      onClick={() => {
                        setIsLoadingTrending(true);
                        fetchTrendingMusic().then((data) => {
                          if (Array.isArray(data) && data.length > 0) setTrendingTracks(data);
                          setIsLoadingTrending(false);
                        });
                      }}
                      className={`px-4 py-2 rounded-full text-xs font-bold transition-transform active:scale-95 ${
                        isDark ? 'bg-white text-black' : 'bg-black text-white'
                      }`}
                    >
                      Retry
                    </button>
                  </div>
                ) : (
                  <div className={`rounded-2xl border overflow-hidden divide-y ${
                    isDark ? 'bg-zinc-950/60 border-white/5 divide-white/5' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                  }`}>
                    {uniqueTrendingTracks.slice(0, 10).map((t, idx) => {
                      const isCurrent = currentTrack?.id === t.id;
                      return (
                        <div
                          key={`trending-clean-${t.id}-${idx}`}
                          onClick={() => playTrack(t)}
                          className={`flex items-center justify-between gap-3 px-3.5 py-3 cursor-pointer transition-colors ${
                            isCurrent
                              ? isDark ? 'bg-white/10' : 'bg-zinc-100'
                              : isDark ? 'hover:bg-white/5' : 'hover:bg-zinc-50'
                          }`}
                        >
                          <div className="flex items-center gap-3.5 min-w-0 flex-1">
                            <img
                              src={getHighResThumbnail(t.cover, t.id)}
                              alt={t.title}
                              onError={handleCoverImageError}
                              className="w-12 h-12 rounded-xl object-cover shrink-0 shadow-sm"
                              loading="lazy"
                            />
                            <div className="min-w-0 flex-1">
                              <h4 className={`text-sm font-bold truncate ${
                                isDark ? 'text-white' : 'text-zinc-950'
                              }`}>
                                {t.title}
                              </h4>
                              <p className={`text-xs truncate mt-0.5 ${
                                isDark ? 'text-zinc-400' : 'text-zinc-500'
                              }`}>
                                {t.artist}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionTrack(t);
                            }}
                            className={`p-2 rounded-full shrink-0 transition-colors ${
                              isDark ? 'text-zinc-400 hover:text-white hover:bg-white/10' : 'text-zinc-500 hover:text-black hover:bg-zinc-200/70'
                            }`}
                            title="Track Options"
                          >
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>

            </div>
          )}

          {/* ========================================================= */}
          {/* 2. DEDICATED SEARCH VIEW                                 */}
          {/* ========================================================= */}
          {currentTab === 'search' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Search Bar & Smart Suggestions */}
              <div className="space-y-2.5 max-w-2xl">
                <div className="relative">
                  <Search className={`w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none ${
                    isDark ? 'text-zinc-500' : 'text-zinc-400'
                  }`} />
                  <input
                    type="text"
                    autoFocus
                    placeholder={isBackendOnline ? "Search songs, artists, albums, or lyrics..." : "Search local tracks..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full text-sm pl-11 pr-11 py-3.5 rounded-2xl border focus:outline-none transition-all shadow-sm ${
                      isDark 
                        ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-500' 
                        : 'bg-zinc-100 border-zinc-200 text-zinc-950 placeholder-zinc-400 focus:border-zinc-400'
                    }`}
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchSuggestions([]);
                        setCorrectedSearchQuery(null);
                      }}
                      className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1 transition-colors ${
                        isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Smart Search Suggestion Pills */}
                {searchSuggestions.length > 0 && (
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5">
                    {searchSuggestions.slice(0, 6).map((sug, i) => (
                      <button
                        key={`sug-${sug}-${i}`}
                        onClick={() => {
                          setSearchQuery(sug);
                          setSearchSuggestions([]);
                        }}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border flex items-center gap-1.5 transition-all shrink-0 ${
                          isDark 
                            ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800' 
                            : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black hover:bg-zinc-200'
                        }`}
                      >
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Auto-Corrected Query Banner */}
                {correctedSearchQuery && (
                  <div className={`p-3 rounded-xl border text-xs flex items-center justify-between animate-in fade-in ${
                    isDark ? 'bg-zinc-900 border-zinc-700 text-zinc-200' : 'bg-zinc-100 border-zinc-300 text-zinc-800'
                  }`}>
                    <div className="flex items-center gap-2">
                      <span>
                        Showing songs for <strong className="underline">{correctedSearchQuery}</strong>
                        <span className={`ml-1.5 hidden sm:inline ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>(Auto-corrected)</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setCorrectedSearchQuery(null)}
                      className={`text-[11px] ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-500 hover:text-black'}`}
                    >
                      Dismiss
                    </button>
                  </div>
                )}
              </div>

              {/* Search Status & Masakali Animated Inline Loader */}
              {isSearching && (
                <div className="py-2 animate-in fade-in duration-200">
                  <MasakaliInlineLoader
                    message="Searching online catalog..."
                    size="sm"
                  />
                </div>
              )}

              {/* Live Search Results */}
              {searchQuery.trim().length > 0 ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Results for "{searchQuery}" ({searchResults.length})
                    </h3>
                  </div>

                  {searchResults.length === 0 && !isSearching ? (
                    <div className={`p-12 text-center rounded-2xl border space-y-2 ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <Music className={`w-8 h-8 mx-auto ${isDark ? 'text-zinc-600' : 'text-zinc-400'}`} />
                      <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>No tracks found</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Try a different spelling or search for an artist</p>
                    </div>
                  ) : (
                    <div className={`rounded-2xl border overflow-hidden divide-y ${
                      isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-850' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                    }`}>
                      {uniqueSearchResults.map((t, idx) => renderTrackItem(t, idx, '', 'search-res'))}
                    </div>
                  )}
                </div>
              ) : (
                /* Browse Genre Cards */
                <div className="space-y-4">
                  <h3 className={`text-base font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                    <Compass className="w-4 h-4 opacity-70" />
                    <span>Browse All Genres & Moods</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {VIBE_CATEGORIES.map((cat, i) => (
                      <button
                        key={`vibe-cat-${cat.id}-${i}`}
                        onClick={() => setSearchQuery(cat.name)}
                        className={`p-4 rounded-2xl border text-left transition-all hover:scale-[1.01] shadow-sm ${
                          isDark 
                            ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900' 
                            : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100'
                        }`}
                      >
                        <h4 className={`text-sm font-bold ${isDark ? 'text-white' : 'text-zinc-950'}`}>{cat.name}</h4>
                        <p className={`text-[11px] mt-1 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>Explore hits</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}

          {/* ========================================================= */}
          {/* 3. DEDICATED LIBRARY VIEW                                */}
          {/* ========================================================= */}
          {currentTab === 'library' && (
            <div className="space-y-6 animate-in fade-in duration-300">

              {/* Library Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h1 className={`text-2xl font-black flex items-center gap-2.5 ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                    <LibraryIcon className={`w-6 h-6 ${isDark ? 'text-zinc-200' : 'text-zinc-800'}`} />
                    <span>Your Library</span>
                  </h1>
                  <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Device songs, playlists, saved tracks, and listening history
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Listening Stats Trigger */}
                  <button
                    onClick={() => setIsStatsOpen(true)}
                    className={`px-3.5 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-sm ${
                      isDark ? 'bg-zinc-900 hover:bg-zinc-800 border-zinc-800 text-white' : 'bg-zinc-100 hover:bg-zinc-200 border-zinc-200 text-zinc-900'
                    }`}
                    title="View Your Music Stats & Personal Wrapped"
                  >
                    <BarChart2 className={`w-4 h-4 ${isDark ? 'text-white' : 'text-black'}`} />
                    <span>Listening Stats</span>
                  </button>

                  {/* 1-Tap Play Local Audio Device Button */}
                  <label className={`cursor-pointer px-4 py-2.5 rounded-xl border font-bold text-xs flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-sm ${
                    isDark ? 'bg-white hover:bg-zinc-200 text-black border-white' : 'bg-black hover:bg-zinc-800 text-white border-black'
                  }`}>
                    <FolderOpen className={`w-4 h-4 ${isDark ? 'text-black' : 'text-white'}`} />
                    <span>Play Local Audio</span>
                    <input
                      type="file"
                      accept="audio/*"
                      multiple
                      onChange={handleLocalFilesSelect}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* Sub-Tabs: Liked, Offline, Local Audio, History, Playlists */}
              <div className={`flex items-center gap-2 pb-1 border-b overflow-x-auto scrollbar-none ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <button
                  onClick={() => {
                    setLibrarySubTab('liked');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    librarySubTab === 'liked' && !activePlaylistId
                      ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                      : isDark ? 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                  }`}
                >
                  Liked Songs ({likedTrackIds.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('offline');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    librarySubTab === 'offline' && !activePlaylistId
                      ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                      : isDark ? 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                  }`}
                >
                  Offline ({cachedTrackIds.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('local');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    librarySubTab === 'local' && !activePlaylistId
                      ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                      : isDark ? 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                  }`}
                >
                  Local Audio ({localTracks.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('history');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    librarySubTab === 'history' && !activePlaylistId
                      ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                      : isDark ? 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                  }`}
                >
                  History ({listeningHistory.length})
                </button>

                <button
                  onClick={() => setLibrarySubTab('playlists')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
                    librarySubTab === 'playlists' || activePlaylistId
                      ? isDark ? 'bg-white text-black shadow-sm' : 'bg-black text-white shadow-sm'
                      : isDark ? 'bg-zinc-900/60 text-zinc-400 hover:text-white border border-zinc-800' : 'bg-zinc-100 text-zinc-600 hover:text-black border border-zinc-200'
                  }`}
                >
                  Playlists ({customPlaylists.length})
                </button>
              </div>

              {/* 3a. Liked Songs List */}
              {librarySubTab === 'liked' && !activePlaylistId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {likedTracksList.length} Liked Songs
                    </h3>
                    {likedTracksList.length > 0 && (
                      <button
                        onClick={() => playTrack(likedTracksList[0])}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform ${
                          isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                        }`}
                      >
                        <Play className={`w-3 h-3 ${isDark ? 'fill-black' : 'fill-white'}`} />
                        <span>Play All</span>
                      </button>
                    )}
                  </div>

                  {likedTracksList.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border space-y-2 ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <Heart className="w-8 h-8 text-zinc-400 mx-auto" />
                      <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>No liked songs yet</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Tap the heart icon on any song to save it here</p>
                    </div>
                  ) : (
                    <div className={`rounded-2xl border overflow-hidden divide-y ${
                      isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                    }`}>
                      {uniqueLikedTracks.map((t, idx) => renderTrackItem(t, idx, '', 'liked'))}
                    </div>
                  )}
                </div>
              )}

              {/* 3b. Offline Tracks List */}
              {librarySubTab === 'offline' && !activePlaylistId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                      {offlineTracksList.length} Downloaded Songs
                    </h3>
                    {offlineTracksList.length > 0 && (
                      <button
                        onClick={() => playTrack(offlineTracksList[0])}
                        className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform ${
                          isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                        }`}
                      >
                        <Play className={`w-3 h-3 ${isDark ? 'fill-black' : 'fill-white'}`} />
                        <span>Play Offline</span>
                      </button>
                    )}
                  </div>

                  {offlineTracksList.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border space-y-2 ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <Download className="w-8 h-8 text-zinc-400 mx-auto" />
                      <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>No offline downloads</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Tap the 3 dots or download icon on any song to cache it for zero-internet playback</p>
                    </div>
                  ) : (
                    <div className={`rounded-2xl border overflow-hidden divide-y ${
                      isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                    }`}>
                      {uniqueOfflineTracks.map((t, idx) => renderTrackItem(t, idx, '', 'offline'))}
                    </div>
                  )}
                </div>
              )}

              {/* 3c. Local Device Audio Files List */}
              {librarySubTab === 'local' && !activePlaylistId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-700'}`}>
                        {localTracks.length} Local Audio Files
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Plays directly from your device with EQ, Slowed+Reverb & 8D
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className={`cursor-pointer px-3.5 py-1.5 rounded-full border font-bold text-xs flex items-center gap-1.5 transition-all ${
                        isDark ? 'bg-zinc-900 hover:bg-zinc-800 text-white border-zinc-800' : 'bg-zinc-100 hover:bg-zinc-200 text-black border-zinc-200'
                      }`}>
                        <FolderOpen className="w-3.5 h-3.5" />
                        <span>+ Add More</span>
                        <input
                          type="file"
                          accept="audio/*"
                          multiple
                          onChange={handleLocalFilesSelect}
                          className="hidden"
                        />
                      </label>

                      {localTracks.length > 0 && (
                        <button
                          onClick={() => playTrack(localTracks[0])}
                          className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform ${
                            isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                          }`}
                        >
                          <Play className={`w-3 h-3 ${isDark ? 'fill-black' : 'fill-white'}`} />
                          <span>Play All</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {localTracks.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border space-y-3 ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <FolderOpen className={`w-10 h-10 mx-auto ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`} />
                      <div>
                        <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>No local audio loaded</h4>
                        <p className={`text-xs mt-1 max-w-sm mx-auto ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                          Select any MP3, WAV, or M4A files on your device to play them with zero internet and live audio editing.
                        </p>
                      </div>
                      <label className={`cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs shadow-sm hover:scale-105 active:scale-95 transition-all ${
                        isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                      }`}>
                        <FolderOpen className={`w-4 h-4 ${isDark ? 'fill-black' : 'fill-white'}`} />
                        <span>Choose Audio Files from Device</span>
                        <input
                          type="file"
                          accept="audio/*"
                          multiple
                          onChange={handleLocalFilesSelect}
                          className="hidden"
                        />
                      </label>
                    </div>
                  ) : (
                    <div className={`rounded-2xl border overflow-hidden divide-y ${
                      isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                    }`}>
                      {uniqueLocalTracks.map((t, idx) => renderTrackItem(t, idx, '', 'local'))}
                    </div>
                  )}
                </div>
              )}

              {/* 3e. Listening History List (Grouped by Today, Yesterday, Earlier) */}
              {librarySubTab === 'history' && !activePlaylistId && (
                <div className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>
                        <Clock className="w-4 h-4" />
                        <span>Listening History ({listeningHistory.length})</span>
                      </h3>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>
                        Last 100 played songs grouped chronologically
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {listeningHistory.length > 0 && (
                        <>
                          <button
                            onClick={handleClearHistory}
                            className={`px-3.5 py-1.5 rounded-full border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                              isDark ? 'bg-zinc-900 hover:bg-rose-950/40 text-zinc-400 hover:text-rose-400 border-zinc-800' : 'bg-zinc-100 hover:bg-rose-50 text-zinc-600 hover:text-rose-600 border-zinc-200'
                            }`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear History</span>
                          </button>

                          <button
                            onClick={() => playTrack(listeningHistory[0])}
                            className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform ${
                              isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                            }`}
                          >
                            <Play className={`w-3 h-3 ${isDark ? 'fill-black' : 'fill-white'}`} />
                            <span>Play All</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {listeningHistory.length === 0 ? (
                    <div className={`p-12 text-center rounded-2xl border space-y-2 ${
                      isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}>
                      <Clock className="w-8 h-8 text-zinc-400 mx-auto" />
                      <h4 className={`text-sm font-bold ${isDark ? 'text-zinc-300' : 'text-zinc-800'}`}>No listening history yet</h4>
                      <p className={`text-xs ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Songs you stream or play from your local files will appear here automatically</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Today */}
                      {uniqueGroupedHistory.today.length > 0 && (
                        <div className="space-y-2">
                          <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-1 ${
                            isDark ? 'text-white' : 'text-zinc-900'
                          }`}>
                            <span>Today</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({uniqueGroupedHistory.today.length})</span>
                          </div>
                          <div className={`rounded-2xl border overflow-hidden divide-y ${
                            isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                          }`}>
                            {uniqueGroupedHistory.today.map((t, idx) => renderTrackItem(t, idx, '', 'hist-today'))}
                          </div>
                        </div>
                      )}

                      {/* Yesterday */}
                      {uniqueGroupedHistory.yesterday.length > 0 && (
                        <div className="space-y-2">
                          <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-1 ${
                            isDark ? 'text-zinc-400' : 'text-zinc-600'
                          }`}>
                            <span>Yesterday</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({uniqueGroupedHistory.yesterday.length})</span>
                          </div>
                          <div className={`rounded-2xl border overflow-hidden divide-y ${
                            isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                          }`}>
                            {uniqueGroupedHistory.yesterday.map((t, idx) => renderTrackItem(t, idx, '', 'hist-yest'))}
                          </div>
                        </div>
                      )}

                      {/* Earlier */}
                      {uniqueGroupedHistory.earlier.length > 0 && (
                        <div className="space-y-2">
                          <div className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 px-1 ${
                            isDark ? 'text-zinc-500' : 'text-zinc-400'
                          }`}>
                            <span>Earlier</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({uniqueGroupedHistory.earlier.length})</span>
                          </div>
                          <div className={`rounded-2xl border overflow-hidden divide-y ${
                            isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                          }`}>
                            {uniqueGroupedHistory.earlier.map((t, idx) => renderTrackItem(t, idx, '', 'hist-earlier'))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* 3d. Playlists List & Detail View */}
              {(librarySubTab === 'playlists' || activePlaylistId) && (
                <div className="space-y-4">

                  {/* Active Playlist Detail */}
                  {activePlaylistId && activeCustomPlaylist ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => setActivePlaylistId(null)}
                          className={`text-xs font-semibold hover:underline ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'}`}
                        >
                          ← Back to All Playlists
                        </button>
                        {activeCustomPlaylistTracks.length > 0 && (
                          <button
                            onClick={() => playTrack(activeCustomPlaylistTracks[0])}
                            className={`px-3.5 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 shadow-sm hover:scale-105 transition-transform ${
                              isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                            }`}
                          >
                            <Play className={`w-3 h-3 ${isDark ? 'fill-black' : 'fill-white'}`} />
                            <span>Play Playlist</span>
                          </button>
                        )}
                      </div>

                      <div className={`p-5 rounded-2xl border space-y-1 ${
                        isDark ? 'bg-zinc-900/60 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-zinc-900'
                      }`}>
                        <h2 className="text-xl font-bold">{activeCustomPlaylist.title}</h2>
                        <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{activeCustomPlaylistTracks.length} tracks</p>
                      </div>

                      {activeCustomPlaylistTracks.length === 0 ? (
                        <div className={`p-8 text-center rounded-2xl border text-xs ${
                          isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
                        }`}>
                          This playlist is empty. Tap the 3 dots (⋮) on any song to add it!
                        </div>
                      ) : (
                        <div className={`rounded-2xl border overflow-hidden divide-y ${
                          isDark ? 'bg-zinc-950/80 border-zinc-800 divide-zinc-800/60' : 'bg-white border-zinc-200 divide-zinc-100 shadow-sm'
                        }`}>
                          {uniqueActiveCustomPlaylistTracks.map((t, idx) => renderTrackItem(t, idx, '', 'cpl-track'))}
                        </div>
                      )}
                    </div>
                  ) : (
                    /* Playlists Grid */
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {customPlaylists.map((pl, idx) => (
                        <div
                          key={`cpl-${pl.id}-${idx}`}
                          onClick={() => setActivePlaylistId(pl.id)}
                          className={`p-4 rounded-2xl border cursor-pointer transition-all space-y-3 ${
                            isDark 
                              ? 'bg-zinc-900/40 hover:bg-zinc-900 border-zinc-800 hover:border-zinc-700' 
                              : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200 hover:border-zinc-300 shadow-sm'
                          }`}
                        >
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center border ${
                            isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-200 border-zinc-300 text-zinc-900'
                          }`}>
                            <Music className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-zinc-950'}`}>{pl.title}</h4>
                            <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{pl.trackIds?.length || 0} songs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

          {/* Clear Footer Disclaimer for Google Safe Browsing / Fair Use */}
          <footer className={`pt-10 pb-16 text-center text-xs transition-colors border-t mt-12 ${
            isDark ? 'border-zinc-900 text-zinc-500' : 'border-zinc-200 text-zinc-400'
          }`}>
            <p className="max-w-xl mx-auto px-4 leading-relaxed text-[11px]">
              Masakali is an educational open-source audio player interface. All media belongs to respective owners.
            </p>
          </footer>

        </main>
      </div>

      {/* Mobile Bottom Tab Bar */}
      <MobileTabBar
        currentTab={currentTab}
        setCurrentTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'library') setActivePlaylistId(null);
        }}
        onOpenStudio={() => setIsStudioOpen(true)}
        onOpenQueue={() => setIsQueueOpen(true)}
        likedCount={likedTrackIds.length}
        queueCount={queue.length}
      />

      {/* Persistent Bottom Mini-Player Bar */}
      <MiniPlayer
        engine={engine}
        isLyricsOpen={isLyricsOpen}
        setIsLyricsOpen={setIsLyricsOpen}
        isStudioOpen={isStudioOpen}
        setIsStudioOpen={setIsStudioOpen}
        isQueueOpen={isQueueOpen}
        setIsQueueOpen={setIsQueueOpen}
        onOpenFullScreen={() => setIsFullScreenOpen(true)}
        likedTrackIds={likedTrackIds}
        onToggleLike={toggleLike}
        onShareApp={handleShareApp}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* Full-Screen Now Playing View */}
      <FullScreenPlayer
        isOpen={isFullScreenOpen}
        onClose={() => setIsFullScreenOpen(false)}
        engine={engine}
        likedTrackIds={likedTrackIds}
        onToggleLike={toggleLike}
        ambientGlow={ambientGlow}
        onOpenClipper={(t) => setClipperTrack(t || currentTrack)}
        onOpenLyricCard={(idx) => {
          setLyricCardInitialIndex(idx);
          setIsLyricCardOpen(true);
        }}
        onShareApp={handleShareApp}
        onOpenSupport={() => setIsSupportModalOpen(true)}
        onOpenSearch={() => {
          setCurrentTab('search');
          setTimeout(() => globalSearchInputRef.current?.focus(), 150);
        }}
      />

      {/* 3-Dot Track Action Sheet (invoked from track rows) */}
      <TrackActionSheet
        isOpen={!!actionTrack}
        onClose={() => setActionTrack(null)}
        track={actionTrack}
        engine={engine}
        isLiked={actionTrack ? likedTrackIds.includes(actionTrack.id) : false}
        onToggleLike={toggleLike}
        onOpenStudio={() => setIsStudioOpen(true)}
        onOpenClipper={(t) => setClipperTrack(t || currentTrack)}
        onOpenLyricCard={(idx) => {
          setLyricCardInitialIndex(idx);
          setIsLyricCardOpen(true);
        }}
        onShareApp={handleShareApp}
        onOpenSupport={() => setIsSupportModalOpen(true)}
      />

      {/* Audio Studio Drawer */}
      <AudioStudioDrawer
        isOpen={isStudioOpen}
        onClose={() => setIsStudioOpen(false)}
        engine={engine}
        onOpenClipper={(t) => setClipperTrack(t || currentTrack)}
      />

      {/* Synced Lyrics Drawer */}
      <SyncedLyricsDrawer
        isOpen={isLyricsOpen}
        onClose={() => setIsLyricsOpen(false)}
        engine={engine}
        onOpenLyricCard={(idx) => {
          setLyricCardInitialIndex(idx);
          setIsLyricCardOpen(true);
        }}
      />

      {/* Smart Queue Drawer */}
      <SmartQueueDrawer
        isOpen={isQueueOpen}
        onClose={() => setIsQueueOpen(false)}
        engine={engine}
        autoPlayRadio={autoPlayRadio}
        toggleAutoPlayRadio={toggleAutoPlayRadio}
      />

      {/* 1-Tap Ringtone & Status Clipper Modal */}
      <RingtoneClipperModal
        isOpen={!!clipperTrack}
        onClose={() => setClipperTrack(null)}
        track={clipperTrack || currentTrack}
        engine={engine}
      />

      {/* 9:16 Lyric Status Card Generator Modal */}
      <LyricStatusCardModal
        isOpen={isLyricCardOpen}
        onClose={() => setIsLyricCardOpen(false)}
        track={currentTrack}
        lyrics={currentTrack?.lyrics || []}
        initialLineIndex={lyricCardInitialIndex}
        showToast={engine.showToast}
      />

      {/* Support Developer (UPI) Modal */}
      <SupportDevModal
        isOpen={isSupportModalOpen}
        onClose={() => setIsSupportModalOpen(false)}
        showToast={engine.showToast}
      />

      {/* Dedicated Settings Drawer */}
      <SettingsDrawer
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        onOpenSupport={() => {
          setIsSettingsOpen(false);
          setIsSupportModalOpen(true);
        }}
        onShareApp={handleShareApp}
        onOpenStats={() => setIsStatsOpen(true)}
        onOpenDownload={handleOpenDownload}
        isInstalled={isInstalled}
        showToast={engine.showToast}
      />

      {/* SimpMusic-Style Listening Stats & Wrapped Analytics Modal */}
      <ListeningStatsModal
        isOpen={isStatsOpen}
        onClose={() => setIsStatsOpen(false)}
        onPlayTrack={playTrack}
        showToast={engine.showToast}
      />

      {/* Download & Install Masakali App Modal */}
      <DownloadAppModal
        isOpen={isDownloadModalOpen}
        onClose={() => setIsDownloadModalOpen(false)}
        onInstallNative={promptInstall}
        canInstallNative={canInstall}
        isInstalled={isInstalled}
        isIOS={isIOS}
      />

    </div>
  );
}
