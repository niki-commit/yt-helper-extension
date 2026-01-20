import { Plus } from "lucide-react";

export function ChipApp() {
  const handleClick = () => {
    console.log("[VideoNotes] Chip Clicked! Dispatching event...");
    window.dispatchEvent(
      new CustomEvent("VN_OPEN_OVERLAY", {
        bubbles: true,
        composed: true,
        detail: { timestamp: Date.now() },
      })
    );
  };

  return (
    <button
      onClick={handleClick}
      className="ml-4 flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-900 transition-colors hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
    >
      <Plus className="h-4 w-4 text-indigo-500" />
      <span>Add Note</span>
    </button>
  );
}
