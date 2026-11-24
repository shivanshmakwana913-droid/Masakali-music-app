import React, { useState } from 'react';
import { X, Heart, Copy, Check, Coffee, ShieldCheck } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import MasakaliLogo from '../common/MasakaliLogo';

export default function SupportDevModal({ isOpen, onClose, showToast }) {
  const { isDark } = useTheme();
  const [copied, setCopied] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState('100');

  if (!isOpen) return null;

  const upiId = 'shivanshmakwana913@okaxis';
  const payeeName = 'Masakali Creator';
  const note = 'Keep Masakali Flying Free 🕊️';

  const upiDeepLink = `upi://pay?pa=${encodeURIComponent(upiId)}&pn=${encodeURIComponent(payeeName)}&am=${selectedAmount}&cu=INR&tn=${encodeURIComponent(note)}`;

  const handleCopyUPI = async () => {
    try {
      await navigator.clipboard.writeText(upiId);
      setCopied(true);
      if (showToast) showToast('UPI ID copied to clipboard!');
      setTimeout(() => setCopied(false), 2500);
    } catch (_) {
      if (showToast) showToast('Failed to copy UPI ID');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">

      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className={`relative w-full max-w-md border rounded-3xl shadow-2xl p-6 z-10 space-y-5 overflow-hidden transition-colors duration-200 ${
        isDark ? 'bg-[#0E0E10] border-zinc-800 text-white' : 'bg-white border-zinc-200 text-zinc-950'
      }`}>

        {/* Header */}
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <MasakaliLogo className="w-10 h-10 rounded-2xl object-contain bg-black border border-zinc-800" />
            <div>
              <h3 className="text-base sm:text-lg font-bold tracking-tight">
                Support Masakali 🕊️
              </h3>
              <p className={`text-xs ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
                Free Your Music • 100% Ad-Free
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`p-1.5 rounded-full transition-colors ${
              isDark ? 'hover:bg-zinc-800 text-zinc-400 hover:text-white' : 'hover:bg-zinc-100 text-zinc-500 hover:text-black'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Friendly Creator Message */}
        <div className={`p-3.5 rounded-2xl border text-xs leading-relaxed space-y-1.5 ${
          isDark ? 'bg-zinc-900/60 border-zinc-800 text-zinc-300' : 'bg-zinc-50 border-zinc-200 text-zinc-700'
        }`}>
          <p>
            Hey! 👋 I built <strong>Masakali 🕊️</strong> with one pure intention: to free your music from intrusive ads, paywalls, and bloated algorithms.
          </p>
          <p>
            Enjoy studio-grade acoustics (10-Band EQ, Slowed+Reverb, 8D Spatial Audio, and Live Karaoke) in an ultra-lightweight player under 1MB.
          </p>
          <p className={`text-[11px] pt-0.5 ${isDark ? 'text-zinc-400' : 'text-zinc-500'}`}>
            If Masakali brings peace, rhythm, or joy to your day, consider chipping in for hosting & server costs so it can fly free forever for everyone!
          </p>
        </div>

        {/* Quick Amount Selector */}
        <div className="space-y-1.5">
          <label className={`text-[11px] font-semibold block ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
            Choose Contribution Amount (INR):
          </label>
          <div className="grid grid-cols-4 gap-2">
            {['50', '100', '250', '500'].map((amt) => (
              <button
                key={amt}
                onClick={() => setSelectedAmount(amt)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${
                  selectedAmount === amt
                    ? isDark 
                      ? 'bg-white text-black border-white shadow-sm' 
                      : 'bg-black text-white border-black shadow-sm'
                    : isDark 
                      ? 'bg-zinc-900 border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800' 
                      : 'bg-zinc-100 border-zinc-200 text-zinc-700 hover:text-black hover:bg-zinc-200'
                }`}
              >
                ₹{amt}
              </button>
            ))}
          </div>
        </div>

        {/* UPI Deep Link Action Button */}
        <div className="space-y-3 pt-1">
          <a
            href={upiDeepLink}
            className={`w-full py-3.5 px-4 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-95 shadow-md ${
              isDark
                ? 'bg-white text-black hover:bg-zinc-200'
                : 'bg-black text-white hover:bg-zinc-800'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>Pay ₹{selectedAmount} via UPI (GPay / PhonePe / Paytm)</span>
          </a>

          {/* Copy UPI ID Box */}
          <div className={`p-3 rounded-2xl border flex items-center justify-between gap-2 ${
            isDark ? 'bg-zinc-900/60 border-zinc-800' : 'bg-zinc-50 border-zinc-200'
          }`}>
            <div className="min-w-0 flex-1">
              <span className={`text-[10px] font-medium block uppercase tracking-wider ${
                isDark ? 'text-zinc-500' : 'text-zinc-400'
              }`}>
                Direct UPI ID
              </span>
              <span className="font-mono text-xs font-semibold select-all truncate block">
                {upiId}
              </span>
            </div>

            <button
              onClick={handleCopyUPI}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition-all active:scale-95 shrink-0 ${
                copied
                  ? 'bg-emerald-500 text-white border-emerald-500'
                  : isDark
                    ? 'bg-zinc-800 border-zinc-700 text-zinc-200 hover:bg-zinc-700'
                    : 'bg-zinc-200 border-zinc-300 text-zinc-800 hover:bg-zinc-300'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Security badge */}
        <div className={`flex items-center justify-center gap-1.5 text-[11px] ${
          isDark ? 'text-zinc-500' : 'text-zinc-400'
        }`}>
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Direct zero-commission creator support • 100% Secure UPI</span>
        </div>

      </div>
    </div>
  );
}
