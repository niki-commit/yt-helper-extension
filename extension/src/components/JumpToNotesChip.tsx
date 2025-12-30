import React from "react";
import { StickyNote } from "lucide-react";

export default function JumpToNotesChip() {
  const handleClick = () => {
    // Determine if we are on mobile or desktop
    const width = window.innerWidth;
    const isMobile = width < 1024;

    const targetId = isMobile ? "video-notes-mobile" : "video-notes-desktop";
    const element = document.querySelector(`[name="${targetId}"]`);

    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      // If mobile and collapsed, we might want to expand it.
      // Since it's in a shadow root, we can't easily trigger the state.
      // But we can dispatch a custom event that VideoNotes listens to.
      window.dispatchEvent(new CustomEvent("yt-helper-expand-notes"));
    }
  };

  return (
    <button
      onClick={handleClick}
      className="flex items-center gap-1.5 px-3 h-9 rounded-full bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/20 transition-all text-indigo-400 text-[12px] font-black uppercase tracking-wider active:scale-95"
      title="Jump to Video Notes"
    >
      <StickyNote className="w-3.5 h-3.5" />
      <span>Notes</span>
    </button>
  );
}
