"use client";

import { useMemo, useState } from "react";
import {
  Search,
  X,
  Play,
  Monitor,
  Cloud,
  ExternalLink,
  Bookmark,
} from "lucide-react";
import Link from "next/link";
import { useExtensionSync } from "@/hooks/useExtensionSync";
import Image from "next/image";

interface BookmarkItem {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl?: string | null;
  bookmarkTime: number; // Seconds
  updatedAt: number;
  isLocal?: boolean;
}

interface BookmarksListProps {
  initialCloudBookmarks: BookmarkItem[];
}

export function BookmarksList({ initialCloudBookmarks }: BookmarksListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { localVideos, isConnected } = useExtensionSync();

  const allBookmarks = useMemo(() => {
    // 1. Process local bookmarks (videos with bookmarkTimestamp)
    const localMapped: BookmarkItem[] = localVideos
      .filter((v) => v.bookmarkTime != null && v.bookmarkTime > 0)
      .map((v) => ({
        id: v.videoId,
        youtubeId: v.videoId,
        title: v.title,
        thumbnailUrl: v.thumbnailUrl,
        bookmarkTime: v.bookmarkTime || 0,
        updatedAt: v.lastVisitedAt,
        isLocal: true,
      }));

    // 2. Merge with cloud bookmarks
    // Avoid duplicates if a video is present in both (prefer cloud or merge?)
    // For now, simple merge. We might see duplicates if syncing isn't perfect,
    // but the `isLocal` flag helps distinguish.

    // Better strategy: Filter out local ones if they match a cloud one by youtubeId?
    // Let's do simple concat for now to ensure visibility.
    const cloudIds = new Set(initialCloudBookmarks.map((b) => b.youtubeId));
    const uniqueLocal = localMapped.filter((lb) => !cloudIds.has(lb.youtubeId));

    const merged = [...initialCloudBookmarks, ...uniqueLocal];

    // 3. Sort by updatedAt descending (recently bookmarked/visited)
    return merged.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [initialCloudBookmarks, localVideos]);

  const filteredBookmarks = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allBookmarks.filter((b) => b.title.toLowerCase().includes(query));
  }, [searchQuery, allBookmarks]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="group relative max-w-2xl">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className="h-5 w-5 text-zinc-400 transition-colors group-focus-within:text-pink-500" />
        </div>
        <input
          type="text"
          placeholder="Search your bookmarks..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-2xl border border-zinc-200 bg-white/50 py-4 pr-12 pl-12 text-sm text-zinc-900 shadow-sm backdrop-blur-sm transition-all focus:border-pink-500 focus:ring-4 focus:ring-pink-500/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      {/* Stats bar */}
      <div className="flex items-center gap-4 text-xs font-bold tracking-widest text-zinc-500 uppercase">
        <span className="flex items-center gap-1.5">
          <Bookmark className="h-3.5 w-3.5" />
          {allBookmarks.length} Bookmarks
        </span>
        {isConnected && (
          <>
            <span className="h-1 w-1 rounded-full bg-zinc-300" />
            <span className="text-indigo-500">Live Extension Sync Active</span>
          </>
        )}
      </div>

      {/* Bookmarks Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredBookmarks.map((bookmark) => (
          <div
            key={bookmark.id + (bookmark.isLocal ? "_local" : "_cloud")}
            className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-200 bg-white transition-all duration-300 hover:border-pink-500/30 hover:shadow-2xl hover:shadow-pink-500/5 dark:border-zinc-800 dark:bg-zinc-900"
          >
            {/* Thumbnail Header */}
            <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
              {bookmark.thumbnailUrl ? (
                <Image
                  src={bookmark.thumbnailUrl}
                  alt={bookmark.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-zinc-300 dark:text-zinc-700">
                  <Play className="h-12 w-12" />
                </div>
              )}
              <div className="absolute inset-0 bg-linear-to-t from-black/60 to-transparent opacity-60" />

              {/* Source Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className={`flex items-center gap-1 rounded-lg border px-2 py-1 text-[10px] font-black tracking-tighter uppercase backdrop-blur-md ${
                    bookmark.isLocal
                      ? "border-zinc-200/50 bg-white/90 text-zinc-600"
                      : "border-pink-400/50 bg-pink-500/90 text-white"
                  }`}
                >
                  {bookmark.isLocal ? (
                    <Monitor className="h-3 w-3" />
                  ) : (
                    <Cloud className="h-3 w-3" />
                  )}
                  {bookmark.isLocal ? "Local" : "Synced"}
                </span>
              </div>

              {/* Timestamp Badge (Large) */}
              <div className="absolute bottom-4 left-4 flex items-center gap-2">
                <span className="flex items-center gap-1.5 rounded-xl bg-pink-600 px-3 py-1.5 text-sm font-bold text-white shadow-lg shadow-pink-900/20">
                  <Bookmark className="h-3.5 w-3.5 fill-current" />
                  {formatTime(bookmark.bookmarkTime)}
                </span>
              </div>
            </div>

            {/* Content */}
            <div className="flex flex-1 flex-col justify-between p-5">
              <div>
                <h3 className="mb-2 line-clamp-2 leading-tight font-bold text-zinc-900 transition-colors group-hover:text-pink-600 dark:text-zinc-50 dark:group-hover:text-pink-400">
                  {bookmark.title}
                </h3>
                <p className="text-xs text-zinc-500">
                  Saved on {new Date(bookmark.updatedAt).toLocaleDateString()}
                </p>
              </div>

              <Link
                href={`/dashboard/videos/${bookmark.youtubeId}?t=${bookmark.bookmarkTime}`}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-zinc-100 py-3 text-sm font-bold text-zinc-900 transition-all group-hover:shadow-lg group-hover:shadow-pink-500/20 hover:bg-pink-600 hover:text-white dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-pink-500"
              >
                <Play className="h-4 w-4 fill-current" />
                Resume Session
              </Link>
            </div>
          </div>
        ))}
      </div>

      {filteredBookmarks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-zinc-200 py-20 opacity-40 dark:border-zinc-800">
          <Bookmark className="mb-4 h-12 w-12" />
          <p className="font-bold">No bookmarks found</p>
        </div>
      )}
    </div>
  );
}
