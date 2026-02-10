import { useState, useEffect } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { useTheme } from "@/hooks/useTheme";
import { Providers } from "@/components/Providers";
import { useVideoMetadata } from "@/hooks/useVideoMetadata";

export function SidebarAppContent() {
  const [value, setValue] = useState<string>("");
  const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
  const [focusNote, setFocusNote] = useState<boolean>(false);
  const { resolvedTheme } = useTheme();

  const videoId = new URLSearchParams(window.location.search).get("v");

  // Sync Video Metadata to DB (Unified Hook)
  useVideoMetadata(videoId);

  useEffect(() => {
    const handleOpen = (e: any) => {
      console.log("[VideoNotes] Sidebar received open event", e.detail);
      if (e.detail?.currentTime !== undefined) {
        setInitialTimestamp(e.detail.currentTime);
      }
      setFocusNote(!!e.detail?.focusNote);
      setValue("item-1"); // Auto-expand
    };

    const handleToggle = (e: any) => {
      // Only toggle if we are NOT in fullscreen
      if (e.detail?.isFullscreen) return;
      setValue((prev) => (prev === "item-1" ? "" : "item-1"));
    };

    window.addEventListener("VN_OPEN_SIDEBAR", handleOpen);
    window.addEventListener("VN_TOGGLE_UI", handleToggle);
    return () => {
      window.removeEventListener("VN_OPEN_SIDEBAR", handleOpen);
      window.removeEventListener("VN_TOGGLE_UI", handleToggle);
    };
  }, []);

  return (
    <div
      className={`border-border bg-background mb-4 overflow-hidden rounded-2xl border shadow-xl transition-all duration-300 ${resolvedTheme === "dark" ? "dark" : ""}`}
    >
      <Accordion
        type="single"
        collapsible
        value={value}
        onValueChange={(newValue) => {
          setValue(newValue);
          // If we are collapsing (newValue is empty), clear the stale initialTimestamp
          // so that the next manual open starts fresh.
          if (!newValue) {
            setInitialTimestamp(null);
            setFocusNote(false);
          }
        }}
        className="w-full"
      >
        <AccordionItem value="item-1" className="border-none">
          <AccordionTrigger className="hover:bg-accent rounded-t-2xl px-4 py-3 transition-colors hover:no-underline">
            <div className="flex items-center gap-2">
              <h1 className="from-primary to-secondary-foreground bg-linear-to-r bg-clip-text text-xl font-bold text-transparent">
                VideoNotes
              </h1>
            </div>
          </AccordionTrigger>
          <AccordionContent className="bg-transparent px-4 pb-4">
            <div className="h-[520px] overflow-auto pt-2">
              <NoteWorkspace
                initialTimestamp={initialTimestamp}
                focusNote={focusNote}
                onSaveComplete={() => {
                  // Keep sidebar open after save for continuous note taking
                  setInitialTimestamp(null);
                  setFocusNote(false);
                }}
              />
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

export function SidebarApp() {
  return (
    <Providers>
      <SidebarAppContent />
    </Providers>
  );
}
