import { useState, useEffect } from "react";
import { browser } from "wxt/browser";

export function useHideComments() {
  const [isEnabled, setIsEnabled] = useState(false);

  // Load initial state
  useEffect(() => {
    browser.storage.local.get("hideComments").then((res) => {
      setIsEnabled((res.hideComments as boolean) ?? false);
    });
  }, []);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.hideComments) {
        setIsEnabled(changes.hideComments.newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const setHideComments = (value: boolean) => {
    setIsEnabled(value);
    browser.storage.local.set({ hideComments: value });
  };

  return { isEnabled, setIsEnabled: setHideComments };
}
