import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { useTheme } from "@/hooks/useTheme";
import { Providers } from "@/components/Providers";

export function FloatingAppContent() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
  const [focusNote, setFocusNote] = useState<boolean>(false);
  const [position, setPosition] = useState({ x: 80, y: 80 });
  const [size, setSize] = useState({ width: 400, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);

  const dragRef = useRef<{
    startX: number;
    startY: number;
    startPosX: number;
    startPosY: number;
  } | null>(null);
  const resizeRef = useRef<{
    startX: number;
    startY: number;
    startWidth: number;
    startHeight: number;
  } | null>(null);

  const { resolvedTheme } = useTheme();

  // Listen for events
  useEffect(() => {
    const handleOpen = (e: any) => {
      if (e.detail?.currentTime !== undefined) {
        setInitialTimestamp(e.detail.currentTime);
      }
      setFocusNote(!!e.detail?.focusNote);
      setIsOpen(true);
    };

    const handleToggle = (e: any) => {
      // Only toggle if we ARE in fullscreen
      if (!e.detail?.isFullscreen) return;
      setIsOpen((prev) => !prev);
    };

    window.addEventListener("VN_OPEN_FLOATING", handleOpen);
    window.addEventListener("VN_TOGGLE_UI", handleToggle);
    return () => {
      window.removeEventListener("VN_OPEN_FLOATING", handleOpen);
      window.removeEventListener("VN_TOGGLE_UI", handleToggle);
    };
  }, []);

  // Auto-close on Fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isOpen) {
        // console.log("[VideoNotes] Exited fullscreen. Closing floating UI.");
        setIsOpen(false);
        setFocusNote(false);
      }
    };

    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, [isOpen]);

  // Drag Logic
  const handleDragStart = (e: React.MouseEvent) => {
    setIsDragging(true);
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  };

  // Resize Logic
  const handleResizeStart = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsResizing(true);
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (isDragging && dragRef.current) {
        const deltaX = e.clientX - dragRef.current.startX;
        const deltaY = e.clientY - dragRef.current.startY;
        setPosition({
          x: dragRef.current.startPosX + deltaX,
          y: dragRef.current.startPosY + deltaY,
        });
      }

      if (isResizing && resizeRef.current) {
        const deltaX = e.clientX - resizeRef.current.startX;
        const deltaY = e.clientY - resizeRef.current.startY;
        setSize({
          width: Math.max(300, resizeRef.current.startWidth + deltaX),
          height: Math.max(200, resizeRef.current.startHeight + deltaY),
        });
      }
    },
    [isDragging, isResizing]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    setIsResizing(false);
  }, []);

  useEffect(() => {
    if (isDragging || isResizing) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    } else {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, isResizing, handleMouseMove, handleMouseUp]);

  if (!isOpen) return null;

  return (
    <div
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        width: `${size.width}px`,
        height: `${size.height}px`,
        position: "fixed",
        top: 0,
        left: 0,
      }}
      className={`border-border bg-background/40 animate-in fade-in slide-in-from-right-4 pointer-events-auto z-99999 flex flex-col rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-[background-color,border-color,opacity,transform] duration-300 ${resolvedTheme === "dark" ? "dark" : ""}`}
    >
      {/* Header / Drag Handle */}
      <div
        onMouseDown={handleDragStart}
        className="border-border/20 mb-4 flex cursor-move items-center justify-between border-b pb-4 select-none"
      >
        <h1 className="from-primary to-secondary-foreground bg-linear-to-r bg-clip-text text-xl font-bold text-transparent">
          VideoNotes
        </h1>
        <button
          onClick={() => {
            setIsOpen(false);
            setInitialTimestamp(null);
            setFocusNote(false);
          }}
          className="hover:bg-accent text-accent-foreground rounded-full p-1 transition-colors"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace */}
      <NoteWorkspace
        initialTimestamp={initialTimestamp}
        focusNote={focusNote}
        onSaveComplete={() => {
          // Keep floating UI open after save for continuous note taking
          setInitialTimestamp(null);
          setFocusNote(false);
        }}
      />

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute right-0 bottom-0 h-8 w-8 cursor-nwse-resize rounded-br-2xl transition-colors hover:bg-white/10"
        title="Resize"
      >
        <div className="border-accent-foreground absolute right-1 bottom-1 h-5 w-5 border-r-2 border-b-2" />
      </div>
    </div>
  );
}

export function FloatingApp() {
  return (
    <Providers>
      <FloatingAppContent />
    </Providers>
  );
}
