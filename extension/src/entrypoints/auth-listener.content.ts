export default defineContentScript({
  matches: ["*://localhost/*"], // Adjust for production later
  main() {
    console.log("VideoNotes: Auth listener active");

    // 1. Listen for the custom DOM event
    window.addEventListener("VIDEO_NOTES_AUTH_COMPLETED", (event: any) => {
      const code = event.detail?.code;
      if (code) {
        console.log("VideoNotes: Received handshake code via event");
        browser.runtime.sendMessage({ type: "AUTH_HANDSHAKE", code });
      }
    });

    // 2. Fallback: Check for the hidden element if already rendered
    const element = document.getElementById("handshake-code");
    if (element) {
      const code = element.getAttribute("data-code");
      if (code) {
        console.log("VideoNotes: Received handshake code via DOM fallback");
        browser.runtime.sendMessage({ type: "AUTH_HANDSHAKE", code });
      }
    }
  },
});
