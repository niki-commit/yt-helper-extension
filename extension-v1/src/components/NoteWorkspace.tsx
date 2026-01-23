import { useState, useEffect } from "react";
import { Plus, Clock, Trash2, Edit2 } from "lucide-react";
import { RichTextEditor } from "@/components/editor/RichTextEditor";
import { useAutoPause } from "@/hooks/useAutoPause";
import { useAdState } from "@/hooks/useAdState";
import { useYouTubePlayer } from "@/hooks/useYouTubePlayer";
import { useNotes } from "@/hooks/useNotes";
import { useVideoMetadata } from "@/hooks/useVideoMetadata";
import { useNoteStore } from "@/storage/noteStore";
import { Note } from "@/types/schema";
import { cn, formatTime } from "@/lib/utils";
import {
  ShadowTooltip,
  ShadowTooltipContent,
  ShadowTooltipTrigger,
} from "@/components/ui/ShadowTooltip";

interface NoteWorkspaceProps {
  initialTimestamp?: number | null;
  onSaveComplete?: () => void;
}

export function NoteWorkspace({
  initialTimestamp,
  onSaveComplete,
}: NoteWorkspaceProps) {
  const { isAutoPauseEnabled } = useAutoPause();

  // Zustand for Cross-UI Sync
  const {
    currentEditorContent,
    setCurrentEditorContent,
    activeNoteId,
    setActiveNoteId,
    activeNoteTimestamp,
    setActiveNoteTimestamp,
  } = useNoteStore();

  const { getCurrentTime, seekTo, play, pause } = useYouTubePlayer();
  const { isAdActive } = useAdState();

  // Get current video ID
  const videoId = new URLSearchParams(window.location.search).get("v");

  // Database CRUD
  const { notes, saveNote, deleteNote, isSaving } = useNotes(videoId);

  // Ensure video metadata is saved
  useVideoMetadata(videoId);

  // Focus Handlers
  const onEditorFocus = () => {
    // We've decoupled this from the global "Auto-Pause" setting (which is for Tab/Window switches).
    // Taking a note is an explicit intent, so we always pause (unless an ad is active).
    if (!isAdActive) {
      console.log("[VideoNotes] Intent-based pause: focuses editor.");
      pause();
    } else {
      console.log("[VideoNotes] Skipping pause: Ad is active.");
    }
  };

  const onEditorBlur = () => {
    console.log("[VideoNotes] onEditorBlur triggered");
  };

  // Sync external initialTimestamp to global store
  useEffect(() => {
    if (initialTimestamp !== null && initialTimestamp !== undefined) {
      // Only overwrite if we aren't already in an active edit/draft session
      // or if the external timestamp is explicitly new.
      setActiveNoteTimestamp(initialTimestamp);
    }
  }, [initialTimestamp]);

  const handleCaptureTimestamp = () => {
    if (isAdActive) return;
    const currentTime = getCurrentTime();
    setActiveNoteTimestamp(currentTime);
  };

  const isContentEmpty = (html: string) => {
    const text = html.replace(/<[^>]*>/g, "").trim();
    return text.length === 0;
  };

  const handleSaveAndResume = async () => {
    console.log("[VideoNotes] handleSaveAndResume clicked", {
      isAdActive,
      isSaving,
      videoId,
      hasContent: !!currentEditorContent,
      contentEmpty: currentEditorContent
        ? isContentEmpty(currentEditorContent)
        : true,
    });

    if (
      isAdActive ||
      !currentEditorContent ||
      isContentEmpty(currentEditorContent)
    ) {
      console.warn("[VideoNotes] Save blocked - reason:", {
        isAdActive,
        noContent: !currentEditorContent,
        effectivelyEmpty: currentEditorContent
          ? isContentEmpty(currentEditorContent)
          : true,
      });
      return;
    }

    try {
      console.log("[VideoNotes] Attempting to save note...");
      await saveNote({
        id: activeNoteId || undefined,
        content: currentEditorContent,
        timestamp: activeNoteTimestamp ?? undefined,
      });

      console.log("[VideoNotes] Note saved successfully. Resuming video...");

      // Clear editor and reset state
      setCurrentEditorContent("");
      setActiveNoteTimestamp(null);
      setActiveNoteId(null);

      // Resume video directly
      play();

      // Inform parent (Floating/Sidebar) to close/collapse
      onSaveComplete?.();
    } catch (err: any) {
      console.error("[VideoNotes] Failed to save note:", {
        message: err.message,
        name: err.name,
        stack: err.stack,
        details: err,
      });
    }
  };

  const handleEditNote = (note: Note) => {
    setActiveNoteId(note.id!);
    setActiveNoteTimestamp(note.timestamp ?? null);
    setCurrentEditorContent(note.content);
  };

  return (
    <div
      onKeyDown={(e) => e.stopPropagation()}
      className="flex h-full flex-1 flex-col gap-6 overflow-hidden text-left font-sans"
    >
      {/* Editor Area */}
      <div className="space-y-4">
        {/* Timestamp Badge */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {activeNoteTimestamp !== null ? (
              <div className="bg-primary/10 text-primary border-primary/20 flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm font-medium">
                <Clock className="h-3.5 w-3.5" />
                <span>{formatTime(activeNoteTimestamp)}</span>
                <ShadowTooltip>
                  <ShadowTooltipTrigger asChild>
                    <button
                      onClick={() => setActiveNoteTimestamp(null)}
                      className="hover:bg-primary/20 ml-1 rounded-full p-0.5 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5 rotate-45" />
                    </button>
                  </ShadowTooltipTrigger>
                  <ShadowTooltipContent side="top">
                    <p>Clear timestamp</p>
                  </ShadowTooltipContent>
                </ShadowTooltip>
              </div>
            ) : (
              <div className="bg-muted/50 text-muted-foreground flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm">
                <span>General Note</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Capture Button (only show if no timestamp) */}
            {activeNoteTimestamp === null && (
              <ShadowTooltip>
                <ShadowTooltipTrigger asChild>
                  <button
                    onClick={handleCaptureTimestamp}
                    disabled={isAdActive}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-all active:scale-95 ${
                      isAdActive
                        ? "cursor-not-allowed border-gray-300 opacity-50"
                        : "hover:bg-accent/50 text-muted-foreground hover:text-foreground border-border"
                    }`}
                  >
                    <Clock className="h-3.5 w-3.5" />
                    <span>Stamp</span>
                  </button>
                </ShadowTooltipTrigger>
                <ShadowTooltipContent side="top">
                  <p>
                    {isAdActive
                      ? "Cannot capture during ads"
                      : "Capture current timestamp"}
                  </p>
                </ShadowTooltipContent>
              </ShadowTooltip>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <RichTextEditor
            content={currentEditorContent || ""}
            onChange={setCurrentEditorContent}
            onFocus={onEditorFocus}
            onBlur={onEditorBlur}
            placeholder="Take a note..."
            // CRITICAL: Only autofocus if we were explicitly opened with a timestamp (via Note chip)
            // or if we are actively editing a note. This prevents "Focus Ghost" on expansion.
            autofocus={
              (initialTimestamp !== null && initialTimestamp !== undefined) ||
              activeNoteId
                ? "end"
                : false
            }
          />
          <div className="flex items-center justify-between px-1">
            <button
              onClick={() => {
                setActiveNoteId(null);
                setCurrentEditorContent("");
                setActiveNoteTimestamp(null);
              }}
              className="text-muted-foreground hover:text-foreground text-[10px] transition-colors"
            >
              {activeNoteId ? "Cancel Edit" : "Clear Draft"}
            </button>
            <span className="text-muted-foreground text-[10px]">
              {isAdActive
                ? "Note taking disabled during ad"
                : isAutoPauseEnabled
                  ? "Auto-Pause Active"
                  : ""}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          {activeNoteId && (
            <button
              onClick={() => {
                setActiveNoteId(null);
                setCurrentEditorContent("");
                setActiveNoteTimestamp(null);
              }}
              className="border-border hover:bg-accent text-foreground flex-1 rounded-lg border py-2.5 text-sm font-bold transition-all active:scale-95"
            >
              Cancel
            </button>
          )}
          <button
            onClick={handleSaveAndResume}
            disabled={
              isAdActive ||
              !currentEditorContent ||
              isContentEmpty(currentEditorContent) ||
              isSaving
            }
            className={`group flex items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-bold shadow-lg transition-all active:scale-95 ${
              activeNoteId ? "flex-2" : "w-full"
            } ${
              isAdActive ||
              !currentEditorContent ||
              isContentEmpty(currentEditorContent) ||
              isSaving
                ? "cursor-not-allowed bg-gray-400 text-gray-200 opacity-50"
                : "bg-primary hover:bg-primary/90 text-primary-foreground hover:cursor-pointer"
            }`}
          >
            {isSaving ? (
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : isAdActive ? (
              "Waiting for Ad..."
            ) : activeNoteId ? (
              "Update Note"
            ) : (
              "Save Note & Resume"
            )}
          </button>
        </div>
      </div>

      {/* Note History / Timeline */}
      <div className="flex flex-1 flex-col overflow-hidden">
        <h3 className="mb-4 text-xs font-bold tracking-wider text-zinc-500 uppercase">
          Your Notes for this video
        </h3>

        <div className="flex-1 space-y-4 overflow-y-auto pr-2 pb-4">
          {notes.length > 0 ? (
            notes.map((note: Note) => (
              <div
                key={note.id}
                className={`bg-card group border-border relative rounded-xl border p-3 shadow-xs transition-all ${
                  activeNoteId === note.id
                    ? "ring-primary/30 border-primary bg-primary/5 ring-2"
                    : "hover:border-zinc-400 dark:hover:border-zinc-600"
                }`}
              >
                <div className="mb-2 flex items-center justify-between">
                  {note.timestamp !== undefined ? (
                    <ShadowTooltip>
                      <ShadowTooltipTrigger asChild>
                        <button
                          onClick={() => !isAdActive && seekTo(note.timestamp!)}
                          disabled={isAdActive}
                          className={`flex items-center gap-1.5 rounded-md px-1.5 py-0.5 text-xs font-bold transition-colors ${
                            isAdActive
                              ? "cursor-not-allowed text-gray-400 opacity-50"
                              : "text-primary hover:bg-primary/10"
                          }`}
                        >
                          <Clock className="h-3 w-3" />
                          {formatTime(note.timestamp)}
                        </button>
                      </ShadowTooltipTrigger>
                      <ShadowTooltipContent side="top">
                        <p>
                          {isAdActive
                            ? "Seeking disabled during ads"
                            : "Jump to this moment"}
                        </p>
                      </ShadowTooltipContent>
                    </ShadowTooltip>
                  ) : (
                    <span className="text-muted-foreground px-1.5 py-0.5 text-[10px] font-medium uppercase">
                      General
                    </span>
                  )}

                  <div
                    className={`flex items-center gap-1 transition-opacity ${
                      activeNoteId
                        ? "pointer-events-none opacity-20"
                        : "opacity-0 group-hover:opacity-100"
                    }`}
                  >
                    <ShadowTooltip>
                      <ShadowTooltipTrigger asChild>
                        <button
                          onClick={() => handleEditNote(note)}
                          disabled={isAdActive}
                          className={`text-muted-foreground rounded-md p-1 transition-colors ${
                            isAdActive
                              ? "cursor-not-allowed opacity-30"
                              : "hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20"
                          }`}
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                      </ShadowTooltipTrigger>
                      <ShadowTooltipContent side="top">
                        <p>
                          {isAdActive ? "Cannot edit during ads" : "Edit note"}
                        </p>
                      </ShadowTooltipContent>
                    </ShadowTooltip>
                    <ShadowTooltip>
                      <ShadowTooltipTrigger asChild>
                        <button
                          onClick={() => deleteNote(note.id!)}
                          className="text-muted-foreground rounded-md p-1 transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </ShadowTooltipTrigger>
                      <ShadowTooltipContent side="top">
                        <p>Delete note</p>
                      </ShadowTooltipContent>
                    </ShadowTooltip>
                  </div>
                </div>

                <div
                  className="prose prose-sm dark:prose-invert max-w-none text-sm text-zinc-700 dark:text-zinc-300"
                  dangerouslySetInnerHTML={{
                    __html:
                      typeof note.content === "string"
                        ? note.content
                        : JSON.stringify(note.content),
                  }}
                />
              </div>
            ))
          ) : (
            <div className="border-border/60 bg-muted/20 flex flex-1 flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center opacity-40">
              <div className="space-y-3">
                <Plus className="text-muted-foreground mx-auto h-8 w-8" />
                <p className="text-muted-foreground text-sm font-medium">
                  No notes yet
                </p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Start typing above to capture your first thought for this
                  video.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
