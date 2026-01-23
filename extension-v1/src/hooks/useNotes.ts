import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dbProxy } from "@/lib/db-proxy";
import { Note } from "@/types/schema";
import { v4 as uuidv4 } from "uuid";

export function useNotes(videoId: string | null) {
  const queryClient = useQueryClient();

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
        is_dirty: true,
        is_deleted: false,
      };

      await dbProxy.notes.save(note);
      return note;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notes", videoId] });
      queryClient.invalidateQueries({ queryKey: ["all-notes"] });
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
