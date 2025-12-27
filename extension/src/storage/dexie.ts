import Dexie, { type EntityTable } from 'dexie';
import type { StorageAdapter, Note, VideoRecord } from './types';

// Dexie Database Definition
const db = new Dexie('VideoNotesDB') as Dexie & {
  notes: EntityTable<Note, 'id'>,
  videos: EntityTable<VideoRecord, 'videoId'>
};

// Schema Definition
db.version(1).stores({
  notes: 'id, videoId, timestamp, updatedAt', // Indexes
  videos: 'videoId, lastVisitedAt'
});

export class DexieStorageAdapter implements StorageAdapter {
  
  async saveNote(note: Note): Promise<void> {
    await db.notes.put(note);
  }

  async getNotes(videoId: string): Promise<Note[]> {
    return await db.notes
      .where('videoId')
      .equals(videoId)
      .sortBy('timestamp');
  }

  async deleteNote(id: string): Promise<void> {
    await db.notes.delete(id);
  }

  async getVideo(videoId: string): Promise<VideoRecord | undefined> {
    return await db.videos.get(videoId);
  }

  async saveVideo(record: VideoRecord): Promise<void> {
    await db.videos.put(record);
  }

  async setBookmark(videoId: string, timestamp: number | null): Promise<void> {
    const video = await this.getVideo(videoId);
    const updated = {
      videoId,
      lastVisitedAt: Date.now(),
      ...video, // keep existing settings
      bookmarkTimestamp: timestamp
    };
    await this.saveVideo(updated as VideoRecord);
  }

  async toggleDistraction(videoId: string, enabled: boolean): Promise<void> {
    const video = await this.getVideo(videoId);
    const updated = {
        videoId,
        lastVisitedAt: Date.now(),
        ...video,
        hideRecommendations: enabled
    };
    await this.saveVideo(updated as VideoRecord);
  }

  async getAllNotes(): Promise<Note[]> {
    return await db.notes.toArray();
  }

  async getAllVideos(): Promise<VideoRecord[]> {
    return await db.videos.toArray();
  }
}

export const localStore = new DexieStorageAdapter();
