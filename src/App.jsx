import React, { useState } from 'react';
import PlayerApp from './pages/PlayerApp';
import SplashLoader from './components/common/SplashLoader';

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  return (
    <div className="min-h-screen bg-[#050507] text-white relative">
      {/* 1.3-Second Non-Blocking Animated Splash Screen */}
      {showSplash && (
        <SplashLoader
          duration={1300}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Main Music Studio & Player (mounts and warms up immediately) */}
      <PlayerApp />
    </div>
  );
}
