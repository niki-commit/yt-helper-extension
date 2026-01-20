import { useState, useEffect, useRef, useCallback } from "react";
import { X } from "lucide-react";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { useTheme } from "@/hooks/useTheme";

export function FloatingApp() {
  const [isOpen, setIsOpen] = useState(false);
  const [initialTimestamp, setInitialTimestamp] = useState<number | null>(null);
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

  // Listen for open event
  useEffect(() => {
    const handleOpen = (e: any) => {
      setInitialTimestamp(e.detail.currentTime ?? null);
      setIsOpen(true);
    };

    window.addEventListener("VN_OPEN_FLOATING", handleOpen);
    return () => window.removeEventListener("VN_OPEN_FLOATING", handleOpen);
  }, []);

  // Auto-close on Fullscreen exit
  useEffect(() => {
    const handleFullscreenChange = () => {
      if (!document.fullscreenElement && isOpen) {
        console.log("[VideoNotes] Exited fullscreen. Closing floating UI.");
        setIsOpen(false);
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

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        className="absolute right-0 bottom-0 h-6 w-6 cursor-nwse-resize rounded-br-2xl transition-colors hover:bg-white/10"
        title="Resize"
      >
        <div className="border-muted-foreground absolute right-1 bottom-1 h-3 w-3 border-r-2 border-b-2 opacity-50" />
      </div>
    </div>
  );
}
