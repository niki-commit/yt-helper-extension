"use client";

import { useState, useMemo } from "react";
import { Search, X, Library } from "lucide-react";
import { VideoCard } from "./VideoCard";

interface VideoData {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl?: string | null;
  lastWatchedAt: Date;
  _count: {
    notes: number;
  };
}

interface GalleryGridProps {
  initialVideos: VideoData[];
}

export function GalleryGrid({ initialVideos }: GalleryGridProps) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredVideos = useMemo(() => {
    return initialVideos.filter((video) =>
      video.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery, initialVideos]);

  return (
    <div className="space-y-10">
      {/* Search Bar */}
      <div className="relative max-w-xl group">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search your study collection..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-2xl border border-zinc-200 bg-white/50 py-4 pl-12 pr-12 text-sm text-zinc-900 placeholder-zinc-500 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 dark:placeholder-zinc-400 transition-all backdrop-blur-sm shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Grid */}
      {filteredVideos.length > 0 ? (
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-700">
          {filteredVideos.map((video) => (
            <VideoCard
              key={video.id}
              id={video.id}
              youtubeId={video.youtubeId}
              title={video.title}
              thumbnailUrl={video.thumbnailUrl}
              noteCount={video._count.notes}
              lastWatchedAt={new Date(video.lastWatchedAt)}
            />
          ))}
        </div>
      ) : (
        /* Empty Search State */
        <div className="flex flex-col items-center justify-center py-24 px-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-center animate-in fade-in zoom-in duration-300">
          <div className="p-5 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 mb-6">
            <Search className="h-10 w-10 text-zinc-300 dark:text-zinc-700" />
          </div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
            No matches found
          </h2>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400 max-w-xs mx-auto">
            We couldn't find any videos matching "
            <span className="font-semibold text-zinc-900 dark:text-zinc-50">
              {searchQuery}
            </span>
            ". Try a different term.
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-6 text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            Clear search
          </button>
        </div>
      )}
    </div>
  );
}
