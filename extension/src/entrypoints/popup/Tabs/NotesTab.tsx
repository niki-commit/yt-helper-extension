import React, { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search } from "lucide-react";
import { VideoCard } from "../components/VideoCard";
import { localStore } from "@/storage/dexie";
import type { Note, VideoRecord } from "@/storage/types";

interface VideoWithNotes {
  videoId: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  noteCount: number;
  lastUpdated: number;
}

export function NotesTab() {
  const [videos, setVideos] = useState<VideoWithNotes[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotesData();
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
            console.log("Current video ID:", videoId);
            setCurrentVideoId(videoId);
          }
        }
      }
    } catch (err) {
      console.error("Failed to get current video ID:", err);
    }
  };

  const loadNotesData = async () => {
    try {
      const allNotes = await localStore.getAllNotes();

      // Group notes by videoId
      const videoMap = new Map<string, Note[]>();
      allNotes.forEach((note) => {
        if (!videoMap.has(note.videoId)) {
          videoMap.set(note.videoId, []);
        }
        videoMap.get(note.videoId)!.push(note);
      });

      // Fetch video metadata for each unique videoId
      const videosWithNotes: VideoWithNotes[] = [];
      for (const [videoId, notes] of videoMap.entries()) {
        const videoRecord = await localStore.getVideo(videoId);
        const lastUpdated = Math.max(...notes.map((n) => n.updatedAt));

        videosWithNotes.push({
          videoId,
          title: videoRecord?.title || "Untitled Video",
          channelName: videoRecord?.channelName,
          thumbnailUrl: videoRecord?.thumbnailUrl,
          noteCount: notes.length,
          lastUpdated,
        });
      }

      // Sort by most recently updated
      videosWithNotes.sort((a, b) => b.lastUpdated - a.lastUpdated);

      setVideos(videosWithNotes);
    } catch (err) {
      console.error("Failed to load notes:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredVideos = videos.filter((video) =>
    video.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Separate current video from rest
  const currentVideo = filteredVideos.find((v) => v.videoId === currentVideoId);
  const otherVideos = filteredVideos.filter(
    (v) => v.videoId !== currentVideoId
  );

  const handleOpenVideo = (videoId: string) => {
    browser.tabs.create({ url: `https://www.youtube.com/watch?v=${videoId}` });
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 bg-white/2 animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <p className="text-sm font-bold text-zinc-400">No Notes Yet</p>
        <p className="text-xs text-zinc-600">
          Start taking notes on YouTube videos to see them here
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
          placeholder="Search videos..."
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
                title={currentVideo.title}
                channelName={currentVideo.channelName}
                thumbnailUrl={currentVideo.thumbnailUrl}
                isSynced={false}
                onOpen={() => handleOpenVideo(currentVideo.videoId)}
              />
            </div>
          )}
          {otherVideos.map((video) => (
            <VideoCard
              key={video.videoId}
              videoId={video.videoId}
              title={video.title}
              channelName={video.channelName}
              thumbnailUrl={video.thumbnailUrl}
              isSynced={false}
              onOpen={() => handleOpenVideo(video.videoId)}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
}
