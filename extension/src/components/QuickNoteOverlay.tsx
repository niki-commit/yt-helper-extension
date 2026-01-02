import React, { useState, useEffect } from "react";
import NotePopup from "./NotePopup";

export default function QuickNoteOverlay() {
  const [vid, setVid] = useState<string | null>(null);

  useEffect(() => {
    const handleOpen = (e: any) => {
      const videoId = e.detail?.videoId;
      if (videoId) {
        setVid(videoId);
      }
    };

    window.addEventListener("yt-helper-open-quick-note", handleOpen);
    return () =>
      window.removeEventListener("yt-helper-open-quick-note", handleOpen);
  }, []);

  if (!vid) return null;

  return (
    <NotePopup videoId={vid} onClose={() => setVid(null)} isModal={true} />
  );
}
