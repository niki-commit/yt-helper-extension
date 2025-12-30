import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { browser } from "wxt/browser";
import { Plus, Bookmark } from "lucide-react";
import { localStore } from "@/storage/dexie";
import { getCurrentTime, waitForPlayer } from "@/utils/youtube";
import NotePopup from "./NotePopup";
import JumpToNotesChip from "./JumpToNotesChip";

interface ActionBarButtonsProps {
  videoId: string;
}

export default function ActionBarButtons({ videoId }: ActionBarButtonsProps) {
  const [showNotePopup, setShowNotePopup] = useState(false);
  const [hasBookmark, setHasBookmark] = useState(false);

  // Ref for popup positioning
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    checkBookmark();
    // Poll for changes (simple way to sync with sidebar)
    const interval = setInterval(checkBookmark, 2000);
    return () => clearInterval(interval);
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
      ref={containerRef}
      style={{ display: "flex", alignItems: "center" }}
    >
      <JumpToNotesChip />

      <div className="relative">
        <button
          onClick={() => setShowNotePopup(true)}
          className="flex items-center gap-1 px-2 h-9 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-lg font-medium text-white"
          title="Add Note"
        >
          <Plus className="w-6 h-6" />
          <span>Note</span>
        </button>

        {showNotePopup && (
          <NotePopup
            videoId={videoId}
            onClose={() => setShowNotePopup(false)}
          />
        )}
      </div>

      <button
        onClick={handleBookmark}
        className={`flex items-center justify-center w-9 h-9 rounded-full transition-colors ${
          hasBookmark
            ? "bg-indigo-600 hover:bg-indigo-500 text-white"
            : "bg-white/10 hover:bg-white/20 text-white"
        }`}
        title={hasBookmark ? "Remove Bookmark" : "Bookmark this timestamp"}
      >
        <Bookmark className={`w-6 h-6 ${hasBookmark ? "fill-current" : ""}`} />
      </button>
    </div>
  );
}
