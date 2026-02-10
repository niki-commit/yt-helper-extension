import { useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { VideoMetadata } from "@/types/schema";

export function useVideoMetadata(videoId: string | null) {
  const queryClient = useQueryClient();

  const { data: videoMetadata } = useQuery({
    queryKey: ["video-metadata", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const videos = await dbProxy.videos.getAll();
      return (videos as any[]).find((v: any) => v.id === videoId) || null;
    },
    enabled: !!videoId,
  });

  // Manual/Triggered Scrape
  const scrapeMetadata = async () => {
    if (!videoId) return null;

    // YouTube's latest layout (v3) uses ytd-watch-metadata
    // Fallback included for older/mobile layouts
    const titleElement = document.querySelector(
      "ytd-watch-metadata h1 yt-formatted-string, #title > h1 > yt-formatted-string, h1.ytd-video-primary-info-renderer"
    );
    const channelElement = document.querySelector(
      "ytd-watch-metadata #owner ytd-channel-name a, #upload-info #channel-name a, .ytd-video-secondary-info-renderer #channel-name a"
    );

    const title = titleElement?.textContent?.trim() || "";
    const channel = channelElement?.textContent?.trim() || "";

    if (title && channel && title !== "Unknown Title") {
      const videoData: VideoMetadata = {
        id: videoId,
        title,
        channel_title: channel,
        duration: "", // Optional for now
        thumbnail_url: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        last_opened_at: Date.now(),
      };

      console.log("[VideoNotes] Scraped metadata:", { title, channel });
      await dbProxy.videos.save(videoData);
      queryClient.invalidateQueries({ queryKey: ["video-metadata", videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      return videoData;
    }
    return null;
  };

  const saveMetadata = useMutation({
    mutationFn: async (metadata: Partial<VideoMetadata>) => {
      if (!videoId) return;

      const videoData: VideoMetadata = {
        id: videoId,
        title: metadata.title || "Unknown Title",
        channel_title: metadata.channel_title || "Unknown Channel",
        duration: metadata.duration?.toString() || "",
        thumbnail_url: metadata.thumbnail_url || "",
        last_opened_at: Date.now(),
      };

      await dbProxy.videos.save(videoData);
      return videoData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["video-metadata", videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
    },
  });

  // Auto-capture metadata from DOM if missing or stale (Content Script ONLY)
  useEffect(() => {
    if (!videoId) return;

    if (
      !window.location.hostname.includes("youtube.com") ||
      !window.location.pathname.includes("/watch")
    ) {
      return;
    }

    // Initial attempt
    scrapeMetadata();

    // Polling fallback: Try a few times because YouTube is slow
    let attempts = 0;
    const interval = setInterval(() => {
      attempts++;
      scrapeMetadata().then((data) => {
        if (data || attempts >= 5) {
          clearInterval(interval);
        }
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [videoId]);

  return {
    videoMetadata,
    saveMetadata: saveMetadata.mutateAsync,
    refreshMetadata: scrapeMetadata,
  };
}
