import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { Card } from "@/components/ui/card";
import type { Bookmark } from "@/types/schema";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Bookmark as BookmarkIcon, Play, Trash2 } from "lucide-react";
import { useState, useEffect } from "react";
import { formatTime } from "@/lib/utils";
import { getThumbnailUrl } from "@/lib/thumbnail-utils";
import { syncEngine } from "@/lib/sync-engine";

type EnrichedBookmark = Bookmark & {
  videoTitle?: string;
  channelTitle?: string;
  thumbnailUrl?: string;
};

interface BookmarksViewProps {
  onSelectVideo: (videoId: string) => void;
}

export function BookmarksView({ onSelectVideo }: BookmarksViewProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const queryClient = useQueryClient();

  // Listen for sync events to refresh bookmarks
  useEffect(() => {
    const unsubscribe = syncEngine.subscribe((event) => {
      if (event.type === "REFRESH_BOOKMARKS") {
        // console.log("[BookmarksView] Received sync event, refreshing...");
        queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      }
    });

    return unsubscribe;
  }, [queryClient]);

  const { data: bookmarks = [], isLoading } = useQuery({
    queryKey: ["all-bookmarks"],
    queryFn: async () => {
      const allBookmarks = await dbProxy.bookmarks.getAll();
      const allVideos = await dbProxy.videos.getAll();

      // Create a map of videoId -> video metadata for quick lookup
      const videoMap = new Map((allVideos as any[]).map((v: any) => [v.id, v]));

      // Enrich bookmarks with video metadata
      const enriched: EnrichedBookmark[] = (allBookmarks as Bookmark[]).map(
        (bookmark) => {
          const video = videoMap.get(bookmark.videoId);
          return {
            ...bookmark,
            videoTitle: video?.title,
            channelTitle: video?.channel_title,
            thumbnailUrl: video?.thumbnail_url,
          };
        }
      );

      return enriched.sort(
        (a, b) =>
          new Date(b.lastModifiedAt || 0).getTime() -
          new Date(a.lastModifiedAt || 0).getTime()
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (videoId: string) => {
      await dbProxy.bookmarks.delete(videoId);
    },
    onSuccess: (_, videoId) => {
      queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      syncEngine.broadcast({ type: "REFRESH_BOOKMARKS", videoId }); // Targeted refresh
    },
  });

  const filteredBookmarks = bookmarks.filter(
    (bookmark: EnrichedBookmark) =>
      bookmark.videoTitle?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bookmark.channelTitle?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-muted-foreground">Loading bookmarks...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
        <Input
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Empty State */}
      {filteredBookmarks.length === 0 && (
        <div className="flex h-[400px] flex-col items-center justify-center text-center">
          <BookmarkIcon className="text-muted-foreground mb-4 h-12 w-12" />
          <h3 className="mb-2 text-lg font-semibold">No bookmarks yet</h3>
          <p className="text-muted-foreground max-w-sm">
            Use the "Quick Bookmark" feature to save your progress on videos!
          </p>
        </div>
      )}

      {/* Bookmarks Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredBookmarks.map((bookmark: EnrichedBookmark) => (
          <Card
            key={bookmark.videoId}
            className="group cursor-pointer gap-0 overflow-hidden p-0 transition-shadow hover:shadow-lg"
            onClick={() => {
              const url = `https://www.youtube.com/watch?v=${bookmark.videoId}&t=${Math.floor(bookmark.timestamp)}`;
              window.open(url, "_blank");
            }}
          >
            {/* Thumbnail */}
            <div className="bg-muted relative aspect-video">
              {bookmark.thumbnailUrl ? (
                <img
                  src={getThumbnailUrl(bookmark.thumbnailUrl)}
                  alt={bookmark.videoTitle || "Video thumbnail"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full items-center justify-center">
                  <BookmarkIcon className="text-muted-foreground h-8 w-8" />
                </div>
              )}

              {/* Delete Button (Overlay) */}
              <div className="absolute top-2 right-2 z-10 opacity-0 transition-opacity group-hover:opacity-100">
                <Button
                  variant="destructive"
                  size="icon"
                  className="h-8 w-8 rounded-full shadow-lg"
                  onClick={(e) => {
                    e.stopPropagation();
                    if (
                      confirm("Are you sure you want to delete this bookmark?")
                    ) {
                      deleteMutation.mutate(bookmark.videoId);
                    }
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>

              {/* Resume Badge */}
              <div className="bg-primary text-primary-foreground absolute right-2 bottom-2 flex items-center gap-1 rounded px-2 py-1 text-xs font-medium">
                <Play className="h-3 w-3" />
                {formatTime(bookmark.timestamp)}
              </div>
            </div>

            {/* Content */}
            <div className="space-y-1 p-3">
              <h3 className="line-clamp-2 text-sm font-semibold">
                {bookmark.videoTitle || "Untitled Video"}
              </h3>
              <p className="text-muted-foreground line-clamp-1 text-xs">
                {bookmark.channelTitle || "Unknown Channel"}
              </p>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
