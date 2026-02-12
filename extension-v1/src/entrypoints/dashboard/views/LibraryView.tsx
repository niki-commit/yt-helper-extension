import { useQuery, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, FileText, Clock } from "lucide-react";
import { useState, useEffect } from "react";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
import type { VideoMetadata } from "@/types/schema";
import { getThumbnailUrl } from "@/lib/thumbnail-utils";
import { syncEngine } from "@/lib/sync-engine";

dayjs.extend(relativeTime);

interface LibraryViewProps {
  onSelectVideo: (videoId: string) => void;
}

export function LibraryView({ onSelectVideo }: LibraryViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Listen for sync events to refresh the library
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      if (
        event.type === "REFRESH_NOTES" ||
        event.type === "REFRESH_BOOKMARKS"
      ) {
        // console.log("[LibraryView] Received sync event, refreshing videos...");
        queryClient.invalidateQueries({ queryKey: ["videos"] });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const { data: videos = [], isLoading } = useQuery({
    queryKey: ["videos"],
    queryFn: async () => {
      const allVideos = await dbProxy.videos.getAll();
      const allNotes = await dbProxy.notes.getAll();

      // Create a map of video ID -> note count
      const noteCountMap = new Map<string, number>();

      // Add videos that have active notes
      (allNotes as any[]).forEach((note: any) => {
        // if (!note.is_deleted) {
        const count = noteCountMap.get(note.video_id) || 0;
        noteCountMap.set(note.video_id, count + 1);
        // }
      });

      // Filter videos to only include those with active notes
      const videosWithNotes = (allVideos as VideoMetadata[]).filter((video) =>
        noteCountMap.has(video.id)
      );

      // Return enriched videos with note count
      return videosWithNotes
        .map((v) => ({
          ...v,
          noteCount: noteCountMap.get(v.id) || 0,
        }))
        .sort(
          (a: any, b: any) =>
            new Date(b.last_opened_at || 0).getTime() -
            new Date(a.last_opened_at || 0).getTime()
        );
    },
  });

  const filteredVideos = videos.filter((video: any) =>
    video.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading your library...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search videos..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Empty State */}
      {filteredVideos.length === 0 && (
        <div className="flex h-[400px] flex-col items-center justify-center text-center">
          <FileText className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">
            {searchQuery ? "No matching videos" : "Your library is empty"}
          </h3>
          <p className="text-muted-foreground max-w-sm">
            {searchQuery
              ? "Try adjusting your search query"
              : "Start taking notes or bookmarking videos on YouTube to build your library!"}
          </p>
        </div>
      )}

      {/* Video Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredVideos.map((video: any) => (
          <Card
            key={video.id}
            className="cursor-pointer gap-0 overflow-hidden p-0 transition-shadow hover:shadow-lg"
            onClick={() => onSelectVideo(video.id)}
          >
            {/* Thumbnail */}
            <div className="bg-muted relative aspect-video">
              {video.thumbnail_url ? (
                <img
                  src={getThumbnailUrl(video.thumbnail_url)}
                  alt={video.title || "Video thumbnail"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <FileText className="text-muted-foreground h-8 w-8" />
                </div>
              )}
              {/* Note Count Badge */}
              <div className="bg-muted/90 text-foreground absolute right-2 bottom-2 flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[10px] font-bold shadow-sm backdrop-blur-sm">
                <FileText className="text-primary h-3 w-3" />
                <span>
                  {video.noteCount} {video.noteCount === 1 ? "Note" : "Notes"}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1 p-3">
              <h3 className="line-clamp-2 text-sm font-semibold">
                {video.title || "Untitled Video"}
              </h3>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {video.channel_title || "Unknown Channel"}
              </p>
              {video.last_opened_at && (
                <div className="text-muted-foreground flex items-center gap-1 text-xs">
                  <Clock className="h-3 w-3" />
                  <span>{dayjs(video.last_opened_at).fromNow()}</span>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
