import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search, Play, Pause, Heart, Sparkles, Sliders, Mic2,
  Disc3, Radio, Waves, Music, X, ListPlus, Download, Check,
  RefreshCw, Info, Maximize2, MoreVertical, Plus, FolderPlus,
  Clock, Flame, Headphones, Compass, Library as LibraryIcon,
  FolderOpen, Share2, BarChart2, Trash2, Zap, Moon
} from 'lucide-react';
import { useAudioEngine } from '../hooks/useAudioEngine';
import { mockTracks, quickPlaylists } from '../data/mockTracks';
import {
  searchMusic,
  fetchLyrics,
  fetchTrendingMusic,
  checkBackendStatus,
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
import MasakaliLogo from '../components/common/MasakaliLogo';
import MasakaliHeader from '../components/common/MasakaliHeader';
import { MasakaliInlineLoader } from '../components/common/SplashLoader';
import { useInstallPrompt } from '../hooks/useInstallPrompt';

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
  const engine = useAudioEngine(mockTracks);
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
  const [currentTab, setCurrentTab] = useState('home'); // 'home' | 'search' | 'library'
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [isStudioOpen, setIsStudioOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isFullScreenOpen, setIsFullScreenOpen] = useState(false);

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

  // Backend Connectivity
  const [isBackendOnline, setIsBackendOnline] = useState(false);

  // Persisted Liked Songs state in localStorage
  const [likedTrackIds, setLikedTrackIds] = useState(() => {
    try {
      const saved = localStorage.getItem('as_music_liked_tracks');
      return saved ? JSON.parse(saved) : ['track-1', 'track-3'];
    } catch (e) {
      return ['track-1', 'track-3'];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem('as_music_liked_tracks', JSON.stringify(likedTrackIds));
    } catch (e) { }
  }, [likedTrackIds]);

  const toggleLike = (trackId) => {
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

  // Check Backend Server on Mount & Fetch Trending Songs
  useEffect(() => {
    checkBackendStatus().then((status) => {
      setIsBackendOnline(status.online);
    });

    fetchTrendingMusic().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setTrendingTracks(data);
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
          { id: 'pl-favs', title: 'Favorites', trackIds: ['track-1', 'track-3'] },
          { id: 'pl-vibes', title: 'Night Vibes', trackIds: ['track-2', 'track-4'] }
        ];
        localStorage.setItem('as_music_custom_playlists', JSON.stringify(defaults));
        setCustomPlaylists(defaults);
      }
    } catch (e) { }
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
  const uniqueTrendingTracks = useMemo(() => deduplicateTracks(trendingTracks.length > 0 ? trendingTracks : tracks), [trendingTracks, tracks]);
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

  // Helper render track item with guaranteed unique composite key
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
        className={`flex items-center justify-between p-3 sm:p-3.5 hover:bg-white/[0.04] transition-colors cursor-pointer group rounded-2xl ${isCurrent ? 'bg-gradient-to-r from-cyan-500/10 via-violet-500/10 to-transparent border border-cyan-500/30' : 'border border-transparent'
          } ${extraClass}`}
      >
        {/* Left: # or Soundwave + Cover + Title */}
        <div className="flex items-center gap-3 sm:gap-4 flex-1 min-w-0 pr-3">
          <div className="w-6 text-center text-xs font-mono text-zinc-500 shrink-0">
            {isCurrent && isPlaying ? (
              <div className="flex items-end justify-center gap-[2px] h-4">
                <span className="w-1 bg-cyan-400 rounded-full h-2 animate-[wave_0.8s_ease-in-out_infinite]" />
                <span className="w-1 bg-cyan-300 rounded-full h-4 animate-[wave_1.2s_ease-in-out_infinite_0.2s]" />
                <span className="w-1 bg-violet-400 rounded-full h-3 animate-[wave_0.9s_ease-in-out_infinite_0.4s]" />
              </div>
            ) : (
              <span className="group-hover:hidden">{idx + 1}</span>
            )}
            <Play className="w-4 h-4 text-cyan-400 hidden group-hover:block mx-auto fill-cyan-400" />
          </div>

          <div className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm">
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
              <h4 className={`text-xs sm:text-sm font-bold truncate ${isCurrent ? 'text-cyan-300 font-extrabold' : 'text-white group-hover:text-cyan-200'
                }`}>
                {track.title}
              </h4>
              {isOffline && (
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  SAVED
                </span>
              )}
              {track.source === 'local' && (
                <span className="shrink-0 text-[9px] font-bold px-1.5 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  LOCAL FILE
                </span>
              )}
            </div>
            <p className="text-[11px] sm:text-xs text-zinc-400 truncate mt-0.5">
              {track.artist}
            </p>
          </div>
        </div>

        {/* Middle: Album Name */}
        <div className="hidden md:block w-1/4 text-xs text-zinc-400 truncate pr-4">
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
            className="p-2 text-zinc-400 hover:text-white"
            title="Like"
          >
            <Heart
              className={`w-4 h-4 ${isTrackLiked ? 'fill-cyan-400 text-cyan-400' : 'text-zinc-500 hover:text-zinc-300'
                }`}
            />
          </button>

          {/* 3-Dot Options Menu */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setActionTrack(track);
            }}
            className="p-2 text-zinc-400 hover:text-white transition-colors"
            title="More Options"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          <span className="text-xs font-mono text-zinc-400 w-10 text-right hidden sm:inline">
            {track.durationFormatted}
          </span>
        </div>
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[#050507] text-white flex flex-col overflow-x-hidden selection:bg-cyan-500/30 selection:text-cyan-200">

      {/* Toast Notification Banner */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#111116] text-white text-xs font-semibold px-4 py-2.5 rounded-full border border-cyan-500/40 shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Dynamic Ambient Background Glow */}
      <div
        className="fixed inset-0 pointer-events-none transition-all duration-1000 -z-10"
        style={{
          background: `radial-gradient(circle at 50% 15%, ${ambientGlow.primary} 0%, ${ambientGlow.secondary} 45%, #050507 90%)`
        }}
      />

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
        <main className="flex-1 overflow-y-auto pb-36 md:pb-28 p-4 sm:p-6 lg:p-8 space-y-6">

          {/* Persistent Global Top Sticky Bar: MasakaliHeader + Search Bar */}
          <div className="sticky top-0 z-30 -mt-2 sm:-mt-4 pt-2 sm:pt-4 pb-3 bg-[#050507]/95 backdrop-blur-2xl border-b border-white/[0.06] space-y-3">
            {/* Signature Top Brand Bar (Visible on Mobile & Desktop) */}
            <MasakaliHeader
              onSearch={(text) => {
                setSearchQuery(text);
                setCurrentTab('search');
              }}
              onFocusSearch={() => {
                globalSearchInputRef.current?.focus();
              }}
              onShareApp={handleShareApp}
              onOpenSupport={() => setIsSupportModalOpen(true)}
              onOpenDownload={handleOpenDownload}
              isInstalled={isInstalled}
              showToast={engine.showToast}
            />

            {/* Global Top Search Bar */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1 group">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400 group-focus-within:text-cyan-400 transition-colors" />
                <input
                  ref={globalSearchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    if (currentTab !== 'search' && e.target.value.trim()) {
                      setCurrentTab('search');
                    }
                  }}
                  onFocus={() => {
                    if (searchQuery.trim() && currentTab !== 'search') {
                      setCurrentTab('search');
                    }
                  }}
                  placeholder="Search songs, artists, Bollywood, Lo-Fi, 8D audio..."
                  className="w-full pl-10 pr-10 py-2.5 rounded-2xl bg-white/[0.05] hover:bg-white/[0.08] focus:bg-white/[0.1] border border-white/10 focus:border-cyan-400/50 text-white placeholder-zinc-500 text-xs sm:text-sm font-medium focus:outline-none transition-all shadow-inner"
                />
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery('');
                      setSearchResults([]);
                      setSearchSuggestions([]);
                      setCorrectedSearchQuery(null);
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-zinc-400 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Continuous Auto-Mix Radio Indicator Pill */}
              <button
                onClick={toggleAutoPlayRadio}
                className={`hidden sm:flex items-center gap-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition-all shrink-0 ${autoPlayRadio
                    ? 'bg-cyan-500/15 border-cyan-400/40 text-cyan-300 shadow-[0_0_12px_rgba(6,182,212,0.25)]'
                    : 'bg-white/[0.04] border-white/10 text-zinc-400 hover:text-white'
                  }`}
                title="Continuous Smart Auto-Mix: automatically queues matching tracks"
              >
                <Radio className={`w-3.5 h-3.5 ${autoPlayRadio ? 'text-cyan-400 animate-pulse' : 'text-zinc-500'}`} />
                <span className="font-mono">∞ Auto-Mix: {autoPlayRadio ? 'ON' : 'OFF'}</span>
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* 1. DEDICATED HOME VIEW                                   */}
          {/* ========================================================= */}
          {currentTab === 'home' && (
            <div className="space-y-7 animate-in fade-in duration-300">

              {/* Top Greeting Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
                    <span>{greeting}</span>
                    <span className="text-lg">✨</span>
                  </h1>
                  <p className="text-xs sm:text-sm text-zinc-400 mt-1">
                    What would you like to listen to today?
                  </p>
                </div>
              </div>

              {/* Quick Filter Chips */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none text-xs">
                {['All', 'Chill', 'Bollywood', 'Lo-Fi', 'Party', 'Bass Boost'].map((chip) => (
                  <button
                    key={chip}
                    onClick={() => handleHomeFilterClick(chip)}
                    className={`px-4 py-2 rounded-full font-semibold transition-all shrink-0 ${homeFilter === chip
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black shadow-[0_0_15px_rgba(6,182,212,0.4)]'
                        : 'bg-white/[0.05] text-zinc-300 hover:text-white border border-white/[0.06]'
                      }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>

              {/* Filtered Search Results on Home if chip selected */}
              {homeFilter !== 'All' && searchResults.length > 0 && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold text-white flex items-center gap-2">
                      <span>{homeFilter} Mixes</span>
                      <Flame className="w-4 h-4 text-cyan-400" />
                    </h3>
                    <button
                      onClick={() => setHomeFilter('All')}
                      className="text-xs text-cyan-400 hover:underline"
                    >
                      Clear Filter
                    </button>
                  </div>
                  <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                    {uniqueSearchResults.map((t, idx) => renderTrackItem(t, idx, '', 'filter-search'))}
                  </div>
                </section>
              )}

              {/* Recently Played Section (persisted in localStorage) */}
              {uniqueRecentlyPlayed.length > 0 && homeFilter === 'All' && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Clock className="w-4 h-4 text-cyan-400" />
                      <span>Recently Played</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {uniqueRecentlyPlayed.slice(0, 6).map((track, idx) => (
                      <div
                        key={`recent-${track.id}-${idx}`}
                        onClick={() => {
                          playTrack(track);
                          setIsFullScreenOpen(true);
                        }}
                        className="group p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-cyan-500/30 cursor-pointer transition-all space-y-2.5"
                      >
                        <div className="aspect-square w-full rounded-xl overflow-hidden relative shadow-md">
                          <img
                            src={getHighResThumbnail(track.cover, track.id)}
                            alt={track.title}
                            onError={handleCoverImageError}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <div className="w-9 h-9 rounded-full bg-cyan-400 flex items-center justify-center text-black shadow-lg">
                              <Play className="w-4 h-4 fill-black translate-x-0.5" />
                            </div>
                          </div>
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                            {track.title}
                          </h4>
                          <p className="text-[11px] text-zinc-400 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Mood & Vibe Mixes (Cards) */}
              {homeFilter === 'All' && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Mood & Vibe Mixes</span>
                    </h3>
                  </div>

                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    {quickPlaylists.map((pl, idx) => (
                      <div
                        key={`vibe-pl-${pl.id}-${idx}`}
                        onClick={() => handlePlaylistClick(pl)}
                        className="group relative rounded-2xl p-3 sm:p-4 glass-card cursor-pointer border border-white/[0.06] hover:border-cyan-500/30 overflow-hidden transition-all hover:-translate-y-1"
                      >
                        {/* Hardware-Accelerated Zero-Network CSS Mesh Artwork */}
                        <div
                          className="aspect-square w-full rounded-2xl overflow-hidden mb-3 relative shadow-lg flex flex-col justify-between p-3.5 sm:p-4 group-hover:scale-[1.03] transition-all duration-500 border border-white/10"
                          style={{ background: pl.meshStyle }}
                        >
                          {/* Top: Icon + Vibe Badge */}
                          <div className="flex items-center justify-between z-10">
                            <div className="w-9 h-9 rounded-xl bg-black/40 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-md">
                              {pl.id === 'p1' && <Moon className="w-4 h-4 text-pink-300" />}
                              {pl.id === 'p2' && <Zap className="w-4 h-4 text-cyan-300" />}
                              {pl.id === 'p3' && <Headphones className="w-4 h-4 text-amber-300" />}
                              {pl.id === 'p4' && <Disc3 className="w-4 h-4 text-emerald-300" />}
                            </div>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-md border shadow-sm ${pl.accentColor}`}>
                              {pl.vibe}
                            </span>
                          </div>

                          {/* Center Animated Equalizer Soundwave */}
                          <div className="flex items-end justify-center gap-1.5 h-10 my-auto opacity-80 group-hover:opacity-100 transition-opacity z-10">
                            <span className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
                            <span className="w-1.5 h-7 bg-white/90 rounded-full animate-[wave_0.9s_ease-in-out_infinite]" />
                            <span className="w-1.5 h-10 bg-white rounded-full animate-[wave_1.2s_ease-in-out_infinite_0.2s]" />
                            <span className="w-1.5 h-6 bg-white/90 rounded-full animate-[wave_1.0s_ease-in-out_infinite_0.4s]" />
                            <span className="w-1.5 h-3 bg-white/70 rounded-full animate-pulse" />
                          </div>

                          {/* Bottom Row: Track count and Play Button */}
                          <div className="flex items-center justify-between z-10">
                            <span className="text-[11px] font-mono font-bold text-white/90 drop-shadow">
                              {pl.tracksCount}
                            </span>
                            <div className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center shadow-2xl opacity-90 group-hover:opacity-100 transition-all translate-y-1 group-hover:translate-y-0 group-hover:scale-110">
                              <Play className="w-3.5 h-3.5 fill-black translate-x-0.5" />
                            </div>
                          </div>

                          {/* Overlay shimmer */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
                        </div>

                        <h4 className="text-xs sm:text-sm font-bold text-white group-hover:text-cyan-300 transition-colors truncate">
                          {pl.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 mt-0.5">
                          {pl.tracksCount} curated tracks
                        </p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

              {/* Trending Now Section */}
              {homeFilter === 'All' && (
                <section className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                        <Flame className="w-4 h-4 text-cyan-400" />
                        <span>Trending Now</span>
                      </h3>
                      <p className="text-xs text-zinc-400">
                        Top played worldwide right now
                      </p>
                    </div>

                    {(trendingTracks.length > 0 || tracks.length > 0) && (
                      <button
                        onClick={() => playTrack((trendingTracks.length > 0 ? trendingTracks : tracks)[0])}
                        className="px-4 py-2 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold text-xs hover:scale-105 transition-transform flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.3)]"
                      >
                        <Play className="w-3.5 h-3.5 fill-black" />
                        <span>Play All</span>
                      </button>
                    )}
                  </div>

                  <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                    {uniqueTrendingTracks.slice(0, 10).map((t, idx) =>
                      renderTrackItem(t, idx, '', 'trending')
                    )}
                  </div>
                </section>
              )}

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
                  <Search className="w-5 h-5 text-zinc-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
                  <input
                    type="text"
                    autoFocus
                    placeholder={isBackendOnline ? "Search songs, artists, albums, or lyrics..." : "Search local tracks..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#111116] text-white placeholder-zinc-500 text-sm pl-11 pr-11 py-3.5 rounded-2xl border border-white/[0.1] focus:outline-none focus:border-cyan-400/80 focus:ring-1 focus:ring-cyan-400/50 shadow-xl transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => {
                        setSearchQuery('');
                        setSearchSuggestions([]);
                        setCorrectedSearchQuery(null);
                      }}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white p-1"
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
                        className="px-3 py-1.5 rounded-full text-xs font-medium bg-white/[0.05] hover:bg-cyan-500/20 text-zinc-300 hover:text-cyan-200 border border-white/[0.08] hover:border-cyan-500/40 flex items-center gap-1.5 transition-all shrink-0"
                      >
                        <Sparkles className="w-3 h-3 text-cyan-400" />
                        <span>{sug}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Auto-Corrected Query Banner */}
                {correctedSearchQuery && (
                  <div className="p-3 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-xs text-cyan-200 flex items-center justify-between animate-in fade-in">
                    <div className="flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span>
                        Showing songs for <strong className="text-white underline">{correctedSearchQuery}</strong>
                        <span className="text-zinc-400 ml-1.5 hidden sm:inline">(Auto-corrected typo)</span>
                      </span>
                    </div>
                    <button
                      onClick={() => setCorrectedSearchQuery(null)}
                      className="text-[11px] text-zinc-400 hover:text-white"
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
                    <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">
                      Results for "{searchQuery}" ({searchResults.length})
                    </h3>
                  </div>

                  {searchResults.length === 0 && !isSearching ? (
                    <div className="p-12 text-center rounded-2xl glass-panel border border-white/[0.06] space-y-2">
                      <Music className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold text-zinc-300">No tracks found</h4>
                      <p className="text-xs text-zinc-500">Try a different spelling or search for an artist</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                      {uniqueSearchResults.map((t, idx) => renderTrackItem(t, idx, '', 'search-res'))}
                    </div>
                  )}
                </div>
              ) : (
                /* Browse Genre Cards */
                <div className="space-y-4">
                  <h3 className="text-base font-bold text-white flex items-center gap-2">
                    <Compass className="w-4 h-4 text-cyan-400" />
                    <span>Browse All Genres & Moods</span>
                  </h3>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {VIBE_CATEGORIES.map((cat, i) => (
                      <button
                        key={`vibe-cat-${cat.id}-${i}`}
                        onClick={() => setSearchQuery(cat.name)}
                        className={`p-4 rounded-2xl bg-gradient-to-br ${cat.color} border border-white/[0.08] hover:border-cyan-400/40 text-left transition-all hover:scale-[1.02] shadow-md`}
                      >
                        <h4 className="text-sm font-extrabold text-white">{cat.name}</h4>
                        <p className="text-[11px] text-zinc-400 mt-1">Explore top hits</p>
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
                  <h1 className="text-2xl font-black text-white flex items-center gap-2.5">
                    <LibraryIcon className="w-6 h-6 text-cyan-400" />
                    <span>Your Library</span>
                  </h1>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Device songs, playlists, saved tracks, and listening history
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  {/* Listening Stats Trigger */}
                  <button
                    onClick={() => setIsStatsOpen(true)}
                    className="px-3.5 py-2.5 rounded-2xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-95 shadow-sm"
                    title="View Your Music Stats & Personal Wrapped"
                  >
                    <BarChart2 className="w-4 h-4 text-cyan-400" />
                    <span>📊 Listening Stats</span>
                  </button>

                  {/* 1-Tap Play Local Audio Device Button */}
                  <label className="cursor-pointer px-4 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-500/20 to-violet-500/20 hover:from-cyan-500/30 hover:to-violet-500/30 border border-cyan-400/40 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.25)] hover:scale-[1.02] active:scale-95 transition-all">
                    <FolderOpen className="w-4 h-4 text-cyan-400" />
                    <span>📁 Play Local Audio</span>
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
              <div className="flex items-center gap-2 pb-1 border-b border-white/[0.06] overflow-x-auto scrollbar-none">
                <button
                  onClick={() => {
                    setLibrarySubTab('liked');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${librarySubTab === 'liked' && !activePlaylistId
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                    }`}
                >
                  Liked Songs ({likedTrackIds.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('offline');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${librarySubTab === 'offline' && !activePlaylistId
                      ? 'bg-emerald-400 text-black shadow-md'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                    }`}
                >
                  Offline ({cachedTrackIds.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('local');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${librarySubTab === 'local' && !activePlaylistId
                      ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black shadow-md font-extrabold'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                    }`}
                >
                  Local Audio ({localTracks.length})
                </button>

                <button
                  onClick={() => {
                    setLibrarySubTab('history');
                    setActivePlaylistId(null);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${librarySubTab === 'history' && !activePlaylistId
                      ? 'bg-gradient-to-r from-amber-400 to-orange-500 text-black shadow-md font-extrabold'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                    }`}
                >
                  History ({listeningHistory.length})
                </button>

                <button
                  onClick={() => setLibrarySubTab('playlists')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${librarySubTab === 'playlists' || activePlaylistId
                      ? 'bg-violet-500 text-white shadow-md'
                      : 'bg-white/[0.04] text-zinc-400 hover:text-white'
                    }`}
                >
                  Playlists ({customPlaylists.length})
                </button>
              </div>

              {/* 3a. Liked Songs List */}
              {librarySubTab === 'liked' && !activePlaylistId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-300">
                      {likedTracksList.length} Liked Songs
                    </h3>
                    {likedTracksList.length > 0 && (
                      <button
                        onClick={() => playTrack(likedTracksList[0])}
                        className="px-3.5 py-1.5 rounded-full bg-cyan-400 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-3 h-3 fill-black" />
                        <span>Play All</span>
                      </button>
                    )}
                  </div>

                  {likedTracksList.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl glass-panel border border-white/[0.06] space-y-2">
                      <Heart className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold text-zinc-300">No liked songs yet</h4>
                      <p className="text-xs text-zinc-500">Tap the heart icon on any song to save it here</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                      {uniqueLikedTracks.map((t, idx) => renderTrackItem(t, idx, '', 'liked'))}
                    </div>
                  )}
                </div>
              )}

              {/* 3b. Offline Tracks List */}
              {librarySubTab === 'offline' && !activePlaylistId && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-zinc-300">
                      {offlineTracksList.length} Downloaded Songs
                    </h3>
                    {offlineTracksList.length > 0 && (
                      <button
                        onClick={() => playTrack(offlineTracksList[0])}
                        className="px-3.5 py-1.5 rounded-full bg-emerald-400 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                      >
                        <Play className="w-3 h-3 fill-black" />
                        <span>Play Offline</span>
                      </button>
                    )}
                  </div>

                  {offlineTracksList.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl glass-panel border border-white/[0.06] space-y-2">
                      <Download className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold text-zinc-300">No offline downloads</h4>
                      <p className="text-xs text-zinc-500">Tap the 3 dots or download icon on any song to cache it for zero-internet playback</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
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
                      <h3 className="text-sm font-bold text-zinc-300">
                        {localTracks.length} Local Audio Files
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Plays directly from your device with EQ, Slowed+Reverb & 8D
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="cursor-pointer px-3.5 py-1.5 rounded-full bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40 font-bold text-xs flex items-center gap-1.5 transition-all">
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
                          className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                        >
                          <Play className="w-3 h-3 fill-black" />
                          <span>Play All</span>
                        </button>
                      )}
                    </div>
                  </div>

                  {localTracks.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl glass-panel border border-white/[0.06] space-y-3">
                      <FolderOpen className="w-10 h-10 text-cyan-400/60 mx-auto" />
                      <div>
                        <h4 className="text-sm font-bold text-zinc-300">No local audio loaded</h4>
                        <p className="text-xs text-zinc-500 mt-1 max-w-sm mx-auto">
                          Select any MP3, WAV, or M4A files on your device to play them with zero internet and live audio editing.
                        </p>
                      </div>
                      <label className="cursor-pointer inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-extrabold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all">
                        <FolderOpen className="w-4 h-4 fill-black" />
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
                    <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
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
                      <h3 className="text-sm font-bold text-zinc-300 flex items-center gap-2">
                        <Clock className="w-4 h-4 text-amber-400" />
                        <span>Listening History ({listeningHistory.length})</span>
                      </h3>
                      <p className="text-xs text-zinc-500">
                        Last 100 played songs grouped chronologically
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {listeningHistory.length > 0 && (
                        <>
                          <button
                            onClick={handleClearHistory}
                            className="px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-rose-500/20 text-zinc-400 hover:text-rose-300 border border-white/[0.08] text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Clear History</span>
                          </button>

                          <button
                            onClick={() => playTrack(listeningHistory[0])}
                            className="px-3.5 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                          >
                            <Play className="w-3 h-3 fill-black" />
                            <span>Play All</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>

                  {listeningHistory.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl glass-panel border border-white/[0.06] space-y-2">
                      <Clock className="w-8 h-8 text-zinc-600 mx-auto" />
                      <h4 className="text-sm font-bold text-zinc-300">No listening history yet</h4>
                      <p className="text-xs text-zinc-500">Songs you stream or play from your local files will appear here automatically</p>
                    </div>
                  ) : (
                    <div className="space-y-5">
                      {/* Today */}
                      {uniqueGroupedHistory.today.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2 px-1">
                            <span>Today</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({uniqueGroupedHistory.today.length})</span>
                          </div>
                          <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                            {uniqueGroupedHistory.today.map((t, idx) => renderTrackItem(t, idx, '', 'hist-today'))}
                          </div>
                        </div>
                      )}

                      {/* Yesterday */}
                      {uniqueGroupedHistory.yesterday.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-cyan-400 flex items-center gap-2 px-1">
                            <span>Yesterday</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({uniqueGroupedHistory.yesterday.length})</span>
                          </div>
                          <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
                            {uniqueGroupedHistory.yesterday.map((t, idx) => renderTrackItem(t, idx, '', 'hist-yest'))}
                          </div>
                        </div>
                      )}

                      {/* Earlier */}
                      {uniqueGroupedHistory.earlier.length > 0 && (
                        <div className="space-y-2">
                          <div className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2 px-1">
                            <span>Earlier</span>
                            <span className="text-[10px] text-zinc-500 font-mono">({uniqueGroupedHistory.earlier.length})</span>
                          </div>
                          <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
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
                          className="text-xs text-cyan-400 font-semibold hover:underline"
                        >
                          ← Back to All Playlists
                        </button>
                        {activeCustomPlaylistTracks.length > 0 && (
                          <button
                            onClick={() => playTrack(activeCustomPlaylistTracks[0])}
                            className="px-3.5 py-1.5 rounded-full bg-violet-400 text-black font-bold text-xs flex items-center gap-1.5 shadow"
                          >
                            <Play className="w-3 h-3 fill-black" />
                            <span>Play Playlist</span>
                          </button>
                        )}
                      </div>

                      <div className="p-5 rounded-2xl bg-gradient-to-r from-violet-500/20 via-cyan-500/10 to-transparent border border-white/10 space-y-1">
                        <h2 className="text-xl font-bold text-white">{activeCustomPlaylist.title}</h2>
                        <p className="text-xs text-zinc-400">{activeCustomPlaylistTracks.length} tracks</p>
                      </div>

                      {activeCustomPlaylistTracks.length === 0 ? (
                        <div className="p-8 text-center rounded-2xl glass-panel border border-white/[0.06] text-xs text-zinc-500">
                          This playlist is empty. Tap the 3 dots (⋮) on any song to add it!
                        </div>
                      ) : (
                        <div className="rounded-2xl glass-panel border border-white/[0.06] overflow-hidden divide-y divide-white/[0.04]">
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
                          className="p-4 rounded-2xl bg-white/[0.03] hover:bg-white/[0.07] border border-white/[0.06] hover:border-violet-500/30 cursor-pointer transition-all space-y-3"
                        >
                          <div className="w-10 h-10 rounded-xl bg-violet-500/20 text-violet-300 flex items-center justify-center border border-violet-500/30">
                            <Music className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white truncate">{pl.title}</h4>
                            <p className="text-xs text-zinc-400 mt-0.5">{pl.trackIds?.length || 0} songs</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                </div>
              )}

            </div>
          )}

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
