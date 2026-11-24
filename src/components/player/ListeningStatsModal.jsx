import React, { useState, useEffect } from 'react';
import { 
  X, BarChart2, Clock, Flame, Play, Music, 
  Share2, RotateCcw, Check, User 
} from 'lucide-react';
import { getListeningAnalytics, clearAllStats } from '../../utils/musicStats';
import { getHighResThumbnail, handleCoverImageError } from '../../services/musicApi';
import { useTheme } from '../../context/ThemeContext';

export default function ListeningStatsModal({
  isOpen,
  onClose,
  onPlayTrack,
  showToast
}) {
  const { isDark } = useTheme();
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className={`relative w-full max-w-xl max-h-[90vh] border rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none transition-colors ${
        isDark ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>
        
        {/* Modal Header */}
        <div className={`flex items-center justify-between p-5 sm:p-6 border-b shrink-0 ${
          isDark ? 'border-zinc-800' : 'border-zinc-200'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl border flex items-center justify-center ${
              isDark ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-zinc-100 border-zinc-200 text-black'
            }`}>
              <BarChart2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg sm:text-xl font-bold flex items-center gap-2">
                <span>Listening Analytics</span>
                <span className={`text-[10px] font-mono font-bold tracking-wider px-2 py-0.5 rounded-full border ${
                  isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-100 border-zinc-200 text-zinc-700'
                }`}>
                  STATS
                </span>
              </h2>
              <p className={`text-xs mt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Insights on your listening habits & top tracks
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'text-zinc-400 hover:text-white hover:bg-zinc-900' : 'text-zinc-600 hover:text-black hover:bg-zinc-100'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body - Scrollable */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6 scrollbar-none">
          
          {/* 4-Metric Bento Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            
            {/* 1. Total Time */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Time</span>
                <Clock className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                  {stats.formattedTime}
                </span>
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Total streamed</p>
              </div>
            </div>

            {/* 2. Total Plays */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Songs</span>
                <Play className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                  {stats.totalPlays}
                </span>
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Completed tracks</p>
              </div>
            </div>

            {/* 3. Daily Streak */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Streak</span>
                <Flame className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                  {stats.streakDays} {stats.streakDays === 1 ? 'day' : 'days'}
                </span>
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Listening streak</p>
              </div>
            </div>

            {/* 4. Favorite Vibe */}
            <div className={`p-3.5 rounded-2xl border flex flex-col justify-between space-y-2 ${
              isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
            }`}>
              <div className="flex items-center justify-between text-zinc-400">
                <span className="text-[11px] font-bold uppercase tracking-wider">Top Vibe</span>
                <Music className="w-4 h-4" />
              </div>
              <div>
                <span className={`text-sm sm:text-base font-black truncate block ${isDark ? 'text-white' : 'text-zinc-950'}`}>
                  {stats.favoriteVibe || 'Studio Flat'}
                </span>
                <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-zinc-400'}`}>Most active EQ</p>
              </div>
            </div>

          </div>

          {/* Top 5 Artists */}
          <div className="space-y-3">
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              <User className="w-4 h-4" />
              <span>Top Artists</span>
            </h3>

            {stats.topArtists.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center text-xs ${
                isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
              }`}>
                Play songs to unlock your top artists!
              </div>
            ) : (
              <div className="space-y-2.5">
                {stats.topArtists.map((artist, idx) => (
                  <div
                    key={artist.name}
                    className={`p-3 rounded-2xl border space-y-2 ${
                      isDark ? 'bg-zinc-900/50 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-xs font-mono font-bold text-zinc-400 w-4 text-center shrink-0">
                          #{idx + 1}
                        </span>

                        <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-xs font-bold shrink-0 ${
                          isDark ? 'bg-zinc-800 border-zinc-700 text-white' : 'bg-zinc-200 border-zinc-300 text-black'
                        }`}>
                          {artist.name.slice(0, 2).toUpperCase()}
                        </div>

                        <span className={`text-sm font-bold truncate max-w-[200px] sm:max-w-xs ${
                          isDark ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {artist.name}
                        </span>
                      </div>

                      <span className={`text-xs font-medium shrink-0 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                        {artist.count} {artist.count === 1 ? 'play' : 'plays'}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className={`w-full h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-zinc-800' : 'bg-zinc-200'
                    }`}>
                      <div 
                        className={`h-full rounded-full transition-all duration-500 ${
                          isDark ? 'bg-white' : 'bg-black'
                        }`}
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
            <h3 className={`text-xs font-bold uppercase tracking-wider flex items-center gap-2 ${
              isDark ? 'text-zinc-400' : 'text-zinc-600'
            }`}>
              <Music className="w-4 h-4" />
              <span>Top 5 Most Played Songs</span>
            </h3>

            {stats.topSongs.length === 0 ? (
              <div className={`p-6 rounded-2xl border text-center text-xs ${
                isDark ? 'bg-zinc-900/40 border-zinc-800 text-zinc-500' : 'bg-zinc-50 border-zinc-200 text-zinc-400'
              }`}>
                Play some songs to discover your top tracks!
              </div>
            ) : (
              <div className="space-y-2">
                {stats.topSongs.map((song, idx) => (
                  <div
                    key={song.id || idx}
                    className={`p-2.5 rounded-2xl border flex items-center justify-between gap-3 transition-colors ${
                      isDark ? 'bg-zinc-900/50 hover:bg-zinc-900 border-zinc-800' : 'bg-zinc-50 hover:bg-zinc-100 border-zinc-200'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Rank */}
                      <span className="w-5 text-center text-xs font-mono font-bold shrink-0 text-zinc-400">
                        #{idx + 1}
                      </span>

                      {/* Cover Thumbnail */}
                      <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 border relative ${
                        isDark ? 'border-zinc-800' : 'border-zinc-200'
                      }`}>
                        <img
                          src={getHighResThumbnail(song.cover, song.id)}
                          alt={song.title}
                          onError={handleCoverImageError}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {/* Song & Artist */}
                      <div className="min-w-0 flex-1">
                        <h4 className={`text-xs sm:text-sm font-bold truncate ${
                          isDark ? 'text-white' : 'text-zinc-950'
                        }`}>
                          {song.title}
                        </h4>
                        <p className={`text-[11px] truncate ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                          {song.artist}
                        </p>
                      </div>
                    </div>

                    {/* Plays & Play Button */}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className={`text-[11px] font-mono px-2 py-0.5 rounded-full ${
                        isDark ? 'bg-zinc-800 text-zinc-300' : 'bg-zinc-200 text-zinc-700'
                      }`}>
                        {song.count} {song.count === 1 ? 'play' : 'plays'}
                      </span>

                      {onPlayTrack && (
                        <button
                          onClick={() => {
                            onPlayTrack(song);
                            onClose();
                          }}
                          className={`p-2 rounded-xl transition-transform hover:scale-105 active:scale-95 ${
                            isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                          }`}
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
        <div className={`p-4 sm:p-5 border-t flex items-center justify-between gap-3 shrink-0 ${
          isDark ? 'border-zinc-800 bg-zinc-950' : 'border-zinc-200 bg-white'
        }`}>
          <button
            onClick={handleReset}
            className={`text-xs flex items-center gap-1.5 transition-colors px-2 py-1 ${
              isDark ? 'text-zinc-500 hover:text-red-400' : 'text-zinc-500 hover:text-red-600'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Stats</span>
          </button>

          <button
            onClick={handleShareStats}
            className={`px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm hover:scale-105 active:scale-95 transition-all ${
              isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            {isCopied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5" />
                <span>Share My Stats</span>
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
}
