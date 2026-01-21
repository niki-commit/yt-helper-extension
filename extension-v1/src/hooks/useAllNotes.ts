import { useQuery } from "@tanstack/react-query";
import { db } from "@/lib/db";

export function useAllNotes() {
  return useQuery({
    queryKey: ["all-notes"],
    queryFn: async () => {
      // Get all notes not deleted
      const allNotes = await db.notes
        .where("is_deleted")
        .equals(0) // Dexie stores false as 0
        .toArray();

      // Get all video metadata
      const allVideos = await db.videos.toArray();
      const videoMap = new Map(allVideos.map((v) => [v.id, v]));

      // Group notes by video
      const grouped = allNotes.reduce(
        (acc, note) => {
          const video = videoMap.get(note.video_id);
          const videoTitle = video?.title || "Unknown Video";

          if (!acc[note.video_id]) {
            acc[note.video_id] = {
              video_id: note.video_id,
              title: videoTitle,
              channel: video?.channel_title || "Unknown Channel",
              count: 0,
              last_modified: 0,
            };
          }

          acc[note.video_id].count++;
          acc[note.video_id].last_modified = Math.max(
            acc[note.video_id].last_modified,
            note.last_modified_at
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
