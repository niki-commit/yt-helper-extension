import { z } from "zod";

export const ProfileType = z.enum(["local", "notion", "cloud"]);
export type ProfileType = z.infer<typeof ProfileType>;

export const NoteSchema = z.object({
  id: z.uuid().optional(),
  video_id: z.string(),
  // For Tiptap JSON content, we use z.any() for now as it's a complex nested object
  content: z.any(),
  timestamp: z.number().optional(), // In seconds
  created_at: z.number(), // Unix timestamp (ms)
  last_modified_at: z.number(), // Unix timestamp (ms)
  account_id: z.string().optional(), // For cloud sync
  profile_type: ProfileType.default("local"),
  folder_id: z.string().optional(),
  is_dirty: z.boolean().default(false),
  is_deleted: z.boolean().default(false),
});

export type Note = z.infer<typeof NoteSchema>;

export const VideoMetadataSchema = z.object({
  id: z.string(), // YouTube video ID
  title: z.string(),
  channel_title: z.string(),
  thumbnail_url: z.string().optional(),
  duration: z.string().optional(),
  last_opened_at: z.number(), // Unix timestamp (ms)
});

export type VideoMetadata = z.infer<typeof VideoMetadataSchema>;

export const FolderSchema = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  account_id: z.string().optional(),
  parent_id: z.string().optional(),
  created_at: z.number(),
});

export type Folder = z.infer<typeof FolderSchema>;

export const SettingsSchema = z.object({
  active_profile: ProfileType.default("local"),
  api_keys: z.record(z.string(), z.string()).optional(),
  theme: z.enum(["light", "dark", "system"]).default("system"),
  hideRecommendations: z.boolean().default(false),
  hideComments: z.boolean().default(false),
  autoPauseEnabled: z.boolean().default(true),
  autoResumeEnabled: z.boolean().default(true),
});

export type Settings = z.infer<typeof SettingsSchema>;

export const BookmarkSchema = z.object({
  videoId: z.string(), // YouTube video ID (unique per bookmark record)
  timestamp: z.number(), // In seconds
  createdAt: z.number(), // Unix timestamp (ms)
});

export type Bookmark = z.infer<typeof BookmarkSchema>;
