import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Bookmark } from "@/types/schema";

export function useBookmarks(videoId: string | null) {
  const queryClient = useQueryClient();

  const { data: bookmark, isLoading } = useQuery({
    queryKey: ["bookmark", videoId],
    queryFn: async () => {
      if (!videoId) return null;
      return await db.bookmarks.get(videoId);
    },
    enabled: !!videoId,
  });

  const saveBookmark = useMutation({
    mutationFn: async (timestamp: number) => {
      if (!videoId) return;
      const newBookmark: Bookmark = {
        videoId,
        timestamp,
        createdAt: Date.now(),
      };
      await db.bookmarks.put(newBookmark);
      return newBookmark;
    },
    onSuccess: (newBookmark) => {
      if (!newBookmark) return;
      queryClient.setQueryData(["bookmark", videoId], newBookmark);
    },
  });

  const deleteBookmark = useMutation({
    mutationFn: async () => {
      if (!videoId) return;
      await db.bookmarks.delete(videoId);
    },
    onSuccess: () => {
      queryClient.setQueryData(["bookmark", videoId], null);
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
