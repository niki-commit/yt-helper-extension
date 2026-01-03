import { Plus, Bookmark, Play, X } from "lucide-react";
import { localStore } from "@/storage/dexie";
import {
  getCurrentTime,
  waitForPlayer,
  isAdRunning,
  formatTime,
  seekTo,
} from "@/utils/youtube";

interface PlayerButtonsProps {
  videoId: string;
}

export default function PlayerButtons({ videoId }: PlayerButtonsProps) {
  const [hasBookmark, setHasBookmark] = useState(false);
  const [bookmarkTime, setBookmarkTime] = useState<number | null>(null);
  const [isAdActive, setIsAdActive] = useState(false);
  const [isExternalNoteActive, setIsExternalNoteActive] = useState(false);
  const [isBookmarkedFlash, setIsBookmarkedFlash] = useState(false);

  useEffect(() => {
    // Initial fetch
    const init = async () => {
      try {
        if (!browser.runtime?.id) return;
        const video = await localStore.getVideo(videoId);
        setHasBookmark(!!(video && video.bookmarkTimestamp !== null));
        setBookmarkTime(video?.bookmarkTimestamp || null);
      } catch (e) {}
    };
    init();

    // Ad detection loop
    const interval = setInterval(async () => {
      try {
        if (!browser.runtime?.id) {
          clearInterval(interval);
          return;
        }
        setIsAdActive(isAdRunning());
      } catch (e) {
        clearInterval(interval);
      }
    }, 1000);

    const handleNoteStatus = (e: any) => {
      if (e.detail?.status === "open") setIsExternalNoteActive(true);
      else setIsExternalNoteActive(false);
    };

    const handleBookmarkUpdated = (e: any) => {
      if (e.detail?.videoId === videoId) {
        setHasBookmark(e.detail.hasBookmark);
        setBookmarkTime(e.detail.bookmarkTime);
      }
    };

    window.addEventListener("yt-helper-note-status", handleNoteStatus);
    window.addEventListener(
      "yt-helper-bookmark-updated",
      handleBookmarkUpdated
    );

    return () => {
      clearInterval(interval);
      window.removeEventListener("yt-helper-note-status", handleNoteStatus);
      window.removeEventListener(
        "yt-helper-bookmark-updated",
        handleBookmarkUpdated
      );
    };
  }, [videoId]);

  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    // Initial check
    setIsFullscreen(!!document.fullscreenElement);

    return () => {
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
    };
  }, []);

  const handleBookmark = async () => {
    const isReady = await waitForPlayer();
    if (!isReady) return;

    const time = getCurrentTime();
    await localStore.setBookmark(videoId, time);
    setHasBookmark(true);
    setBookmarkTime(time);

    // Trigger Success Flash
    setIsBookmarkedFlash(true);
    setTimeout(() => setIsBookmarkedFlash(false), 800);

    window.dispatchEvent(
      new CustomEvent("yt-helper-bookmark-updated", {
        detail: { videoId, hasBookmark: true, bookmarkTime: time },
      })
    );
  };

  const deleteBookmark = async () => {
    await localStore.setBookmark(videoId, null);
    setHasBookmark(false);
    setBookmarkTime(null);
    window.dispatchEvent(
      new CustomEvent("yt-helper-bookmark-updated", {
        detail: { videoId, hasBookmark: false, bookmarkTime: null },
      })
    );
  };

  if (!isFullscreen) return null;

  return (
    <div
      className="flex items-center h-full pointer-events-auto z-9999"
      style={{
        display: "inline-flex",
        alignItems: "flex-start", // Align top so padding pushes it down
        justifyContent: "center",
        height: "100%",
        paddingTop: "9px", // Fine-tuned alignment
        pointerEvents: "auto",
        zIndex: 9999,
      }}
    >
      {/* Note Button */}
      <div className="relative flex items-center h-full">
        <button
          onClick={() => {
            if (isAdActive) return;
            window.dispatchEvent(
              new CustomEvent("yt-helper-open-quick-note", {
                detail: { videoId },
              })
            );
          }}
          className={`flex items-center gap-1 px-2 mt-0.5 rounded-full h-full transition-colors text-white font-medium text-2xl whitespace-nowrap justify-center ${
            isAdActive || isExternalNoteActive
              ? "text-zinc-500 cursor-default opacity-50"
              : "hover:bg-white/10"
          }`}
          title={
            isAdActive
              ? "Disabled during ads"
              : isExternalNoteActive
              ? "Note already in progress"
              : "Add Note"
          }
          disabled={isAdActive || isExternalNoteActive}
        >
          <Plus className="w-6 h-6" />
          <span>Note</span>
        </button>
      </div>

      {/* Bookmark Button */}
      <button
        onClick={() => {
          if (!isAdActive) handleBookmark();
        }}
        className={`w-12 h-full flex items-center justify-center transition-all duration-300 ${
          isAdActive
            ? "text-zinc-500 cursor-default opacity-50"
            : isBookmarkedFlash
            ? "text-white scale-125 drop-shadow-[0_0_8px_rgba(79,70,229,0.8)]"
            : "text-white hover:bg-white/10"
        }`}
        title={
          isAdActive
            ? "Disabled during ads"
            : hasBookmark
            ? "Update Bookmark to current time"
            : "Bookmark"
        }
        disabled={isAdActive}
      >
        <Bookmark
          className={`w-6 h-6 mt-1.5 transition-all duration-300 ${
            isBookmarkedFlash && !isAdActive
              ? "fill-current text-white scale-110"
              : "text-zinc-300"
          }`}
        />
      </button>

      {/* Resume Button */}
      {hasBookmark && bookmarkTime !== null && (
        <div className="flex items-center ml-2 group/resume">
          <button
            onClick={() => {
              if (!isAdActive) seekTo(bookmarkTime);
            }}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-l-full bg-zinc-800/80 hover:bg-zinc-700/80 transition-all border border-zinc-700/50 whitespace-nowrap border-r-0 ${
              isAdActive ? "opacity-50 cursor-default" : "active:scale-95"
            }`}
            title={`Resume from ${formatTime(bookmarkTime)}`}
            disabled={isAdActive}
          >
            <Play className="w-3.5 h-3.5 fill-current text-indigo-400 group-hover/resume:scale-110 transition-transform" />
            <span className="text-xs font-bold uppercase tracking-wider text-zinc-300 group-hover/resume:text-white">
              Resume {formatTime(bookmarkTime)}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdActive) deleteBookmark();
            }}
            className={`flex items-center justify-center w-8 h-9 rounded-r-full bg-zinc-800/80 hover:bg-red-500/20 transition-all border border-zinc-700/50 border-l-0 text-zinc-500 hover:text-red-500 ${
              isAdActive ? "opacity-50 cursor-default" : ""
            }`}
            title="Delete Bookmark"
            disabled={isAdActive}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
}
