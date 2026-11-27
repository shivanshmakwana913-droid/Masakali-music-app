import React from 'react';

const CORRUPTIBLE_STORAGE_KEYS = [
  'as_music_prefs',
  'history',
  'as_music_history',
  'as_music_stats',
  'as_music_recently_played',
  'as_music_liked_tracks',
  'as_music_custom_playlists',
  'as_music_artist_affinity',
  'masakali_user_profile',
  'masakali_theme'
];

/**
 * Safely inspect localStorage for corrupted JSON entries and remove only broken keys,
 * or all known app state keys when performing a full recovery.
 */
export function clearCorruptedStorage(forceAll = false) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return;

    if (forceAll) {
      CORRUPTIBLE_STORAGE_KEYS.forEach((key) => {
        try {
          localStorage.removeItem(key);
        } catch (_) {}
      });
      return;
    }

    // Validate JSON-backed keys and remove any that fail to parse
    CORRUPTIBLE_STORAGE_KEYS.forEach((key) => {
      if (key === 'masakali_theme') return;
      try {
        const raw = localStorage.getItem(key);
        if (raw !== null) {
          JSON.parse(raw);
        }
      } catch (_) {
        try {
          localStorage.removeItem(key);
        } catch (__) {}
      }
    });
  } catch (_) {}
}

/**
 * React Error Boundary with automatic mobile boot recovery.
 * Clears corrupted localStorage data on startup crashes instead of rendering a blank screen.
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, recovered: false };
    // Proactively purge malformed JSON entries before children mount
    clearCorruptedStorage(false);
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error('Masakali ErrorBoundary caught:', error, info);
    clearCorruptedStorage(true);

    // Attempt one automatic clean reload per session to recover mobile boots seamlessly
    try {
      const alreadyRecovered = sessionStorage.getItem('masakali_boot_recovered');
      if (!alreadyRecovered) {
        sessionStorage.setItem('masakali_boot_recovered', '1');
        window.location.reload();
        return;
      }
    } catch (_) {}

    this.setState({ recovered: true });
  }

  handleManualReset = () => {
    clearCorruptedStorage(true);
    try {
      sessionStorage.removeItem('masakali_boot_recovered');
    } catch (_) {}
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#050507] text-white flex flex-col items-center justify-center p-6 text-center select-none">
          <div className="max-w-sm w-full rounded-3xl border border-zinc-800 bg-zinc-950/90 p-6 space-y-4 shadow-2xl">
            <img
              src="/logo.png"
              alt="Masakali"
              className="w-12 h-12 mx-auto object-contain opacity-90"
            />
            <div className="space-y-1.5">
              <h1 className="text-lg font-bold tracking-tight">Restoring Masakali</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Cleared stale local cache so the app can boot cleanly on your device.
              </p>
            </div>
            <button
              type="button"
              onClick={this.handleManualReset}
              className="w-full py-2.5 px-4 rounded-2xl bg-white text-black text-xs font-bold hover:bg-zinc-200 active:scale-[0.98] transition-all"
            >
              Reload App
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
