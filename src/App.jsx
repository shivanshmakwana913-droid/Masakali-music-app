import React, { useState } from 'react';
import { ThemeProvider, useTheme } from './context/ThemeContext';
import PlayerApp from './pages/PlayerApp';
import SplashLoader from './components/common/SplashLoader';

function AppContent() {
  const [showSplash, setShowSplash] = useState(true);
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen ${isDark ? 'bg-black text-white' : 'bg-white text-zinc-950'} transition-colors duration-200 relative select-none`}>
      {/* 1.3-Second Non-Blocking Animated Splash Screen */}
      {showSplash && (
        <SplashLoader
          duration={1300}
          onFinish={() => setShowSplash(false)}
        />
      )}

      {/* Main Music Studio & Player */}
      <PlayerApp />
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
