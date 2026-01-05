"use client";

import { useState, useEffect } from "react";

export interface LocalVideo {
  videoId: string;
  title: string;
  thumbnailUrl?: string;
  channelName?: string;
  bookmarkTime?: number;
  lastVisitedAt: number;
  _count?: {
    notes: number;
  };
}

export function useExtensionSync() {
  const [localVideos, setLocalVideos] = useState<LocalVideo[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [activeNotes, setActiveNotes] = useState<any[]>([]);
  const [allLocalNotes, setAllLocalNotes] = useState<any[]>([]);

  useEffect(() => {
    let connected = false;

    // 0. Define bridge request function
    const fetchLocal = () => {
      // Channel 1: PostMessage
      window.postMessage(
        { source: "VN_DASHBOARD", type: "REQUEST_LOCAL_VIDEOS" },
        "*"
      );
      // Channel 2: CustomEvent (Redundant)
      window.dispatchEvent(new CustomEvent("VN_REQUEST_LOCAL_VIDEOS"));
    };

    const fetchNotes = () => {
      window.postMessage(
        { source: "VN_DASHBOARD", type: "REQUEST_ALL_NOTES" },
        "*"
      );
      window.dispatchEvent(new CustomEvent("VN_REQUEST_ALL_NOTES"));
    };

    // 1. Listen for response from extension (PostMessage)
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.source === "VN_EXTENSION") {
        if (event.data.type === "LOCAL_VIDEOS_RESPONSE") {
          setLocalVideos(event.data.payload);
          setIsConnected(true);
          connected = true;
          fetchNotes(); // Fetch all notes once videos are loaded
        } else if (event.data.type === "VIDEO_NOTES_RESPONSE") {
          setActiveNotes(event.data.payload);
        } else if (event.data.type === "ALL_NOTES_RESPONSE") {
          setAllLocalNotes(event.data.payload);
        } else if (event.data.type === "BRIDGE_READY") {
          fetchLocal();
        } else if (event.data.type === "PONG") {
          setIsConnected(true);
          connected = true;
        }
      }
    };

    // 1b. Listen for response from extension (CustomEvent)
    const handleCustomEvent = (event: Event) => {
      const detail = (event as CustomEvent).detail;
      if (detail) {
        if (
          Array.isArray(detail) &&
          detail.length > 0 &&
          "videoId" in detail[0]
        ) {
          // This is likely videos
          setLocalVideos(detail);
        } else {
          // This is likely notes
          setAllLocalNotes(detail);
        }
        setIsConnected(true);
        connected = true;
      }
    };

    window.addEventListener("message", handleMessage);
    window.addEventListener("VN_LOCAL_VIDEOS_RESPONSE", handleCustomEvent);
    window.addEventListener("VN_ALL_NOTES_RESPONSE", handleCustomEvent);

    // 2. Persistent Polling
    const interval = setInterval(() => {
      if (!connected) {
        console.log("Dashboard: Still searching for extension...");
        fetchLocal();
        window.postMessage({ source: "VN_DASHBOARD", type: "PING" }, "*");
      }
    }, 2000);

    // Initial fetch
    fetchLocal();

    return () => {
      window.removeEventListener("message", handleMessage);
      clearInterval(interval);
    };
  }, []);

  const fetchVideoNotes = (videoId: string) => {
    window.postMessage(
      {
        source: "VN_DASHBOARD",
        type: "REQUEST_VIDEO_NOTES",
        videoId,
      },
      "*"
    );
  };

  return {
    localVideos,
    isConnected,
    activeNotes,
    allLocalNotes,
    fetchVideoNotes,
  };
}
