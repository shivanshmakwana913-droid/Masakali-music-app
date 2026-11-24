import React, { useState, useEffect } from 'react';
import { 
  X, Download, Check, ListPlus, ListMusic, Plus, 
  FolderPlus, Moon, Sliders, Share2, Heart, Scissors 
} from 'lucide-react';
import { getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';
import { useTheme } from '../../context/ThemeContext';

export default function TrackActionSheet({
  isOpen,
  onClose,
  track,
  engine,
  isLiked,
  onToggleLike,
  onOpenStudio,
  onOpenClipper,
  onShareApp,
  onOpenSupport
}) {
  const { isDark } = useTheme();
  const [showPlaylistPicker, setShowPlaylistPicker] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [customPlaylists, setCustomPlaylists] = useState([]);

  // Load custom playlists from localStorage
  useEffect(() => {
    if (!isOpen) {
      setShowPlaylistPicker(false);
      return;
    }
    try {
      const stored = localStorage.getItem('as_music_custom_playlists');
      if (stored) {
        setCustomPlaylists(JSON.parse(stored));
      } else {
        const defaultLists = [
          { id: 'pl-favs', title: 'Favorites', trackIds: [] },
          { id: 'pl-vibes', title: 'Night Vibes', trackIds: [] }
        ];
        localStorage.setItem('as_music_custom_playlists', JSON.stringify(defaultLists));
        setCustomPlaylists(defaultLists);
      }
    } catch (e) {
      setCustomPlaylists([]);
    }
  }, [isOpen]);

  if (!isOpen || !track) return null;

  const isOffline = engine.cachedTrackIds.includes(track.id);

  // Toggle Track in a Custom Playlist
  const toggleTrackInPlaylist = (playlistId) => {
    try {
      const updated = customPlaylists.map((pl) => {
        if (pl.id !== playlistId) return pl;
        const exists = pl.trackIds?.includes(track.id);
        const newIds = exists 
          ? pl.trackIds.filter(id => id !== track.id) 
          : [...(pl.trackIds || []), track.id];
        return { ...pl, trackIds: newIds };
      });

      setCustomPlaylists(updated);
      localStorage.setItem('as_music_custom_playlists', JSON.stringify(updated));
      engine.showToast(`Updated "${customPlaylists.find(p => p.id === playlistId)?.title}"`);
    } catch (e) {}
  };

  // Create New Custom Playlist
  const handleCreatePlaylist = (e) => {
    e.preventDefault();
    if (!newPlaylistName.trim()) return;

    const newPl = {
      id: `pl-${Date.now()}`,
      title: newPlaylistName.trim(),
      trackIds: [track.id]
    };

    const updated = [...customPlaylists, newPl];
    setCustomPlaylists(updated);
    try {
      localStorage.setItem('as_music_custom_playlists', JSON.stringify(updated));
    } catch (e) {}
    setNewPlaylistName('');
    engine.showToast(`Created "${newPl.title}" and added song`);
  };

  // Share Song Handler
  const handleShare = async () => {
    const shareData = {
      title: track.title,
      text: `Listen to "${track.title}" by ${track.artist} on Masakali 🕊️!`,
      url: window.location.href
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        engine.showToast('Song shared!');
        onClose();
        return;
      } catch (err) {
        if (err.name === 'AbortError') return;
      }
    }

    try {
      await navigator.clipboard.writeText(`${track.title} - ${track.artist} (Playing on Masakali 🕊️: ${window.location.href})`);
      engine.showToast('Song link copied to clipboard!');
      onClose();
    } catch {
      engine.showToast('Unable to copy link');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      
      {/* Backdrop tap to dismiss */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Action Sheet Container */}
      <div className={`relative w-full sm:max-w-md border rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 z-10 space-y-4 max-h-[85vh] overflow-y-auto transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Top Header with Track Preview */}
        <div className={`flex items-center justify-between pb-3 border-b ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <img 
              src={getHighResThumbnail(track.cover, track.id)} 
              alt={track.title} 
              onError={handleCoverImageError}
              className={`w-12 h-12 rounded-xl object-cover shrink-0 border ${
                isDark ? 'border-zinc-800' : 'border-zinc-200'
              }`}
            />
            <div className="min-w-0">
              <h3 className={`text-sm font-bold truncate ${isDark ? 'text-white' : 'text-zinc-950'}`}>{track.title}</h3>
              <p className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>{track.artist}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className={`p-2 rounded-full transition-colors ${
              isDark ? 'hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-600 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Options List */}
        {!showPlaylistPicker ? (
          <div className="space-y-1">
            
            {/* 1. Like Song */}
            <button
              onClick={() => {
                onToggleLike(track.id);
                engine.showToast(isLiked ? 'Removed from Liked Songs' : 'Added to Liked Songs');
              }}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? (isDark ? 'fill-white text-white' : 'fill-black text-black') : 'text-zinc-400'}`} />
              <span>{isLiked ? 'Liked (In Your Library)' : 'Add to Liked Songs'}</span>
            </button>

            {/* 2. Download / Offline */}
            <button
              onClick={async () => {
                if (isOffline) {
                  await engine.removeOfflineTrack(track.id);
                } else {
                  await engine.saveTrackOffline(track);
                }
              }}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3.5">
                {isOffline ? (
                  <Check className="w-5 h-5 text-emerald-500" />
                ) : (
                  <Download className="w-5 h-5 text-zinc-400" />
                )}
                <span>{isOffline ? 'Saved for Offline Playback' : 'Download Song Offline'}</span>
              </div>
              {isOffline && (
                <span className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded ${
                  isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-800'
                }`}>
                  READY
                </span>
              )}
            </button>

            {/* 3. Add to Playlist */}
            <button
              onClick={() => setShowPlaylistPicker(true)}
              className={`w-full flex items-center justify-between px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <div className="flex items-center gap-3.5">
                <FolderPlus className="w-5 h-5 text-zinc-400" />
                <span>Add to Custom Playlist</span>
              </div>
              <span className="text-xs text-zinc-400">›</span>
            </button>

            {/* 4. Play Next */}
            <button
              onClick={() => {
                engine.playNextInQueue(track);
                onClose();
              }}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <ListPlus className="w-5 h-5 text-zinc-400" />
              <span>Play Next</span>
            </button>

            {/* 5. Add to Queue */}
            <button
              onClick={() => {
                engine.addToQueue(track);
                onClose();
              }}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <ListMusic className="w-5 h-5 text-zinc-400" />
              <span>Add to Queue</span>
            </button>

            {/* 6. Cut Ringtone / Clip */}
            {onOpenClipper && (
              <button
                onClick={() => {
                  onClose();
                  onOpenClipper(track);
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                }`}
              >
                <Scissors className="w-5 h-5 text-zinc-400" />
                <span>Cut Ringtone / 30s Status Clip</span>
              </button>
            )}

            {/* 7. Sleep Timer Quick Options */}
            <div className={`py-2 px-3 space-y-2 border-t border-b ${
              isDark ? 'border-zinc-800' : 'border-zinc-200'
            }`}>
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <Moon className="w-4 h-4" />
                <span>Sleep Timer:</span>
                {engine.sleepTimerRemaining && (
                  <span className="font-mono font-bold">
                    ({Math.ceil(engine.sleepTimerRemaining / 60)}m left)
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    onClick={() => {
                      engine.setSleepTimer(mins);
                      onClose();
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                      engine.sleepTimerSetting === mins
                        ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                        : isDark ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-black'
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
                <button
                  onClick={() => {
                    engine.setSleepTimer('end_of_track');
                    onClose();
                  }}
                  className={`px-2.5 py-1 rounded-xl text-xs font-semibold border transition-all ${
                    engine.sleepTimerSetting === 'end_of_track'
                      ? isDark ? 'bg-white text-black border-white font-bold' : 'bg-black text-white border-black font-bold'
                      : isDark ? 'bg-zinc-900 text-zinc-300 border-zinc-800 hover:text-white' : 'bg-zinc-100 text-zinc-700 border-zinc-200 hover:text-black'
                  }`}
                >
                  End of Track
                </button>
                {engine.sleepTimerSetting && (
                  <button
                    onClick={() => {
                      engine.clearSleepTimer();
                      engine.showToast('Sleep timer turned off');
                    }}
                    className={`px-2.5 py-1 rounded-xl text-xs font-semibold border ${
                      isDark ? 'bg-rose-950/40 text-rose-300 border-rose-900' : 'bg-rose-50 text-rose-700 border-rose-200'
                    }`}
                  >
                    Off
                  </button>
                )}
              </div>
            </div>

            {/* 8. Audio Studio Shortcut */}
            {onOpenStudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStudio();
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                }`}
              >
                <Sliders className="w-5 h-5 text-zinc-400" />
                <span>Audio Studio (10-Band EQ & 8D)</span>
              </button>
            )}

            {/* 9. Share Song */}
            <button
              onClick={handleShare}
              className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
              }`}
            >
              <Share2 className="w-5 h-5 text-zinc-400" />
              <span>Share Song</span>
            </button>

            {/* 10. Share Masakali App */}
            {onShareApp && (
              <button
                onClick={() => {
                  onClose();
                  onShareApp();
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                }`}
              >
                <Share2 className="w-5 h-5 text-zinc-400" />
                <span>Share Masakali App</span>
              </button>
            )}

            {/* 11. Support Developer */}
            {onOpenSupport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSupport();
                }}
                className={`w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl text-sm font-medium transition-colors ${
                  isDark ? 'hover:bg-zinc-900 text-zinc-200' : 'hover:bg-zinc-100 text-zinc-800'
                }`}
              >
                <Heart className="w-5 h-5 text-zinc-400" />
                <span>Support Masakali (UPI)</span>
              </button>
            )}

          </div>
        ) : (
          /* Sub-View: Add to Playlist Picker */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <button 
                onClick={() => setShowPlaylistPicker(false)}
                className={`text-xs font-semibold hover:underline ${isDark ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'}`}
              >
                ← Back to options
              </button>
              <span className={`text-xs font-bold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>Select Playlist</span>
            </div>

            {/* Create New Playlist Input */}
            <form onSubmit={handleCreatePlaylist} className="flex gap-2">
              <input
                type="text"
                placeholder="New playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none transition-colors ${
                  isDark 
                    ? 'bg-zinc-900 border-zinc-800 text-white placeholder-zinc-500 focus:border-zinc-600' 
                    : 'bg-zinc-100 border-zinc-200 text-black placeholder-zinc-400 focus:border-zinc-400'
                }`}
              />
              <button
                type="submit"
                className={`px-3.5 py-2 font-bold text-xs rounded-xl flex items-center gap-1 shadow-sm transition-transform hover:scale-105 ${
                  isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create</span>
              </button>
            </form>

            {/* Playlist List */}
            <div className="space-y-1.5 max-h-52 overflow-y-auto">
              {customPlaylists.map((pl) => {
                const inPlaylist = pl.trackIds?.includes(track.id);
                return (
                  <button
                    key={pl.id}
                    onClick={() => toggleTrackInPlaylist(pl.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl border text-xs font-medium transition-colors ${
                      inPlaylist
                        ? isDark ? 'bg-zinc-900 border-zinc-700 text-white' : 'bg-zinc-100 border-zinc-300 text-black'
                        : isDark ? 'border-zinc-800/60 hover:bg-zinc-900 text-zinc-400 hover:text-white' : 'border-zinc-200 hover:bg-zinc-100 text-zinc-600 hover:text-black'
                    }`}
                  >
                    <span>{pl.title} ({pl.trackIds?.length || 0})</span>
                    {inPlaylist ? (
                      <Check className="w-4 h-4" />
                    ) : (
                      <Plus className="w-4 h-4 text-zinc-400" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
