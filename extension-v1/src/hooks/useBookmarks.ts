import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { Bookmark } from "@/types/schema";

export function useBookmarks(videoId: string | null) {
  const queryClient = useQueryClient();

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
        isDirty: true,
        isDeleted: false,
      };
      await dbProxy.bookmarks.save(newBookmark);
      return newBookmark;
    },
    onSuccess: (newBookmark) => {
      if (!newBookmark) return;
      queryClient.setQueryData(["bookmark", videoId], newBookmark);
      queryClient.invalidateQueries({ queryKey: ["all-bookmarks"] });
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
