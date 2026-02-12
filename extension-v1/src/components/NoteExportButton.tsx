import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { dbProxy } from "@/lib/db-proxy";
import { exportNotesAsMarkdown, downloadFile } from "@/lib/export";
import { toast } from "sonner";
import { Note, Bookmark } from "@/types/schema";

interface NoteExportButtonProps {
  videoId: string;
  videoTitle: string;
  variant?: "default" | "ghost" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
}

export function NoteExportButton({
  videoId,
  videoTitle,
  variant = "ghost",
  size = "sm",
  className,
}: NoteExportButtonProps) {
  const handleExport = async () => {
    try {
      // Fetch notes and bookmarks for this video
      const notes = (await dbProxy.notes.get(videoId)) as Note[];
      const bookmarks = (await dbProxy.bookmarks.get(videoId)) as Bookmark[];

      if (notes.length === 0 && bookmarks.length === 0) {
        toast.error("No notes or bookmarks to export for this video");
        return;
      }

      // Generate Markdown
      const markdown = exportNotesAsMarkdown(
        notes,
        bookmarks,
        videoTitle,
        videoId
      );

      // Sanitize filename
      const safeFilename = videoTitle
        .replace(/[<>:"/\\|?*]/g, "-")
        .substring(0, 100);

      // Download file
      downloadFile(markdown, `${safeFilename}.md`, "text/markdown");

      toast.success("Notes exported successfully!");
    } catch (error) {
      console.error("Export error:", error);
      toast.error("Failed to export notes");
    }
  };

  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleExport}
      className={className}
    >
      <Download className="size-4" />
      <span className="ml-2">Download</span>
    </Button>
  );
}
