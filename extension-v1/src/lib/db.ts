import Dexie, { type Table } from "dexie";
import { Note, VideoMetadata, Folder, Bookmark } from "@/types/schema";

export class VideoNotesDB extends Dexie {
  notes!: Table<Note>;
  videos!: Table<VideoMetadata>;
  folders!: Table<Folder>;
  settings!: Table<{ id: string; value: any }>;
  bookmarks!: Table<Bookmark>;

  constructor() {
    super("VideoNotesDB");

    this.version(4).stores({
      // Primary keys and indexes
      notes: "id, video_id, folder_id, last_modified_at, is_dirty, is_deleted",
      videos: "id, last_opened_at",
      folders: "id, parent_id",
      settings: "id",
      bookmarks: "videoId",
    });
  }
}

export const db = new VideoNotesDB();

// Explicitly open the database and catch failures
db.open().catch(async (err) => {
  console.error("[VideoNotes DB] Failed to open database:", err);

  // Critical Reset: Only wipe and start over for Version or Schema mismatches
  if (err.name === "VersionError" || err.name === "SchemaError") {
    console.warn(
      "[VideoNotes DB] Schema mismatch detected. Wiping database for fresh start..."
    );
    try {
      await Dexie.delete("VideoNotesDB");
      window.location.reload();
    } catch (deleteErr) {
      console.error("[VideoNotes DB] Failed to delete database:", deleteErr);
    }
  }
});
