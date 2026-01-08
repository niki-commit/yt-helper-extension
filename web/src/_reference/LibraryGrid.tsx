"use client";

import { useState, useMemo } from "react";
import { Search, X, Library, Monitor, Cloud } from "lucide-react";
import { VideoCard } from "./VideoCard";
import { useExtensionSync } from "@/hooks/useExtensionSync";

interface VideoData {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl?: string | null;
  lastWatchedAt: Date;
  isLocal?: boolean;
  _count: {
    notes: number;
  };
}

interface LibraryGridProps {
  initialVideos: VideoData[];
}

export function LibraryGrid({ initialVideos }: LibraryGridProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { localVideos: rawLocalVideos, isConnected } = useExtensionSync();

  const allVideos = useMemo(() => {
    // 1. Convert local extension videos to our internal format
    const localVideos = rawLocalVideos || [];
    console.log(
      `VideoNotes Bridge: Found ${localVideos.length} raw videos in IndexedDB`
    );

    const activeVideos = Array.isArray(localVideos)
      ? localVideos.filter(
          (v) => v.bookmarkTime != null || (v._count?.notes ?? 0) > 0
        )
      : [];

    console.log(
      `VideoNotes Bridge: Sending ${activeVideos.length} videos (after Smart Filter) to Dashboard`
    );

    const localMapped: VideoData[] = activeVideos.map((lv) => ({
      id: lv.videoId, // Use videoId as temporary ID for local
      youtubeId: lv.videoId,
      title: lv.title || "Untitled Video",
      thumbnailUrl: lv.thumbnailUrl,
      lastWatchedAt: lv.lastVisitedAt
        ? new Date(lv.lastVisitedAt)
        : new Date(0),
      isLocal: true,
      _count: {
        notes: lv._count?.notes || 0,
      },
    }));

    // 2. Merge with cloud videos
    // Avoid duplicates if a video is both local and cloud
    const cloudIds = new Set(initialVideos.map((v) => v.youtubeId));
    const uniqueLocal = localMapped.filter((lv) => !cloudIds.has(lv.youtubeId));

    const merged = [...initialVideos, ...uniqueLocal];

    // 3. Sort by lastWatched
    return merged.sort(
      (a, b) => b.lastWatchedAt.getTime() - a.lastWatchedAt.getTime()
    );
  }, [initialVideos, rawLocalVideos]);

  const filteredVideos = useMemo(() => {
    return allVideos.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, allVideos]);

  return (
    <div className="space-y-10">
      {/* Search Bar & Sync Status */}
      <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
        <div className="group relative max-w-xl flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-zinc-400 transition-colors group-focus-within:text-indigo-500" />
          </div>
          <input
            type="text"
            placeholder="Search your study collection..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full rounded-2xl border border-zinc-200 bg-white/50 py-4 pr-12 pl-12 text-sm text-zinc-900 placeholder-zinc-500 shadow-sm backdrop-blur-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 dark:placeholder-zinc-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 transition-colors hover:text-zinc-600 dark:hover:text-zinc-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>

        {isConnected ? (
          <div className="flex items-center gap-4">
            {rawLocalVideos.length > 0 && (
              <div className="animate-in fade-in slide-in-from-right-4 flex items-center gap-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-2 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400">
                <Monitor className="h-4 w-4" />
                <span className="text-xs font-bold">
                  Detected {rawLocalVideos.length} local sessions
                </span>
              </div>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => {
                  console.log("Debug: Triggering CustomEvent");
                  window.dispatchEvent(
                    new CustomEvent("VN_REQUEST_LOCAL_VIDEOS")
                  );
                }}
                className="rounded bg-red-100 px-2 py-1 text-xs text-red-600"
              >
                Force CustomEvent
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 text-xs font-bold text-zinc-500 transition-colors hover:text-indigo-600 dark:text-zinc-400 dark:hover:text-indigo-400"
              >
                Refresh Sync
              </button>
            </div>
          </div>
        ) : (
          <div className="flex animate-pulse items-center gap-2 rounded-xl border border-amber-100 bg-amber-50 px-4 py-2 text-amber-600 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-400">
            <Monitor className="h-4 w-4" />
            <span className="text-xs font-bold">Extension not detected</span>
            <button
              onClick={() => {
                console.log("Debug: Triggering Ping");
                window.postMessage(
                  { source: "VN_DASHBOARD", type: "PING" },
                  "*"
                );
              }}
              className="ml-2 text-[10px] underline"
            >
              Ping
            </button>
          </div>
        )}
      </div>

      {/* Grid */}
      {filteredVideos.length > 0 ? (
        <div className="animate-in fade-in slide-in-from-bottom-4 grid grid-cols-1 gap-8 duration-700 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              youtubeId={video.youtubeId}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              noteCount={video._count.notes}
              lastWatchedAt={video.lastWatchedAt}
              isLocal={video.isLocal}
            />
          ))}
        </div>
      ) : (
        /* Empty Search State */
        <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-24 text-center duration-300 dark:border-zinc-800 dark:bg-zinc-950/20">
          <div className="mb-6 rounded-2xl border border-zinc-100 bg-white p-5 shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
            <Search className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            No matches found
          </h2>
          <p className="mx-auto mt-2 max-w-xs text-zinc-600 dark:text-zinc-400">
            We couldn't find any videos matching "
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {searchQuery}
            </span>
            ". Try a different term.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-6 text-sm font-bold text-indigo-600 hover:underline dark:text-indigo-400"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
