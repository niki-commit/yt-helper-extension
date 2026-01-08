export default defineContentScript({
  matches: [
    "http://localhost/*",
    "http://127.0.0.1/*",
    "http://localhost:*/*",
    "http://127.0.0.1:*/*",
    "https://localhost/*",
    "https://127.0.0.1/*",
    "https://localhost:*/*",
    "https://127.0.0.1:*/*",
  ],
  runAt: "document_start",
  main() {
    console.log(
      "%cVideoNotes: Bridge Active (via Auth Listener)",
      "color: #6366f1; font-weight: bold;"
    );

    // 1. Listen for the custom DOM event
    window.addEventListener("VIDEO_NOTES_AUTH_COMPLETED", (event: any) => {
      const code = event.detail?.code;
      if (code) {
        console.log("VideoNotes: Received handshake code via event");
        browser.runtime.sendMessage({ type: "AUTH_HANDSHAKE", code });
      }
    });

    // --- Dashboard Bridge Logic ---
    const announceReady = () => {
      window.postMessage({ source: "VN_EXTENSION", type: "BRIDGE_READY" }, "*");
    };
    announceReady();
    setInterval(announceReady, 3000);

    const isContextValid = () => {
      try {
        return !!browser.runtime.getManifest();
      } catch (e) {
        return false;
      }
    };

    window.addEventListener("message", async (event) => {
      if (!isContextValid()) return;
      if (event.data?.source !== "VN_DASHBOARD") return;

      console.log(`VideoNotes Bridge: Received ${event.data.type}`);
      // ... existing message handling ...
      if (event.data.type === "PING") {
        window.postMessage({ source: "VN_EXTENSION", type: "PONG" }, "*");
        return;
      }

      if (event.data.type === "REQUEST_LOCAL_VIDEOS") {
        try {
          const response = await browser.runtime.sendMessage({
            type: "DB_CALL",
            method: "getAllVideos",
            args: [],
          });

          const localVideos = response || [];
          console.log(
            `VideoNotes Bridge: Found ${localVideos.length} raw local videos`
          );

          const activeVideos = Array.isArray(localVideos)
            ? localVideos
                .map((v) => ({
                  ...v,
                  bookmarkTime: v.bookmarkTimestamp,
                }))
                .filter(
                  (v) => v.bookmarkTime != null || (v._count?.notes ?? 0) > 0
                )
            : [];

          console.log(
            `VideoNotes Bridge: Sending ${activeVideos.length} processed videos to dashboard`
          );

          window.postMessage(
            {
              source: "VN_EXTENSION",
              type: "LOCAL_VIDEOS_RESPONSE",
              payload: activeVideos,
            },
            "*"
          );
        } catch (err: any) {
          if (err.message?.includes("context invalidated")) {
            console.warn(
              "VideoNotes Bridge: Extension context invalidated. Please refresh the page."
            );
          } else {
            console.error(
              "VideoNotes Bridge: Failed to communicate with background",
              err
            );
          }
        }
      }
      if (event.data.type === "REQUEST_VIDEO_NOTES") {
        try {
          const { videoId } = event.data;
          const response = await browser.runtime.sendMessage({
            type: "DB_CALL",
            method: "getNotes",
            args: [videoId],
          });

          window.postMessage(
            {
              source: "VN_EXTENSION",
              type: "VIDEO_NOTES_RESPONSE",
              payload: response || [],
              videoId,
            },
            "*"
          );
        } catch (err: any) {
          if (!err.message?.includes("context invalidated")) {
            console.error("VideoNotes Bridge: Failed to fetch notes", err);
          }
        }
      }
      if (event.data.type === "REQUEST_ALL_NOTES") {
        try {
          const response = await browser.runtime.sendMessage({
            type: "DB_CALL",
            method: "getAllNotes",
            args: [],
          });
          window.postMessage(
            {
              source: "VN_EXTENSION",
              type: "ALL_NOTES_RESPONSE",
              payload: response || [],
            },
            "*"
          );
        } catch (err: any) {
          if (!err.message?.includes("context invalidated")) {
            console.error("VideoNotes Bridge: Failed to fetch all notes", err);
          }
        }
      }
    });

    // --- Redundant Channel (CustomEvent) to bypass postMessage filters ---
    window.addEventListener("VN_REQUEST_ALL_NOTES", async () => {
      if (!isContextValid()) return;
      try {
        const response = await browser.runtime.sendMessage({
          type: "DB_CALL",
          method: "getAllNotes",
          args: [],
        });
        window.dispatchEvent(
          new CustomEvent("VN_ALL_NOTES_RESPONSE", {
            detail: response || [],
          })
        );
      } catch (e: any) {
        if (!e.message?.includes("context invalidated")) {
          console.error("Bridge CustomEvent Error (All Notes):", e);
        }
      }
    });

    window.addEventListener("VN_REQUEST_LOCAL_VIDEOS", async () => {
      if (!isContextValid()) return;
      console.log("VideoNotes Bridge: Received CustomEvent request");
      try {
        const response = await browser.runtime.sendMessage({
          type: "DB_CALL",
          method: "getAllVideos",
          args: [],
        });
        const localVideos = response || [];
        const activeVideos = Array.isArray(localVideos)
          ? localVideos
              .map((v) => ({
                ...v,
                bookmarkTime: v.bookmarkTimestamp,
              }))
              .filter(
                (v) => v.bookmarkTime != null || (v._count?.notes ?? 0) > 0
              )
          : [];

        window.dispatchEvent(
          new CustomEvent("VN_LOCAL_VIDEOS_RESPONSE", {
            detail: activeVideos,
          })
        );
      } catch (e: any) {
        if (!e.message?.includes("context invalidated")) {
          console.error("Bridge CustomEvent Error:", e);
        }
      }
    });
  },
});
