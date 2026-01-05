import Dexie, { type EntityTable } from "dexie";
import type { StorageAdapter, Note, VideoRecord } from "./types";

// Dexie Database Definition
const db = new Dexie("VideoNotesDB") as Dexie & {
  notes: EntityTable<Note, "id">;
  videos: EntityTable<VideoRecord, "videoId">;
};

// Schema Definition
db.version(1).stores({
  notes: "id, videoId, timestamp, updatedAt", // Indexes
  videos: "videoId, lastVisitedAt",
});

// Helper to detect if we are in the background script
const isBackground = typeof window === "undefined";

export class DexieStorageAdapter implements StorageAdapter {
  private async callBackground(method: string, ...args: any[]): Promise<any> {
    if (isBackground) {
      // In background: Call directly on this instance
      // Note: We use type casting because we know the methods exist
      return (this as any)[`_${method}`](...args);
    } else {
      // In content/popup: Send message to background
      return browser.runtime.sendMessage({
        type: "DB_CALL",
        method,
        args,
      });
    }
  }

  // Wrapper methods that route to proxy or internal implementation
  async saveNote(note: Note): Promise<void> {
    return this.callBackground("saveNote", note);
  }

  async getNotes(videoId: string): Promise<Note[]> {
    return this.callBackground("getNotes", videoId);
  }

  async deleteNote(id: string): Promise<void> {
    return this.callBackground("deleteNote", id);
  }

  async getVideo(videoId: string): Promise<VideoRecord | undefined> {
    return this.callBackground("getVideo", videoId);
  }

  async saveVideo(record: VideoRecord): Promise<void> {
    return this.callBackground("saveVideo", record);
  }

  async setBookmark(videoId: string, timestamp: number | null): Promise<void> {
    return this.callBackground("setBookmark", videoId, timestamp);
  }

  async toggleDistraction(videoId: string, enabled: boolean): Promise<void> {
    return this.callBackground("toggleDistraction", videoId, enabled);
  }

  async getAllNotes(): Promise<Note[]> {
    return this.callBackground("getAllNotes");
  }

  async getAllVideos(): Promise<VideoRecord[]> {
    return this.callBackground("getAllVideos");
  }

  // Internal implementations (prefixed with _) that DO the work in background
  private async _saveNote(note: Note): Promise<void> {
    await db.notes.put(note);
    // Background sync trigger is handled separately in background.ts listeners
  }

  private async _getNotes(videoId: string): Promise<Note[]> {
    return await db.notes.where("videoId").equals(videoId).sortBy("timestamp");
  }

  private async _deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  }

  private async _getVideo(videoId: string): Promise<VideoRecord | undefined> {
    return await db.videos.get(videoId);
  }

  private async _saveVideo(record: VideoRecord): Promise<void> {
    await db.videos.put(record);
  }

  private async _setBookmark(
    videoId: string,
    timestamp: number | null
  ): Promise<void> {
    const video = await this._getVideo(videoId);
    const updated = {
      videoId,
      lastVisitedAt: Date.now(),
      ...video,
      bookmarkTimestamp: timestamp,
    };
    await this._saveVideo(updated as VideoRecord);
  }

  private async _toggleDistraction(
    videoId: string,
    enabled: boolean
  ): Promise<void> {
    const video = await this._getVideo(videoId);
    const updated = {
      videoId,
      lastVisitedAt: Date.now(),
      ...video,
      hideRecommendations: enabled,
    };
    await this._saveVideo(updated as VideoRecord);
  }

  private async _getAllNotes(): Promise<Note[]> {
    return await db.notes.toArray();
  }

  private async _getAllVideos(): Promise<
    (VideoRecord & { _count?: { notes: number } })[]
  > {
    const videos = await db.videos.toArray();
    const result = await Promise.all(
      videos.map(async (v) => {
        const notesCount = await db.notes
          .where("videoId")
          .equals(v.videoId)
          .count();
        return {
          ...v,
          _count: { notes: notesCount },
        };
      })
    );
    return result;
  }
}

export const localStore = new DexieStorageAdapter();
