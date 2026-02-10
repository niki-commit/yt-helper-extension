import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { useEffect } from "react";
import { syncEngine } from "@/lib/sync-engine";

export function useAllBookmarks() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      if (event.type === "REFRESH_BOOKMARKS") {
        queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: ["all-bookmarks"],
    queryFn: async () => {
      // Get all bookmarks
      const allBookmarks = (await dbProxy.bookmarks.getAll()) || [];

      // Get all video metadata to show titles/channels
      const allVideos = (await dbProxy.videos.getAll()) || [];
      const videoMap = new Map((allVideos as any[]).map((v: any) => [v.id, v]));

      return (allBookmarks as any[])
        .map((b: any) => ({
          ...b,
          video_title: videoMap.get(b.videoId)?.title || "Unknown Video",
          channel_title:
            videoMap.get(b.videoId)?.channel_title || "Unknown Channel",
          thumbnail_url: videoMap.get(b.videoId)?.thumbnail_url || "",
        }))
        .sort((a, b) => b.createdAt - a.createdAt);
    },
  });
}
