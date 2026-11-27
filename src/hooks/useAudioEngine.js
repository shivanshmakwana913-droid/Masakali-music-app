import { useState, useEffect, useRef, useCallback } from 'react';
import { 
  saveTrackOffline, 
  removeOfflineTrack, 
  getAllOfflineTracks, 
  isTrackOffline 
} from '../utils/offlineStorage';
import { fetchNextMix, fetchTrendingMusic, warmTrack, API_BASE } from '../services/musicApi';
import { recordTrackPlay, recordListeningSeconds } from '../utils/musicStats';
import { rankNextTracks, recordFullListen, recordEarlySkip } from '../utils/nextSongAlgo';

// 10-Band EQ Frequencies in Hertz
export const EQ_FREQUENCIES = [32, 64, 125, 250, 500, 1000, 2000, 4000, 8000, 16000];

// Standard EQ Presets (in dB, -12 to +12)
export const EQ_PRESETS = {
  Flat: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  'Bass Boost': [10, 8, 6, 3, 1, 0, 0, 0, 0, 0],
  Vocal: [-2, -1, 0, 2, 4, 4, 3, 1, 0, -1],
  Pop: [-1, 2, 4, 5, 3, -1, 1, 2, 3, 2],
  Rock: [5, 4, 2, -1, -2, 0, 2, 4, 5, 5]
};

