import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { Bookmark } from "@/types/schema";
import { syncEngine } from "@/lib/sync-engine";
import { useEffect } from "react";
import { useVideoMetadata } from "./useVideoMetadata";

export function useBookmarks(videoId: string | null) {
  const queryClient = useQueryClient();
  const { refreshMetadata } = useVideoMetadata(videoId);

  // Subscribe to sync events
  useEffect(() => {
    if (!videoId) return;

    // console.log(
    //   "[VideoNotes] Subscribing to sync events for bookmark:",
    //   videoId
    // );
    const unsubscribe = syncEngine.subscribe((event) => {
      if (
        event.type === "REFRESH_BOOKMARKS" &&
        (event.videoId === videoId || event.videoId === "")
      ) {
        // console.log(
        //   "[VideoNotes] Received sync event for bookmark",
        //   videoId || "global"
        // );
        queryClient.invalidateQueries({ queryKey: ["bookmark", videoId] });
        queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      }
    });

    return unsubscribe;
  }, [videoId]);

  const { data: bookmark, isLoading } = useQuery({
    queryKey: ["bookmark", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      const result = await dbProxy.bookmarks.get(videoId);
      return result[0] || null;
    },
    enabled: !!videoId,
  });

  const saveBookmark = useMutation({
    mutationFn: async (timestamp: number) => {
      if (!videoId) return;
      const now = Date.now();
      const newBookmark: Bookmark = {
        videoId,
        timestamp,
        createdAt: now,
        lastModifiedAt: now,
        isDirty: true, // Keep for types/schema
        isDeleted: false, // Keep for types/schema
      };

      // Ensure metadata is captured right now
      await refreshMetadata();

      await dbProxy.bookmarks.save(newBookmark);
      return newBookmark;
    },
    onSuccess: (newBookmark) => {
      if (!newBookmark) return;
      queryClient.setQueryData(["bookmark", videoId], newBookmark);
      queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      // Broadcast change
      if (videoId) {
        syncEngine.broadcast({ type: "REFRESH_BOOKMARKS", videoId });
      }
    },
  });

  const deleteBookmark = useMutation({
    mutationFn: async () => {
      if (!videoId) return;
      await dbProxy.bookmarks.delete(videoId);
    },
    onSuccess: () => {
      queryClient.setQueryData(["bookmark", videoId], null);
      queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      // Broadcast change
      if (videoId) {
        syncEngine.broadcast({ type: "REFRESH_BOOKMARKS", videoId });
      }
    },
    onError: (err) => {
      console.error("[VideoNotes] useBookmarks: Delete failed:", err);
    },
  });

  return {
    bookmark,
    isLoading,
    saveBookmark: saveBookmark.mutateAsync,
    deleteBookmark: deleteBookmark.mutateAsync,
    isSaving: saveBookmark.isPending,
    isDeleting: deleteBookmark.isPending,
  };
}
