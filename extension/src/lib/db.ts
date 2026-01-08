import Dexie, { type EntityTable } from "dexie";

// Local types matching our Prisma schema structure
export interface LocalNote {
  id: string;
  accountId: string;
  content: string;
  approxSizeBytes?: number;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  // Sync tracking
  syncedAt?: Date;
  isDirty: boolean; // Has local changes not yet synced
}

export interface LocalAttachment {
  id: string;
  noteId: string;
  accountId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  storageKey: string;
  createdAt: Date;
  // Sync tracking
  syncedAt?: Date;
  isDirty: boolean;
}

export interface LocalAccount {
  id: string;
  planId: string;
  displayName?: string;
  quotaBytes: number;
  storageUsedBytes: number;
  lastSyncedAt?: Date;
}

// Initialize Dexie database
const db = new Dexie("yt-helper-db") as Dexie & {
  notes: EntityTable<LocalNote, "id">;
  attachments: EntityTable<LocalAttachment, "id">;
  accounts: EntityTable<LocalAccount, "id">;
};

// Schema definition
db.version(1).stores({
  notes: "id, accountId, createdAt, updatedAt, isDirty",
  attachments: "id, noteId, accountId, isDirty",
  accounts: "id",
});

export { db };
