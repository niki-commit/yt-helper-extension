export const DISTRACTION_FREE_CSS = `
  /* Scope all distraction-free rules to the watch page only */
  
  /* Hide Recommendations List */
  ytd-watch-flexy ytd-watch-next-secondary-results-renderer { display: none !important; }

  /* Hide Suggested Videos in the end screen and overlay */
  ytd-watch-flexy .ytp-endscreen-content { display: none !important; }
  ytd-watch-flexy .ytp-ce-element { display: none !important; }
  ytd-watch-flexy .ytp-videowall-still { display: none !important; }
  
  /* Hide related content and ads */
  ytd-watch-flexy ytd-companion-slot-renderer { display: none !important; }
  ytd-watch-flexy ytd-player-legacy-desktop-watch-ads-renderer { display: none !important; }

  /* Hide metadata / merchandising below player if any */
  ytd-watch-flexy #merch-shelf { display: none !important; }
  ytd-watch-flexy ytd-video-secondary-info-renderer #metadata-row { display: none !important; }

  /* Ensure our sidebar container stays visible on watch page */
  ytd-watch-flexy #secondary { 
    display: block !important; 
    min-width: 350px !important;
    visibility: visible !important;
  }
`;

let styleElement: HTMLStyleElement | null = null;

export const setDistractionFreeMode = (enabled: boolean) => {
  if (enabled) {
    if (!styleElement) {
      styleElement = document.createElement("style");
      styleElement.id = "video-notes-distraction-free";
      styleElement.textContent = DISTRACTION_FREE_CSS;
      document.head.appendChild(styleElement);
    }
  } else {
    if (styleElement) {
      styleElement.remove();
      styleElement = null;
    }
  }
};
