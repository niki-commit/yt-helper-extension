import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import VideoNotes from "@/components/VideoNotes";
import ActionBarButtons from "@/components/ActionBarButtons";
import PlayerButtons from "@/components/PlayerButtons";
import { initAutoPause, setAutoPauseEnabled } from "@/features/autoPause";
import { setDistractionFreeMode } from "@/features/distraction";
import { getSettings, watchSettings } from "@/storage/settings";
import "@/styles/globals.css";

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // ---- 1. Responsive Sidebar Logic ----
    // We create Two UIs for sidebar: One for Desktop, One for Mobile
    // Only one should be mounted at a time.
    // However, createShadowRootUi doesn't expose easy unmount/remount on demand without re-calling it?
    // WXT's UI API usually returns an object with mount() and unmount().
    // We will create both and manage them manually based on ResizeObserver.

    let desktopUi: any = null;
    let mobileUi: any = null;

    // Desktop UI Definition
    desktopUi = await createShadowRootUi(ctx, {
      name: "video-notes-desktop",
      position: "inline",
      anchor: "ytd-watch-flexy #secondary",
      append: "first",
      onMount: (container) => {
        // Block shortcuts
        const handleKeys = (e: KeyboardEvent) => {
          if (e.composedPath().includes(container)) {
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        };
        window.addEventListener("keydown", handleKeys, true);
        window.addEventListener("keyup", handleKeys, true);
        window.addEventListener("keypress", handleKeys, true);

        const root = ReactDOM.createRoot(container);
        const VideoNotesGlobal = () => {
          const getVid = () =>
            new URLSearchParams(window.location.search).get("v") || "";
          const [vid, setVid] = useState(getVid);

          useEffect(() => {
            const check = () => {
              const newV = getVid();
              if (newV !== vid) setVid(newV);
            };
            const t = setInterval(check, 500);
            return () => clearInterval(t);
          }, [vid]);

          if (!vid) return null;
          return <VideoNotes videoId={vid} isMobile={false} />;
        };

        root.render(<VideoNotesGlobal />);
        return {
          unmount: () => {
            window.removeEventListener("keydown", handleKeys, true);
            window.removeEventListener("keyup", handleKeys, true);
            window.removeEventListener("keypress", handleKeys, true);
            root.unmount();
          },
        };
      },
    });

    // Mobile UI Definition
    mobileUi = await createShadowRootUi(ctx, {
      name: "video-notes-mobile",
      position: "inline",
      anchor: "#comments", // Insert before comments
      append: "before",
      onMount: (container) => {
        // Same shortcuts blocking
        const handleKeys = (e: KeyboardEvent) => {
          if (e.composedPath().includes(container)) {
            e.stopPropagation();
            e.stopImmediatePropagation();
          }
        };
        window.addEventListener("keydown", handleKeys, true);

        const root = ReactDOM.createRoot(container);
        const VideoNotesGlobal = () => {
          const getVid = () =>
            new URLSearchParams(window.location.search).get("v") || "";
          const [vid, setVid] = useState(getVid);
          useEffect(() => {
            const check = () => {
              const newV = getVid();
              if (newV !== vid) setVid(newV);
            };
            const t = setInterval(check, 500);
            return () => clearInterval(t);
          }, [vid]);
          if (!vid) return null;
          return <VideoNotes videoId={vid} isMobile={true} />;
        };
        root.render(<VideoNotesGlobal />);
        return {
          unmount: () => {
            window.removeEventListener("keydown", handleKeys, true);
            root.unmount();
          },
        };
      },
    });

    // ---- 2. Action Bar UI ----
    const actionBarUi = await createShadowRootUi(ctx, {
      name: "video-notes-action-bar",
      position: "inline",
      anchor: "#top-level-buttons-computed",
      append: "first",
      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        const Wrapper = () => {
          const getVid = () =>
            new URLSearchParams(window.location.search).get("v") || "";
          const [vid, setVid] = useState(getVid);
          useEffect(() => {
            const check = () => {
              const newV = getVid();
              if (newV !== vid) setVid(newV);
            };
            const t = setInterval(check, 500);
            return () => clearInterval(t);
          }, [vid]);
          if (!vid) return null;
          return <ActionBarButtons videoId={vid} />;
        };
        root.render(<Wrapper />);
        return { unmount: () => root.unmount() };
      },
    });

    // ---- 3. Player UI ----
    const playerUi = await createShadowRootUi(ctx, {
      name: "video-notes-player",
      position: "inline",
      anchor: ".ytp-right-controls",
      append: "first",

      onMount: (container) => {
        const root = ReactDOM.createRoot(container);
        const Wrapper = () => {
          const getVid = () =>
            new URLSearchParams(window.location.search).get("v") || "";
          const [vid, setVid] = useState(getVid);
          useEffect(() => {
            const check = () => {
              const newV = getVid();
              if (newV !== vid) setVid(newV);
            };
            const t = setInterval(check, 500);
            return () => clearInterval(t);
          }, [vid]);
          if (!vid) return null;
          return <PlayerButtons videoId={vid} />;
        };
        root.render(<Wrapper />);
        return { unmount: () => root.unmount() };
      },
    });

    // ---- 4. Extra Features (Auto-Pause, Focus Mode) ----
    const stopAutoPause = initAutoPause();

    // Watch settings for changes
    const unwatch = watchSettings((settings) => {
      setAutoPauseEnabled(settings.autoPauseEnabled);
      setDistractionFreeMode(settings.distractionFreeEnabled);
    });

    // Initial state
    getSettings().then((settings) => {
      setAutoPauseEnabled(settings.autoPauseEnabled);
      setDistractionFreeMode(settings.distractionFreeEnabled);
    });

    // Flag to stop all activity if context is invalidated
    let isDead = false;
    const checkDead = () => {
      if (isDead) return true;
      try {
        if (!browser.runtime?.id) {
          isDead = true;
          return true;
        }
      } catch (e) {
        isDead = true;
        return true;
      }
      return false;
    };

    // Manage Sidebar Mounting based on screen size
    const manageSidebar = () => {
      if (checkDead()) return;
      const width = window.innerWidth;
      const isMobile = width < 1024; // Standard tablet breakpoint

      try {
        if (isMobile) {
          if (desktopUi.mounted) desktopUi.remove();
          if (!mobileUi.mounted) mobileUi.mount();
        } else {
          if (mobileUi.mounted) mobileUi.remove();
          if (!desktopUi.mounted) desktopUi.mount();
        }
      } catch (e) {
        // Silence resize-triggered mount errors
      }
    };

    // Listeners
    window.addEventListener("resize", () => {
      if (!checkDead()) manageSidebar();
    });

    // Initial mount check loop
    const initInterval = setInterval(() => {
      if (checkDead()) {
        clearInterval(initInterval);
        unwatch();
        stopAutoPause();
        return;
      }

      const safelyMount = (ui: any) => {
        try {
          if (!ui.mounted) ui.mount();
        } catch (e) {
          // Silence mount errors (usually "anchor not found")
        }
      };

      const safelyRemove = (ui: any) => {
        try {
          if (ui.mounted) ui.remove();
        } catch (e) {
          // Silence remove errors
        }
      };

      // Ensure Action Bar and Player UI are mounted if elements exist
      const hasButtons = document.querySelector("#top-level-buttons-computed");
      const hasPlayer = document.querySelector(".ytp-right-controls");

      if (hasButtons) {
        safelyMount(actionBarUi);
      }

      if (hasPlayer) {
        // More aggressive: Check if the shadow root host is physically in the DOM
        let isMounted = false;
        try {
          isMounted =
            !!playerUi.mounted && hasPlayer.contains(playerUi.shadowHost);
        } catch (e) {
          isMounted = false;
        }

        if (!isMounted) {
          // Unmount if WXT thinks it's mounted but it's gone from DOM
          safelyRemove(playerUi);
          safelyMount(playerUi);
        }
      }

      manageSidebar();
    }, 1000);

    // Initial call
    manageSidebar();

    // Clean up? Content script usually persists but...
    // Return cleanup?
  },
});
