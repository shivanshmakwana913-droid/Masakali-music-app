import React, { useState } from 'react';
import { X, Heart, Copy, Check, ExternalLink, Sparkles, Coffee, ShieldCheck } from 'lucide-react';
import MasakaliLogo from '../common/MasakaliLogo';

export default function SupportDevModal({ isOpen, onClose, showToast }) {
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">

      {/* Backdrop tap to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-md bg-[#0F0F14] border border-white/10 rounded-3xl shadow-2xl p-6 z-10 space-y-5 text-white overflow-hidden">

        {/* Glow decoration */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-violet-500/20 to-transparent blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-start justify-between relative">
          <div className="flex items-center gap-3">
            <MasakaliLogo className="w-11 h-11 rounded-2xl object-cover" />
            <div>
              <h3 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Keep Masakali Flying Free 🕊️</span>
                <Sparkles className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-xs text-zinc-400">Free Your Music. Fly Without Ads. • 100% Ad-Free</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Friendly Creator Message */}
        <div className="p-3.5 rounded-2xl bg-white/[0.03] border border-white/[0.06] text-xs text-zinc-300 leading-relaxed space-y-1.5">
          <p>
            Hey! 👋 I built <strong>Masakali 🕊️</strong> with one pure intention: to free your music from intrusive ads, paywalls, and bloated algorithms.
          </p>
          <p>
            Enjoy studio-grade acoustics (10-Band EQ, Slowed+Reverb, 8D Spatial Audio, and Live Karaoke) in an ultra-lightweight player under 1MB.
          </p>
          <p className="text-zinc-400 text-[11px] pt-0.5">
            If Masakali brings peace, rhythm, or joy to your day, consider chipping in for hosting & updates so it can fly free forever for everyone! 🕊️
          </p>
        </div>

        {/* Quick Amount Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-semibold text-zinc-400 block">Choose Contribution Amount (INR):</label>
          <div className="grid grid-cols-4 gap-2">
            {['50', '100', '250', '500'].map((amt) => (
              <button
                key={amt}
                onClick={() => setSelectedAmount(amt)}
                className={`py-2 rounded-xl text-xs font-bold border transition-all ${selectedAmount === amt
                    ? 'bg-gradient-to-r from-cyan-400 to-violet-500 text-black border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.3)]'
                    : 'bg-white/[0.04] text-zinc-300 border-white/[0.08] hover:text-white hover:bg-white/[0.08]'
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
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-black font-extrabold text-sm flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(16,185,129,0.35)] transition-all hover:scale-[1.02] active:scale-95"
          >
            <Coffee className="w-4 h-4 fill-black" />
            <span>Pay ₹{selectedAmount} via UPI App (GPay / PhonePe / Paytm)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {/* Copyable UPI ID Strip */}
          <div className="flex items-center justify-between p-3 rounded-2xl bg-[#09090D] border border-white/10 text-xs">
            <div className="min-w-0 pr-2">
              <span className="text-[10px] text-zinc-500 uppercase tracking-wider block font-semibold">UPI ID:</span>
              <span className="font-mono text-cyan-300 font-bold truncate block">{upiId}</span>
            </div>

            <button
              onClick={handleCopyUPI}
              className="px-3 py-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-xs font-semibold flex items-center gap-1.5 transition-all active:scale-95 shrink-0"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-zinc-300" />
                  <span>Copy UPI</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Trust Badge */}
        <div className="pt-2 border-t border-white/[0.06] flex items-center justify-center gap-2 text-[11px] text-zinc-500">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Secure direct UPI transfer • No middleman fees</span>
        </div>

      </div>

    </div>
  );
}
