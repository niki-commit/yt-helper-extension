import { useState, useEffect } from "react";

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

  useEffect(() => {
    if (!isEnabled) return;

    // Create style tag
    const style = document.createElement("style");
    style.id = "vn-focus-mode";
    style.textContent = NO_DISTRACTION_CSS;
    document.head.appendChild(style);

    return () => {
      // Cleanup
      const existingStyle = document.getElementById("vn-focus-mode");
      if (existingStyle) {
        existingStyle.remove();
      }
    };
  }, [isEnabled]);

  // TODO: Persist preference to browser.storage

  return { isEnabled, setIsEnabled };
}
