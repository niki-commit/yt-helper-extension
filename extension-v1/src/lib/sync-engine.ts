type SyncEvent =
  | { type: "REFRESH_NOTES"; videoId: string }
  | { type: "REFRESH_BOOKMARKS"; videoId: string };

class SyncEngine {
  private listeners: Set<(event: SyncEvent) => void> = new Set();

  constructor() {
    // Listen for messages from background relay or other contexts
    browser.runtime.onMessage.addListener((message: any) => {
      if (message.type === "SYNC_EVENT") {
        console.log("[SyncEngine] Received sync event:", message.payload);
        this.notifyListeners(message.payload);
      }
    });
  }

  /**
   * Broadcast an event to all other contexts via background relay
   */
  broadcast(event: SyncEvent) {
    console.log("[SyncEngine] Broadcasting via runtime:", event);
    browser.runtime
      .sendMessage({
        type: "SYNC_EVENT",
        payload: event,
      })
      .catch((err) => {
        // Ignore errors if no one is listening (e.g. extension reloaded)
        console.warn("[SyncEngine] Broadcast failed:", err);
      });
  }

  /**
   * Subscribe to sync events
   */
  subscribe(callback: (event: SyncEvent) => void) {
    this.listeners.add(callback);
    return () => {
      this.listeners.delete(callback);
    };
  }

  private notifyListeners(event: SyncEvent) {
    this.listeners.forEach((listener) => listener(event));
  }
}

export const syncEngine = new SyncEngine();
