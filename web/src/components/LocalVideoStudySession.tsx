"use client";

import { useExtensionSync } from "@/hooks/useExtensionSync";
import { VideoStudySession } from "./VideoStudySession";
import { Loader2, Monitor } from "lucide-react";
import { useEffect } from "react";

export function LocalVideoStudySession({ youtubeId }: { youtubeId: string }) {
  const { localVideos, isConnected, activeNotes, fetchVideoNotes } =
    useExtensionSync();

  useEffect(() => {
    if (isConnected) {
      fetchVideoNotes(youtubeId);
    }
  }, [isConnected, youtubeId]);

  const video = localVideos.find((v) => v.videoId === youtubeId);

  if (!isConnected) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white">
        <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
        <p className="text-zinc-400 font-medium">
          Detecting local video data...
        </p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-zinc-950 text-white p-8 text-center">
        <Monitor className="w-16 h-16 text-zinc-700 mb-6" />
        <h2 className="text-2xl font-bold mb-2">Video not found locally</h2>
        <p className="text-zinc-400 max-w-md">
          This video doesn't seem to have any local notes or bookmarks in your
          browser extension.
        </p>
      </div>
    );
  }

  // Map local format to session format
  // Note: We don't have a full list of local notes here yet,
  // because the bridge currently only sends the video records.
  // We might need to extend the bridge to fetch notes for a specific video.

  return (
    <VideoStudySession
      id={video.videoId}
      youtubeId={video.videoId}
      title={video.title || "Local Video"}
      initialNotes={activeNotes.map((n) => ({
        id: n.id,
        timestamp: n.timestamp,
        text: n.content || n.text, // Handle both naming conventions
      }))}
    />
  );
}
