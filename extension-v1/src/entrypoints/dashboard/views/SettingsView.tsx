import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Monitor,
  Download,
  Database,
  FileArchive,
} from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { Button } from "@/components/ui/button";
import { dbProxy } from "@/lib/db-proxy";
import {
  exportAllDataAsJson,
  exportAllNotesAsZip,
  downloadFile,
} from "@/lib/export";
import { toast } from "sonner";
import { Note, Bookmark, VideoMetadata } from "@/types/schema";

export function SettingsView() {
  const { theme, setTheme } = useTheme();

  const handleExportBackup = async () => {
    try {
      toast.loading("Preparing backup...");

      const notes = (await dbProxy.notes.getAll()) as Note[];
      const bookmarks = (await dbProxy.bookmarks.getAll()) as Bookmark[];
      const videos = (await dbProxy.videos.getAll()) as VideoMetadata[];

      const json = exportAllDataAsJson(notes, bookmarks, videos);
      const filename = `videonotes-backup-${new Date().toISOString().split("T")[0]}.json`;

      downloadFile(json, filename, "application/json");

      toast.dismiss();
      toast.success("Backup exported successfully!");
    } catch (error) {
      console.error("Backup export error:", error);
      toast.dismiss();
      toast.error("Failed to export backup");
    }
  };

  const handleExportMarkdownZip = async () => {
    try {
      toast.loading("Preparing Markdown export...");

      const notes = (await dbProxy.notes.getAll()) as Note[];
      const bookmarks = (await dbProxy.bookmarks.getAll()) as Bookmark[];
      const videos = (await dbProxy.videos.getAll()) as VideoMetadata[];

      if (notes.length === 0 && bookmarks.length === 0) {
        toast.dismiss();
        toast.error("No notes or bookmarks to export");
        return;
      }

      const zipBlob = await exportAllNotesAsZip(notes, bookmarks, videos);
      const filename = `videonotes-export-${new Date().toISOString().split("T")[0]}.zip`;

      downloadFile(zipBlob, filename, "application/zip");

      toast.dismiss();
      toast.success("Markdown files exported successfully!");
    } catch (error) {
      console.error("Markdown export error:", error);
      toast.dismiss();
      toast.error("Failed to export Markdown files");
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <SettingsIcon className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>
          <Separator />

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Theme</Label>
                <p className="text-muted-foreground text-sm">
                  Choose your preferred color scheme
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <button
                onClick={() => setTheme("light")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  theme === "light"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Sun className="h-6 w-6" />
                <span className="text-sm font-medium">Light</span>
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  theme === "dark"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Moon className="h-6 w-6" />
                <span className="text-sm font-medium">Dark</span>
              </button>

              <button
                onClick={() => setTheme("system")}
                className={`flex flex-col items-center gap-2 rounded-lg border-2 p-4 transition-colors ${
                  theme === "system"
                    ? "border-primary bg-primary/5"
                    : "border-border hover:border-primary/50"
                }`}
              >
                <Monitor className="h-6 w-6" />
                <span className="text-sm font-medium">System</span>
              </button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Data Management</h2>
          </div>
          <Separator />

          <div className="space-y-4">
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Export Options</h3>
              <p className="text-muted-foreground text-sm">
                Download your data for backup or migration to other tools
              </p>
            </div>

            <div className="grid gap-3">
              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={handleExportBackup}
              >
                <Download className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">Export Full Backup (JSON)</span>
                  <span className="text-muted-foreground text-xs">
                    Complete backup of all notes, bookmarks, and metadata
                  </span>
                </div>
              </Button>

              <Button
                variant="outline"
                className="justify-start gap-2"
                onClick={handleExportMarkdownZip}
              >
                <FileArchive className="h-4 w-4" />
                <div className="flex flex-col items-start">
                  <span className="font-medium">
                    Export All Notes (Markdown ZIP)
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Individual Markdown files for each video (for
                    Obsidian/Notion)
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            <h2 className="text-lg font-semibold">About</h2>
          </div>
          <Separator />
          <div className="text-muted-foreground space-y-2 text-sm">
            <p>
              <strong>VideoNotes</strong> - Your YouTube study companion
            </p>
            <p>Version 1.0.0</p>
            <p className="pt-2">
              Built with ❤️ by{" "}
              <a href="https://x.com/Ravuri__Nikhil" target="_blank">
                <strong>Ravuri Nikhil</strong>
              </a>{" "}
              from India
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
