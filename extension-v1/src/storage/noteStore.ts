import { create } from "zustand";
import { Note } from "@/types/schema";

interface NoteState {
  // Currently active video notes
  notes: Note[];
  setNotes: (notes: Note[]) => void;

  // Current note being edited (if any)
  activeNoteId: string | null;
  setActiveNoteId: (id: string | null) => void;

  // Ephemeral content for sync between sidebar/floating
  currentEditorContent: any;
  setCurrentEditorContent: (content: any) => void;

  // Timestamp for the note currently being edited or drafted
  activeNoteTimestamp: number | null;
  setActiveNoteTimestamp: (time: number | null) => void;
}

export const useNoteStore = create<NoteState>((set) => ({
  notes: [],
  setNotes: (notes) => set({ notes }),

  activeNoteId: null,
  setActiveNoteId: (id) => set({ activeNoteId: id }),

  currentEditorContent: null,
  setCurrentEditorContent: (currentEditorContent) =>
    set({ currentEditorContent }),

  activeNoteTimestamp: null,
  setActiveNoteTimestamp: (activeNoteTimestamp) => set({ activeNoteTimestamp }),
}));
