import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import { localStore } from "@/storage/dexie";
import type { VideoRecord } from "@/storage/types";

export function BookmarksTab() {
  const [bookmarkedVideos, setBookmarkedVideos] = useState<VideoRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadBookmarks();
    getCurrentVideoId();
  }, []);

  const getCurrentVideoId = async () => {
    try {
      const tabs = await browser.tabs.query({
        active: true,
        currentWindow: true,
      });
      const tab = tabs[0];
      if (tab?.url) {
        const url = new URL(tab.url);
        if (url.hostname.includes("youtube.com") && url.pathname === "/watch") {
          const videoId = url.searchParams.get("v");
          if (videoId) {
            setCurrentVideoId(videoId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to get current video ID:", err);
    }
  };

  const loadBookmarks = async () => {
    try {
      const allVideos = await localStore.getAllVideos();
      const bookmarked = allVideos.filter(
        (video) =>
          video.bookmarkTimestamp !== null &&
          video.bookmarkTimestamp !== undefined
      );

      // Sort by most recently visited
      bookmarked.sort((a, b) => b.lastVisitedAt - a.lastVisitedAt);

      setBookmarkedVideos(bookmarked);
    } catch (err) {
      console.error("Failed to load bookmarks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleResume = (videoId: string, timestamp: number) => {
    browser.tabs.create({
      url: `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(
        timestamp
      )}s`,
    });
  };

  const handleDelete = async (videoId: string) => {
    try {
      await localStore.setBookmark(videoId, null);
      // Reload bookmarks
      loadBookmarks();

      // Dispatch event locally in popup
      window.dispatchEvent(
        new CustomEvent("yt-helper-bookmark-updated", {
          detail: { videoId, hasBookmark: false, bookmarkTime: null },
        })
      );

      // Send message to active tabs to update UI in real-time
      const tabs = await browser.tabs.query({ url: "*://*.youtube.com/*" });
      tabs.forEach((tab) => {
        if (tab.id) {
          browser.tabs
            .sendMessage(tab.id, {
              type: "BOOKMARK_UPDATED",
              payload: { videoId, hasBookmark: false, bookmarkTime: null },
            })
            .catch(() => {
              // Ignore errors if tab is not ready or content script not injected
            });
        }
      });
    } catch (err) {
      console.error("Failed to delete bookmark:", err);
    }
  };

  const filteredVideos = bookmarkedVideos.filter((video) =>
    (video.title || "").toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate current video from rest
  const currentVideo = filteredVideos.find((v) => v.videoId === currentVideoId);
  const otherVideos = filteredVideos.filter(
    (v) => v.videoId !== currentVideoId
  );

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/2 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (bookmarkedVideos.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm font-bold text-zinc-400">No Bookmarks Yet</p>
        <p className="text-xs text-zinc-600">
          Bookmark videos to quickly resume watching from where you left off
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <Input
          type="text"
          placeholder="Search bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-9 bg-zinc-900/50 border-zinc-800 text-zinc-200 placeholder:text-zinc-600 focus:border-indigo-500"
        />
      </div>

      {/* Video List */}
      <ScrollArea className="h-[320px]">
        <div className="space-y-3 pr-4">
          {currentVideo && (
            <div className="relative">
              <div className="absolute -left-2 top-0 h-full w-1 bg-indigo-500 rounded-full" />
              <VideoCard
                videoId={currentVideo.videoId}
                title={currentVideo.title || "Untitled Video"}
                channelName={currentVideo.channelName}
                thumbnailUrl={currentVideo.thumbnailUrl}
                isSynced={false}
                timestamp={currentVideo.bookmarkTimestamp || 0}
                onResume={() =>
                  handleResume(
                    currentVideo.videoId,
                    currentVideo.bookmarkTimestamp || 0
                  )
                }
                onDelete={() => handleDelete(currentVideo.videoId)}
              />
            </div>
          )}
          {otherVideos.map((video) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title || "Untitled Video"}
              channelName={video.channelName}
              thumbnailUrl={video.thumbnailUrl}
              isSynced={false}
              timestamp={video.bookmarkTimestamp || 0}
              onResume={() =>
                handleResume(video.videoId, video.bookmarkTimestamp || 0)
              }
              onDelete={() => handleDelete(video.videoId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
