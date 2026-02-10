import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { useEffect } from "react";
import { syncEngine } from "@/lib/sync-engine";

export function useAllNotes() {
  const queryClient = useQueryClient();

  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      if (
        event.type === "REFRESH_NOTES" ||
        event.type === "REFRESH_BOOKMARKS"
      ) {
        queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      }
    });
    return unsubscribe;
  }, [queryClient]);

  return useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => {
      const allNotes = (await dbProxy.notes.getAll()) || [];
      const allVideos = (await dbProxy.videos.getAll()) || [];

      const videoMap = new Map((allVideos as any[]).map((v: any) => [v.id, v]));

      // Group notes by video
      const grouped = (allNotes as any[]).reduce(
        (acc: any, note: any) => {
          if (!note.video_id) return acc;
          const video = videoMap.get(note.video_id);
          const videoTitle = video?.title || "Unknown Video";

          if (!acc[note.video_id]) {
            acc[note.video_id] = {
              video_id: note.video_id,
              title: videoTitle,
              channel: video?.channel_title || "Unknown Channel",
              thumbnail_url: video?.thumbnail_url || "",
              count: 0,
              last_modified: 0,
            };
          }

          acc[note.video_id].count++;
          acc[note.video_id].last_modified = Math.max(
            acc[note.video_id].last_modified,
            note.last_modified_at || 0
          );

          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(grouped).sort(
        (a: any, b: any) => b.last_modified - a.last_modified
      );
    },
  });
}
