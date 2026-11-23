import { useState, useEffect, useCallback } from 'react';

/**
 * useInstallPrompt Hook
 * Captures `beforeinstallprompt` to enable 1-tap native PWA installation,
 * detects iOS Safari, Android, standalone mode, and handles install prompts.
 */
export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);

  useEffect(() => {
    // 1. Detect standalone (already installed) mode
    const checkIsStandalone = () => {
      const isStandaloneMode =
        (typeof window !== 'undefined') &&
        (window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: fullscreen)').matches ||
         window.matchMedia('(display-mode: minimal-ui)').matches ||
         window.navigator.standalone === true ||
         document.referrer.includes('android-app://') ||
         window.location.search.includes('standalone=true') ||
         window.location.search.includes('source=pwa') ||
         localStorage.getItem('masakali_app_installed') === 'true');
      setIsInstalled(!!isStandaloneMode);
    };
    checkIsStandalone();

    const mediaQuery = window.matchMedia?.('(display-mode: standalone)');
    const handleMediaChange = (e) => {
      if (e.matches) {
        setIsInstalled(true);
        try { localStorage.setItem('masakali_app_installed', 'true'); } catch (_) {}
      }
    };
    if (mediaQuery?.addEventListener) {
      mediaQuery.addEventListener('change', handleMediaChange);
    }

    // 2. Platform detection
    const ua = window.navigator.userAgent.toLowerCase();
    const isIOSDevice = /iphone|ipad|ipod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    const isAndroidDevice = /android/.test(ua);
    setIsIOS(isIOSDevice);
    setIsAndroid(isAndroidDevice);

    // 3. Capture native PWA install prompt
    const handleBeforeInstallPrompt = (e) => {
      // Prevent browser default mini-infobar
      e.preventDefault();
      setDeferredPrompt(e);
    };

    // 4. Listen for app installation completion
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      try {
        localStorage.setItem('masakali_app_installed', 'true');
      } catch (_) {}
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  /**
   * Trigger native installation or return status
   */
  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) {
      return { success: false, reason: 'no_prompt' };
    }

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;
      if (choiceResult && choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
        setDeferredPrompt(null);
        return { success: true, outcome: 'accepted' };
      }
      return { success: false, outcome: 'dismissed' };
    } catch (err) {
      return { success: false, error: err };
    }
  }, [deferredPrompt]);

  return {
    deferredPrompt,
    canInstall: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    promptInstall
  };
}
