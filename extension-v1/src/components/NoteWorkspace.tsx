import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useAutoPause } from "@/hooks/useAutoPause";
import { useAdState } from "@/hooks/useAdState";

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

  // Format Helper: Seconds to MM:SS
  const formatTime = (seconds: number) => {
    const min = Math.floor(seconds / 60);
    const sec = Math.floor(seconds % 60);
    return `[${min}:${sec.toString().padStart(2, "0")}] `;
  };

  // Auto-populate timestamp when it changes
  useEffect(() => {
    if (initialTimestamp !== null && initialTimestamp !== undefined) {
      const timeStr = formatTime(initialTimestamp);
      setEditorContent(timeStr);
    }
  }, [initialTimestamp]);

  const { isAdActive } = useAdState();

  const handleSaveAndResume = () => {
    if (isAdActive) return;
    console.log("[VideoNotes] Saving note:", editorContent);
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
