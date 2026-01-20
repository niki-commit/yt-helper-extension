import { useState, useEffect } from "react";
import { useFocusMode } from "@/hooks/useFocusMode";
import { useAutoPause } from "@/hooks/useAutoPause";
import { Eye, EyeOff, Layout, Bookmark, Settings } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RichTextEditor } from "@/components/editor/RichTextEditor";

export function OverlayApp() {
  const [isOpen, setIsOpen] = useState(false);
  const { isEnabled, setIsEnabled } = useFocusMode();
  const { isAutoPauseEnabled, setIsAutoPauseEnabled, handleFocus, handleBlur } =
    useAutoPause();

  // Listen for open event from Chip
  useEffect(() => {
    const handleOpen = (e: any) => {
      console.log("[VideoNotes] Overlay received open event:", e.detail);
      setIsOpen(true);
    };

    console.log(
      "[VideoNotes] OverlayApp mounted, listening for events on window"
    );
    window.addEventListener("VN_OPEN_OVERLAY", handleOpen);
    return () => window.removeEventListener("VN_OPEN_OVERLAY", handleOpen);
  }, []);

  if (!isOpen) return null;

  return (
    <div className="pointer-events-auto fixed right-4 top-20 z-[99999] flex h-[600px] w-[400px] flex-col rounded-xl border border-zinc-200 bg-white p-4 shadow-2xl backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-950/95">
      {/* Header */}
      <div className="flex items-center justify-between pb-4">
        <h1 className="bg-gradient-to-r from-amber-500 to-orange-500 bg-clip-text text-xl font-bold text-transparent dark:from-cyan-400 dark:to-teal-500">
          VideoNotes
        </h1>
        <button
          onClick={() => setIsOpen(false)}
          className="text-sm font-medium text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
        >
          Close
        </button>
      </div>

      {/* Main Tabs */}
      <Tabs defaultValue="notes" className="flex flex-1 flex-col">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="notes">Notes</TabsTrigger>
          <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        {/* NOTES TAB */}
        <TabsContent
          value="notes"
          className="flex flex-1 flex-col gap-4 rounded-lg p-0 pt-2"
        >
          <div className="flex-1 overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
            <RichTextEditor
              content=""
              onChange={() => {}} // TODO: Connect to state
              onFocus={handleFocus}
              onBlur={handleBlur}
              placeholder="Take a note... (Video will pause)"
            />
          </div>

          {/* Timestamp Button (Placeholder for now) */}
          <div className="flex items-center justify-between px-1">
            <button className="text-xs font-bold text-indigo-500 hover:underline">
              + Add Timestamp
            </button>
            <span className="text-[10px] text-zinc-400">
              {isAutoPauseEnabled ? "Auto-Pause Active" : ""}
            </span>
          </div>
        </TabsContent>

        {/* BOOKMARKS TAB */}
        <TabsContent
          value="bookmarks"
          className="flex-1 rounded-lg border border-dashed border-zinc-200 p-4 dark:border-zinc-800"
        >
          <div className="flex h-full flex-col items-center justify-center space-y-2 opacity-50">
            <Bookmark className="h-8 w-8" />
            <p className="text-xs">Bookmarks List Coming Soon</p>
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent value="settings" className="space-y-4 pt-4">
          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/50">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Focus Mode
                </label>
                <p className="text-xs text-zinc-500">
                  Hide recommendations & comments
                </p>
              </div>
              <button
                onClick={() => setIsEnabled(!isEnabled)}
                className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                  isEnabled ? "bg-cyan-500" : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    isEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-zinc-100 bg-zinc-50 p-3 dark:border-zinc-900 dark:bg-zinc-900/50">
              <div className="space-y-0.5">
                <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  Auto-Pause
                </label>
                <p className="text-xs text-zinc-500">Pause video when typing</p>
              </div>
              <button
                onClick={() => setIsAutoPauseEnabled(!isAutoPauseEnabled)}
                className={`flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ${
                  isAutoPauseEnabled
                    ? "bg-cyan-500"
                    : "bg-zinc-200 dark:bg-zinc-700"
                }`}
              >
                <span
                  className={`h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${
                    isAutoPauseEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
