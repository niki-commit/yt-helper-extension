import React, { useState, useEffect, useRef } from "react";
import { browser } from "wxt/browser";
import { Plus, Bookmark } from "lucide-react";
import { localStore } from "@/storage/dexie";
import { getCurrentTime, waitForPlayer } from "@/utils/youtube";
import NotePopup from "./NotePopup";

interface PlayerButtonsProps {
  videoId: string;
}

export default function PlayerButtons({ videoId }: PlayerButtonsProps) {
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [hasBookmark, setHasBookmark] = useState(false);

  useEffect(() => {
    // Check bookmark
    const interval = setInterval(async () => {
      try {
        if (!browser.runtime?.id) {
          clearInterval(interval);
          return;
        }
        const video = await localStore.getVideo(videoId);
        setHasBookmark(!!(video && video.bookmarkTimestamp !== null));
      } catch (e) {
        clearInterval(interval);
      }
    }, 2000);

    return () => clearInterval(interval);
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

    if (hasBookmark) {
      await localStore.setBookmark(videoId, null);
      setHasBookmark(false);
    } else {
      const time = getCurrentTime();
      await localStore.setBookmark(videoId, time);
      setHasBookmark(true);
    }
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
          onClick={() => setShowNotePopup(true)}
          className="flex items-center gap-1 px-2 mt-1 rounded-full h-full hover:bg-white/10 transition-colors text-white font-medium text-2xl whitespace-nowrap justify-center"
          title="Add Note"
        >
          <Plus className="w-6 h-6" />
          <span>Note</span>
        </button>

        {showNotePopup && (
          <div className="absolute bottom-full mb-4 right-0 z-1000">
            <NotePopup
              videoId={videoId}
              onClose={() => setShowNotePopup(false)}
            />
          </div>
        )}
      </div>

      {/* Bookmark Button */}
      <button
        onClick={handleBookmark}
        className={`w-12 h-full flex items-center justify-center hover:bg-white/10 transition-all ${
          hasBookmark ? "text-indigo-400" : "text-white"
        }`}
        title="Bookmark"
      >
        <Bookmark
          className={`w-6 h-6 mt-1.5 ${hasBookmark ? "fill-current" : ""}`}
        />
      </button>
    </div>
  );
}