export function useAudioEngine(initialTracks = []) {
  const [tracks, setTracks] = useState(initialTracks);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(180);
  const [volume, setVolume] = useState(0.85);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState('off'); // 'off' | 'all' | 'one'
  
  // Audio Studio DSP Controls
  const [eqGains, setEqGains] = useState(EQ_PRESETS.Flat);
  const [activePreset, setActivePreset] = useState('Flat');
  const [isSlowedReverb, setIsSlowedReverb] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0); // 0.5x to 2.0x
  const [is8DActive, setIs8DActive] = useState(false);
  const [isKaraokeMode, setIsKaraokeMode] = useState(false);
  const [crossfadeDuration, setCrossfadeDuration] = useState(2); // in seconds
  const [panPosition, setPanPosition] = useState(0); // -1 (L) to +1 (R) for 8D UI

  // Smart Queue & Auto-Radio
  const [queue, setQueue] = useState([]);
  const [autoPlayRadio, setAutoPlayRadio] = useState(true);

  // Sleep Timer (in minutes or 'end_of_track')
  const [sleepTimerSetting, setSleepTimerSetting] = useState(null);
  const [sleepTimerRemaining, setSleepTimerRemaining] = useState(null); // seconds
  const sleepTimerIntervalRef = useRef(null);

  // Offline Caching (IndexedDB)
  const [cachedTrackIds, setCachedTrackIds] = useState([]);

  // Toast / Status Notifications
  const [toastMessage, setToastMessage] = useState(null);
  const toastTimeoutRef = useRef(null);

  const showToast = useCallback((msg) => {
    setToastMessage(msg);
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3500);
  }, []);

  // Track recent history to avoid repeating songs in Auto-Play
  const playedHistoryIdsRef = useRef([]);
  // Track pre-warmed song IDs to prevent duplicate warm requests
  const prewarmedIdsRef = useRef(new Set());

  // Refs for Web Audio API nodes & HTMLAudioElement
  const audioRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const biquadFiltersRef = useRef([]);
  const masterGainRef = useRef(null);
  const pannerNodeRef = useRef(null);
  const delayNodeRef = useRef(null);
  const delayFeedbackRef = useRef(null);
  const delayGainRef = useRef(null);
  const analyserRef = useRef(null);
  const normalGainRef = useRef(null);
  const karaokeGainRef = useRef(null);
  const karaokeVocalCutRef = useRef(null);
  const karaokeBassCompRef = useRef(null);
  const animationFrame8DRef = useRef(null);
  const isWebAudioInitializedRef = useRef(false);
  const panAngleRef = useRef(0);
  const isPlayingRef = useRef(false);

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  const currentTrack = tracks[currentTrackIndex] || tracks[0];

  // Load offline track cache IDs on mount
  useEffect(() => {
    getAllOfflineTracks().then((items) => {
      setCachedTrackIds(items.map((i) => i.id));
    }).catch(() => {});
  }, []);

  // Initialize Web Audio Context safely on first user gesture
  const initWebAudio = useCallback(() => {
    if (isWebAudioInitializedRef.current && audioCtxRef.current) {
      if (audioCtxRef.current.state === 'suspended') {
        audioCtxRef.current.resume();
      }
      return;
    }

    try {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return;

      const ctx = new AudioContextClass();
      audioCtxRef.current = ctx;

      // 1. Create Source from existing <audio> element
      if (!audioRef.current) {
        audioRef.current = new Audio();
        audioRef.current.playsInline = true;
        audioRef.current.setAttribute('playsinline', 'true');
        audioRef.current.setAttribute('webkit-playsinline', 'true');
        audioRef.current.crossOrigin = 'anonymous';
        audioRef.current.preload = 'auto';
      } else {
        audioRef.current.playsInline = true;
        audioRef.current.setAttribute('playsinline', 'true');
        audioRef.current.setAttribute('webkit-playsinline', 'true');
        audioRef.current.preload = 'auto';
      }

      // AudioContext state keeper: immediately resume if mobile OS attempts to suspend during playback
      ctx.onstatechange = () => {
        if (ctx.state === 'suspended' && isPlayingRef.current) {
          ctx.resume().catch(() => {});
        }
      };

      let source;
      try {
        source = ctx.createMediaElementSource(audioRef.current);
        sourceNodeRef.current = source;
      } catch (err) {
        console.warn('MediaElementSource already connected or cross-origin restricted:', err);
        return;
      }

      // 2. Build 10-Band BiquadFilter Equalizer Chain
      const filters = EQ_FREQUENCIES.map((freq, i) => {
        const filter = ctx.createBiquadFilter();
        if (i === 0) {
          filter.type = 'lowshelf';
        } else if (i === EQ_FREQUENCIES.length - 1) {
          filter.type = 'highshelf';
        } else {
          filter.type = 'peaking';
          filter.Q.value = 1.4;
        }
        filter.frequency.value = freq;
        filter.gain.value = eqGains[i] || 0;
        return filter;
      });
      biquadFiltersRef.current = filters;

      for (let i = 0; i < filters.length - 1; i++) {
        filters[i].connect(filters[i + 1]);
      }

      // 3. Create 8D Stereo Panner Node
      let panner;
      if (ctx.createStereoPanner) {
        panner = ctx.createStereoPanner();
      } else {
        panner = ctx.createPanner();
        panner.panningModel = 'equalpower';
      }
      pannerNodeRef.current = panner;

      // 4. Create Slowed + Reverb Delay Loop
      const delayNode = ctx.createDelay();
      delayNode.delayTime.value = 0.22;
      const feedback = ctx.createGain();
      feedback.gain.value = 0.38;
      const reverbGain = ctx.createGain();
      reverbGain.gain.value = 0;

      delayNode.connect(feedback);
      feedback.connect(delayNode);
      delayNode.connect(reverbGain);

      delayNodeRef.current = delayNode;
      delayFeedbackRef.current = feedback;
      delayGainRef.current = reverbGain;

      // 5. Analyser Node for Visualizer
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.8;
      analyserRef.current = analyser;

      // 6. Master Gain Node
      const masterGain = ctx.createGain();
      masterGain.gain.value = volume;
      masterGainRef.current = masterGain;

      // 7. Live Karaoke (Center-Channel Vocal Remover Subgraph + Multi-Singer Duet Suppression)
      const normalGain = ctx.createGain();
      normalGain.gain.value = isKaraokeMode ? 0.0 : 1.0;
      normalGainRef.current = normalGain;

      const karaokeGain = ctx.createGain();
      karaokeGain.gain.value = isKaraokeMode ? 1.0 : 0.0;
      karaokeGainRef.current = karaokeGain;

      // Stereo Channel Splitter and Inverter for Phase Cancellation (Left - Right)
      const splitter = ctx.createChannelSplitter(2);
      const inverter = ctx.createGain();
      inverter.gain.value = -1.0; // Invert Right channel to cancel center vocal

      const diffGain = ctx.createGain();
      diffGain.gain.value = 1.0;

      // Bass preservation filter (keeps kick & sub-bass solid under 130Hz)
      const bassFilter = ctx.createBiquadFilter();
      bassFilter.type = 'lowpass';
      bassFilter.frequency.value = 130;

      const diffMerger = ctx.createChannelMerger(2);

      // Targeted Mid-Range Vocal Band-Stop (Peaking cut around 900Hz–2400Hz, -18dB)
      // Suppresses off-center, panned duet vocals, and vocal reverb spill
      const vocalCutFilter = ctx.createBiquadFilter();
      vocalCutFilter.type = 'peaking';
      vocalCutFilter.frequency.value = 1500;
      vocalCutFilter.Q.value = 0.95;
      vocalCutFilter.gain.value = isKaraokeMode ? -18.0 : 0.0;
      karaokeVocalCutRef.current = vocalCutFilter;

      // Subtle Low-End Bass Compensation (+4dB at 100Hz)
      // Keeps the beat and bass punchy and energetic while vocals are removed
      const bassCompFilter = ctx.createBiquadFilter();
      bassCompFilter.type = 'peaking';
      bassCompFilter.frequency.value = 100;
      bassCompFilter.Q.value = 1.0;
      bassCompFilter.gain.value = isKaraokeMode ? 4.0 : 0.0;
      karaokeBassCompRef.current = bassCompFilter;

      // Connect Web Audio Graph:
      source.connect(filters[0]);
      const lastFilter = filters[filters.length - 1];

      // Route 1: Normal unprocessed stereo path
      lastFilter.connect(normalGain);

      // Route 2: Karaoke Differential vocal cancellation path + Duet Suppression Chain
      lastFilter.connect(splitter);
      lastFilter.connect(bassFilter);

      splitter.connect(diffGain, 0); // L -> diff
      splitter.connect(inverter, 1); // R -> inverter
      inverter.connect(diffGain);    // -R -> diff
      bassFilter.connect(diffGain);  // Add preserved bass

      diffGain.connect(diffMerger, 0, 0); // L
      diffGain.connect(diffMerger, 0, 1); // R

      // Pass differential stereo signal through mid-range vocal band-stop and bass punch compensation
      diffMerger.connect(vocalCutFilter);
      vocalCutFilter.connect(bassCompFilter);
      bassCompFilter.connect(karaokeGain);

      // Connect both paths into spatial panner and delay effects
      normalGain.connect(panner);
      karaokeGain.connect(panner);

      normalGain.connect(delayNode);
      karaokeGain.connect(delayNode);
      reverbGain.connect(masterGain);

      panner.connect(masterGain);
      masterGain.connect(analyser);
      analyser.connect(ctx.destination);

      isWebAudioInitializedRef.current = true;
    } catch (error) {
      console.warn('Web Audio initialization fallback:', error);
    }
  }, [eqGains, volume, isKaraokeMode]);

  // Synchronize Live Karaoke Toggle (Smooth crossfade & adaptive filter modulation)
  useEffect(() => {
    if (!audioCtxRef.current) return;
    const t = audioCtxRef.current.currentTime;
    if (isKaraokeMode) {
      if (normalGainRef.current) normalGainRef.current.gain.setTargetAtTime(0, t, 0.03);
      if (karaokeGainRef.current) karaokeGainRef.current.gain.setTargetAtTime(1, t, 0.03);
      if (karaokeVocalCutRef.current) karaokeVocalCutRef.current.gain.setTargetAtTime(-18, t, 0.03);
      if (karaokeBassCompRef.current) karaokeBassCompRef.current.gain.setTargetAtTime(4, t, 0.03);
      showToast('Karaoke Mode ON (Vocal Remover & Duet Suppression Active)');
    } else {
      if (normalGainRef.current) normalGainRef.current.gain.setTargetAtTime(1, t, 0.03);
      if (karaokeGainRef.current) karaokeGainRef.current.gain.setTargetAtTime(0, t, 0.03);
      if (karaokeVocalCutRef.current) karaokeVocalCutRef.current.gain.setTargetAtTime(0, t, 0.03);
      if (karaokeBassCompRef.current) karaokeBassCompRef.current.gain.setTargetAtTime(0, t, 0.03);
    }
  }, [isKaraokeMode, showToast]);

  // Queue Operations
  const addToQueue = useCallback((track) => {
    setQueue((prev) => [...prev, track]);
    showToast(`Added "${track.title}" to Queue`);
  }, [showToast]);

  const playNextInQueue = useCallback((track) => {
    setQueue((prev) => [track, ...prev]);
    showToast(`"${track.title}" will play next`);
  }, [showToast]);

  const removeFromQueue = useCallback((index) => {
    setQueue((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const moveQueueItem = useCallback((fromIndex, toIndex) => {
    setQueue((prev) => {
      const copy = [...prev];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    });
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    showToast('Queue cleared');
  }, [showToast]);

  // Sleep Timer Countdown Logic
  const setSleepTimer = useCallback((minutes) => {
    if (minutes === 'end_of_track') {
      setSleepTimerSetting('end_of_track');
      setSleepTimerRemaining(Math.round(duration - currentTime));
      showToast('Sleep timer set to End of Track');
      return;
    }

    if (!minutes || minutes <= 0) {
      setSleepTimerSetting(null);
      setSleepTimerRemaining(null);
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
      showToast('Sleep timer turned off');
      return;
    }

    setSleepTimerSetting(minutes);
    setSleepTimerRemaining(minutes * 60);
    showToast(`Sleep timer set for ${minutes} minutes`);
  }, [duration, currentTime, showToast]);

  const clearSleepTimer = useCallback(() => {
    setSleepTimerSetting(null);
    setSleepTimerRemaining(null);
    if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
  }, []);

  useEffect(() => {
    if (!sleepTimerRemaining || sleepTimerRemaining <= 0) return;

    if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);

    sleepTimerIntervalRef.current = setInterval(() => {
      setSleepTimerRemaining((prev) => {
        if (!prev || prev <= 1) {
          clearInterval(sleepTimerIntervalRef.current);
          if (audioRef.current) audioRef.current.pause();
          setIsPlaying(false);
          setSleepTimerSetting(null);
          showToast('Music paused by Sleep Timer');
          return null;
        }

        if (prev <= 8 && masterGainRef.current && audioCtxRef.current) {
          masterGainRef.current.gain.setTargetAtTime(0, audioCtxRef.current.currentTime, 1.5);
        }

        return prev - 1;
      });
    }, 1000);

    return () => {
      if (sleepTimerIntervalRef.current) clearInterval(sleepTimerIntervalRef.current);
    };
  }, [sleepTimerRemaining, showToast]);

  // Play Specific Track (ensures crossOrigin is set BEFORE src & records recently played)
  const playTrack = useCallback((track, index = null) => {
    initWebAudio();
    let targetIndex = index;
    if (targetIndex === null) {
      targetIndex = tracks.findIndex((t) => t.id === track.id);
      if (targetIndex === -1) {
        setTracks((prev) => [track, ...prev]);
        targetIndex = 0;
      }
    }

    setCurrentTrackIndex(targetIndex);

    // Immediately seed duration from track object if finite & positive
    if (track.duration && Number.isFinite(track.duration) && track.duration > 0) {
      setDuration(track.duration);
    }

    // Record into Listening History and update User Analytics (SimpMusic Style)
    try {
      const activeVibe = isKaraokeMode ? 'Karaoke Mode'
        : isSlowedReverb ? 'Slowed + Reverb'
        : is8DActive ? '8D Spatial Audio'
        : activePreset && activePreset !== 'Flat' ? `${activePreset} EQ`
        : 'Studio Clean';
      recordTrackPlay(track, activeVibe);
    } catch (e) {}

    // Save to recently played in localStorage for backwards compatibility
    try {
      const stored = localStorage.getItem('as_music_recently_played');
      const list = stored ? JSON.parse(stored) : [];
      const updated = [track, ...list.filter(t => t.id !== track.id)].slice(0, 25);
      localStorage.setItem('as_music_recently_played', JSON.stringify(updated));
    } catch (e) {}

    // Add to played history
    playedHistoryIdsRef.current = [...new Set([...playedHistoryIdsRef.current, track.id])].slice(-40);

    if (audioRef.current) {
      // Zero-Latency Switch: immediately pause previous stream and reset head
      try {
        audioRef.current.pause();
      } catch (_) {}

      setCurrentTime(0);
      setIsPlaying(true);    // Instant optimistic visual feedback
      setIsBuffering(true);  // Smart micro-spinner until audio starts flowing

      // Critical: remove crossOrigin for local blob URLs to avoid CORS restrictions, use anonymous for remote streams
      if (track.audioUrl && track.audioUrl.startsWith('blob:')) {
        audioRef.current.removeAttribute('crossorigin');
      } else {
        audioRef.current.crossOrigin = 'anonymous';
      }
      audioRef.current.preload = 'auto';

      let targetAudioUrl = track.audioUrl;
      // Seamlessly resolve remote Render stream URL when running on Vercel or cloud web host
      if (targetAudioUrl && typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
        if (targetAudioUrl.includes('localhost:5000/api')) {
          targetAudioUrl = targetAudioUrl.replace(/https?:\/\/localhost:\d+\/api/, API_BASE);
        } else if (targetAudioUrl.startsWith('/api/')) {
          targetAudioUrl = `${API_BASE.replace(/\/api\/?$/, '')}${targetAudioUrl}`;
        }
      }
      // If it's our backend stream endpoint, append title query parameter for robust fallback
      if (targetAudioUrl && targetAudioUrl.includes('/api/stream/') && track.title && !targetAudioUrl.includes('title=')) {
        targetAudioUrl += (targetAudioUrl.includes('?') ? '&' : '?') + `title=${encodeURIComponent(track.title)}`;
      }

      audioRef.current.src = targetAudioUrl;
      audioRef.current.currentTime = 0;
      audioRef.current.load();
      audioRef.current.play()
        .then(() => {
          setIsPlaying(true);
          setIsBuffering(false);
        })
        .catch((err) => {
          console.warn('Play error for track:', track.title, err.message);
          // If browser Autoplay restriction blocked play, allow user gesture to resume smoothly
          if (err.name === 'NotAllowedError') {
            setIsPlaying(false);
            setIsBuffering(false);
            showToast('Tap play to start audio');
            return;
          }
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().then(() => {
              audioRef.current.play()
                .then(() => {
                  setIsPlaying(true);
                  setIsBuffering(false);
                })
                .catch(() => {
                  setIsBuffering(false);
                });
            });
          } else {
            setIsBuffering(false);
          }
        });
    }
  }, [tracks, initWebAudio]);

  // Proactive Auto-Mix Queue Filler: keeps Up-Next populated ahead of time
  const isFetchingAutoMixRef = useRef(false);
  const songsSinceDiscoveryRef = useRef(0);
  const trendingCacheRef = useRef([]);

  const buildSmartMix = useCallback(async (baseTrack) => {
    const [mixCandidates, trendingList] = await Promise.all([
      fetchNextMix(baseTrack.id, baseTrack.title, baseTrack.artist),
      trendingCacheRef.current.length > 0
        ? Promise.resolve(trendingCacheRef.current)
        : fetchTrendingMusic().catch(() => [])
    ]);

    if (Array.isArray(trendingList) && trendingList.length > 0) {
      trendingCacheRef.current = trendingList;
    }

    return rankNextTracks({
      currentTrack: baseTrack,
      candidates: mixCandidates || [],
      trendingCandidates: trendingCacheRef.current,
      recentIds: playedHistoryIdsRef.current,
      queueIds: queue.map((q) => q.id),
      songsSinceDiscovery: songsSinceDiscoveryRef.current,
      limit: 10
    });
  }, [queue]);

  const ensureAutoMixQueue = useCallback(async (baseTrack = currentTrack) => {
    if (!autoPlayRadio || !baseTrack || isFetchingAutoMixRef.current) return;
    if (queue.length >= 3) return;

    isFetchingAutoMixRef.current = true;
    try {
      const ranked = await buildSmartMix(baseTrack);
      if (ranked.length > 0) {
        setQueue((prev) => {
          const existingIds = new Set(prev.map((q) => q.id));
          const fresh = ranked.filter((t) => !existingIds.has(t.id));
          return [...prev, ...fresh.slice(0, 4)];
        });
      }
    } catch (e) {
      console.warn('Auto-Mix queue fill error:', e.message);
    } finally {
      isFetchingAutoMixRef.current = false;
    }
  }, [autoPlayRadio, currentTrack, queue.length, buildSmartMix]);

  // Next Track with Smart Auto-Mix Support & Behavioral Early-Skip Tracking
  const handleNextTrack = useCallback(async () => {
    // Record behavioral penalty (-4) if user skips before 12 seconds
    if (currentTrack && currentTime > 0.5 && currentTime < 12) {
      recordEarlySkip(currentTrack, currentTime);
    }

    // 1. Pop from user Queue
    if (queue.length > 0) {
      const nextQueueTrack = queue[0];
      songsSinceDiscoveryRef.current = nextQueueTrack.isDiscoveryPick ? 0 : (songsSinceDiscoveryRef.current + 1) % 4;
      setQueue((prev) => prev.slice(1));
      playTrack(nextQueueTrack);
      return;
    }

    // 2. If queue is empty and autoPlayRadio is ON: fetch next vibe-matched song dynamically!
    if (autoPlayRadio && currentTrack) {
      showToast('∞ Auto-Mix: Finding next vibe-matched track...');
      try {
        const ranked = await buildSmartMix(currentTrack);
        const candidate = ranked[0];

        if (candidate) {
          songsSinceDiscoveryRef.current = candidate.isDiscoveryPick ? 0 : (songsSinceDiscoveryRef.current + 1) % 4;
          const nextInLine = ranked.slice(1, 5);
          if (nextInLine.length > 0) {
            setQueue((prev) => [...prev, ...nextInLine]);
          }
          playTrack(candidate);
          showToast(`∞ Auto-Mix: Playing "${candidate.title}"`);
          return;
        }
      } catch (err) {
        console.warn('Auto-Mix next track error:', err.message);
      }
    }

    // 3. Fallback: cycle tracks or shuffle
    let nextIndex;
    if (isShuffle) {
      nextIndex = Math.floor(Math.random() * tracks.length);
    } else {
      nextIndex = (currentTrackIndex + 1) % tracks.length;
    }
    playTrack(tracks[nextIndex], nextIndex);
  }, [queue, autoPlayRadio, currentTrack, currentTime, isShuffle, tracks, currentTrackIndex, playTrack, showToast, buildSmartMix]);

  // Handle Track Completion with Smart Related Auto-Play & Full-Listen Affinity (+5)
  const handleTrackEnded = useCallback(async () => {
    // Keep AudioContext awake across track transitions when mobile screen is locked
    if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
      audioCtxRef.current.resume().catch(() => {});
    }

    // Record +5 artist affinity for a full listen
    if (currentTrack) {
      recordFullListen(currentTrack);
    }

    if (sleepTimerSetting === 'end_of_track') {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
      clearSleepTimer();
      showToast('Music paused by Sleep Timer');
      return;
    }

    if (repeatMode === 'one' && audioRef.current) {
      audioRef.current.currentTime = 0;
      audioRef.current.play().catch(() => {});
      return;
    }

    // Next item in Queue
    if (queue.length > 0) {
      const nextQueueTrack = queue[0];
      songsSinceDiscoveryRef.current = nextQueueTrack.isDiscoveryPick ? 0 : (songsSinceDiscoveryRef.current + 1) % 4;
      setQueue((prev) => prev.slice(1));
      playTrack(nextQueueTrack);
      return;
    }

    // Smart Related Auto-Play (fetches vibe-matched ranked tracks)
    if (autoPlayRadio && currentTrack) {
      try {
        const ranked = await buildSmartMix(currentTrack);
        const candidate = ranked[0];

        if (candidate) {
          songsSinceDiscoveryRef.current = candidate.isDiscoveryPick ? 0 : (songsSinceDiscoveryRef.current + 1) % 4;
          const nextInLine = ranked.slice(1, 5);
          if (nextInLine.length > 0) {
            setQueue((prev) => [...prev, ...nextInLine]);
          }
          playTrack(candidate);
          showToast(`∞ Auto-Mix: "${candidate.title}"`);
          return;
        }
      } catch (err) {
        console.warn('Auto-Play fetch error:', err.message);
      }

      // Fallback: local unplayed track
      const remainingTracks = tracks.filter((t) => t.id !== currentTrack.id && !playedHistoryIdsRef.current.includes(t.id));
      const fallbackTrack = remainingTracks.length > 0 ? remainingTracks[0] : tracks[0];
      if (fallbackTrack) {
        playTrack(fallbackTrack);
        return;
      }
    }

    handleNextTrack();
  }, [sleepTimerSetting, repeatMode, queue, autoPlayRadio, currentTrack, tracks, clearSleepTimer, showToast, playTrack, handleNextTrack, buildSmartMix]);

  // Audio Event Listeners with Preload & Smart Buffering Tracker
  useEffect(() => {
    if (!audioRef.current) {
      const audio = new Audio();
      audio.playsInline = true;
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.crossOrigin = 'anonymous';
      audio.preload = 'auto';
      audioRef.current = audio;
    } else {
      audioRef.current.playsInline = true;
      audioRef.current.setAttribute('playsinline', 'true');
      audioRef.current.setAttribute('webkit-playsinline', 'true');
      audioRef.current.preload = 'auto';
    }

    const audio = audioRef.current;
    audio.preload = 'auto';

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);

      // Continuously synchronize Lock-Screen Position State for smooth lock-screen scrub bars
      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(Math.max(0, audio.currentTime || 0), audio.duration)
          });
        } catch (_) {}
      }

      // Background Stream Pre-Warming at 50% Playback
      const effDur = (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0)
        ? audio.duration
        : (currentTrack?.duration || 180);

      if (effDur > 0 && audio.currentTime / effDur >= 0.5) {
        const nextCandidate = (queue.length > 0 ? queue[0] : tracks[(currentTrackIndex + 1) % tracks.length]);
        if (nextCandidate?.id && !prewarmedIdsRef.current.has(nextCandidate.id)) {
          prewarmedIdsRef.current.add(nextCandidate.id);
          warmTrack(nextCandidate.id);
        }
      }
    };

    const handleWaiting = () => setIsBuffering(true);
    const handleStalled = () => setIsBuffering(true);
    const handlePlaying = () => setIsBuffering(false);
    const handleCanPlay = () => setIsBuffering(false);
    const handlePause = () => setIsBuffering(false);

    const handleLoadedMetadata = () => {
      if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      } else if (currentTrack?.duration && Number.isFinite(currentTrack.duration) && currentTrack.duration > 0) {
        setDuration(currentTrack.duration);
      }
      if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(audio.duration) && audio.duration > 0) {
        try {
          navigator.mediaSession.setPositionState({
            duration: audio.duration,
            playbackRate: audio.playbackRate || 1,
            position: Math.min(Math.max(0, audio.currentTime || 0), audio.duration)
          });
        } catch (_) {}
      }
    };

    const handleDurationChange = () => {
      if (audio.duration && Number.isFinite(audio.duration) && audio.duration > 0) {
        setDuration(audio.duration);
      }
    };

    const handleError = () => {
      setIsBuffering(false);
      const mediaErr = audioRef.current?.error;
      console.warn('Audio playback error encountered:', mediaErr?.code, mediaErr?.message);

      // If crossOrigin restriction blocked playback (MEDIA_ERR_SRC_NOT_SUPPORTED code 4),
      // retry immediately without crossOrigin attribute for direct native audio playback
      if (audio.hasAttribute('crossorigin')) {
        console.warn('CORS / crossOrigin restriction detected. Retrying without crossOrigin attribute...');
        audio.removeAttribute('crossorigin');
        audio.load();
        if (isPlaying) {
          audio.play().catch((playErr) => console.warn('Retry without crossOrigin failed:', playErr.message));
        }
        return;
      }

      showToast('Stream interrupted. Retrying with backup...');
      if (currentTrack?.fallbackUrl && audio.src !== currentTrack.fallbackUrl) {
        audio.src = currentTrack.fallbackUrl;
        audio.load();
        if (isPlaying) audio.play().catch(() => {});
      }
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('durationchange', handleDurationChange);
    audio.addEventListener('ended', handleTrackEnded);
    audio.addEventListener('error', handleError);
    audio.addEventListener('waiting', handleWaiting);
    audio.addEventListener('stalled', handleStalled);
    audio.addEventListener('playing', handlePlaying);
    audio.addEventListener('canplay', handleCanPlay);
    audio.addEventListener('pause', handlePause);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('durationchange', handleDurationChange);
      audio.removeEventListener('ended', handleTrackEnded);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('waiting', handleWaiting);
      audio.removeEventListener('stalled', handleStalled);
      audio.removeEventListener('playing', handlePlaying);
      audio.removeEventListener('canplay', handleCanPlay);
      audio.removeEventListener('pause', handlePause);
    };
  }, [handleTrackEnded, currentTrack, currentTrackIndex, isPlaying, queue, tracks, showToast]);

  // Pre-warm next queued track as soon as queue gets an item
  useEffect(() => {
    if (queue.length > 0) {
      const nextQ = queue[0];
      if (nextQ?.id && !prewarmedIdsRef.current.has(nextQ.id)) {
        prewarmedIdsRef.current.add(nextQ.id);
        warmTrack(nextQ.id);
      }
    }
  }, [queue]);

  // Synchronize playbackRate
  useEffect(() => {
    if (!audioRef.current) return;
    const finalRate = isSlowedReverb ? 0.85 * playbackSpeed : playbackSpeed;
    audioRef.current.playbackRate = finalRate;

    if (delayGainRef.current) {
      delayGainRef.current.gain.setTargetAtTime(
        isSlowedReverb ? 0.55 : 0.0,
        audioCtxRef.current?.currentTime || 0,
        0.05
      );
    }
  }, [isSlowedReverb, playbackSpeed]);

  // Real-time periodic listening time accumulation for Music Stats & Analytics
  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      recordListeningSeconds(3);
    }, 3000);
    return () => clearInterval(interval);
  }, [isPlaying]);

  // 8D Audio Continuous Panning LFO Animation
  useEffect(() => {
    if (!is8DActive) {
      if (animationFrame8DRef.current) {
        cancelAnimationFrame(animationFrame8DRef.current);
      }
      if (pannerNodeRef.current && pannerNodeRef.current.pan) {
        pannerNodeRef.current.pan.value = 0;
      }
      setPanPosition(0);
      return;
    }

    let lastTime = performance.now();
    const orbitSpeed = 0.8;

    const animate8D = (now) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;
      panAngleRef.current += orbitSpeed * dt;

      const panValue = Math.sin(panAngleRef.current);
      setPanPosition(panValue);

      if (pannerNodeRef.current && pannerNodeRef.current.pan) {
        pannerNodeRef.current.pan.value = panValue;
      }

      animationFrame8DRef.current = requestAnimationFrame(animate8D);
    };

    animationFrame8DRef.current = requestAnimationFrame(animate8D);

    return () => {
      if (animationFrame8DRef.current) {
        cancelAnimationFrame(animationFrame8DRef.current);
      }
    };
  }, [is8DActive]);

  // Synchronize Master Volume and Mute
  useEffect(() => {
    const targetVol = isMuted ? 0 : volume;
    if (audioRef.current) {
      audioRef.current.volume = targetVol;
    }
    if (masterGainRef.current && audioCtxRef.current) {
      masterGainRef.current.gain.setTargetAtTime(targetVol, audioCtxRef.current.currentTime, 0.02);
    }
  }, [volume, isMuted]);

  // Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (!audioRef.current) return;
    initWebAudio();

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch((err) => {
          console.warn('Playback error:', err.message);
          if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().then(() => {
              audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
            });
          }
        });
    }
  }, [isPlaying, initWebAudio]);

  // Proactively pre-populate Up-Next queue when autoPlayRadio is ON and queue is running low
  useEffect(() => {
    if (autoPlayRadio && isPlaying && queue.length < 2 && currentTrack) {
      ensureAutoMixQueue(currentTrack);
    }
  }, [autoPlayRadio, isPlaying, queue.length, currentTrack, ensureAutoMixQueue]);

  // Previous Track
  const handlePrevTrack = useCallback(() => {
    if (currentTime > 3) {
      if (audioRef.current) audioRef.current.currentTime = 0;
      setCurrentTime(0);
      return;
    }
    const prevIndex = (currentTrackIndex - 1 + tracks.length) % tracks.length;
    playTrack(tracks[prevIndex], prevIndex);
  }, [currentTime, currentTrackIndex, tracks, playTrack]);

  // Seek safely without resetting audio source, jumping to the end, or triggering reload
  const seek = useCallback((timeInSeconds) => {
    if (!audioRef.current) return;
    const effectiveDur = (duration && Number.isFinite(duration) && duration > 0)
      ? duration
      : (currentTrack?.duration && Number.isFinite(currentTrack.duration) && currentTrack.duration > 0 ? currentTrack.duration : 180);
    const clamped = Math.max(0, Math.min(timeInSeconds, effectiveDur));
    audioRef.current.currentTime = clamped;
    setCurrentTime(clamped);

    // Sync mediaSession position state immediately on seek
    if ('mediaSession' in navigator && navigator.mediaSession.setPositionState && Number.isFinite(effectiveDur) && effectiveDur > 0) {
      try {
        navigator.mediaSession.setPositionState({
          duration: effectiveDur,
          playbackRate: audioRef.current.playbackRate || 1,
          position: clamped
        });
      } catch (_) {}
    }
  }, [duration, currentTrack?.duration]);

  // Bulletproof Mobile Background Audio & AudioContext Keep-Alive
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (isPlayingRef.current) {
        // When user switches apps or phone screen locks, keep AudioContext awake
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
          audioCtxRef.current.resume().catch(() => {});
        }
        // Ensure <audio> element is not paused by background throttling
        if (audioRef.current && audioRef.current.paused) {
          audioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('pagehide', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pagehide', handleVisibilityChange);
    };
  }, []);

  // Full Lock-Screen & Notification Media Session Controls (navigator.mediaSession)
  useEffect(() => {
    if (!('mediaSession' in navigator) || !currentTrack) return;

    // 1. Register complete MediaMetadata with multi-size artwork
    const artwork = [];
    if (currentTrack.cover && !currentTrack.cover.startsWith('data:') && currentTrack.cover !== '/logo.png') {
      artwork.push(
        { src: currentTrack.cover, sizes: '96x96', type: 'image/jpeg' },
        { src: currentTrack.cover, sizes: '256x256', type: 'image/jpeg' },
        { src: currentTrack.cover, sizes: '512x512', type: 'image/jpeg' }
      );
    }
    artwork.push(
      { src: '/logo.png', sizes: '96x96', type: 'image/png' },
      { src: '/logo.png', sizes: '192x192', type: 'image/png' },
      { src: '/logo.png', sizes: '512x512', type: 'image/png' }
    );

    try {
      navigator.mediaSession.metadata = new window.MediaMetadata({
        title: currentTrack.title || 'Masakali',
        artist: currentTrack.artist || 'Free Your Music',
        album: currentTrack.album || 'Masakali',
        artwork
      });
    } catch (e) {
      console.warn('MediaMetadata registration error:', e);
    }
  }, [currentTrack]);

  // Synchronize MediaSession playbackState
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    try {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    } catch (_) {}
  }, [isPlaying]);

  // Wire Hardware & Lock-Screen Action Handlers
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;

    const actionHandlers = [
      ['play', () => {
        if (audioRef.current && audioRef.current.paused) {
          if (audioCtxRef.current?.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
          }
          audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      }],
      ['pause', () => {
        if (audioRef.current && !audioRef.current.paused) {
          audioRef.current.pause();
          setIsPlaying(false);
        }
      }],
      ['previoustrack', () => handlePrevTrack()],
      ['nexttrack', () => handleNextTrack()],
      ['seekto', (details) => {
        if (details.seekTime !== undefined && details.seekTime !== null) {
          seek(details.seekTime);
        }
      }],
      ['seekbackward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          seek(Math.max(0, audioRef.current.currentTime - offset));
        }
      }],
      ['seekforward', (details) => {
        const offset = details.seekOffset || 10;
        if (audioRef.current) {
          const effDur = audioRef.current.duration || 180;
          seek(Math.min(effDur, audioRef.current.currentTime + offset));
        }
      }],
      ['stop', () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          setIsPlaying(false);
        }
      }]
    ];

    for (const [action, handler] of actionHandlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (_) {}
    }

    return () => {
      for (const [action] of actionHandlers) {
        try {
          navigator.mediaSession.setActionHandler(action, null);
        } catch (_) {}
      }
    };
  }, [handlePrevTrack, handleNextTrack, seek]);

  // Equalizer Band Gain Change
  const setEqBand = useCallback((bandIndex, gainDb) => {
    const clampedGain = Math.max(-12, Math.min(12, gainDb));
    setEqGains((prev) => {
      const next = [...prev];
      next[bandIndex] = clampedGain;
      return next;
    });
    setActivePreset('Custom');

    if (biquadFiltersRef.current[bandIndex] && audioCtxRef.current) {
      biquadFiltersRef.current[bandIndex].gain.setTargetAtTime(
        clampedGain,
        audioCtxRef.current.currentTime,
        0.01
      );
    }
  }, []);

  // Apply Preset
  const applyPreset = useCallback((presetName) => {
    const preset = EQ_PRESETS[presetName];
    if (!preset) return;
    setEqGains(preset);
    setActivePreset(presetName);

    preset.forEach((gain, i) => {
      if (biquadFiltersRef.current[i] && audioCtxRef.current) {
        biquadFiltersRef.current[i].gain.setTargetAtTime(
          gain,
          audioCtxRef.current.currentTime,
          0.02
        );
      }
    });
  }, []);

  // Offline Caching Handlers
  const handleSaveOffline = async (track) => {
    const success = await saveTrackOffline(track);
    if (success) {
      setCachedTrackIds((prev) => [...new Set([...prev, track.id])]);
      showToast(`Saved "${track.title}" for offline playback`);
    } else {
      showToast(`Could not cache "${track.title}" offline`);
    }
    return success;
  };

  const handleRemoveOffline = async (trackId) => {
    const success = await removeOfflineTrack(trackId);
    if (success) {
      setCachedTrackIds((prev) => prev.filter((id) => id !== trackId));
      showToast('Removed track from offline storage');
    }
    return success;
  };

  const formatTime = (seconds) => {
    if (isNaN(seconds) || seconds < 0) return '0:00';
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return {
    tracks,
    setTracks,
    currentTrack,
    currentTrackIndex,
    isPlaying,
    isBuffering,
    currentTime,
    duration,
    volume,
    isMuted,
    isShuffle,
    repeatMode,
    // Studio State
    eqGains,
    activePreset,
    isSlowedReverb,
    playbackSpeed,
    is8DActive,
    isKaraokeMode,
    crossfadeDuration,
    panPosition,
    analyserNode: analyserRef.current,
    // Smart Queue & Auto-Radio
    queue,
    setQueue,
    autoPlayRadio,
    addToQueue,
    playNextInQueue,
    removeFromQueue,
    moveQueueItem,
    clearQueue,
    toggleAutoPlayRadio: () => setAutoPlayRadio((prev) => !prev),
    // Sleep Timer
    sleepTimerSetting,
    sleepTimerRemaining,
    setSleepTimer,
    clearSleepTimer,
    // Offline Cache
    cachedTrackIds,
    saveTrackOffline: handleSaveOffline,
    removeOfflineTrack: handleRemoveOffline,
    // Toast Notifications
    toastMessage,
    showToast,
    // Actions
    togglePlay,
    playTrack,
    nextTrack: handleNextTrack,
    prevTrack: handlePrevTrack,
    seek,
    setVolume,
    setIsMuted,
    toggleMute: () => setIsMuted((prev) => !prev),
    toggleShuffle: () => setIsShuffle((prev) => !prev),
    cycleRepeat: () => {
      setRepeatMode((prev) => (prev === 'off' ? 'all' : prev === 'all' ? 'one' : 'off'));
    },
    setEqBand,
    applyPreset,
    toggleSlowedReverb: () => setIsSlowedReverb((prev) => !prev),
    setPlaybackSpeed,
    toggle8D: () => setIs8DActive((prev) => !prev),
    toggleKaraoke: () => setIsKaraokeMode((prev) => !prev),
    setCrossfadeDuration,
    formatTime,
    initWebAudio
  };
}
