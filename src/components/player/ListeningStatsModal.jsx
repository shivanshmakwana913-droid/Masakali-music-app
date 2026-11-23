import React, { useState, useEffect } from 'react';
import { 
  X, BarChart2, Clock, Flame, Play, Music, Sparkles, 
  Share2, RotateCcw, Award, Check, User 
} from 'lucide-react';
import { getListeningAnalytics, clearAllStats } from '../../utils/musicStats';
import { getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';

export default function ListeningStatsModal({
  isOpen,
  onClose,
  onPlayTrack,
  showToast
}) {
  const [stats, setStats] = useState(() => getListeningAnalytics());
  const [isCopied, setIsCopied] = useState(false);

  // Refresh stats on open and on custom event
  useEffect(() => {
    if (!isOpen) return;
    setStats(getListeningAnalytics());

    const handleUpdate = () => {
      setStats(getListeningAnalytics());
    };

    window.addEventListener('as_music_stats_updated', handleUpdate);
    return () => window.removeEventListener('as_music_stats_updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleShareStats = async () => {
    const summaryText = `🕊️ My Masakali Stats:\n⏱️ Listening Time: ${stats.formattedTime}\n🎶 Songs Played: ${stats.totalPlays}\n🔥 Streak: ${stats.streakDays} days\n🎛️ Favorite Vibe: ${stats.favoriteVibe}\n${stats.topArtists[0] ? `🎤 Top Artist: ${stats.topArtists[0].name}` : ''}\n${stats.topSongs[0] ? `⭐ Top Song: ${stats.topSongs[0].title}` : ''}\n\nFree Your Music on Masakali 🕊️: ${window.location.origin || window.location.href}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My Masakali Stats 🕊️',
          text: summaryText,
          url: window.location.href
        });
        return;
      } catch (_) {}
    }

    try {
      await navigator.clipboard.writeText(summaryText);
      setIsCopied(true);
      if (showToast) showToast('Stats copied to clipboard!');
      setTimeout(() => setIsCopied(false), 2500);
    } catch (_) {}
  };

  const handleReset = () => {
    if (window.confirm('Reset all listening analytics and history?')) {
      clearAllStats();
      setStats(getListeningAnalytics());
      if (showToast) showToast('Listening analytics reset');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl max-h-[90vh] bg-[#09090E] border border-white/[0.1] rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none">
        
        {/* Subtle Ambient Background Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-gradient-to-b from-cyan-500/20 via-violet-500/10 to-transparent blur-3xl pointer-events-none -z-10" />

        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/[0.08] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-cyan-400 to-violet-500 p-[1px] shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <div className="w-full h-full bg-[#050507] rounded-[15px] flex items-center justify-center text-cyan-400">
                <BarChart2 className="w-5 h-5" />
              </div>
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-black text-white flex items-center gap-2">
                <span>Listening Analytics</span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                  Stats & Wrapped
                </span>
              </h2>
              <p className="text-xs text-zinc-400 mt-0.5">
                Real-time insights on your music taste & audio presets
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/[0.06] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-none">
          
          {/* 4-Metric Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* 1. Total Time */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Time</span>
                <Clock className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white truncate">
                  {stats.formattedTime}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Streamed & Local</div>
              </div>
            </div>

            {/* 2. Songs Played */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Tracks</span>
                <Music className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white">
                  {stats.totalPlays}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Songs enjoyed</div>
              </div>
            </div>

            {/* 3. Daily Streak */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Streak</span>
                <Flame className="w-4 h-4 text-amber-400" />
              </div>
              <div>
                <div className="text-lg sm:text-xl font-black text-white flex items-center gap-1">
                  <span>{stats.streakDays}</span>
                  <span className="text-xs text-amber-400 font-bold">days</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Consecutive listening</div>
              </div>
            </div>

            {/* 4. Top Vibe */}
            <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex flex-col justify-between space-y-2">
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Top Vibe</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <div className="text-xs sm:text-sm font-extrabold text-cyan-300 truncate">
                  {stats.favoriteVibe}
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">DSP Audio Preset</div>
              </div>
            </div>

          </div>

          {/* Top 5 Most Played Artists */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Award className="w-4 h-4 text-cyan-400" />
              <span>Top 5 Most Played Artists</span>
            </h3>

            {stats.topArtists.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center text-xs text-zinc-500">
                Play some songs to see your favorite artists here!
              </div>
            ) : (
              <div className="space-y-2">
                {stats.topArtists.map((artist, idx) => (
                  <div
                    key={artist.name}
                    className="p-3 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] transition-all space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Rank Badge */}
                        <span className={`w-5 text-center text-xs font-mono font-black ${
                          idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-500'
                        }`}>
                          #{idx + 1}
                        </span>

                        {/* Circular Avatar */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500/20 to-violet-500/30 border border-white/10 flex items-center justify-center text-cyan-300 text-xs font-bold shrink-0">
                          {artist.name.slice(0, 2).toUpperCase()}
                        </div>

                        <span className="text-sm font-bold text-white truncate max-w-[200px] sm:max-w-xs">
                          {artist.name}
                        </span>
                      </div>

                      <span className="text-xs font-semibold text-zinc-400 shrink-0">
                        {artist.count} {artist.count === 1 ? 'play' : 'plays'}
                      </span>
                    </div>

                    {/* Progress Bar (Zero bloat pure CSS) */}
                    <div className="w-full h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-cyan-400 to-violet-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.max(8, artist.percent)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Top 5 Most Played Songs */}
          <div className="space-y-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Music className="w-4 h-4 text-violet-400" />
              <span>Top 5 Most Played Songs</span>
            </h3>

            {stats.topSongs.length === 0 ? (
              <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/[0.05] text-center text-xs text-zinc-500">
                Play some songs to discover your top tracks!
              </div>
            ) : (
              <div className="space-y-2">
                {stats.topSongs.map((song, idx) => (
                  <div
                    key={song.id || idx}
                    className="p-2.5 rounded-2xl bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.05] flex items-center justify-between gap-3 group transition-all"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Rank */}
                      <span className={`w-5 text-center text-xs font-mono font-black shrink-0 ${
                        idx === 0 ? 'text-amber-400' : idx === 1 ? 'text-zinc-300' : idx === 2 ? 'text-amber-600' : 'text-zinc-500'
                      }`}>
                        #{idx + 1}
                      </span>

                      {/* Cover Thumbnail (HD upgraded) */}
                      <div className="w-10 h-10 rounded-xl overflow-hidden shrink-0 border border-white/10 shadow-sm relative">
                        <img
                          src={getHighResThumbnail(song.cover, song.id)}
                          alt={song.title}
                          onError={handleCoverImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Song & Artist */}
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-cyan-300 transition-colors">
                          {song.title}
                        </h4>
                        <p className="text-[11px] text-zinc-400 truncate">
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* Plays & Play Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-[11px] font-mono text-zinc-400 px-2 py-0.5 rounded-full bg-white/[0.04]">
                        {song.count} {song.count === 1 ? 'play' : 'plays'}
                      </span>

                      {onPlayTrack && (
                        <button
                          onClick={() => {
                            onPlayTrack(song);
                            onClose();
                          }}
                          className="p-2 rounded-xl bg-cyan-500/20 hover:bg-cyan-500 text-cyan-300 hover:text-black transition-all"
                          title="Play this track"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-white/[0.08] bg-[#0B0B10]/95 flex items-center justify-between gap-3 shrink-0">
          <button
            onClick={handleReset}
            className="text-xs text-zinc-500 hover:text-rose-400 flex items-center gap-1.5 transition-colors px-2 py-1"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stats</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={handleShareStats}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-cyan-400 to-violet-500 text-black font-extrabold text-xs flex items-center gap-2 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              {isCopied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-black" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Share2 className="w-3.5 h-3.5 text-black" />
                  <span>Share My Stats</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
