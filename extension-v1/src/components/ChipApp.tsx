import { useState, useEffect } from "react";
import {
  FileEdit,
  PlayCircle,
  Bookmark,
  Check,
  CheckCircle2,
  Layout,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useAdState } from "@/hooks/useAdState";
import { useBookmarks } from "@/hooks/useBookmarks";
import { useVideoMetadata } from "@/hooks/useVideoMetadata";
import { formatTime } from "@/lib/utils";
import {
  ShadowTooltip,
  ShadowTooltipContent,
  ShadowTooltipTrigger,
} from "@/components/ui/ShadowTooltip";

interface ChipAppProps {
  isPlayerControl?: boolean;
}

export function ChipApp({ isPlayerControl = false }: ChipAppProps) {
  const [isSaved, setIsSaved] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const { resolvedTheme } = useTheme();
  const { getCurrentTime, seekTo, play } = useYouTubePlayer();

  // Get current video ID
  const videoId = new URLSearchParams(window.location.search).get("v");

  // Real Bookmark Logic
  const {
    bookmark,
    saveBookmark,
    deleteBookmark,
    isSaving: isBookmarkSaving,
  } = useBookmarks(videoId);

  // Auto-capture metadata
  useVideoMetadata(videoId);

  useEffect(() => {
    if (!isPlayerControl) return;

    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // Initial check
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, [isPlayerControl]);

  const { isAdActive } = useAdState();

  const handleOpenWorkspace = () => {
    if (isAdActive) return;

    window.dispatchEvent(
      new CustomEvent("VN_REQUEST_OPEN", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          currentTime: null, // General mode: No timestamp, no pause
        },
      })
    );
  };

  const handleOpenOverlay = () => {
    if (isAdActive) return;
    const currentTime = getCurrentTime();

    window.dispatchEvent(
      new CustomEvent("VN_REQUEST_OPEN", {
        bubbles: true,
        composed: true,
        detail: {
          timestamp: Date.now(),
          currentTime: currentTime,
        },
      })
    );
  };

  const handleQuickSave = async () => {
    if (isAdActive || isBookmarkSaving) return;

    const currentTime = getCurrentTime();
    setIsSaved(true);

    try {
      await saveBookmark(currentTime);
    } catch (err) {
      console.error("[VideoNotes] Failed to save bookmark:", err);
    }

    setTimeout(() => {
      setIsSaved(false);
    }, 2000);
  };

  const handleResume = () => {
    if (isAdActive || !bookmark) return;
    seekTo(bookmark.timestamp);
    play();
  };

  const handleDeleteBookmark = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteBookmark();
    } catch (err) {
      console.error("[VideoNotes] Failed to delete bookmark:", err);
    }
  };

  // Only show in player controls if fullscreen is active
  if (isPlayerControl && !isFullscreen) return null;

  return (
    <div
      className={`${
        isPlayerControl
          ? "ml-0 h-[48px] items-center pb-[7px]"
          : "ml-4 items-center"
      } ${resolvedTheme === "dark" ? "dark" : ""} ${
        isAdActive ? "grayscale" : ""
      } flex flex-nowrap gap-2.5 overflow-hidden bg-transparent font-sans whitespace-nowrap`}
    >
      {/* 0. WORKSPACE TOGGLE (Manual Open) */}
      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <button
            onClick={handleOpenWorkspace}
            disabled={isAdActive}
            className={`border-border bg-card flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 ${
              isAdActive
                ? "cursor-not-allowed opacity-50"
                : "hover:bg-accent/50 hover:border-primary/50 hover:cursor-pointer"
            }`}
          >
            <Layout className="text-primary h-5 w-5 transition-colors" />
          </button>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="top" shortcut="S">
          <p>{isAdActive ? "Disabled during ads" : "Open workspace"}</p>
        </ShadowTooltipContent>
      </ShadowTooltip>

      {/* 1. NOTE BUTTON */}
      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <button
            onClick={handleOpenOverlay}
            disabled={isAdActive}
            className={`group border-border bg-card text-foreground flex h-10 items-center gap-2.5 rounded-full border px-5 text-sm font-medium shadow-sm transition-all active:scale-95 ${
              isAdActive
                ? "cursor-not-allowed opacity-50"
                : "hover:border-primary/50 hover:bg-accent/50 hover:cursor-pointer"
            }`}
          >
            <FileEdit className="text-primary h-5 w-5 transition-colors dark:text-cyan-400" />
            <span className="text-[14px]">
              {isAdActive ? "Ad Active" : "Note"}
            </span>
          </button>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="top" shortcut="N">
          <p>
            {isAdActive
              ? "Disabled during ads"
              : "Capture timestamp & take note"}
          </p>
        </ShadowTooltipContent>
      </ShadowTooltip>

      {/* 2. RESUME SPLIT-BUTTON (Conditional) */}
      {bookmark && (
        <div className="group flex items-center rounded-full shadow-sm transition-all active:scale-95">
          {/* Resume Part */}
          <ShadowTooltip>
            <ShadowTooltipTrigger asChild>
              <button
                onClick={handleResume}
                disabled={isAdActive}
                className={`border-border bg-card flex h-10 items-center gap-2.5 rounded-l-full border px-5 text-sm font-medium transition-all ${
                  isAdActive
                    ? "cursor-not-allowed opacity-50"
                    : "hover:bg-accent/50 hover:border-primary/50 hover:cursor-pointer"
                }`}
              >
                <PlayCircle className="text-secondary-foreground h-5 w-5 dark:text-amber-400" />
                <span className="text-foreground text-[13px] font-medium whitespace-nowrap">
                  {isAdActive
                    ? "Ad Active"
                    : `Resume @ ${formatTime(bookmark.timestamp)}`}
                </span>
              </button>
            </ShadowTooltipTrigger>
            <ShadowTooltipContent side="top">
              <p>
                {isAdActive
                  ? "Cannot resume during ads"
                  : `Jump to ${formatTime(bookmark.timestamp)}`}
              </p>
            </ShadowTooltipContent>
          </ShadowTooltip>

          {/* Delete Part */}
          <ShadowTooltip>
            <ShadowTooltipTrigger asChild>
              <button
                onClick={handleDeleteBookmark}
                disabled={isAdActive}
                className="border-border bg-card hover:bg-destructive/10 hover:border-destructive/50 hover:text-destructive text-muted-foreground flex h-10 w-9 items-center justify-center rounded-r-full border border-l transition-all hover:cursor-pointer"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="lucide lucide-x"
                >
                  <path d="M18 6 6 18" />
                  <path d="m6 6 12 12" />
                </svg>
              </button>
            </ShadowTooltipTrigger>
            <ShadowTooltipContent side="top">
              <p>Remove bookmark</p>
            </ShadowTooltipContent>
          </ShadowTooltip>
        </div>
      )}

      {/* 3. QUICK SAVE BUTTON */}
      <ShadowTooltip>
        <ShadowTooltipTrigger asChild>
          <button
            onClick={handleQuickSave}
            disabled={isSaved || isAdActive}
            className={`border-border bg-card flex h-10 w-10 items-center justify-center rounded-full border shadow-sm transition-all active:scale-95 ${
              isAdActive
                ? "cursor-not-allowed opacity-50 grayscale"
                : isSaved
                  ? "bg-primary/10 border-primary/50 cursor-default"
                  : "hover:bg-accent/50 hover:border-primary/50 hover:cursor-pointer"
            }`}
          >
            <div className="relative flex items-center justify-center">
              <Bookmark
                className={`text-foreground h-5 w-5 transition-all duration-300 ${
                  isSaved ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
              />
              <CheckCircle2
                className={`text-primary absolute h-5 w-5 transition-all duration-300 ${
                  isSaved ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
            </div>
          </button>
        </ShadowTooltipTrigger>
        <ShadowTooltipContent side="top" shortcut="B">
          <p>
            {isAdActive
              ? "Disabled during ads"
              : isSaved
                ? "Bookmark saved!"
                : "Quick bookmark"}
          </p>
        </ShadowTooltipContent>
      </ShadowTooltip>
    </div>
  );
}
