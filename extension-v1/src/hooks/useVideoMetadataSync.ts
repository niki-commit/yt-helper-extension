import { useEffect } from "react";
import { db } from "@/lib/db";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

export function useVideoMetadataSync() {
  const videoId = new URLSearchParams(window.location.search).get("v");

  useEffect(() => {
    const syncMetadata = async () => {
      if (!videoId) return;

      // Try to find video title from DOM
      const titleElement = document.querySelector(
        "ytd-watch-metadata h1 yt-formatted-string"
      );
      const channelElement = document.querySelector(
        "ytd-watch-metadata #owner ytd-channel-name a"
      );

      const title = titleElement?.textContent || "Unknown Video";
      const channel = channelElement?.textContent || "Unknown Channel";

      try {
        await db.videos.put({
          id: videoId,
          title,
          channel_title: channel,
          last_opened_at: Date.now(),
        });
      } catch (err) {
        console.error("[VideoNotes] Metadata sync failed:", err);
      }
    };

    // YouTube title/channel might load slightly after mount
    const timer = setTimeout(syncMetadata, 2000);
    return () => clearTimeout(timer);
  }, [videoId]);
}
