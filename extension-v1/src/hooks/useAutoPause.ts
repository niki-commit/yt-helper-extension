import { useState, useEffect } from "react";
import { useYouTubePlayer } from "./useYouTubePlayer";
import { browser, Browser } from "wxt/browser";

export function useAutoPause() {
  const [isAutoPauseEnabled, setIsAutoPauseEnabled] = useState(true);
  const { pause } = useYouTubePlayer();

  // Load initial state
  useEffect(() => {
    browser.storage.local.get("autoPauseEnabled").then((res) => {
      setIsEnabled(res.autoPauseEnabled !== false);
    });
  }, []);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.autoPauseEnabled) {
        setIsEnabled(changes.autoPauseEnabled.newValue !== false);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const setIsEnabled = (value: boolean) => {
    setIsAutoPauseEnabled(value);
    browser.storage.local.set({ autoPauseEnabled: value });
  };

  // Note: Tab/Window visibility auto-pause is now handled globally in content.tsx via initAutoPause()

  const handleFocus = () => {
    if (isAutoPauseEnabled) {
      pause();
    }
  };

  const handleBlur = () => {
    // Optional resume logic
  };

  return {
    isAutoPauseEnabled,
    setIsAutoPauseEnabled: setIsEnabled,
    handleFocus,
    handleBlur,
  };
}
