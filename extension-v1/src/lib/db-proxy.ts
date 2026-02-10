import { db } from "./db";
import { browser } from "wxt/browser";
import { messages } from "@/entrypoints/background";

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
        // .filter((n) => !n.is_deleted)
        .toArray();
    },
    async getAll() {
      if (isContentScript) {
        return await browser.runtime.sendMessage({ type: MSG.GET_ALL_NOTES });
      }
      // return await db.notes.filter((n) => !n.is_deleted).toArray();
      return await db.notes.toArray();
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

      // 1. Get the video_id before deleting so we can check for orphans later
      const note = await db.notes.get(noteId);
      const videoId = note?.video_id;

      /* SOFT DELETE (V2 Cloud Sync Ready)
      return await db.notes.update(noteId, {
        is_deleted: true,
        is_dirty: true,
        last_modified_at: Date.now(),
      });
      */

      // 2. HARD DELETE (V1 Clean Implementation)
      await db.notes.delete(noteId);

      // 3. Cleanup Orphan Video Metadata
      if (videoId) {
        const remainingNotes = await db.notes
          .where("video_id")
          .equals(videoId)
          .count();
        const remainingBookmarks = await db.bookmarks
          .where("videoId")
          .equals(videoId)
          .count();

        if (remainingNotes === 0 && remainingBookmarks === 0) {
          console.log(
            `[VideoNotes] No remaining content for ${videoId}. Purging metadata.`
          );
          await db.videos.delete(videoId);
        }
      }
      return { success: true };
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
      const bookmark = await db.bookmarks.get(videoId);
      // if (bookmark && !bookmark.isDeleted) return bookmark;
      if (bookmark) return [bookmark]; // Keep array return for compatibility with current hook usage [0]
      return [];
    },
    async getAll() {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.GET_ALL_BOOKMARKS,
        });
      }
      // return await db.bookmarks.filter((b) => !b.isDeleted).toArray();
      return await db.bookmarks.toArray();
    },
    async save(bookmark: any) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.SAVE_BOOKMARK,
          payload: { bookmark },
        });
      }
      const now = Date.now();
      const bookmarkWithSync = {
        ...bookmark,
        lastModifiedAt: now,
        isDirty: true,
        isDeleted: false,
      };
      return await db.bookmarks.put(bookmarkWithSync);
    },
    async delete(videoId: string) {
      if (isContentScript) {
        return await browser.runtime.sendMessage({
          type: MSG.DELETE_BOOKMARK,
          payload: { videoId },
        });
      }
      /* SOFT DELETE (V2 Cloud Sync Ready)
      return await db.bookmarks.update(videoId, {
        isDeleted: true,
        isDirty: true,
        lastModifiedAt: Date.now(),
      });
      */
      // 1. HARD DELETE (V1 Clean Implementation)
      await db.bookmarks.delete(videoId);

      // 2. Cleanup Orphan Video Metadata
      const remainingNotes = await db.notes
        .where("video_id")
        .equals(videoId)
        .count();

      if (remainingNotes === 0) {
        console.log(
          `[VideoNotes] No remaining content for ${videoId}. Purging metadata.`
        );
        await db.videos.delete(videoId);
      }
      return { success: true };
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
