import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { Note } from "@/types/schema";
import { v4 as uuidv4 } from "uuid";
import { syncEngine } from "@/lib/sync-engine";
import { useEffect } from "react";
import { useVideoMetadata } from "./useVideoMetadata";

export function useNotes(videoId: string | null) {
  const queryClient = useQueryClient();
  const { refreshMetadata } = useVideoMetadata(videoId);

  // Subscribe to sync events
  useEffect(() => {
    if (!videoId) return;

    console.log("[VideoNotes] Subscribing to sync events for video:", videoId);
    const unsubscribe = syncEngine.subscribe((event) => {
      if (event.type === "REFRESH_NOTES" && event.videoId === videoId) {
        console.log(
          "[VideoNotes] Received remote sync event for notes",
          videoId
        );
        queryClient.invalidateQueries({ queryKey: ["notes", videoId] });
        queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      }
    });

    return unsubscribe;
  }, [videoId]);

  // Fetch all notes for the current video
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", videoId],
    queryFn: async () => {
      if (!videoId) return [];
      const result = await dbProxy.notes.get(videoId);
      return result.sort(
        (a: any, b: any) => b.last_modified_at - a.last_modified_at
      );
    },
    enabled: !!videoId,
  });

  // Create or Update Note
  const saveNoteMutation = useMutation({
    mutationFn: async (noteData: Partial<Note>) => {
      if (!videoId) throw new Error("No video ID");

      const now = Date.now();
      const note: Note = {
        ...noteData,
        id: noteData.id || uuidv4(),
        video_id: videoId,
        content: noteData.content || {},
        timestamp: noteData.timestamp,
        created_at: noteData.created_at || now,
        last_modified_at: now,
        profile_type: "local",
        is_dirty: true, // Keep for types/schema, ignored by V1 hard delete
        is_deleted: false, // Keep for types/schema, ignored by V1 hard delete
      };

      // Ensure metadata is captured right now
      await refreshMetadata();

      await dbProxy.notes.save(note);
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      // Broadcast change to other tabs
      if (videoId) {
        syncEngine.broadcast({ type: "REFRESH_NOTES", videoId });
      }
    },
  });

  // Delete Note (Soft Delete)
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await dbProxy.notes.delete(noteId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
      queryClient.invalidateQueries({ queryKey: ["videos"] });
      // Broadcast change to other tabs
      if (videoId) {
        syncEngine.broadcast({ type: "REFRESH_NOTES", videoId });
      }
    },
  });

  return {
    notes,
    isLoading,
    saveNote: saveNoteMutation.mutateAsync,
    isSaving: saveNoteMutation.isPending,
    deleteNote: deleteNoteMutation.mutateAsync,
  };
}
