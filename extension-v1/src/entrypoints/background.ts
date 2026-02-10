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
  SYNC_EVENT: "SYNC_EVENT",
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
                // .filter((n) => !n.is_deleted)
                .toArray();

            case messages.SAVE_NOTE:
              await db.notes.put(message.payload.note);
              return { success: true };

            case messages.DELETE_NOTE: {
              // Get videoId before delete for cleanup
              const note = await db.notes.get(message.payload.noteId);
              const videoId = note?.video_id;

              /* SOFT DELETE (V2)
              await db.notes.update(message.payload.noteId, {
                is_deleted: true,
                is_dirty: true,
                last_modified_at: Date.now(),
              });
              */
              // HARD DELETE (V1)
              await db.notes.delete(message.payload.noteId);

              // Cleanup Orphan Metadata
              if (videoId) {
                const countNotes = await db.notes
                  .where("video_id")
                  .equals(videoId)
                  .count();
                const countBookmarks = await db.bookmarks
                  .where("videoId")
                  .equals(videoId)
                  .count();
                if (countNotes === 0 && countBookmarks === 0) {
                  await db.videos.delete(videoId);
                }
              }
              return { success: true };
            }

            case messages.GET_ALL_NOTES:
              // return await db.notes.filter((n) => !n.is_deleted).toArray();
              return await db.notes.toArray();

            // --- BOOKMARKS ---
            case messages.GET_BOOKMARKS:
              // Return bookmarks for a specific video (filter deleted)
              return await db.bookmarks
                .where("videoId")
                .equals(message.payload.videoId)
                // .filter((b) => !b.isDeleted)
                .toArray();

            case messages.SAVE_BOOKMARK:
              await db.bookmarks.put(message.payload.bookmark);
              return { success: true };

            case messages.DELETE_BOOKMARK: {
              const videoId = message.payload.videoId;
              /* SOFT DELETE (V2)
              await db.bookmarks.update(videoId, {
                isDeleted: true,
                isDirty: true,
                lastModifiedAt: Date.now(),
              });
              */
              // 1. HARD DELETE (V1)
              await db.bookmarks.delete(videoId);

              // 2. Cleanup Orphan Metadata
              const countNotes = await db.notes
                .where("video_id")
                .equals(videoId)
                .count();
              if (countNotes === 0) {
                await db.videos.delete(videoId);
              }
              return { success: true };
            }

            case messages.GET_ALL_BOOKMARKS:
              // return await db.bookmarks.filter((b) => !b.isDeleted).toArray();
              return await db.bookmarks.toArray();

            // --- VIDEO METADATA ---
            case messages.SAVE_VIDEO_METADATA:
              await db.videos.put(message.payload.video);
              return { success: true };

            case messages.GET_ALL_VIDEOS:
              return await db.videos.toArray();

            case messages.SYNC_EVENT:
              console.log("[VideoNotes] Relaying sync event:", message.payload);
              // 1. Relay to all tabs (for Content Scripts)
              browser.tabs.query({}).then((tabs) => {
                tabs.forEach((tab) => {
                  if (tab.id) {
                    browser.tabs.sendMessage(tab.id, message).catch(() => {
                      // Ignore errors for tabs where content script isn't loaded
                    });
                  }
                });
              });
              // 2. Relay via runtime (for other extension pages like Popup/Dashboard)
              // Note: sendMessage from background reaches all extension page listeners
              // but we don't need a response here.
              return { success: true };

            default:
              return { error: "Unknown message type" };
          }
        } catch (err: any) {
          console.error("[VideoNotes] Background DB Error:", err);
          return { error: err.message };
        }
      };

      // Special case: SYNC_EVENT doesn't need to await DB results usually,
      // but we follow the same pattern for consistency unless performance becomes an issue.
      handleAsync().then(sendResponse);
      return true;
    }
  );
});
