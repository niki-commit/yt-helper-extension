import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Save, X } from "lucide-react";
import {
  formatTime,
  getCurrentTime,
  pauseVideo,
  playVideo,
} from "@/utils/youtube";
import { localStore } from "@/storage/dexie";
import { v4 as uuidv4 } from "uuid";

interface NotePopupProps {
  videoId: string;
  onClose: () => void;
  anchorRef?: React.RefObject<HTMLElement>;
}

export default function NotePopup({
  videoId,
  onClose,
  anchorRef,
}: NotePopupProps) {
  const [noteText, setNoteText] = useState("");
  const [timestamp, setTimestamp] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    // Capture time and pause on mount
    const time = getCurrentTime();
    setTimestamp(time);
    pauseVideo();

    // Focus textarea
    setTimeout(() => {
      textareaRef.current?.focus();
    }, 100);

    return () => {
      // Resume on unmount? User said "when add note button clicked video pauses...".
      // Usually implied resume on cancel/save.
    };
  }, []);

  const handleSave = async () => {
    if (!noteText.trim()) return;
    setIsSaving(true);

    try {
      const title = document.title.replace(" - YouTube", "") || "YouTube Video";
      // Ensure video exists in store
      const video = await localStore.getVideo(videoId);
      await localStore.saveVideo({
        ...video,
        videoId: videoId,
        title: title,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        lastVisitedAt: Date.now(),
      });

      await localStore.saveNote({
        id: uuidv4(),
        videoId,
        timestamp,
        text: noteText,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });

      playVideo(); // Resume
      onClose();
    } catch (error) {
      console.error("Failed to save note", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    playVideo();
    onClose();
  };

  return (
    <div
      className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 z-[9999] w-[320px] bg-[#0f0f0f]/95 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200"
      style={
        {
          // If we wanted to position dynamically based on anchorRef, we could do it here
          // But 'bottom-full' works if the parent is relative.
        }
      }
    >
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-[11px] font-black uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">
            Moment: {formatTime(timestamp)}
          </div>
          <button
            onClick={handleCancel}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <Textarea
          ref={textareaRef}
          value={noteText}
          onChange={(e) => setNoteText(e.target.value)}
          placeholder="Capture your thought..."
          className="min-h-[100px] bg-black/40 border-zinc-700/50 focus:border-indigo-500/50 focus:ring-0 rounded-xl resize-none text-sm text-zinc-200 placeholder:text-zinc-600"
          onKeyDown={(e: any) => {
            e.stopPropagation(); // Prevent YouTube shortcuts
            if (e.key === "Enter" && e.ctrlKey) handleSave();
            if (e.key === "Escape") handleCancel();
          }}
        />

        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-8 text-xs font-bold text-zinc-400 hover:text-white"
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={!noteText.trim() || isSaving}
            className="h-8 text-xs font-bold bg-indigo-600 hover:bg-indigo-500 text-white gap-2 rounded-lg"
          >
            <Save className="w-3.5 h-3.5" />
            Save Note
          </Button>
        </div>
      </div>
    </div>
  );
}
