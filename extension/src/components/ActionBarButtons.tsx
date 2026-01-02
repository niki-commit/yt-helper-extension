import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { browser } from "wxt/browser";
import { Plus, Bookmark } from "lucide-react";
import { localStore } from "@/storage/dexie";
import { getCurrentTime, waitForPlayer, isAdRunning } from "@/utils/youtube";
import NotePopup from "./NotePopup";
import JumpToNotesChip from "./JumpToNotesChip";

interface ActionBarButtonsProps {
  videoId: string;
}

export default function ActionBarButtons({ videoId }: ActionBarButtonsProps) {
  const [hasBookmark, setHasBookmark] = useState(false);
  const [isAdActive, setIsAdActive] = useState(false);

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

    // Poll for changes (simple way to sync with sidebar)
    const syncInterval = setInterval(checkBookmark, 2000);

    return () => {
      clearInterval(adCheckInterval);
      clearInterval(syncInterval);
    };
  }, [videoId]);

  const checkBookmark = async () => {
    try {
      if (!browser.runtime?.id) return;
      const video = await localStore.getVideo(videoId);
      setHasBookmark(!!(video && video.bookmarkTimestamp !== null));
    } catch (e) {
      // Context invalidated or db error
    }
  };

  const handleBookmark = async () => {
    const isReady = await waitForPlayer();
    if (!isReady) return;

    if (hasBookmark) {
      await localStore.setBookmark(videoId, null);
      setHasBookmark(false);
    } else {
      const time = getCurrentTime();
      await localStore.setBookmark(videoId, time);
      setHasBookmark(true);
    }
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
            isAdActive
              ? "bg-white/5 text-zinc-500 cursor-default opacity-50"
              : "bg-white/10 hover:bg-white/20"
          }`}
          title={isAdActive ? "Disabled during ads" : "Add Note"}
          disabled={isAdActive}
        >
          <Plus className="w-6 h-6" />
          <span>Note</span>
        </button>
      </div>

      <button
        onClick={() => {
          if (!isAdActive) handleBookmark();
        }}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          isAdActive
            ? "bg-white/5 text-zinc-500 cursor-default opacity-50"
            : hasBookmark
            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
        title={
          isAdActive
            ? "Disabled during ads"
            : hasBookmark
            ? "Remove Bookmark"
            : "Bookmark this timestamp"
        }
        disabled={isAdActive}
      >
        <Bookmark className={`w-6 h-6 ${hasBookmark ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
