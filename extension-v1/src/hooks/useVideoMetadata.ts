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
      queryClient.invalidateQueries({ queryKey: ["all-notes"] }); // Refresh popup list
    },
  });

  // Auto-capture metadata from DOM if missing or stale
  useEffect(() => {
    if (!videoId) return;

    // We can try to scrape the title/channel from the DOM
    const checkForMetadata = () => {
      const titleElement = document.querySelector(
        "#title > h1 > yt-formatted-string"
      );
      const channelElement = document.querySelector(
        "#upload-info #channel-name a"
      );

      if (titleElement && channelElement) {
        const title = titleElement.textContent || "";
        const channel = channelElement.textContent || "";

        // Get reliable thumbnail URL
        // YouTube's hqdefault.jpg (480x360) exists for ALL public videos
        // maxresdefault.jpg only exists for newer/popular videos
        let thumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;

        // Only save if meaningful
        if (title && channel) {
          console.log("[VideoNotes] Auto-saving metadata:", {
            title,
            channel,
            thumbnail,
          });
          saveMetadata.mutate({
            title,
            channel_title: channel,
            thumbnail_url: thumbnail,
          });
        }
      }
    };

    // Attempt immediately, and maybe after a delay for dynamic loading
    checkForMetadata();
    const timer = setTimeout(checkForMetadata, 2000);

    return () => clearTimeout(timer);
  }, [videoId]);

  return {
    videoMetadata,
    saveMetadata: saveMetadata.mutateAsync,
  };
}
