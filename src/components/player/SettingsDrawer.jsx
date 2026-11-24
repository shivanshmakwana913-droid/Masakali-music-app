import React, { useState, useEffect } from 'react';
import { 
  X, Moon, Sun, Check, User, Video, Smartphone, 
  Heart, RotateCcw, ExternalLink, ShieldCheck, Sparkles, 
  LogOut, Edit3, Save, ChevronRight, Github, AlertTriangle
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { clearOfflineDatabase } from '../../utils/offlineStorage';
import MasakaliLogo from '../common/MasakaliLogo';

const AVATAR_OPTIONS = ['🕊️', '🎧', '🎵', '⚡', '🌟', '👤', '☕', '💎'];

export default function SettingsDrawer({
  isOpen,
  onClose,
  onOpenSupport,
  showToast
}) {
  const { theme, setTheme, isDark } = useTheme();

  // Local Profile state persisted in localStorage
  const [profile, setProfile] = useState(() => {
    try {
      const saved = localStorage.getItem('masakali_user_profile');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      name: 'Shivansh',
      avatar: '🕊️',
      isLoggedIn: true
    };
  });

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [nameInput, setNameInput] = useState(profile.name);
  const [selectedAvatar, setSelectedAvatar] = useState(profile.avatar);

  // 2-Step Reset Confirmation state
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem('masakali_user_profile', JSON.stringify(profile));
    } catch {}
  }, [profile]);

  if (!isOpen) return null;

  const handleSaveProfile = () => {
    const trimmed = nameInput.trim() || 'Music Lover';
    setProfile(prev => ({
      ...prev,
      name: trimmed,
      avatar: selectedAvatar,
      isLoggedIn: true
    }));
    setIsEditingProfile(false);
    if (showToast) showToast('Profile updated successfully!');
  };

  const handleToggleLogin = () => {
    if (profile.isLoggedIn) {
      setProfile({
        name: 'Guest Listener',
        avatar: '👤',
        isLoggedIn: false
      });
      if (showToast) showToast('Signed out of local profile');
    } else {
      setProfile({
        name: 'Shivansh',
        avatar: '🕊️',
        isLoggedIn: true
      });
      setNameInput('Shivansh');
      setSelectedAvatar('🕊️');
      if (showToast) showToast('Signed in to local profile');
    }
  };

  const handleResetAllData = async () => {
    setIsResetting(true);
    try {
      // Clear all local app keys
      const keysToRemove = [
        'as_music_liked_tracks',
        'as_music_listening_history',
        'as_music_custom_playlists',
        'as_music_volume',
        'as_music_eq_gains',
        'as_music_eq_preset',
        'masakali_theme',
        'masakali_user_profile'
      ];
      keysToRemove.forEach(k => {
        try { localStorage.removeItem(k); } catch {}
      });

      // Clear any lyrics cache keys
      try {
        const allKeys = Object.keys(localStorage);
        allKeys.forEach(k => {
          if (k.startsWith('as_music_')) {
            localStorage.removeItem(k);
          }
        });
      } catch {}

      // Clear IndexedDB offline storage
      await clearOfflineDatabase();

      if (showToast) showToast('Reset complete! Restoring clean defaults...');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    } catch (err) {
      setIsResetting(false);
      setShowResetConfirm(false);
      if (showToast) showToast('Reset failed: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      {/* Tap backdrop to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Drawer Body */}
      <div className={`relative w-full max-w-md h-full flex flex-col z-10 shadow-2xl transition-colors duration-200 ${
        isDark ? 'bg-[#0A0A0A] text-white border-l border-zinc-800' : 'bg-white text-zinc-950 border-l border-zinc-200'
      }`}>
        
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4.5 border-b shrink-0 ${
          isDark ? 'border-zinc-800/80 bg-[#0A0A0A]' : 'border-zinc-200 bg-white'
        }`}>
          <div className="flex items-center gap-2.5">
            <MasakaliLogo className="w-7 h-7 rounded-lg object-contain bg-black" />
            <div>
              <h2 className="text-base font-bold tracking-tight">Settings</h2>
              <p className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Preferences & Developer Information
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-2 rounded-xl transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-zinc-950'
            }`}
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* 1. APPEARANCE (Theme Toggle) */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight">Appearance</h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Simple Black & White Theme System
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Minimal Black Card */}
              <button
                onClick={() => setTheme('dark')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                  isDark
                    ? 'bg-zinc-900 border-white text-white shadow-sm ring-1 ring-white/20'
                    : 'bg-zinc-900 border-zinc-700 text-white opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-black border border-zinc-700 flex items-center justify-center">
                    <Moon className="w-4 h-4 text-white" />
                  </div>
                  {isDark && (
                    <span className="w-5 h-5 rounded-full bg-white text-black flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Minimal Black</div>
                  <div className="text-[10px] text-zinc-400">Pure matte black & white</div>
                </div>
              </button>

              {/* Clean White Card */}
              <button
                onClick={() => setTheme('light')}
                className={`p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-between h-28 ${
                  !isDark
                    ? 'bg-white border-zinc-950 text-zinc-950 shadow-sm ring-1 ring-zinc-950/20'
                    : 'bg-white border-zinc-300 text-zinc-950 opacity-85 hover:opacity-100'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="w-7 h-7 rounded-lg bg-zinc-100 border border-zinc-300 flex items-center justify-center">
                    <Sun className="w-4 h-4 text-zinc-950" />
                  </div>
                  {!isDark && (
                    <span className="w-5 h-5 rounded-full bg-zinc-950 text-white flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>
                <div>
                  <div className="text-xs font-bold text-zinc-950">Clean White</div>
                  <div className="text-[10px] text-zinc-500">Minimal monochrome light</div>
                </div>
              </button>
            </div>
          </section>

          {/* 2. ACCOUNT / QUICK PROFILE */}
          <section className={`p-4 rounded-2xl border ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          } space-y-3.5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 border ${
                  isDark ? 'bg-black border-zinc-700' : 'bg-white border-zinc-200'
                }`}>
                  {profile.avatar}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold tracking-tight">{profile.name}</span>
                    {profile.isLoggedIn && (
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="Active Local Profile" />
                    )}
                  </div>
                  <span className={`text-[11px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    {profile.isLoggedIn ? 'Local Profile • Active' : 'Guest Mode'}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setIsEditingProfile(!isEditingProfile)}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                    isDark ? 'border-zinc-700 hover:bg-zinc-800 text-zinc-300' : 'border-zinc-300 hover:bg-zinc-200 text-zinc-700'
                  }`}
                  title="Edit Profile"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
                <button
                  onClick={handleToggleLogin}
                  className={`p-2 rounded-xl text-xs font-semibold border transition-colors ${
                    profile.isLoggedIn
                      ? isDark ? 'border-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400' : 'border-zinc-200 hover:bg-red-500/10 text-zinc-600 hover:text-red-500'
                      : isDark ? 'border-zinc-700 hover:bg-zinc-800 text-white' : 'border-zinc-300 hover:bg-zinc-200 text-black'
                  }`}
                  title={profile.isLoggedIn ? 'Sign Out' : 'Sign In'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Profile Editing Form */}
            {isEditingProfile && (
              <div className={`pt-3 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} space-y-3`}>
                <div className="space-y-1.5">
                  <label className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Listener Name
                  </label>
                  <input
                    type="text"
                    value={nameInput}
                    onChange={(e) => setNameInput(e.target.value)}
                    placeholder="Enter your name"
                    maxLength={30}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium border outline-none transition-colors ${
                      isDark 
                        ? 'bg-black border-zinc-700 text-white focus:border-white' 
                        : 'bg-white border-zinc-300 text-zinc-950 focus:border-black'
                    }`}
                  />
                </div>

                <div className="space-y-1.5">
                  <label className={`text-[11px] font-semibold ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Choose Avatar Emblem
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {AVATAR_OPTIONS.map((av) => (
                      <button
                        key={av}
                        onClick={() => setSelectedAvatar(av)}
                        className={`w-8 h-8 rounded-lg text-sm flex items-center justify-center border transition-all ${
                          selectedAvatar === av
                            ? isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                            : isDark ? 'bg-black border-zinc-800 hover:border-zinc-700' : 'bg-white border-zinc-200 hover:border-zinc-300'
                        }`}
                      >
                        {av}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleSaveProfile}
                  className={`w-full py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isDark ? 'bg-white text-black hover:bg-zinc-200' : 'bg-black text-white hover:bg-zinc-800'
                  }`}
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Profile</span>
                </button>
              </div>
            )}
          </section>

          {/* 3. DEVELOPER VLOG */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight">Developer Journey</h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Behind-the-scenes vlogs & build logs
                </p>
              </div>
            </div>

            <a
              href="https://github.com/shivanshmakwana913-droid"
              target="_blank"
              rel="noopener noreferrer"
              className={`p-3.5 rounded-2xl border flex items-center justify-between transition-all group ${
                isDark 
                  ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-900' 
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-black border-zinc-700 text-white' : 'bg-white border-zinc-200 text-black'
                }`}>
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                    <span>Developer Vlogs & Updates</span>
                    <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                  </div>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Watch engineering devlogs by Shivansh Makwana
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </a>
          </section>

          {/* 4. MORE APPS BY DEVELOPER */}
          <section className="space-y-2.5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold tracking-tight">More by Shivansh Makwana</h3>
                <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                  Clean, fast & ad-free independent applications
                </p>
              </div>
            </div>

            <div className="space-y-2">
              {/* Raabta App */}
              <a
                href="https://github.com/shivanshmakwana913-droid"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all group ${
                  isDark 
                    ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' 
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${
                    isDark ? 'bg-black border-zinc-700' : 'bg-white border-zinc-200'
                  }`}>
                    ❤️
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                      <span>Raabta App</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.2 rounded border ${
                        isDark ? 'bg-zinc-800 border-zinc-700 text-zinc-300' : 'bg-zinc-200 border-zinc-300 text-zinc-700'
                      }`}>
                        Soulful
                      </span>
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Music streaming & heartfelt connection platform
                    </p>
                  </div>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-zinc-400 group-hover:text-current" />
              </a>

              {/* Masakali Web & Mobile */}
              <div
                className={`p-3 rounded-2xl border flex items-center justify-between ${
                  isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm border ${
                    isDark ? 'bg-black border-zinc-700' : 'bg-white border-zinc-200'
                  }`}>
                    🕊️
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                      <span>Masakali Music</span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded border ${
                        isDark ? 'bg-white text-black border-white' : 'bg-black text-white border-black'
                      }`}>
                        Current
                      </span>
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      Ultra-light &lt;1MB ad-free audio studio with 10-Band EQ
                    </p>
                  </div>
                </div>
              </div>

              {/* GitHub Portfolio */}
              <a
                href="https://github.com/shivanshmakwana913-droid"
                target="_blank"
                rel="noopener noreferrer"
                className={`p-3 rounded-2xl border flex items-center justify-between transition-all group ${
                  isDark 
                    ? 'bg-zinc-900/60 border-zinc-800 hover:border-zinc-700' 
                    : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                    isDark ? 'bg-black border-zinc-700 text-white' : 'bg-white border-zinc-200 text-black'
                  }`}>
                    <Github className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-xs font-bold tracking-tight flex items-center gap-1.5">
                      <span>GitHub Portfolio</span>
                      <ExternalLink className="w-3 h-3 opacity-60 group-hover:opacity-100" />
                    </div>
                    <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                      github.com/shivanshmakwana913-droid
                    </p>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
              </a>
            </div>
          </section>

          {/* 5. SUPPORT DEVELOPER */}
          <section className="space-y-2">
            <button
              onClick={() => {
                if (onOpenSupport) onOpenSupport();
              }}
              className={`w-full p-3.5 rounded-2xl border flex items-center justify-between transition-all group ${
                isDark
                  ? 'bg-zinc-900 border-zinc-800 hover:border-zinc-700 text-white'
                  : 'bg-zinc-50 border-zinc-200 hover:border-zinc-300 text-zinc-950'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-500 flex items-center justify-center shrink-0">
                  <Heart className="w-4 h-4 fill-rose-500" />
                </div>
                <div className="text-left">
                  <div className="text-xs font-bold tracking-tight">Support Masakali via UPI</div>
                  <p className={`text-[10px] ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                    Keep it running 100% ad-free & server hosted
                  </p>
                </div>
              </div>
              <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </section>

          {/* 6. RESET APP DATA */}
          <section className={`p-4 rounded-2xl border ${
            isDark ? 'bg-zinc-900/40 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          } space-y-3`}>
            <div>
              <h3 className="text-sm font-bold tracking-tight">Data & Cache Storage</h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Clear cached songs, listening history, playlists & preferences
              </p>
            </div>

            {!showResetConfirm ? (
              <button
                onClick={() => setShowResetConfirm(true)}
                className={`w-full py-2.5 px-3 rounded-xl border text-xs font-semibold flex items-center justify-center gap-2 transition-colors ${
                  isDark 
                    ? 'border-zinc-800 hover:border-red-500/40 hover:bg-red-500/10 text-zinc-400 hover:text-red-400' 
                    : 'border-zinc-300 hover:border-red-500/40 hover:bg-red-500/10 text-zinc-600 hover:text-red-600'
                }`}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset App Data</span>
              </button>
            ) : (
              <div className={`p-3 rounded-xl border ${
                isDark ? 'bg-red-500/10 border-red-500/30' : 'bg-red-50 border-red-200'
              } space-y-2.5 animate-in fade-in`}>
                <div className="flex items-start gap-2 text-xs text-red-500">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span className="leading-tight font-medium">
                    Are you sure? This will clear all offline tracks, liked songs, history, and custom settings.
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    disabled={isResetting}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold border ${
                      isDark ? 'border-zinc-700 bg-zinc-800 text-zinc-300' : 'border-zinc-300 bg-zinc-100 text-zinc-700'
                    }`}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleResetAllData}
                    disabled={isResetting}
                    className="flex-1 py-1.5 rounded-lg text-xs font-bold bg-red-600 text-white hover:bg-red-700 transition-colors"
                  >
                    {isResetting ? 'Resetting...' : 'Yes, Reset'}
                  </button>
                </div>
              </div>
            )}
          </section>

          {/* Version Info & Disclaimer */}
          <div className={`text-center pt-2 pb-4 ${isDark ? 'text-zinc-600' : 'text-zinc-400'} text-[11px] space-y-1.5`}>
            <div>Masakali 🕊️ v1.0 • Engineered by Shivansh Makwana</div>
            <p className="text-[10px] leading-relaxed max-w-xs mx-auto text-zinc-500">
              Masakali is an educational open-source audio player interface. All media belongs to respective owners.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}
