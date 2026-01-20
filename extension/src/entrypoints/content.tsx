import ReactDOM from "react-dom/client";
import "../styles/app.css";
import { OverlayApp } from "@/components/OverlayApp";
import { ChipApp } from "@/components/ChipApp";

export default {
  matches: ["*://*.youtube.com/*"],

  main() {
    console.log("[VideoNotes] Content script loaded");

    // Helper to find and copy extension styles into shadow roots
    const harvestStyles = (root: ShadowRoot) => {
      const copy = () => {
        const styles = document.querySelectorAll(
          "style, link[rel='stylesheet']"
        );
        styles.forEach((s) => {
          // Clone it into the shadow root to apply styles
          root.appendChild(s.cloneNode(true));
        });
      };

      // Try immediately
      copy();
      // And again after a short delay for dynamic styles
      setTimeout(copy, 500);
      setTimeout(copy, 2000);
    };

    // 1. Mount Overlay with manual Shadow Root
    const overlayContainer = document.createElement("div");
    overlayContainer.id = "vn-overlay-root";
    overlayContainer.style.position = "fixed";
    overlayContainer.style.inset = "0";
    overlayContainer.style.zIndex = "999999";
    overlayContainer.style.pointerEvents = "none";
    document.body.appendChild(overlayContainer);

    const overlayShadow = overlayContainer.attachShadow({ mode: "open" });

    // Initial harvest
    harvestStyles(overlayShadow);

    const overlayMountPoint = document.createElement("div");
    overlayShadow.appendChild(overlayMountPoint);

    const overlayReactRoot = ReactDOM.createRoot(overlayMountPoint);
    overlayReactRoot.render(<OverlayApp />);

    // 2. Mount Chip with manual Shadow Root
    const mountChip = () => {
      const titleContainer = document.querySelector(
        "ytd-watch-metadata #title"
      );
      if (!titleContainer || document.getElementById("vn-chip-root")) return;

      const chipContainer = document.createElement("div");
      chipContainer.id = "vn-chip-root";
      chipContainer.style.display = "inline-flex";
      chipContainer.style.marginLeft = "12px";
      chipContainer.style.verticalAlign = "middle";

      const chipShadow = chipContainer.attachShadow({ mode: "open" });
      harvestStyles(chipShadow);

      const chipMountPoint = document.createElement("div");
      chipShadow.appendChild(chipMountPoint);

      titleContainer.appendChild(chipContainer);

      const chipReactRoot = ReactDOM.createRoot(chipMountPoint);
      chipReactRoot.render(<ChipApp />);
    };

    // Use MutationObserver for dynamic page updates
    const observer = new MutationObserver(() => {
      mountChip();
    });

    observer.observe(document.body, { childList: true, subtree: true });
    mountChip();
  },
};
