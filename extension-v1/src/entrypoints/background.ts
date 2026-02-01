import { db } from "@/lib/db";
import { Note, Folder, VideoMetadata, Bookmark } from "@/types/schema";

export const messages = {
  // NOTES
  GET_NOTES: "GET_NOTES",
  SAVE_NOTE: "SAVE_NOTE",
  DELETE_NOTE: "DELETE_NOTE",
  GET_ALL_NOTES: "GET_ALL_NOTES",

  // BOOKMARKS
  GET_BOOKMARKS: "GET_BOOKMARKS",
  SAVE_BOOKMARK: "SAVE_BOOKMARK",
  DELETE_BOOKMARK: "DELETE_BOOKMARK",
  GET_ALL_BOOKMARKS: "GET_ALL_BOOKMARKS",

  // VIDEOS
  SAVE_VIDEO_METADATA: "SAVE_VIDEO_METADATA",
  GET_ALL_VIDEOS: "GET_ALL_VIDEOS",
};

export default defineBackground(() => {
  console.log("[VideoNotes] Background Service Worker Initialized");

  // Message Handler
  browser.runtime.onMessage.addListener(
    (message: any, sender, sendResponse) => {
      // Helper to handle async dexie operations
      const handleAsync = async () => {
        try {
          switch (message.type) {
            // --- NOTES ---
            case messages.GET_NOTES:
              return await db.notes
                .where("video_id")
                .equals(message.payload.videoId)
                .filter((n) => !n.is_deleted)
                .toArray();

            case messages.SAVE_NOTE:
              await db.notes.put(message.payload.note);
              return { success: true };

            case messages.DELETE_NOTE:
              // Soft delete
              await db.notes.update(message.payload.noteId, {
                is_deleted: true,
                is_dirty: true,
                last_modified_at: Date.now(),
              });
              return { success: true };

            case messages.GET_ALL_NOTES:
              return await db.notes.filter((n) => !n.is_deleted).toArray();

            // --- BOOKMARKS ---
            case messages.GET_BOOKMARKS:
              // Return bookmarks for a specific video (filter deleted)
              return await db.bookmarks
                .where("videoId")
                .equals(message.payload.videoId)
                .filter((b) => !b.isDeleted)
                .toArray();

            case messages.SAVE_BOOKMARK:
              await db.bookmarks.put(message.payload.bookmark);
              return { success: true };

            case messages.DELETE_BOOKMARK:
              // Soft delete
              await db.bookmarks.update(message.payload.videoId, {
                isDeleted: true,
                isDirty: true,
                lastModifiedAt: Date.now(),
              });
              return { success: true };

            case messages.GET_ALL_BOOKMARKS:
              return await db.bookmarks.filter((b) => !b.isDeleted).toArray();

            // --- VIDEO METADATA ---
            case messages.SAVE_VIDEO_METADATA:
              await db.videos.put(message.payload.video);
              return { success: true };

            case messages.GET_ALL_VIDEOS:
              return await db.videos.toArray();

            default:
              return { error: "Unknown message type" };
          }
        } catch (err: any) {
          console.error("[VideoNotes] Background DB Error:", err);
          return { error: err.message };
        }
      };

      // Return true to indicate we will send a response asynchronously
      handleAsync().then(sendResponse);
      return true;
    }
  );
});
