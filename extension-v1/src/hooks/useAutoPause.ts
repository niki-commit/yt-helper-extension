import { useState, useEffect } from "react";
import { useYouTubePlayer } from "./useYouTubePlayer";
import { browser, Browser } from "wxt/browser";

export function useAutoPause() {
  const [isAutoPauseEnabled, setIsAutoPauseEnabled] = useState(true);
  const { pause } = useYouTubePlayer();

  // Load initial state
  useEffect(() => {
    browser.storage.local.get("autoPause").then((res) => {
      // Default to true if not set
      setIsEnabled((res.autoPause as boolean) ?? true);
    });
  }, []);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.autoPause) {
        setIsEnabled(changes.autoPause.newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const setIsEnabled = (value: boolean) => {
    setIsAutoPauseEnabled(value);
    browser.storage.local.set({ autoPause: value });
  };

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
