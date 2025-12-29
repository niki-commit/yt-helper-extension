import { authActions } from "@/utils/auth";
import { syncService } from "@/utils/syncService";
import { localStore } from "@/storage/dexie";

export default defineBackground(() => {
  console.log("VideoNotes Background Service Active");

  browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
    // 1. Handle DB Proxy Calls
    if (message.type === "DB_CALL") {
      const { method, args } = message;
      const internalMethod = `_${method}`;
      const target = localStore as any;

      if (typeof target[internalMethod] === "function") {
        target[internalMethod](...args)
          .then((result: any) => {
            sendResponse(result);
            // If it's a mutation, trigger sync
            const mutations = [
              "saveNote",
              "deleteNote",
              "setBookmark",
              "saveVideo",
            ];
            if (mutations.includes(method)) {
              console.log(`Background: DB Mutation (${method}), syncing...`);
              syncService.pushToCloud();
            }
          })
          .catch((err: any) => {
            console.error(`Background: DB_CALL Error (${method}):`, err);
            sendResponse({ error: err.message });
          });
        return true; // Async response
      }
    }

    // 2. Auth Handshake
    if (message.type === "AUTH_HANDSHAKE") {
      console.log(
        "VideoNotes: Received handshake code. Exchanging for tokens..."
      );
      authActions.exchangeCodeForTokens(message.code).then((tokens) => {
        if (tokens) {
          console.log("VideoNotes: Handshake successful, tokens stored.");
          browser.runtime
            .sendMessage({
              type: "AUTH_UPDATED",
              authenticated: true,
            })
            .catch(() => {});
          syncService.pushToCloud();
        } else {
          console.error("VideoNotes: Handshake failed.");
        }
      });
    }

    // 3. Sync Trigger
    if (message.type === "TRIGGER_SYNC") {
      syncService.pushToCloud();
    }
  });
});
