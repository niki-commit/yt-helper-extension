import { Plus, Bookmark, Play, X } from "lucide-react";
import { localStore } from "@/storage/dexie";
import {
  getCurrentTime,
  waitForPlayer,
  isAdRunning,
  formatTime,
  seekTo,
} from "@/utils/youtube";
import NotePopup from "./NotePopup";
import JumpToNotesChip from "./JumpToNotesChip";

interface ActionBarButtonsProps {
  videoId: string;
}

export default function ActionBarButtons({ videoId }: ActionBarButtonsProps) {
  const [hasBookmark, setHasBookmark] = useState(false);
  const [bookmarkTime, setBookmarkTime] = useState<number | null>(null);
  const [isAdActive, setIsAdActive] = useState(false);
  const [isExternalNoteActive, setIsExternalNoteActive] = useState(false);
  const [isBookmarkedFlash, setIsBookmarkedFlash] = useState(false);

  const [isMobile, setIsMobile] = useState(window.innerWidth < 1024);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 1024);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    checkBookmark();

    // Ad detection loop
    const adCheckInterval = setInterval(() => {
      try {
        if (!browser.runtime?.id) {
          clearInterval(adCheckInterval);
          return;
        }
        setIsAdActive(isAdRunning());
      } catch (e) {
        clearInterval(adCheckInterval);
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
      clearInterval(adCheckInterval);
      window.removeEventListener("yt-helper-note-status", handleNoteStatus);
      window.removeEventListener(
        "yt-helper-bookmark-updated",
        handleBookmarkUpdated
      );
    };
  }, [videoId]);

  const checkBookmark = async () => {
    try {
      if (!browser.runtime?.id) return;
      const video = await localStore.getVideo(videoId);
      const isBookmarked = !!(video && video.bookmarkTimestamp !== null);
      setHasBookmark(isBookmarked);
      setBookmarkTime(video?.bookmarkTimestamp || null);
    } catch (e) {
      // Context invalidated or db error
    }
  };

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

  return (
    <div
      className="flex items-center gap-2 mr-2"
      style={{ display: "flex", alignItems: "center" }}
    >
      {isMobile && <JumpToNotesChip />}

      <div className="relative">
        <button
          onClick={() => {
            if (isAdActive) return;
            window.dispatchEvent(
              new CustomEvent("yt-helper-open-quick-note", {
                detail: { videoId },
              })
            );
          }}
          className={`flex items-center gap-1 px-2 h-9 rounded-full transition-colors text-lg font-medium text-white ${
            isAdActive || isExternalNoteActive
              ? "bg-white/5 text-zinc-500 cursor-default opacity-50"
              : "bg-white/10 hover:bg-white/20"
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

      {hasBookmark && bookmarkTime !== null && (
        <div className="flex items-center group">
          <button
            onClick={() => {
              if (!isAdActive) seekTo(bookmarkTime);
            }}
            className={`flex items-center gap-1.5 px-3 h-9 rounded-l-full bg-zinc-800 hover:bg-zinc-700 transition-all border border-zinc-700/50 whitespace-nowrap border-r-0 ${
              isAdActive ? "opacity-50 cursor-default" : "active:scale-95"
            }`}
            title={`Resume from ${formatTime(bookmarkTime)}`}
            disabled={isAdActive}
          >
            <Play className="w-3.5 h-3.5 fill-current text-indigo-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-wider text-zinc-300 group-hover:text-white">
              Resume {formatTime(bookmarkTime)}
            </span>
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isAdActive) deleteBookmark();
            }}
            className={`flex items-center justify-center w-8 h-9 rounded-r-full bg-zinc-800 hover:bg-red-500/20 transition-all border border-zinc-700/50 border-l-0 text-zinc-500 hover:text-red-500 ${
              isAdActive ? "opacity-50 cursor-default" : ""
            }`}
            title="Delete Bookmark"
            disabled={isAdActive}
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      <button
        onClick={() => {
          if (!isAdActive) handleBookmark();
        }}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-all duration-300 ${
          isAdActive
            ? "bg-white/5 text-zinc-500 cursor-default opacity-50"
            : isBookmarkedFlash
            ? "bg-indigo-600 text-white scale-110 shadow-[0_0_15px_rgba(79,70,229,0.6)]"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
        title={
          isAdActive
            ? "Disabled during ads"
            : hasBookmark
            ? "Update Bookmark to current time"
            : "Bookmark this timestamp"
        }
        disabled={isAdActive}
      >
        <Bookmark
          className={`w-6 h-6 transition-all duration-300 ${
            isBookmarkedFlash && !isAdActive
              ? "fill-current text-white scale-110"
              : "text-zinc-400"
          }`}
        />
      </button>
    </div>
  );
}
