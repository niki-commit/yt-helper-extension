import { useEffect, useMemo } from "react";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useAdState } from "@/hooks/useAdState";
import { toast } from "sonner";

export function KeyboardShortcutsHandler() {
  // Extract videoId from URL
  const videoId = useMemo(() => {
    return new URLSearchParams(window.location.search).get("v");
  }, [window.location.search]);

  const { saveBookmark } = useBookmarks(videoId);
  const { getCurrentTime } = useYouTubePlayer();
  const { isAdActive } = useAdState();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Alt/Option key
      if (!e.altKey) return;

      const key = e.key.toLowerCase();
      const isFullscreen = !!document.fullscreenElement;

      // Determine which event to send based on fullscreen status
      const targetEvent = isFullscreen ? "VN_OPEN_FLOATING" : "VN_OPEN_SIDEBAR";

      // Alt + N: New Note
      if (key === "n") {
        if (isAdActive) {
          // console.warn("[VideoNotes] Shortcut blocked: Ad is active.");
          return;
        }

        const currentTime = getCurrentTime();
        e.preventDefault();
        e.stopPropagation();

        window.dispatchEvent(
          new CustomEvent(targetEvent, {
            detail: {
              currentTime,
              focusNote: true,
            },
          })
        );
      }

      // Alt + S: Toggle Sidebar/Floating
      if (key === "s") {
        if (isAdActive) {
          // console.warn("[VideoNotes] Shortcut blocked: Ad is active.");
          return;
        }

        e.preventDefault();
        e.stopPropagation();
        // We still use the unified toggle, but we ensure the apps are context-aware
        // Actually, to be safe and avoid multi-firing, let's send specific events
        window.dispatchEvent(
          new CustomEvent("VN_TOGGLE_UI", {
            detail: { isFullscreen },
          })
        );
      }

      // Alt + B: Quick Bookmark
      if (key === "b") {
        if (isAdActive) {
          // console.warn("[VideoNotes] Shortcut blocked: Ad is active.");
          return;
        }

        const currentTime = getCurrentTime();
        if (videoId && currentTime !== undefined) {
          e.preventDefault();
          e.stopPropagation();
          saveBookmark(currentTime);
          toast.success("Bookmark Saved!", {
            description: "Quickly added via shortcut",
            duration: 2000,
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, [saveBookmark, videoId, getCurrentTime, isAdActive]);

  return null;
}
