<p align="center">
  <img src="public/logo.png" width="130" alt="Masakali Logo" style="border-radius: 32px; box-shadow: 0 0 45px rgba(6,182,212,0.45);" />
</p>

<h1 align="center">Masakali 🕊️ — Free Your Music</h1>

<p align="center">
  <strong>"Free Your Music. Fly Without Ads."</strong><br>
  <em>An ultra-lightweight (<1MB bundle), high-fidelity ad-free music streaming player & real-time audio studio for Android, iOS, and Desktop.</em>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Bundle%20Size-%3C%20112%20kB%20gzipped-06B6D4?style=for-the-badge&logo=speedtest&logoColor=white" alt="Bundle Size" />
  <img src="https://img.shields.io/badge/Ads-100%25%20Free-10B981?style=for-the-badge&logo=adguard&logoColor=white" alt="Ad Free" />
  <img src="https://img.shields.io/badge/Audio-10--Band%20EQ%20%2B%208D-8B5CF6?style=for-the-badge&logo=airplayaudio&logoColor=white" alt="Studio Audio" />
  <img src="https://img.shields.io/badge/Platform-Android%20%7C%20iOS%20%7C%20Web-EC4899?style=for-the-badge&logo=pwa&logoColor=white" alt="Cross Platform" />
  <img src="https://img.shields.io/badge/License-MIT-3B82F6?style=for-the-badge" alt="License" />
</p>

<p align="center">
  <a href="https://pages.dev">
    <img src="https://img.shields.io/badge/🌐_Launch_App-Live_Web_App-06B6D4?style=for-the-badge&logo=googlechrome&logoColor=white" alt="Live Web App" />
  </a>
</p>

---

## 🌟 What is Masakali?

**Masakali 🕊️** is an ultra-fast, zero-bloat music streaming app designed to liberate your music from endless video ads, intrusive tracking, and slow mobile buffering. Engineered with native Web Audio API DSP nodes and progressive web app (PWA) architecture, Masakali delivers an uncompromising audiophile studio experience in **less than 112 kB gzipped** of code.

---

## ✨ Features Showcase

### 🎛️ Real-Time Audio Studio
- **10-Band Precision Equalizer:** Cascaded `BiquadFilterNode` equalizer covering 32Hz to 16kHz with curated presets (*Bass Boost*, *Vocal Clarity*, *Electronic*, *Acoustic*, *Rock*, *R&B*, *Flat*).
- **🌌 Slowed + Reverb:** Smooth playback speed adjustment (0.5x–2.0x) paired with an algorithmic stereo delay feedback loop for dreamy lofi vibes.
- **🎧 8D Spatial Audio:** Real-time orbital binaural stereo panning with adjustable rotation speed for immersive headphone listening.
- **🎤 Live Karaoke (Vocal Remover):** Real-time center stereo phase cancellation combined with a targeted **900Hz–2400Hz (-18dB) vocal band-stop** and **+4dB 100Hz bass compensation** to suppress vocals even on panned duet tracks while keeping drums punchy.
- **✂️ 1-Tap 30s Ringtone Cutter:** In-browser `OfflineAudioContext` audio trimmer that bakes active EQ, Slowed+Reverb, and speed effects directly into downloadable `.wav` ringtones.

### 📜 Synced Lyrics & Status Cards
- **Real Time-Synced Lyrics:** Millisecond-accurate `.lrc` playback via LRCLIB with YouTube auto-captions fallback and auto-scrolling active line highlighting.
- **🎨 9:16 Lyric Status Card Generator:** Design and download high-resolution Instagram Story & WhatsApp status quote cards with customizable themes (*OLED Dark Neon*, *Blurred Album Artwork*, *Frosted Glass*) watermarked with *"Made with Masakali 🕊️"*.

### 📱 Native Mobile & Background Experience
- **📲 1-Tap App Installation (PWA / Add to Home Screen):** Native `beforeinstallprompt` integration to add Masakali to your home screen with zero browser address bars.
- **📱 Background Audio & Screen-Off Playback:** `AudioContext` keep-alive and `visibilitychange` listeners ensure music never pauses when locking your phone or switching apps.
- **🎧 Lock-Screen Media Session:** Full `navigator.mediaSession` integration with album art, title, artist, seek scrubber, and headphone button actions.
- **📁 Play Local Audio Files:** Play offline MP3, WAV, M4A, and FLAC files directly from your device through the 10-band EQ and 8D spatial engine.
- **🎙️ Voice Search:** Hands-free song and artist search powered by the native Web Speech API.
- **📊 Listening Analytics:** SimpMusic-style stats tracking play count, listening streaks, top genres, and favorite audio vibes.

---

## 🚀 Quick Start & Installation

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [npm](https://www.npmjs.com/)

### 1. Clone the Repository
```bash
git clone https://github.com/shivanshmakwana913-droid/Masakali-music-app.git
cd Masakali-music-app
```

### 2. Install Dependencies
```bash
# Install frontend dependencies
npm install

# Install backend dependencies
cd server
npm install
cd ..
```

### 3. Run Development Servers
```bash
# Start backend streaming & lyrics server (Port 5000)
cd server
node index.js

# In a separate terminal, start frontend Vite dev server (Port 3000)
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser to start listening!

### 4. Build for Production
```bash
npm run build
```
The optimized output is generated in `/dist` (**~112 kB gzipped** total).

---

## 📲 Install on Mobile Devices

### Android (Chrome / Brave / Edge)
1. Tap the **"📲 Install App"** button in the top header (or the 3 dots **⋮** menu in Chrome).
2. Tap **"Install app"** or **"Add to Home screen"**.
3. Enjoy full-screen Masakali right from your mobile home screen with zero browser address bars.

### iPhone & iPad (iOS Safari)
1. Open the app in **Safari**.
2. Tap the **Share** button (`⬆️`) at the bottom of the screen.
3. Scroll down and select **"Add to Home Screen"** (`➕`).
4. Tap **"Add"** in the top right. Masakali will now launch full-screen with no browser address bars!

---

## 🕊️ Tech Stack

| Layer | Technology |
|---|---|
| **Frontend Framework** | React 18, Vite 5 |
| **Styling** | Tailwind CSS 3 (Hardware-accelerated animations) |
| **Audio Processing** | Web Audio API (`AudioContext`, `BiquadFilterNode`, `StereoPannerNode`, `ConvolverNode`) |
| **Icons** | Lucide React |
| **Backend & Proxy** | Node.js, Express, yt-dlp / YouTube Music Scraper |
| **Offline Storage** | IndexedDB (`idb-keyval` lightweight wrapper) & Cache Storage API |
| **PWA Capabilities** | Web App Manifest, Service Worker (`sw.js`), `MediaSession` API |

---

## ❤️ Support the Developer

Masakali is **100% free, ad-free, and open source**. If Masakali made your music listening better, consider buying a coffee or supporting future development via UPI:

<p align="center">
  <strong>UPI ID:</strong> <code>shivanshmakwana913@okaxis</code>
</p>

---

## ⚖️ Disclaimer

> Masakali is an educational open-source audio player interface. All media belongs to respective owners.

---

## 📄 License

Distributed under the **MIT License**. See `LICENSE` for more information.

<p align="center">
  <em>Made with ❤️ by Shivansh Makwana for music lovers worldwide.</em>
</p>
