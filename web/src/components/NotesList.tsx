"use client";

import { useState, useMemo } from "react";
import {
  Search,
  X,
  Clock,
  ExternalLink,
  FileText,
  Monitor,
  Cloud,
} from "lucide-react";
import Link from "next/link";
import { useExtensionSync } from "@/hooks/useExtensionSync";

interface Note {
  id: string;
  videoId: string;
  videoTitle?: string;
  timestamp: number;
  text: string;
  updatedAt: number;
  isLocal?: boolean;
}

interface NotesListProps {
  initialCloudNotes: Note[];
}

export function NotesList({ initialCloudNotes }: NotesListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { allLocalNotes, localVideos, isConnected } = useExtensionSync();

  const allNotes = useMemo(() => {
    // 1. Process local notes
    const localMapped: Note[] = allLocalNotes.map((ln) => {
      const video = localVideos.find((v) => v.videoId === ln.videoId);
      return {
        id: ln.id,
        videoId: ln.videoId,
        videoTitle: video?.title || "Local Video",
        timestamp: ln.timestamp,
        text: ln.content || ln.text, // Handle both naming conventions
        updatedAt: ln.updatedAt,
        isLocal: true,
      };
    });

    // 2. Merge with cloud notes
    // Deduplicate: If duplicate ID found in cloud list, prefer cloud version.
    const cloudIds = new Set(initialCloudNotes.map((n) => n.id));
    const uniqueLocal = localMapped.filter((n) => !cloudIds.has(n.id));

    const merged = [...initialCloudNotes, ...uniqueLocal];

    // 3. Sort by updatedAt descending
    return merged.sort((a, b) => b.updatedAt - a.updatedAt);
  }, [initialCloudNotes, allLocalNotes, localVideos]);

  const filteredNotes = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return allNotes.filter(
      (note) =>
        note.text.toLowerCase().includes(query) ||
        note.videoTitle?.toLowerCase().includes(query)
    );
  }, [searchQuery, allNotes]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="space-y-8">
      {/* Search Header */}
      <div className="relative group max-w-2xl">
        <div className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none">
          <Search className="h-5 w-5 text-zinc-400 group-focus-within:text-indigo-500 transition-colors" />
        </div>
        <input
          type="text"
          placeholder="Search through all your notes..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="block w-full rounded-2xl border border-zinc-200 bg-white/50 py-4 pl-12 pr-12 text-sm text-zinc-900 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 transition-all backdrop-blur-sm shadow-sm"
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
      <div className="flex items-center gap-4 text-xs font-bold text-zinc-500 uppercase tracking-widest">
        <span className="flex items-center gap-1.5">
          <FileText className="w-3.5 h-3.5" />
          {allNotes.length} Total Notes
        </span>
        {isConnected && (
          <>
            <span className="w-1 h-1 rounded-full bg-zinc-300" />
            <span className="text-indigo-500">Live Extension Sync Active</span>
          </>
        )}
      </div>

      {/* Notes Grid/List */}
      <div className="grid gap-6">
        {filteredNotes.map((note) => (
          <div
            key={note.id}
            className="group relative flex flex-col p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 hover:shadow-2xl hover:shadow-indigo-500/5 transition-all duration-300 overflow-hidden"
          >
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex-1 space-y-3">
                {/* Video Info Header */}
                <div className="flex items-center gap-3">
                  <span
                    className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter border ${
                      note.isLocal
                        ? "bg-zinc-50 text-zinc-500 border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
                        : "bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
                    }`}
                  >
                    {note.isLocal ? (
                      <Monitor className="w-3 h-3" />
                    ) : (
                      <Cloud className="w-3 h-3" />
                    )}
                    {note.isLocal ? "Local" : "Synced"}
                  </span>
                  <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50 line-clamp-1 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {note.videoTitle}
                  </h3>
                </div>

                {/* Note content */}
                <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-sm whitespace-pre-wrap">
                  {note.text}
                </p>

                {/* Timestamp & Meta */}
                <div className="flex items-center gap-4 text-xs font-medium text-zinc-500">
                  <div className="flex items-center gap-1.5 font-mono text-indigo-500 bg-indigo-50 dark:bg-indigo-900/20 px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/10">
                    <Clock className="w-3.5 h-3.5" />
                    {formatTime(note.timestamp)}
                  </div>
                  <span>{new Date(note.updatedAt).toLocaleDateString()}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <Link
                href={`/dashboard/videos/${note.videoId}?t=${note.timestamp}`}
                className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-zinc-900 text-white dark:bg-white dark:text-black font-bold text-sm hover:scale-105 transition-all shadow-xl"
              >
                Jump to Moment
                <ExternalLink className="w-4 h-4" />
              </Link>
            </div>

            {/* Background Hint */}
            <div className="absolute right-0 bottom-0 opacity-[0.03] p-4 pointer-events-none">
              <FileText className="w-24 h-24" />
            </div>
          </div>
        ))}

        {filteredNotes.length === 0 && (
          <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl opacity-40">
            <Search className="w-12 h-12 mb-4" />
            <p className="font-bold">No notes match your search</p>
          </div>
        )}
      </div>
    </div>
  );
}
