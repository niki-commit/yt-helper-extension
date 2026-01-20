import { browser } from "wxt/browser";

// Modular CSS for Focus Mode
const HIDE_RECOMMENDATIONS_CSS = `
  /* Hide YouTube's Recommendation Content */
  #secondary > #secondary-inner > #related { display: none !important; }
  ytd-watch-next-secondary-results-renderer { display: none !important; }
  
  /* Expand Main Video Container to Full Width */
  ytd-watch-flexy[flexy] #primary.ytd-watch-flexy {
    max-width: 100% !important;
    min-width: 100% !important;
    padding-right: 0 !important;
  }
  
  @media (min-width: 1000px) {
    /* Force #secondary visible on desktop for our sidebar */
    #secondary {
      display: block !important;
    }
  }

  @media (max-width: 999px) {
    /* On smaller screens, completely hide the secondary container if hiding recs.
       Our mobile sidebar is anchored to metadata, so it stays visible.
    */
    #secondary {
      display: none !important;
    }
  }
`;

const HIDE_COMMENTS_CSS = `
  /* Hide Comments */
  #comments { display: none !important; }
`;

export function initFocusMode() {
  const applyStyles = (hideRecommendations: boolean, hideComments: boolean) => {
    // Recommendations style
    let recStyle = document.getElementById("vn-hide-recommendations");
    if (hideRecommendations) {
      if (!recStyle) {
        recStyle = document.createElement("style");
        recStyle.id = "vn-hide-recommendations";
        document.head.appendChild(recStyle);
      }
      recStyle.textContent = HIDE_RECOMMENDATIONS_CSS;
    } else if (recStyle) {
      recStyle.remove();
    }

    // Comments style
    let commentsStyle = document.getElementById("vn-hide-comments");
    if (hideComments) {
      if (!commentsStyle) {
        commentsStyle = document.createElement("style");
        commentsStyle.id = "vn-hide-comments";
        document.head.appendChild(commentsStyle);
      }
      commentsStyle.textContent = HIDE_COMMENTS_CSS;
    } else if (commentsStyle) {
      commentsStyle.remove();
    }
  };

  // Initial load
  browser.storage.local
    .get(["hideRecommendations", "hideComments"])
    .then((res) => {
      applyStyles(!!res.hideRecommendations, !!res.hideComments);
    });

  // Listen for changes
  browser.storage.onChanged.addListener((changes, area) => {
    if (
      area === "local" &&
      (changes.hideRecommendations || changes.hideComments)
    ) {
      browser.storage.local
        .get(["hideRecommendations", "hideComments"])
        .then((res) => {
          applyStyles(!!res.hideRecommendations, !!res.hideComments);
        });
    }
  });
}

export function initAutoPause() {
  let autoPauseEnabled = true;
  let autoResumeEnabled = true;

  // Initial load
  browser.storage.local
    .get(["autoPauseEnabled", "autoResumeEnabled"])
    .then((res) => {
      autoPauseEnabled = res.autoPauseEnabled !== false;
      autoResumeEnabled = res.autoResumeEnabled !== false;
    });

  // Listen for storage changes
  browser.storage.onChanged.addListener((changes, area) => {
    if (area === "local") {
      if (changes.autoPauseEnabled) {
        autoPauseEnabled = changes.autoPauseEnabled.newValue !== false;
      }
      if (changes.autoResumeEnabled) {
        autoResumeEnabled = changes.autoResumeEnabled.newValue !== false;
      }
    }
  });

  // Listen for visibility changes (Tab/Window switch)
  document.addEventListener("visibilitychange", () => {
    const video = document.querySelector(
      "video.html5-main-video"
    ) as HTMLVideoElement;
    if (!video) return;

    if (document.visibilityState === "hidden" && autoPauseEnabled) {
      if (!video.paused) {
        console.log("[VideoNotes] Tab backgrounded. Auto-pausing.");
        video.pause();
      }
    } else if (document.visibilityState === "visible" && autoResumeEnabled) {
      if (video.paused) {
        console.log("[VideoNotes] Tab focused. Auto-resuming.");
        video.play();
      }
    }
  });
}
