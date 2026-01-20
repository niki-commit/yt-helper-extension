import { useState, useEffect } from "react";
import { Plus, Clock } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useAutoPause } from "@/hooks/useAutoPause";
import { useAdState } from "@/hooks/useAdState";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";

interface NoteWorkspaceProps {
  initialTimestamp?: number | null;
  onSaveComplete?: () => void;
}

export function NoteWorkspace({
  initialTimestamp,
  onSaveComplete,
}: NoteWorkspaceProps) {
  const { isAutoPauseEnabled, handleFocus, handleBlur } = useAutoPause();
  const [editorContent, setEditorContent] = useState("");
  const [noteTimestamp, setNoteTimestamp] = useState<number | null>(
    initialTimestamp ?? null
  );
  const { getCurrentTime } = useYouTubePlayer();
  const { isAdActive } = useAdState();

  // Format Helper: Seconds to MM:SS
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `${min}:${sec.toString().padStart(2, "0")}`;
  };

  // Update timestamp when initialTimestamp changes
  useEffect(() => {
    if (initialTimestamp !== null && initialTimestamp !== undefined) {
      setNoteTimestamp(initialTimestamp);
    }
  }, [initialTimestamp]);

  const handleCaptureTimestamp = () => {
    if (isAdActive) return;
    const currentTime = getCurrentTime();
    setNoteTimestamp(currentTime);
  };

  const handleSaveAndResume = () => {
    if (isAdActive) return;
    console.log("[VideoNotes] Saving note:", {
      timestamp: noteTimestamp,
      content: editorContent,
    });
    // TODO: Phase 3 Dexie Save

    // Notify content script to resume video
    window.dispatchEvent(new CustomEvent("VN_NOTE_SAVE_COMPLETE"));

    // Inform parent (Floating/Sidebar) to close/collapse
    onSaveComplete?.();
  };

  return (
    <div
      onKeyDown={(e) => e.stopPropagation()}
      className="flex h-full flex-1 flex-col gap-4 overflow-hidden text-left font-sans"
    >
      {/* Editor Area */}
      <div className="space-y-4">
        {/* Timestamp Badge */}
        <div className="flex items-center justify-between gap-2">
          {noteTimestamp !== null ? (
            <div className="bg-primary/10 text-primary border-primary/20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium">
              <Clock className="h-3.5 w-3.5" />
              <span>{formatTime(noteTimestamp)}</span>
              <button
                onClick={() => setNoteTimestamp(null)}
                className="hover:bg-primary/20 ml-1 rounded-full p-0.5 transition-colors"
                title="Clear Timestamp"
              >
                <Plus className="h-3.5 w-3.5 rotate-45" />
              </button>
            </div>
          ) : (
            <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
              <span>General Note</span>
            </div>
          )}

          {/* Capture Button (only show if no timestamp) */}
          {noteTimestamp === null && (
            <button
              onClick={handleCaptureTimestamp}
              disabled={isAdActive}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all active:scale-95 ${
                isAdActive
                  ? "cursor-not-allowed border-gray-300 opacity-50"
                  : "hover:bg-accent/50 text-muted-foreground hover:text-foreground border-border"
              }`}
              title={
                isAdActive
                  ? "Cannot capture time during ads"
                  : "Capture Current Time"
              }
            >
              <Clock className="h-3.5 w-3.5" />
              <span>Stamp</span>
            </button>
          )}
        </div>

        <div className="space-y-2">
          <RichTextEditor
            content={editorContent}
            onChange={setEditorContent}
            onFocus={handleFocus}
            onBlur={handleBlur}
            placeholder="Take a note..."
          />
          <div className="flex items-center justify-end px-1">
            <span className="text-muted-foreground text-[10px]">
              {isAdActive
                ? "Note taking disabled during ad"
                : isAutoPauseEnabled
                  ? "Auto-Pause Active"
                  : ""}
            </span>
          </div>
        </div>

        <button
          onClick={handleSaveAndResume}
          disabled={isAdActive}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${
            isAdActive
              ? "cursor-not-allowed bg-gray-400 text-gray-200 opacity-50"
              : "bg-primary hover:bg-primary/90 text-primary-foreground hover:cursor-pointer"
          }`}
          title={isAdActive ? "Cannot save timestamps during ads" : "Save Note"}
        >
          {isAdActive ? "Waiting for Ad..." : "Save & Resume Execution"}
        </button>
      </div>

      {/* Note History / Timeline Placeholder */}
      <div className="border-border/60 bg-muted/20 flex min-h-[200px] flex-1 flex-col items-center justify-center rounded-lg border border-dashed p-8 text-center">
        <div className="space-y-3 opacity-30">
          <Plus className="text-muted-foreground mx-auto h-8 w-8" />
          <p className="text-muted-foreground text-sm font-medium">
            Note History
          </p>
          <p className="text-muted-foreground text-xs">
            Your saved notes will appear here in a chronological timeline.
          </p>
        </div>
      </div>
    </div>
  );
}
