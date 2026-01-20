import { useState, useEffect } from "react";
import { browser } from "wxt/browser";

export function useHideRecommendations() {
  const [isEnabled, setIsEnabled] = useState(false);

  // Load initial state
  useEffect(() => {
    browser.storage.local.get("hideRecommendations").then((res) => {
      setIsEnabled((res.hideRecommendations as boolean) ?? false);
    });
  }, []);

  // Sync with storage changes
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.hideRecommendations) {
        setIsEnabled(changes.hideRecommendations.newValue);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  const setHideRecommendations = (value: boolean) => {
    setIsEnabled(value);
    browser.storage.local.set({ hideRecommendations: value });
  };

  return { isEnabled, setIsEnabled: setHideRecommendations };
}
