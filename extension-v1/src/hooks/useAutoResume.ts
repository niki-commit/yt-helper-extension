import { useState, useEffect } from "react";
import { browser } from "wxt/browser";

export function useAutoResume() {
  const [isEnabled, setIsEnabled] = useState(true);

  // Load initial state
  useEffect(() => {
    browser.storage.local.get("autoResumeEnabled").then((res) => {
      setIsEnabled(res.autoResumeEnabled !== false);
    });
  }, []);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.autoResumeEnabled) {
        setIsEnabled(changes.autoResumeEnabled.newValue !== false);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const setAutoResume = (value: boolean) => {
    setIsEnabled(value);
    browser.storage.local.set({ autoResumeEnabled: value });
  };

  return { isEnabled, setIsEnabled: setAutoResume };
}
