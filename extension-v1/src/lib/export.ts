import { Note, Bookmark, VideoMetadata } from "@/types/schema";
import JSZip from "jszip";

/**
 * Extracts plain text from Tiptap JSON content
 */
function extractTextFromTiptapContent(content: any): string {
  if (!content) return "";

  if (typeof content === "string") {
    try {
      content = JSON.parse(content);
    } catch {
      return content;
    }
  }

  let text = "";

  function traverse(node: any) {
    if (node.type === "text") {
      text += node.text || "";
    }
    if (node.content && Array.isArray(node.content)) {
      node.content.forEach(traverse);
    }
  }

  traverse(content);
  return text.trim();
}

/**
 * Formats seconds to MM:SS timestamp
 */
function formatTimestamp(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/**
 * Exports notes and bookmarks for a single video as Markdown
 */
export function exportNotesAsMarkdown(
  notes: Note[],
  bookmarks: Bookmark[],
  videoTitle: string,
  videoId: string
): string {
  let markdown = `# ${videoTitle}\n\n`;
  markdown += `**Video ID:** ${videoId}\n`;
  markdown += `**Exported:** ${new Date().toLocaleDateString()}\n\n`;
  markdown += `---\n\n`;

  // Add Notes section
  if (notes.length > 0) {
    markdown += `## Notes\n\n`;

    notes.forEach((note, index) => {
      const content = extractTextFromTiptapContent(note.content);
      const timestamp =
        note.timestamp !== undefined
          ? `[${formatTimestamp(note.timestamp)}]`
          : "";

      markdown += `### Note ${index + 1} ${timestamp}\n\n`;
      markdown += `${content}\n\n`;
    });
  }

  // Add Bookmarks section
  if (bookmarks.length > 0) {
    markdown += `## Bookmarks\n\n`;

    bookmarks.forEach((bookmark) => {
      const timestamp = formatTimestamp(bookmark.timestamp);
      const youtubeLink = `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(bookmark.timestamp)}s`;
      markdown += `- [${timestamp}](${youtubeLink})\n`;
    });

    markdown += `\n`;
  }

  return markdown;
}

/**
 * Exports all data (notes, bookmarks, videos) as JSON
 */
export function exportAllDataAsJson(
  notes: Note[],
  bookmarks: Bookmark[],
  videos: VideoMetadata[]
): string {
  const data = {
    exportedAt: new Date().toISOString(),
    version: "1.0",
    notes,
    bookmarks,
    videos,
  };

  return JSON.stringify(data, null, 2);
}

/**
 * Exports all notes as individual Markdown files in a ZIP archive
 */
export async function exportAllNotesAsZip(
  notes: Note[],
  bookmarks: Bookmark[],
  videos: VideoMetadata[]
): Promise<Blob> {
  const zip = new JSZip();

  // Group notes by video
  const notesByVideo = new Map<string, Note[]>();
  notes.forEach((note) => {
    if (!notesByVideo.has(note.video_id)) {
      notesByVideo.set(note.video_id, []);
    }
    notesByVideo.get(note.video_id)!.push(note);
  });

  // Group bookmarks by video
  const bookmarksByVideo = new Map<string, Bookmark[]>();
  bookmarks.forEach((bookmark) => {
    if (!bookmarksByVideo.has(bookmark.videoId)) {
      bookmarksByVideo.set(bookmark.videoId, []);
    }
    bookmarksByVideo.get(bookmark.videoId)!.push(bookmark);
  });

  // Collect all unique video IDs
  const allVideoIds = new Set<string>([
    ...notesByVideo.keys(),
    ...bookmarksByVideo.keys(),
  ]);

  // Create a Markdown file for each video ID
  const videosMap = new Map(videos.map((v) => [v.id, v]));

  for (const videoId of allVideoIds) {
    const videoNotes = notesByVideo.get(videoId) || [];
    const videoBookmarks = bookmarksByVideo.get(videoId) || [];
    const videoMetadata = videosMap.get(videoId);

    // Determine filename
    let title = videoMetadata?.title || `Video ${videoId}`;
    let filename = title.replace(/[<>:"/\\|?*]/g, "-").substring(0, 100);

    // Ensure uniqueness in case of duplicate titles or "Video [ID]" collisions
    // (Simple append could be added if needed, but keeping it simple for now)

    const markdown = exportNotesAsMarkdown(
      videoNotes,
      videoBookmarks,
      title,
      videoId
    );

    zip.file(`${filename}.md`, markdown);
  }

  return await zip.generateAsync({ type: "blob" });
}

/**
 * Triggers a browser download for the given content
 */
export function downloadFile(
  content: Blob | string,
  filename: string,
  type: "text/markdown" | "application/json" | "application/zip"
): void {
  const blob =
    content instanceof Blob ? content : new Blob([content], { type });

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
