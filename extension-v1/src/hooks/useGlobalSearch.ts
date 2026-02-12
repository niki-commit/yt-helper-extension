import { useQuery } from "@tanstack/react-query";
import { useState, useEffect, useMemo } from "react";
import { dbProxy } from "@/lib/db-proxy";
import type { Note, VideoMetadata, Bookmark } from "@/types/schema";

export type SearchResultType = "note" | "video" | "bookmark";

export interface SearchResult {
  type: SearchResultType;
  id: string;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  thumbnailUrl?: string;
  // For notes
  noteContent?: string;
  noteSnippet?: string;
  timestamp?: number;
  // For bookmarks
  bookmarkTimestamp?: number;
}

/**
 * Global Search Hook
 * Searches across Notes (content), Videos (metadata), and Bookmarks (via video metadata)
 * with debouncing to prevent excessive DB queries.
 */
export function useGlobalSearch(query: string, debounceMs: number = 300) {
  const [debouncedQuery, setDebouncedQuery] = useState(query);

  // Debounce the search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query);
    }, debounceMs);

    return () => clearTimeout(timer);
  }, [query, debounceMs]);

  const searchQuery = useQuery({
    queryKey: ["global-search", debouncedQuery],
    queryFn: async (): Promise<SearchResult[]> => {
      if (!debouncedQuery || debouncedQuery.trim().length === 0) {
        return [];
      }

      const searchTerm = debouncedQuery.toLowerCase().trim();
      const results: SearchResult[] = [];

      // 1. Search Videos (by title and channel)
      const allVideos = await dbProxy.videos.getAll();
      const matchingVideos = allVideos.filter(
        (video: VideoMetadata) =>
          video.title.toLowerCase().includes(searchTerm) ||
          video.channel_title.toLowerCase().includes(searchTerm)
      );

      const matchingVideoIds = new Set(
        matchingVideos.map((v: VideoMetadata) => v.id)
      );

      // Add video results
      for (const video of matchingVideos) {
        results.push({
          type: "video",
          id: video.id,
          videoId: video.id,
          videoTitle: video.title,
          channelTitle: video.channel_title,
          thumbnailUrl: video.thumbnail_url,
        });
      }

      // 2. Search Notes (by content and also include notes from matching videos)
      const allNotes = await dbProxy.notes.getAll();
      const matchingNotes = allNotes.filter((note: Note) => {
        // Check if note belongs to a matching video
        if (matchingVideoIds.has(note.video_id)) {
          return true;
        }

        // Check if note content contains the search term
        try {
          const contentText = extractTextFromTiptapContent(note.content);
          return contentText.toLowerCase().includes(searchTerm);
        } catch {
          return false;
        }
      });

      // Get video metadata for matching notes
      const noteVideoIds = [
        ...new Set(matchingNotes.map((n: Note) => n.video_id)),
      ];
      // Filter from already-fetched videos instead of calling get()
      const videoMap = new Map<string, VideoMetadata>();
      allVideos.forEach((video: VideoMetadata) => {
        if (noteVideoIds.includes(video.id)) {
          videoMap.set(video.id, video);
        }
      });

      // Add note results
      for (const note of matchingNotes) {
        const video = videoMap.get(note.video_id);
        if (!video) continue;

        const contentText = extractTextFromTiptapContent(note.content);
        const snippet = generateSnippet(contentText, searchTerm);

        results.push({
          type: "note",
          id: note.id!,
          videoId: note.video_id,
          videoTitle: video.title,
          channelTitle: video.channel_title,
          thumbnailUrl: video.thumbnail_url,
          noteContent: contentText,
          noteSnippet: snippet,
          timestamp: note.timestamp,
        });
      }

      // 3. Search Bookmarks (via matching videos)
      const allBookmarks = await dbProxy.bookmarks.getAll();
      const matchingBookmarks = allBookmarks.filter((bookmark: Bookmark) =>
        matchingVideoIds.has(bookmark.videoId)
      );

      // Add bookmark results
      for (const bookmark of matchingBookmarks) {
        const video = matchingVideos.find(
          (v: VideoMetadata) => v.id === bookmark.videoId
        );
        if (!video) continue;

        results.push({
          type: "bookmark",
          id: `${bookmark.videoId}-${bookmark.timestamp}`,
          videoId: bookmark.videoId,
          videoTitle: video.title,
          channelTitle: video.channel_title,
          thumbnailUrl: video.thumbnail_url,
          bookmarkTimestamp: bookmark.timestamp,
        });
      }

      return results;
    },
    enabled: debouncedQuery.trim().length > 0,
  });

  // Group results by type for easier rendering
  const groupedResults = useMemo(() => {
    if (!searchQuery.data) {
      return { videos: [], notes: [], bookmarks: [] };
    }

    return {
      videos: searchQuery.data.filter((r) => r.type === "video"),
      notes: searchQuery.data.filter((r) => r.type === "note"),
      bookmarks: searchQuery.data.filter((r) => r.type === "bookmark"),
    };
  }, [searchQuery.data]);

  return {
    results: searchQuery.data || [],
    groupedResults,
    isLoading: searchQuery.isLoading,
    isEmpty: !searchQuery.isLoading && searchQuery.data?.length === 0,
  };
}

/**
 * Extract plain text from Tiptap JSON content
 */
function extractTextFromTiptapContent(content: any): string {
  if (!content) return "";

  // Handle if content is already a string
  if (typeof content === "string") return content;

  // Recursively extract text from Tiptap JSON structure
  const extractText = (node: any): string => {
    if (!node) return "";

    if (node.text) return node.text;

    if (node.content && Array.isArray(node.content)) {
      return node.content.map(extractText).join(" ");
    }

    return "";
  };

  return extractText(content).trim();
}

/**
 * Generate a snippet around the matching search term
 */
function generateSnippet(
  text: string,
  searchTerm: string,
  contextLength: number = 60
): string {
  const lowerText = text.toLowerCase();
  const lowerTerm = searchTerm.toLowerCase();
  const index = lowerText.indexOf(lowerTerm);

  if (index === -1) {
    // If no match found (shouldn't happen), return beginning
    return (
      text.substring(0, contextLength) +
      (text.length > contextLength ? "..." : "")
    );
  }

  // Calculate snippet boundaries
  const start = Math.max(0, index - contextLength / 2);
  const end = Math.min(
    text.length,
    index + searchTerm.length + contextLength / 2
  );

  let snippet = text.substring(start, end);

  // Add ellipsis if needed
  if (start > 0) snippet = "..." + snippet;
  if (end < text.length) snippet = snippet + "...";

  return snippet;
}
