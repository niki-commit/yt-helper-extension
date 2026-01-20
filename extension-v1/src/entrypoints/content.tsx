import ReactDOM, { Root } from "react-dom/client";
import { browser } from "wxt/browser";
import { SidebarApp } from "@/components/SidebarApp";
import { FloatingApp } from "@/components/FloatingApp";
import { ChipApp } from "@/components/ChipApp";
import "@/assets/tailwind.css";

export default defineContentScript({
  matches: ["*://*.youtube.com/*"],
  cssInjectionMode: "ui",

  async main(ctx) {
    console.log("[VideoNotes] Content script loaded (SPA Mode)");

    // Define UI Type Helper
    type UiInstance = Awaited<ReturnType<typeof createShadowRootUi>>;

    // --- State & Mounting Logic ---
    let uiState: {
      sidebar?: UiInstance;
      floating?: UiInstance;
      chipOwner?: UiInstance;
      chipPlayer?: UiInstance;
      overlay?: any; // Manual mount
      isMounted: boolean;
      currentVideoId: string | null;
    } = {
      isMounted: false,
      currentVideoId: null,
    };

    // Helper: Component Definitions
    // 1. Sidebar UI
    const createSidebarUi = async () =>
      createShadowRootUi(ctx, {
        name: "vn-sidebar",
        position: "inline",
        anchor: "#secondary",
        append: "first",
        onMount: (container: HTMLElement) => {
          container.style.display = "block";
          container.style.backgroundColor = "transparent";
          container.style.marginBottom = "10px";
          const root = ReactDOM.createRoot(container);
          root.render(<SidebarApp />);
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
          root.render(<FloatingApp />);
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
          container.style.display = "contents";
          const root = ReactDOM.createRoot(container);
          root.render(<ChipApp />);
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
          root.render(<ChipApp isPlayerControl={true} />);
          return root;
        },
        onRemove: (root: Root | undefined) => root?.unmount(),
      });

    // --- Mount Manager ---

    const unmountAll = () => {
      if (!uiState.isMounted) return;
      console.log("[VideoNotes] Unmounting all UI.");

      uiState.sidebar?.remove();
      uiState.floating?.remove();
      uiState.chipOwner?.remove();
      uiState.chipPlayer?.remove();

      uiState.isMounted = false;
      uiState.currentVideoId = null;
    };

    const mountAll = async () => {
      const videoId = new URLSearchParams(window.location.search).get("v");
      if (!videoId) {
        console.log("[VideoNotes] No Video ID found. Skipping mount.");
        return;
      }

      // Prevent duplicate mounting for the same video
      if (uiState.isMounted && uiState.currentVideoId === videoId) {
        return;
      }

      console.log(`[VideoNotes] Mounting UI for Video: ${videoId}`);
      uiState.currentVideoId = videoId;
      uiState.isMounted = true;

      // Cleanup any stale elements manually (prevents dupes)
      document
        .querySelectorAll("vn-sidebar, vn-floating, vn-chip, vn-player-chip")
        .forEach((el) => el.remove());

      // Initialize UI instances if needed
      if (!uiState.sidebar) uiState.sidebar = await createSidebarUi();
      if (!uiState.floating) uiState.floating = await createFloatingUi();
      if (!uiState.chipOwner) uiState.chipOwner = await createChipOwnerUi();
      if (!uiState.chipPlayer) uiState.chipPlayer = await createChipPlayerUi();

      // Mount logic with retries (DOM availability)
      const tryMount = () => {
        // Owner Chip
        if (
          document.querySelector("ytd-watch-metadata #owner") &&
          !document.querySelector("vn-chip")
        ) {
          uiState.chipOwner?.mount();
        }
        // Player Chip
        if (
          document.querySelector(".ytp-right-controls") &&
          !document.querySelector("vn-player-chip")
        ) {
          uiState.chipPlayer?.mount();
        }
        // Sidebar (Check for secondary column)
        const secondary = document.querySelector("#secondary");
        if (secondary && !document.querySelector("vn-sidebar")) {
          uiState.sidebar?.mount();
        }

        // Always mount floating (once)
        if (!document.querySelector("vn-floating")) {
          uiState.floating?.mount();
        }
      };

      tryMount();
      // Retry a few times for dynamic elements
      setTimeout(tryMount, 1000);
      setTimeout(tryMount, 3000);
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

      // 1. Auto-Pause
      const video = document.querySelector(
        "video.html5-main-video"
      ) as HTMLVideoElement;
      if (video) video.pause();

      const eventDetail = { detail: e.detail };

      // 2. Determine container
      // If we are in Fullscreen, ALWAYS favor Floating UI
      if (document.fullscreenElement) {
        window.dispatchEvent(new CustomEvent("VN_OPEN_FLOATING", eventDetail));
        return;
      }

      // Otherwise check if Sidebar is available
      const sidebarMounted = document.querySelector("vn-sidebar");
      if (sidebarMounted) {
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
          (node.tagName === "VN-SIDEBAR" || node.tagName === "VN-FLOATING")
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
