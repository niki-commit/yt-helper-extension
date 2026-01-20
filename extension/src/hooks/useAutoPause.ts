import { useState, useEffect } from "react";
import { useYouTubePlayer } from "./useYouTubePlayer";

export function useAutoPause() {
  // TODO: Persist to storage
  const [isAutoPauseEnabled, setIsAutoPauseEnabled] = useState(true);
  const { pause, play } = useYouTubePlayer();

  const handleFocus = () => {
    if (isAutoPauseEnabled) {
      pause();
    }
  };

  const handleBlur = () => {
    if (isAutoPauseEnabled) {
      // Optional: Auto-resume? Usually strictly pausing is safer UX.
      // play();
    }
  };

  return {
    isAutoPauseEnabled,
    setIsAutoPauseEnabled,
    handleFocus,
    handleBlur,
  };
}
