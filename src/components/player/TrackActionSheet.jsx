import React, { useState, useEffect } from 'react';
import { 
  X, Download, Check, ListPlus, ListMusic, Plus, 
  FolderPlus, Moon, Sliders, Share2, Heart, Music, Scissors 
} from 'lucide-react';
import { getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';

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
      <div className="relative w-full sm:max-w-md bg-[#0F0F14] border border-white/10 rounded-t-3xl sm:rounded-3xl shadow-2xl p-5 z-10 space-y-4 max-h-[85vh] overflow-y-auto">
        
        {/* Top Header with Track Preview */}
        <div className="flex items-center justify-between pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-3 min-w-0 pr-3">
            <img 
              src={getHighResThumbnail(track.cover, track.id)} 
              alt={track.title} 
              onError={handleCoverImageError}
              className="w-12 h-12 rounded-xl object-cover shrink-0 border border-white/10"
            />
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate">{track.title}</h3>
              <p className="text-xs text-zinc-400 truncate">{track.artist}</p>
            </div>
          </div>

          <button 
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
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
              className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-cyan-400 text-cyan-400' : 'text-zinc-400'}`} />
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
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
            >
              <div className="flex items-center gap-3.5">
                {isOffline ? (
                  <Check className="w-5 h-5 text-emerald-400" />
                ) : (
                  <Download className="w-5 h-5 text-zinc-400" />
                )}
                <span>{isOffline ? 'Saved for Offline Playback' : 'Download Song Offline'}</span>
              </div>
              {isOffline && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  READY
                </span>
              )}
            </button>

            {/* 3. Add to Playlist */}
            <button
              onClick={() => setShowPlaylistPicker(true)}
              className="w-full flex items-center justify-between px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
            >
              <div className="flex items-center gap-3.5">
                <FolderPlus className="w-5 h-5 text-cyan-400" />
                <span>Add to Custom Playlist</span>
              </div>
              <span className="text-xs text-zinc-500">›</span>
            </button>

            {/* 4. Play Next */}
            <button
              onClick={() => {
                engine.playNextInQueue(track);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
            >
              <ListPlus className="w-5 h-5 text-cyan-400" />
              <span>Play Next</span>
            </button>

            {/* 5. Add to Queue */}
            <button
              onClick={() => {
                engine.addToQueue(track);
                onClose();
              }}
              className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
            >
              <ListMusic className="w-5 h-5 text-violet-400" />
              <span>Add to Queue</span>
            </button>

            {/* 6. Cut Ringtone / Clip */}
            {onOpenClipper && (
              <button
                onClick={() => {
                  onClose();
                  onOpenClipper(track);
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
              >
                <Scissors className="w-5 h-5 text-cyan-400" />
                <span>Cut Ringtone / 30s Status Clip</span>
              </button>
            )}

            {/* 7. Sleep Timer Quick Options */}
            <div className="py-2 px-3 space-y-2 border-t border-b border-white/[0.06]">
              <div className="flex items-center gap-2 text-xs font-semibold text-zinc-400">
                <Moon className="w-4 h-4 text-amber-400" />
                <span>Sleep Timer:</span>
                {engine.sleepTimerRemaining && (
                  <span className="text-amber-300 font-mono">
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
                        ? 'bg-amber-400 text-black border-amber-400'
                        : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:text-white'
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
                      ? 'bg-amber-400 text-black border-amber-400'
                      : 'bg-white/[0.04] text-zinc-300 border-white/10 hover:text-white'
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
                    className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-red-500/20 text-red-300 border border-red-500/30"
                  >
                    Off
                  </button>
                )}
              </div>
            </div>

            {/* 7. Audio Studio Shortcut */}
            {onOpenStudio && (
              <button
                onClick={() => {
                  onClose();
                  onOpenStudio();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
              >
                <Sliders className="w-5 h-5 text-violet-400" />
                <span>Audio Studio (10-Band EQ & 8D)</span>
              </button>
            )}

            {/* 8. Share Song */}
            <button
              onClick={handleShare}
              className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
            >
              <Share2 className="w-5 h-5 text-cyan-400" />
              <span>Share Song</span>
            </button>

            {/* 9. Share Masakali 🕊️ App */}
            {onShareApp && (
              <button
                onClick={() => {
                  onClose();
                  onShareApp();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-zinc-200"
              >
                <Share2 className="w-5 h-5 text-violet-400" />
                <span>Share Masakali 🕊️ App</span>
              </button>
            )}

            {/* 10. Support Developer (UPI) */}
            {onOpenSupport && (
              <button
                onClick={() => {
                  onClose();
                  onOpenSupport();
                }}
                className="w-full flex items-center gap-3.5 px-3 py-3 rounded-2xl hover:bg-white/[0.06] text-sm font-medium transition-colors text-rose-300"
              >
                <Heart className="w-5 h-5 text-rose-400 fill-rose-500/30" />
                <span>Support Developer (UPI)</span>
              </button>
            )}

          </div>
        ) : (
          /* Sub-View: Add to Playlist Picker */
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-1">
              <button 
                onClick={() => setShowPlaylistPicker(false)}
                className="text-xs text-cyan-400 font-semibold hover:underline"
              >
                ← Back to options
              </button>
              <span className="text-xs font-bold text-zinc-400">Select Playlist</span>
            </div>

            {/* Create New Playlist Input */}
            <form onSubmit={handleCreatePlaylist} className="flex gap-2">
              <input
                type="text"
                placeholder="New playlist name..."
                value={newPlaylistName}
                onChange={(e) => setNewPlaylistName(e.target.value)}
                className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-3 py-2 bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-bold text-xs rounded-xl flex items-center gap-1 shadow-md hover:scale-105 transition-transform"
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
                    className={`w-full flex items-center justify-between p-3 rounded-2xl border transition-all text-xs font-semibold ${
                      inPlaylist 
                        ? 'bg-cyan-500/20 text-cyan-200 border-cyan-400/50' 
                        : 'bg-white/[0.03] text-zinc-300 border-white/[0.06] hover:bg-white/[0.06]'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Music className="w-4 h-4 text-cyan-400 shrink-0" />
                      <span className="truncate">{pl.title}</span>
                      <span className="text-[10px] text-zinc-500">
                        ({pl.trackIds?.length || 0} songs)
                      </span>
                    </div>

                    <div className={`w-5 h-5 rounded-full flex items-center justify-center border ${
                      inPlaylist ? 'bg-cyan-400 border-cyan-400 text-black' : 'border-zinc-600'
                    }`}>
                      {inPlaylist && <Check className="w-3 h-3 stroke-[3]" />}
                    </div>
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
