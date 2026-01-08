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
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <Loader2 className="mb-4 h-10 w-10 animate-spin text-indigo-500" />
        <p className="font-medium text-zinc-400">
          Detecting local video data...
        </p>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-zinc-950 p-8 text-center text-white">
        <Monitor className="mb-6 h-16 w-16 text-zinc-700" />
        <h2 className="mb-2 text-2xl font-bold">Video not found locally</h2>
        <p className="max-w-md text-zinc-400">
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
