import { db } from "./db";
import { browser } from "wxt/browser";
import { messages } from "@/entrypoints/background";
// Note: We can't import messages from entrypoint in some builds, so we might need to move constants to specific file.
// For now, let's redefine constants here or create a shared constants file.
// Actually, let's create a `lib/rpc.ts` to be safe and clean.

// But to save steps, I will implement a check.
// If we are in the Content Script context, we MUST use sendMessage.
// If we are in the Popup/Background context, we CAN use db directly (optional, but consistent to always use rpc? No, direct is faster).

// Actually, WXT builds separate bundles. Content script cannot import `db` directly if `db` uses Dexie which relies on IndexedDB.
// If code uses `db` in Content Script, it uses `youtube.com` IDB.
// So we need a "Repository" pattern that switches implementation.

export const MSG = {
  GET_NOTES: "GET_NOTES",
  SAVE_NOTE: "SAVE_NOTE",
  DELETE_NOTE: "DELETE_NOTE",
  GET_ALL_NOTES: "GET_ALL_NOTES",
  GET_BOOKMARKS: "GET_BOOKMARKS",
  SAVE_BOOKMARK: "SAVE_BOOKMARK",
  DELETE_BOOKMARK: "DELETE_BOOKMARK",
  GET_ALL_BOOKMARKS: "GET_ALL_BOOKMARKS",
  SAVE_VIDEO_METADATA: "SAVE_VIDEO_METADATA",
  GET_ALL_VIDEOS: "GET_ALL_VIDEOS",
};

// Check if we are in a content script environment
// browser.runtime.id is available in both, but window location might differ.
const isContentScript =
  typeof window !== "undefined" && window.location.protocol.startsWith("http");

export const dbProxy = {
  notes: {
    async get(videoId: string) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.GET_NOTES,
          payload: { videoId },
        });
      }
      return await db.notes
        .where("video_id")
        .equals(videoId)
        .filter((n) => !n.is_deleted)
        .toArray();
    },
    async getAll() {
      if (isContentScript) {
        return await browser.runtime.sendMessage({ type: MSG.GET_ALL_NOTES });
      }
      return await db.notes.filter((n) => !n.is_deleted).toArray();
    },
    async save(note: any) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.SAVE_NOTE,
          payload: { note },
        });
      }
      return await db.notes.put(note);
    },
    async delete(noteId: string) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.DELETE_NOTE,
          payload: { noteId },
        });
      }
      // Soft delete
      return await db.notes.update(noteId, {
        is_deleted: true,
        is_dirty: true,
        last_modified_at: Date.now(),
      });
    },
  },
  bookmarks: {
    async get(videoId: string) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.GET_BOOKMARKS,
          payload: { videoId },
        });
      }
      return await db.bookmarks.where("videoId").equals(videoId).toArray();
    },
    async getAll() {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.GET_ALL_BOOKMARKS,
        });
      }
      return await db.bookmarks.toArray();
    },
    async save(bookmark: any) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.SAVE_BOOKMARK,
          payload: { bookmark },
        });
      }
      return await db.bookmarks.put(bookmark);
    },
    async delete(videoId: string) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.DELETE_BOOKMARK,
          payload: { videoId },
        });
      }
      return await db.bookmarks.delete(videoId);
    },
  },
  videos: {
    async getAll() {
      if (isContentScript) {
        return await browser.runtime.sendMessage({ type: MSG.GET_ALL_VIDEOS });
      }
      return await db.videos.toArray();
    },
    async save(video: any) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.SAVE_VIDEO_METADATA,
          payload: { video },
        });
      }
      return await db.videos.put(video);
    },
  },
};
