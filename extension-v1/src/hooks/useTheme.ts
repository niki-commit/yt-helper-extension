import { useState, useEffect } from "react";
import { browser } from "wxt/browser";

export type Theme = "system" | "light" | "dark";

export function useTheme() {
  const [theme, setThemeState] = useState<Theme>("system");
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");

  // Load initial theme from storage
  useEffect(() => {
    browser.storage.local.get("theme").then((res) => {
      setThemeState((res.theme as Theme) ?? "system");
    });
  }, []);

  // Listen for storage changes from other contexts (Popup <=> Content Script)
  useEffect(() => {
    const handleStorageChange = (changes: any, areaName: string) => {
      if (areaName === "local" && changes.theme) {
        setThemeState(changes.theme.newValue as Theme);
      }
    };

    browser.storage.onChanged.addListener(handleStorageChange);
    return () => browser.storage.onChanged.removeListener(handleStorageChange);
  }, []);

  // Resolve and apply theme
  useEffect(() => {
    const resolveAndApply = () => {
      let current: "light" | "dark" = "light";

      if (theme === "system") {
        current = window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
      } else {
        current = theme as "light" | "dark";
      }

      setResolvedTheme(current);

      // Apply to document root for the current context (Popup or Content Script host)
      if (current === "dark") {
        document.documentElement.classList.add("dark");
      } else {
        document.documentElement.classList.remove("dark");
      }
    };

    resolveAndApply();

    // If item is system, we need to listen for OS changes
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => resolveAndApply();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    browser.storage.local.set({ theme: newTheme });
  };

  return { theme, resolvedTheme, setTheme };
}
