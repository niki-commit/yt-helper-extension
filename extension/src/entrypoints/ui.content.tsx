import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom/client";
import VideoNotes from "@/components/VideoNotes";
import ActionBarButtons from "@/components/ActionBarButtons";
import PlayerButtons from "@/components/PlayerButtons";
import QuickNoteOverlay from "@/components/QuickNoteOverlay";
import { initAutoPause, setAutoPauseEnabled } from "@/features/autoPause";
import { setDistractionFreeMode } from "@/features/distraction";
import { getSettings, watchSettings } from "@/storage/settings";
import "@/styles/globals.css";

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  cssInjectionMode: "ui",
  async main(ctx) {
    // ---- 1. Responsive Sidebar Logic ----
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
      anchor: "ytd-watch-metadata", // Insert after description
      append: "after",
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
      anchor: "ytd-watch-metadata #top-level-buttons-computed",
      append: "first",
      onMount: (container) => {
        // Enforce basic layout styles
        container.style.display = "inline-block";
        container.style.verticalAlign = "middle";
        container.style.height = "100%";
        container.style.pointerEvents = "auto";
        container.style.position = "relative";
        container.style.marginRight = "8px";
        container.style.marginLeft = "8px";

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
        container.style.overflow = "visible";
        container.style.position = "relative";
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

    // Listeners for Sidebar
    window.addEventListener("resize", () => {
      if (!checkDead()) manageSidebar();
    });

    // ---- Robust Mounting Logic ----

    const safelyMount = (ui: any) => {
      try {
        if (!ui.mounted) ui.mount();
      } catch (e) {
        // Silence mount errors
      }
    };

    const safelyRemove = (ui: any) => {
      try {
        if (ui.mounted) ui.remove();
      } catch (e) {
        // Silence remove errors
      }
    };

    const checkAndMount = () => {
      if (checkDead()) return;

      const hasButtons = document.querySelector("#top-level-buttons-computed");
      const hasPlayer = document.querySelector(".ytp-right-controls");

      // ---- Action Bar ----
      if (hasButtons) {
        let isMounted = false;
        try {
          // Check if it's actually in the document and mounted via WXT
          isMounted =
            !!actionBarUi.mounted &&
            actionBarUi.shadowHost &&
            document.body.contains(actionBarUi.shadowHost);
        } catch (e) {
          isMounted = false;
        }

        if (!isMounted) {
          // Only if genuinely missing do we intervene
          console.log(
            "[YT-Helper] Action Bar not found in anchor, ensuring mount..."
          );
          safelyMount(actionBarUi);

          // Force YouTube to re-calculate layout (multiple triggers to catch late hydration)
          // tailored for Polymer's iron-resizable-behavior
          const triggerResize = () => {
            const ev = new CustomEvent("iron-resize", {
              bubbles: true,
              composed: true,
            });
            window.dispatchEvent(new Event("resize"));
            document.querySelector("ytd-app")?.dispatchEvent(ev);
            document.querySelector("ytd-watch-flexy")?.dispatchEvent(ev);
            document
              .querySelector("#top-level-buttons-computed")
              ?.dispatchEvent(ev);
          };

          [100, 500, 1000, 2500].forEach((ms) => {
            setTimeout(triggerResize, ms);
          });
        }

        // Enforce styles to prevent clipping
        try {
          const host = actionBarUi.shadowHost as HTMLElement;
          if (host) {
            host.style.display = "inline-block";
            host.style.verticalAlign = "middle";
            host.style.height = "100%";
            host.style.pointerEvents = "auto";
            host.style.position = "relative";
          }
        } catch (e) {}
      }

      // ---- Player UI ----
      if (hasPlayer) {
        let isMounted = false;
        try {
          isMounted =
            !!playerUi.mounted && hasPlayer.contains(playerUi.shadowHost);
        } catch (e) {
          isMounted = false;
        }

        if (!isMounted) {
          console.log("[YT-Helper] Player anchor found, mounting...");
          safelyRemove(playerUi);
          safelyMount(playerUi);
        }

        // Enforce styles
        try {
          const host = playerUi.shadowHost as HTMLElement;
          if (host) {
            host.style.display = "inline-flex";
            host.style.verticalAlign = "top";
            host.style.height = "100%";
            host.style.pointerEvents = "auto";
            host.style.zIndex = "9999";
          }
        } catch (e) {}
      }

      manageSidebar();
    };

    // Track the burst interval to clear it if navigation happens rapidly
    let currentBurstInterval: NodeJS.Timeout | null = null;

    // 2. YouTube Navigation Event
    window.addEventListener("yt-navigate-finish", () => {
      console.log(
        "[YT-Helper] Navigation finished. Force-refreshing Action Bar..."
      );

      // Rely on checkAndMount to see if we need to re-attach to new DOM elements
      // (This avoids the "Remove then Mount" flicker during navigation)

      // Do NOT remove Sidebars (to prevent flickering)

      // Burst check: Check 15 times over 3 seconds to catch slow UI loads
      let checks = 0;
      currentBurstInterval = setInterval(() => {
        checks++;
        if (checks > 15 || checkDead()) {
          if (currentBurstInterval) clearInterval(currentBurstInterval);
          currentBurstInterval = null;
          return;
        }
        checkAndMount();
      }, 200);

      // Immediate check
      checkAndMount();
    });

    // 3. Fallback Interval (Safety net, slow poll)
    const initInterval = setInterval(() => {
      if (checkDead()) {
        clearInterval(initInterval);
        unwatch();
        stopAutoPause();
        if (currentBurstInterval) clearInterval(currentBurstInterval);
        return;
      }
      checkAndMount();
    }, 3000);

    // ---- 4. Global Quick Note Overlay ----
    const quickNoteUi = await createShadowRootUi(ctx, {
      name: "video-notes-quick-note",
      position: "overlay",
      onMount: (container) => {
        container.style.zIndex = "2147483647";
        const root = ReactDOM.createRoot(container);
        root.render(<QuickNoteOverlay />);
        return { unmount: () => root.unmount() };
      },
    });
    quickNoteUi.mount();

    // Initial call
    checkAndMount();
  },
});
