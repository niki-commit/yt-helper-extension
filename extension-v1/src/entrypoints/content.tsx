import ReactDOM, { Root } from "react-dom/client";
import { browser } from "wxt/browser";
import { SidebarApp } from "@/components/SidebarApp";
import { FloatingApp } from "@/components/FloatingApp";
import { ChipApp } from "@/components/ChipApp";
import { initFocusMode, initAutoPause } from "@/lib/settings";
import { ShadowRootContext } from "@/components/ui/ShadowTooltip";
import { Providers } from "@/components/Providers";
import { KeyboardShortcutsHandler } from "@/components/KeyboardShortcutsHandler";
import { Toaster } from "@/components/ui/sonner";
import "@/assets/tailwind.css";

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("[VideoNotes] Content script loaded (SPA Mode)");

    // Initialize Global Settings Logic
    initFocusMode();
    initAutoPause();

    // Define UI Type Helper
    type UiInstance = Awaited<ReturnType<typeof createShadowRootUi>>;

    // --- State & Mounting Logic ---
    let uiState: {
      sidebarDesktop?: UiInstance;
      sidebarMobile?: UiInstance;
      floating?: UiInstance;
      chipOwner?: UiInstance;
      chipPlayer?: UiInstance;
      globalLogic?: UiInstance;
      tooltipLayer?: UiInstance;
      overlay?: any;
      isMounted: boolean;
      currentVideoId: string | null;
    } = {
      isMounted: false,
      currentVideoId: null,
    };

    // Helper: Component Definitions
    // 1a. Desktop Sidebar UI (right side on desktop)
    const createSidebarDesktopUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-sidebar-desktop",
        position: "inline",
        anchor: "#secondary-inner", // More stable child of #secondary
        append: "first",
        onMount: (container: HTMLElement) => {
          container.style.backgroundColor = "transparent";
          container.style.marginBottom = "10px";

          // Encapsulated Responsive Style
          const styleSheet = document.createElement("style");
          styleSheet.textContent = `
            :host { display: block !important; }
            @media (max-width: 999px) {
              :host { display: none !important; }
            }
          `;
          container.appendChild(styleSheet);

          const root = ReactDOM.createRoot(container);
          root.render(
            <ShadowRootContext.Provider value={container}>
              <SidebarApp />
            </ShadowRootContext.Provider>
          );
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // 1b. Mobile Sidebar UI (below description on mobile)
    const createSidebarMobileUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-sidebar-mobile",
        position: "inline",
        anchor: "ytd-watch-metadata",
        append: "after",
        onMount: (container: HTMLElement) => {
          container.style.backgroundColor = "transparent";
          container.style.marginTop = "16px";
          container.style.marginBottom = "16px";

          // Encapsulated Responsive Style
          const styleSheet = document.createElement("style");
          styleSheet.textContent = `
            :host { display: block !important; }
            @media (min-width: 1000px) {
              :host { display: none !important; }
            }
          `;
          container.appendChild(styleSheet);

          const root = ReactDOM.createRoot(container);
          root.render(
            <ShadowRootContext.Provider value={container}>
              <SidebarApp />
            </ShadowRootContext.Provider>
          );
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // 2. Floating UI
    const createFloatingUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-floating",
        position: "inline",
        anchor: "#movie_player", // Anchoring to player ensuring visibility in Fullscreen
        append: "last",
        onMount: (container: HTMLElement) => {
          // Absolute positioning relative to the player
          container.style.position = "absolute";
          container.style.display = "block";
          container.style.backgroundColor = "transparent"; // Fix for white overlay
          container.style.top = "0";
          container.style.left = "0";
          container.style.width = "100%";
          container.style.height = "100%";
          container.style.pointerEvents = "none"; // Let clicks pass through primarily
          container.style.zIndex = "2000"; // Above player controls

          const root = ReactDOM.createRoot(container);
          root.render(
            <ShadowRootContext.Provider value={container}>
              <FloatingApp />
            </ShadowRootContext.Provider>
          );
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // 3. Chip (Owner)
    const createChipOwnerUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-chip",
        position: "inline",
        anchor: "ytd-watch-metadata #owner",
        append: "last",
        onMount: (container: HTMLElement) => {
          container.style.backgroundColor = "transparent";
          const root = ReactDOM.createRoot(container);
          root.render(
            <ShadowRootContext.Provider value={container}>
              <Providers>
                <ChipApp />
              </Providers>
            </ShadowRootContext.Provider>
          );
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // 4. Chip (Player)
    const createChipPlayerUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-player-chip",
        position: "inline",
        anchor: ".ytp-right-controls",
        append: "first",
        onMount: (container: HTMLElement) => {
          container.style.display = "contents";
          container.style.backgroundColor = "transparent";
          const root = ReactDOM.createRoot(container);
          root.render(
            <ShadowRootContext.Provider value={container}>
              <Providers>
                <ChipApp isPlayerControl={true} />
              </Providers>
            </ShadowRootContext.Provider>
          );
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // 5. Global Logic UI (Headless listener & Toaster)
    const createGlobalLogicUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-global-logic",
        position: "inline",
        anchor: "body",
        append: "last",
        onMount: (container: HTMLElement) => {
          container.style.position = "fixed";
          container.style.inset = "0";
          container.style.backgroundColor = "transparent";
          container.style.pointerEvents = "none";
          container.style.zIndex = "999999"; // Ensure toasts are on top
          const root = ReactDOM.createRoot(container);
          root.render(
            <ShadowRootContext.Provider value={container}>
              <Providers>
                <KeyboardShortcutsHandler />
                <Toaster position="bottom-right" richColors expand={true} />
              </Providers>
            </ShadowRootContext.Provider>
          );
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // --- Mount Manager ---
    let mountObserver: MutationObserver | null = null;
    let isMounting = false;
    let mountedPieces = {
      sidebarDesktop: false,
      sidebarMobile: false,
      floating: false,
      chipOwner: false,
      chipPlayer: false,
    };

    const stopPolling = () => {
      mountObserver?.disconnect();
      mountObserver = null;
      isMounting = false;
    };

    const unmountAll = () => {
      stopPolling();
      if (!uiState.isMounted) return;
      console.log("[VideoNotes] Unmounting all UI.");

      uiState.sidebarDesktop?.remove();
      uiState.sidebarMobile?.remove();
      uiState.floating?.remove();
      uiState.chipPlayer?.remove();
      uiState.globalLogic?.remove();
      uiState.tooltipLayer?.remove();

      // Clear references to ensure fresh creation on next mount
      uiState.sidebarDesktop = undefined;
      uiState.sidebarMobile = undefined;
      uiState.floating = undefined;
      uiState.chipOwner = undefined;
      uiState.chipPlayer = undefined;
      uiState.globalLogic = undefined;

      uiState.isMounted = false;
      uiState.currentVideoId = null;
    };

    const mountAll = async () => {
      const videoId = new URLSearchParams(window.location.search).get("v");
      if (!videoId) {
        console.log("[VideoNotes] No Video ID found. Skipping mount.");
        return;
      }

      // 1. Prevent double-mounting for the SAME video
      if (uiState.isMounted && uiState.currentVideoId === videoId) {
        return;
      }

      // 2. If we are already in the process of mounting another video, stop everything
      if (isMounting) {
        stopPolling();
      }

      console.log(`[VideoNotes] Starting Mount sequence for: ${videoId}`);
      isMounting = true;
      uiState.currentVideoId = videoId;
      uiState.isMounted = true;

      // Reset mounted tracking
      mountedPieces = {
        sidebarDesktop: false,
        sidebarMobile: false,
        floating: false,
        chipOwner: false,
        chipPlayer: false,
      };

      document
        .querySelectorAll(
          "vn-sidebar-desktop, vn-sidebar-mobile, vn-floating, vn-chip, vn-player-chip, vn-global-logic"
        )
        .forEach((el) => el.remove());

      // 4. Create fresh instances
      uiState.globalLogic = await createGlobalLogicUi();
      uiState.globalLogic.mount();

      uiState.sidebarDesktop = await createSidebarDesktopUi();
      uiState.sidebarMobile = await createSidebarMobileUi();
      uiState.floating = await createFloatingUi();
      uiState.chipOwner = await createChipOwnerUi();
      uiState.chipPlayer = await createChipPlayerUi();

      const tryMount = () => {
        // Owner Chip
        if (
          !mountedPieces.chipOwner &&
          document.querySelector("ytd-watch-metadata #owner")
        ) {
          uiState.chipOwner?.mount();
          mountedPieces.chipOwner = true;
          console.log("[VideoNotes] Mounted: Chip (Owner)");
        }
        // Player Chip
        if (
          !mountedPieces.chipPlayer &&
          document.querySelector(".ytp-right-controls")
        ) {
          uiState.chipPlayer?.mount();
          mountedPieces.chipPlayer = true;
          console.log("[VideoNotes] Mounted: Chip (Player)");
        }
        // Desktop Sidebar (Using inner for stability)
        if (
          !mountedPieces.sidebarDesktop &&
          document.querySelector("#secondary-inner")
        ) {
          uiState.sidebarDesktop?.mount();
          mountedPieces.sidebarDesktop = true;
          console.log("[VideoNotes] Mounted: Sidebar (Desktop)");
        }
        // Mobile Sidebar
        if (
          !mountedPieces.sidebarMobile &&
          document.querySelector("ytd-watch-metadata")
        ) {
          uiState.sidebarMobile?.mount();
          mountedPieces.sidebarMobile = true;
          console.log("[VideoNotes] Mounted: Sidebar (Mobile)");
        }
        // Floating UI
        if (!mountedPieces.floating) {
          uiState.floating?.mount();
          mountedPieces.floating = true;
          console.log("[VideoNotes] Mounted: Floating UI");
        }

        // Return true only if EVERYTHING is mounted
        // Check DOM directly for final confirmation
        const allInDom =
          document.querySelector("vn-chip") &&
          document.querySelector("vn-player-chip") &&
          (document.querySelector("vn-sidebar-desktop") ||
            document.querySelector("vn-sidebar-mobile")) &&
          document.querySelector("vn-floating");

        return !!allInDom;
      };

      // 5. Initial Attempt
      if (tryMount()) {
        isMounting = false;
        return;
      }

      // 6. Robust Polling with MutationObserver
      console.log("[VideoNotes] Some anchors missing. Starting observer...");
      mountObserver = new MutationObserver(() => {
        if (tryMount()) {
          console.log("[VideoNotes] All UI pieces mounted successfully.");
          stopPolling();
        }
      });

      mountObserver.observe(document.body, {
        childList: true,
        subtree: true,
      });

      // 7. Extra interval polling (Fallback)
      const interval = setInterval(() => {
        if (!isMounting) {
          clearInterval(interval);
          return;
        }
        if (tryMount()) {
          console.log("[VideoNotes] Elements mounted via fallback interval.");
          stopPolling();
          clearInterval(interval);
        }
      }, 1000);

      // 8. Fail-safe: Stop polling after 20 seconds
      setTimeout(() => {
        clearInterval(interval);
        if (isMounting) {
          console.log(
            "[VideoNotes] Mount polling timed out. State:",
            mountedPieces
          );
          stopPolling();
        }
      }, 20000);
    };

    // --- Navigation Handlers ---

    const handleNavigation = () => {
      const isWatchPage = window.location.pathname === "/watch";
      const hasVideoId = !!new URLSearchParams(window.location.search).get("v");

      if (isWatchPage && hasVideoId) {
        mountAll();
      } else {
        unmountAll();
      }
    };

    // 1. YouTube SPA Event
    window.addEventListener("yt-navigate-finish", handleNavigation);

    // 2. Initial Load Check
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", handleNavigation);
    } else {
      handleNavigation();
    }

    // --- Legacy Listeners (Ad Safety & Layout) ---
    // (Kept from Phase 0 work)
    const handleRequestOpen = (e: any) => {
      // 0. Ad Check
      const player = document.querySelector("#movie_player");
      const isAdActive =
        player?.classList.contains("ad-showing") ||
        player?.classList.contains("ad-interrupting");

      if (isAdActive) {
        console.warn("[VideoNotes] Blocked open request - Ad is active.");
        return;
      }

      // 1. Auto-Pause (REMOVED - Now handled by editor focus in NoteWorkspace)
      // const video = document.querySelector("video.html5-main-video") as HTMLVideoElement;
      // if (video) video.pause();

      const eventDetail = { detail: e.detail };

      // 2. Determine container
      // If we are in Fullscreen, ALWAYS favor Floating UI
      if (document.fullscreenElement) {
        window.dispatchEvent(new CustomEvent("VN_OPEN_FLOATING", eventDetail));
        return;
      }

      // Otherwise check if either Sidebar variant is visible
      const desktopSidebar = document.querySelector("vn-sidebar-desktop");
      const mobileSidebar = document.querySelector("vn-sidebar-mobile");

      const isDesktopVisible =
        desktopSidebar &&
        window.getComputedStyle(desktopSidebar).display !== "none";
      const isMobileVisible =
        mobileSidebar &&
        window.getComputedStyle(mobileSidebar).display !== "none";

      if (isDesktopVisible || isMobileVisible) {
        window.dispatchEvent(new CustomEvent("VN_OPEN_SIDEBAR", eventDetail));
      } else {
        window.dispatchEvent(new CustomEvent("VN_OPEN_FLOATING", eventDetail));
      }
    };

    window.addEventListener("VN_REQUEST_OPEN", handleRequestOpen);

    const handleSaveComplete = () => {
      const video = document.querySelector(
        "video.html5-main-video"
      ) as HTMLVideoElement;
      if (video) video.play();
    };

    window.addEventListener("VN_NOTE_SAVE_COMPLETE", handleSaveComplete);
    // --- Keyboard Event Shield (Capture Phase) ---
    // Blocks YouTube from seeing keystrokes when typing in our UI
    const blockExtensionEvents = (e: KeyboardEvent) => {
      const path = e.composedPath();
      const cameFromExtension = path.some(
        (node) =>
          node instanceof HTMLElement &&
          (node.tagName === "VN-SIDEBAR-DESKTOP" ||
            node.tagName === "VN-SIDEBAR-MOBILE" ||
            node.tagName === "VN-FLOATING")
      );

      if (cameFromExtension) {
        e.stopImmediatePropagation(); // Stop other listeners (YouTube)
        e.stopPropagation(); // Stop bubbling
        // Note: We don't preventDefault() here so normal typing still works.
        // But for Spacebar specifically inside our UI, preventing scroll might be handled by the editor itself.
      }
    };

    window.addEventListener("keydown", blockExtensionEvents, true);
    window.addEventListener("keyup", blockExtensionEvents, true);
    window.addEventListener("keypress", blockExtensionEvents, true);
  },
});
