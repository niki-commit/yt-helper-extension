import { useState, useEffect } from "react";
import { browser } from "wxt/browser";

const NO_DISTRACTION_CSS = `
  /* Hide Recommended Sidebar */
  #secondary { display: none !important; }
  
  /* Hide Comments */
  #comments { display: none !important; }
  #below { display: none !important; }

  /* Expand Main Video Container to Full Width */
  ytd-watch-flexy[flexy] #primary.ytd-watch-flexy {
    max-width: 100% !important;
    min-width: 100% !important;
    padding-right: 0 !important;
  }
  
  /* Hide End Screen Suggestions */
  .ytp-endscreen-content { display: none !important; }
`;

export function useFocusMode() {
  const [isEnabled, setIsEnabled] = useState(false);

  // Load initial state
  useEffect(() => {
    browser.storage.local.get("focusMode").then((res) => {
      setIsEnabled((res.focusMode as boolean) ?? false);
    });
  }, []);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.focusMode) {
        setIsEnabled(changes.focusMode.newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Removed DOM side-effects. Handled by initFocusMode in content script.
  useEffect(() => {
    // This hook now only manages the 'isEnabled' state for UI syncing.
  }, [isEnabled]);

  const setFocusMode = (value: boolean) => {
    setIsEnabled(value); // Optimistic update
    browser.storage.local.set({ focusMode: value });
  };

  return { isEnabled, setIsEnabled: setFocusMode };
}
