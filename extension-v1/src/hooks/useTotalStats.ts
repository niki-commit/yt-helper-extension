import { useLiveQuery } from "dexie-react-hooks";
import { db } from "@/lib/db";

export function useTotalStats() {
  const totalNotes = useLiveQuery(() => db.notes.count()) ?? 0;
  const totalBookmarks = useLiveQuery(() => db.bookmarks.count()) ?? 0;

  return {
    totalNotes,
    totalBookmarks,
    isLoading: totalNotes === undefined || totalBookmarks === undefined,
  };
}
