import { useEffect, useRef } from 'react';

/**
 * Manages mobile hardware/browser Back button navigation for overlays, drawers,
 * Full-Screen Player, and secondary tabs, plus double-back-to-exit protection on Home.
 *
 * @param {Object} params
 * @param {Array<{ id: string, isOpen: boolean, close: () => void }>} params.views
 *        Ordered from highest priority (topmost modal) to lowest (secondary tab).
 * @param {(msg: string) => void} [params.onExitPrompt]
 *        Called on first back press on Home screen to show "Press back again to exit".
 */
export function useBackNavigation({ views, onExitPrompt }) {
  const viewsRef = useRef(views);
  viewsRef.current = views;

  const onExitPromptRef = useRef(onExitPrompt);
  onExitPromptRef.current = onExitPrompt;

  // Track which view IDs currently have a pushed history entry
  const pushedStackRef = useRef([]);
  // Views closed via hardware popstate (so effect does not call history.back() again)
  const closedByPopRef = useRef(new Set());
  // Counter for programmatic history.back() calls triggered by on-screen close buttons
  const programmaticBackCountRef = useRef(0);

  // Double-back-to-exit guard on Home
  const exitArmedRef = useRef(false);
  const exitTimerRef = useRef(null);
  const guardInitializedRef = useRef(false);

  // 1. Initialize base history guard + global popstate listener
  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return;

    if (!guardInitializedRef.current) {
      guardInitializedRef.current = true;
      try {
        window.history.replaceState({ masakaliRoot: true }, '');
        window.history.pushState({ masakaliGuard: true }, '');
      } catch (_) {}
    }

    const handlePopState = () => {
      if (programmaticBackCountRef.current > 0) {
        programmaticBackCountRef.current -= 1;
        return;
      }

      const currentViews = viewsRef.current || [];
      const topmostOpen = currentViews.find((v) => v.isOpen);

      if (topmostOpen) {
        // Cancel any armed exit state when navigating back from a sub-view
        exitArmedRef.current = false;
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }

        // Remove from pushed stack and mark so UI-close sync doesn't double-pop
        pushedStackRef.current = pushedStackRef.current.filter((id) => id !== topmostOpen.id);
        closedByPopRef.current.add(topmostOpen.id);
        topmostOpen.close();
        return;
      }

      // Already on Home with no overlays open -> Double-back protection
      if (!exitArmedRef.current) {
        exitArmedRef.current = true;
        try {
          window.history.pushState({ masakaliGuard: true }, '');
        } catch (_) {}

        if (typeof onExitPromptRef.current === 'function') {
          onExitPromptRef.current('Press back again to exit');
        }

        if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
        exitTimerRef.current = setTimeout(() => {
          exitArmedRef.current = false;
        }, 2000);
      } else {
        // Second back press within 2s -> allow browser/PWA to exit
        exitArmedRef.current = false;
        if (exitTimerRef.current) {
          clearTimeout(exitTimerRef.current);
          exitTimerRef.current = null;
        }
        window.history.back();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current);
    };
  }, []);

  // 2. Sync open/close state changes with window.history
  const openSignature = views.map((v) => `${v.id}:${v.isOpen ? 1 : 0}`).join('|');

  useEffect(() => {
    if (typeof window === 'undefined' || !window.history) return;

    const currentOpenIds = new Set(viewsRef.current.filter((v) => v.isOpen).map((v) => v.id));

    // Push history entry for newly opened views
    viewsRef.current.forEach((v) => {
      if (v.isOpen && !pushedStackRef.current.includes(v.id)) {
        pushedStackRef.current.push(v.id);
        try {
          window.history.pushState({ view: v.id }, '');
        } catch (_) {}
      }
    });

    // Pop history entry for views closed via on-screen buttons (↓ or ✕)
    const remaining = [];
    let backsNeeded = 0;

    pushedStackRef.current.forEach((id) => {
      if (currentOpenIds.has(id)) {
        remaining.push(id);
      } else if (closedByPopRef.current.has(id)) {
        closedByPopRef.current.delete(id);
      } else {
        backsNeeded += 1;
      }
    });

    pushedStackRef.current = remaining;

    if (backsNeeded > 0) {
      programmaticBackCountRef.current += backsNeeded;
      try {
        window.history.go(-backsNeeded);
      } catch (_) {
        programmaticBackCountRef.current = Math.max(0, programmaticBackCountRef.current - backsNeeded);
      }
    }
  }, [openSignature]);
}
