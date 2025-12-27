export interface Note {
    id: string; // uuid
    videoId: string;
    timestamp: number; // seconds
    text: string;
    createdAt: number;
    updatedAt: number;
    tags?: string[];
  }
  
  export interface VideoRecord {
    videoId: string;
    bookmarkTimestamp?: number | null; // seconds
    hideRecommendations?: boolean;
    autoPause?: boolean;
    lastVisitedAt: number;
  }
  
  export interface StorageAdapter {
    // Methods return Promises
    saveNote(note: Note): Promise<void>;
    getNotes(videoId: string): Promise<Note[]>;
    deleteNote(id: string): Promise<void>;
    
    getVideo(videoId: string): Promise<VideoRecord | undefined>;
    saveVideo(record: VideoRecord): Promise<void>;
    
    setBookmark(videoId: string, timestamp: number | null): Promise<void>;
    toggleDistraction(videoId: string, enabled: boolean): Promise<void>;
    
    // Sync related
    getAllNotes(): Promise<Note[]>;
    getAllVideos(): Promise<VideoRecord[]>;
  }
