import { localStore } from "../storage/dexie";
import { authActions } from "./auth";

const BASE_URL = "http://localhost:3000"; // Adjust for production

export const syncService = {
  async pushToCloud(): Promise<boolean> {
    try {
      const tokens = await authActions.getTokens();
      if (!tokens) {
        console.warn("Sync aborted: User not authenticated");
        return false;
      }

      // Gather local data
      const notes = await localStore.getAllNotes();
      const videos = await localStore.getAllVideos();

      // Format for the API (Prisma expects youtubeId, Extension uses videoId)
      const payload = {
        videos: videos.map((v) => ({
          youtubeId: v.videoId,
          title: v.title || "YouTube Video",
          thumbnailUrl:
            v.thumbnailUrl ||
            `https://i.ytimg.com/vi/${v.videoId}/mqdefault.jpg`,
          bookmarkTime: v.bookmarkTimestamp,
          lastWatchedAt: v.lastVisitedAt,
        })),
        notes: notes.map((n) => ({
          id: n.id,
          youtubeId: n.videoId,
          text: n.text,
          timestamp: n.timestamp,
          createdAt: n.createdAt,
          updatedAt: n.updatedAt,
        })),
      };

      const response = await fetch(`${BASE_URL}/api/sync`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${tokens.accessToken}`,
        },
        body: JSON.stringify(payload),
      });

      if (response.status === 401) {
        console.log(
          "Sync service: Access token expired, attempting refresh..."
        );
        const newTokens = await authActions.refreshTokens();

        if (newTokens) {
          // Retry once with the new token
          console.log("Sync service: Refresh successful, retrying sync...");
          const retryResponse = await fetch(`${BASE_URL}/api/sync`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${newTokens.accessToken}`,
            },
            body: JSON.stringify(payload),
          });

          if (retryResponse.ok) {
            console.log("Sync service: Retry successful.");
            return true;
          }
        }

        // If we reach here, either refresh failed or retry failed
        return false;
      }

      if (!response.ok) throw new Error("Sync request failed");

      const result = await response.json();
      console.log("Sync successful:", result);
      return true;
    } catch (error) {
      console.error("Sync service error:", error);
      return false;
    }
  },
};
