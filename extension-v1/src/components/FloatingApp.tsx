import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { useTheme } from "@/hooks/useTheme";

export function FloatingApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
  const { resolvedTheme } = useTheme();

  // Listen for open event
  useEffect(() => {
    const handleOpen = (e: any) => {
      console.log(
        "[VideoNotes] Floating Overlay received open event:",
        e.detail
      );
      setInitialTimestamp(e.detail.currentTime ?? null);
      setIsOpen(true);
    };

    window.addEventListener("VN_OPEN_FLOATING", handleOpen);
    return () => window.removeEventListener("VN_OPEN_FLOATING", handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div
      className={`border-border bg-background/40 animate-in fade-in slide-in-from-right-4 pointer-events-auto fixed top-20 right-4 z-99999 flex h-[600px] w-[400px] flex-col rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-all duration-300 ${resolvedTheme === "dark" ? "dark" : ""}`}
    >
      {/* Header */}
      <div className="border-border/20 mb-4 flex items-center justify-between border-b pb-4">
        <h1 className="from-primary to-secondary-foreground bg-linear-to-r bg-clip-text text-xl font-bold text-transparent">
          VideoNotes
        </h1>
        <button
          onClick={() => setIsOpen(false)}
          className="text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-full p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace */}
      <NoteWorkspace
        initialTimestamp={initialTimestamp}
        onSaveComplete={() => setIsOpen(false)}
      />
    </div>
  );
}
