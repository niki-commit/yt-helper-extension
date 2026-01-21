import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { db } from "@/lib/db";
import { Note } from "@/types/schema";
import { v4 as uuidv4 } from "uuid";

export function useNotes(videoId: string | null) {
  const queryClient = useQueryClient();

  // Fetch all notes for the current video
  const { data: notes = [], isLoading } = useQuery({
    queryKey: ["notes", videoId],
    queryFn: async () => {
      if (!videoId) return [];
      return await db.notes
        .where("video_id")
        .equals(videoId)
        .and((n) => !n.is_deleted)
        .reverse()
        .sortBy("last_modified_at");
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
        is_dirty: true,
        is_deleted: false,
      };

      await db.notes.put(note);
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", videoId] });
    },
  });

  // Delete Note (Soft Delete)
  const deleteNoteMutation = useMutation({
    mutationFn: async (noteId: string) => {
      await db.notes.update(noteId, {
        is_deleted: true,
        last_modified_at: Date.now(),
        is_dirty: true,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", videoId] });
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
