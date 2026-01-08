"use client";

import { useState, useRef, useEffect } from "react";
import {
  ArrowLeft,
  Clock,
  Save,
  Type,
  Layout,
  Maximize2,
  ChevronLeft,
  ChevronRight,
  Plus,
  Play,
} from "lucide-react";
import Link from "next/link";
import Script from "next/script";

import { useSearchParams } from "next/navigation";

interface Note {
  id: string;
  timestamp: number;
  text: string;
}

interface VideoStudySessionProps {
  id: string;
  youtubeId: string;
  title: string;
  initialNotes: Note[];
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

export function VideoStudySession({
  id,
  youtubeId,
  title,
  initialNotes,
}: VideoStudySessionProps) {
  const searchParams = useSearchParams();
  const startTime = parseInt(searchParams.get("t") || "0");

  const [notes, setNotes] = useState<Note[]>(initialNotes);

  // Sync notes when initialNotes changes (e.g. after async fetch)
  useEffect(() => {
    setNotes(initialNotes);
  }, [initialNotes]);

  const [currentTime, setCurrentTime] = useState(0);
  const [isEditorOpen, setIsEditorOpen] = useState(true);
  const playerRef = useRef<any>(null);
  const [playerReady, setPlayerReady] = useState(false);

  // Initialize YouTube Player
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      const firstScriptTag = document.getElementsByTagName("script")[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const onPlayerReady = (event: any) => {
      setPlayerReady(true);

      // Auto-seek if timestamp provided
      if (startTime > 0) {
        event.target.seekTo(startTime, true);
        event.target.playVideo();
      }

      // Update time every second
      const interval = setInterval(() => {
        if (event.target && event.target.getCurrentTime) {
          setCurrentTime(event.target.getCurrentTime());
        }
      }, 1000);
      return () => clearInterval(interval);
    };

    window.onYouTubeIframeAPIReady = () => {
      playerRef.current = new window.YT.Player("study-player", {
        videoId: youtubeId,
        playerVars: {
          autoplay: 0,
          modestbranding: 1,
          rel: 0,
        },
        events: {
          onReady: onPlayerReady,
        },
      });
    };

    // If API already loaded but container just re-mounted
    if (window.YT && window.YT.Player && !playerRef.current) {
      window.onYouTubeIframeAPIReady();
    }

    return () => {
      // Cleanup player if needed
    };
  }, [youtubeId]);

  const seekTo = (time: number) => {
    if (playerRef.current && playerRef.current.seekTo) {
      playerRef.current.seekTo(time, true);
      playerRef.current.playVideo();
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col overflow-hidden bg-white dark:bg-zinc-950">
      {/* Top Header Bar */}
      <header className="z-10 flex items-center justify-between border-b border-zinc-200 bg-white/50 px-6 py-4 backdrop-blur-md dark:border-zinc-800 dark:bg-zinc-900/50">
        <div className="flex min-w-0 items-center gap-4">
          <Link
            href="/dashboard/library"
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold text-zinc-900 dark:text-zinc-50">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium tracking-widest text-zinc-500 uppercase">
              <span>Deep Focus Mode</span>
              <span className="h-1 w-1 rounded-full bg-zinc-300" />
              <span className="font-bold text-indigo-500">
                {notes.length} Notes
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-bold transition-all ${
              isEditorOpen
                ? "border border-indigo-100 bg-indigo-50 text-indigo-600 dark:border-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400"
                : "border border-zinc-200 bg-zinc-100 text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400"
            }`}
          >
            <Layout className="h-4 w-4" />
            {isEditorOpen ? "Split View" : "Full Player"}
          </button>
        </div>
      </header>

      {/* Main Study Area */}
      <main className="relative flex min-h-0 flex-1">
        {/* Left Side: Video Player (Occupies 60% or 100%) */}
        <div
          className={`flex flex-1 items-center justify-center bg-black transition-all duration-500 ease-in-out ${
            isEditorOpen ? "lg:flex-[0.6]" : "lg:flex-1"
          }`}
        >
          <div className="aspect-video max-h-full w-full">
            <div id="study-player" className="h-full w-full" />
          </div>
        </div>

        {/* Right Side: Notes & Editor (Occupies 40%) */}
        <aside
          className={`${
            isEditorOpen
              ? "translate-x-0 lg:w-[40%]"
              : "w-0 translate-x-full lg:hidden"
          } absolute top-0 right-0 bottom-0 z-20 flex flex-col border-l border-zinc-200 bg-zinc-50 transition-all duration-500 ease-in-out lg:relative dark:border-zinc-800 dark:bg-zinc-950`}
        >
          <div className="flex min-h-0 flex-1 flex-col">
            {/* Editor Controls */}
            <div className="flex items-center justify-between border-b border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <span className="flex items-center gap-2 text-sm font-bold text-zinc-900 dark:text-zinc-50">
                <Type className="h-4 w-4 text-indigo-500" />
                Notes & Timeline
              </span>
              <button className="flex items-center gap-2 rounded-xl bg-indigo-600 p-2 text-xs font-bold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-700">
                <Plus className="h-4 w-4" />
                New Note
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 space-y-4 overflow-y-auto p-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group rounded-2xl border border-zinc-200 bg-white p-4 transition-all duration-300 hover:border-indigo-500/30 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <button
                      onClick={() => seekTo(note.timestamp)}
                      className="flex items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-1.5 text-xs font-bold text-indigo-600 transition-all group-hover:scale-105 hover:bg-indigo-600 hover:text-white dark:border-indigo-900/10 dark:bg-indigo-900/20 dark:text-indigo-400"
                    >
                      <Clock className="h-3.5 w-3.5" />
                      {formatTime(note.timestamp)}
                    </button>
                    <div className="flex items-center gap-2 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        Edit
                      </button>
                      <button className="text-[10px] font-bold text-red-400 hover:text-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                    {note.text}
                  </p>
                </div>
              ))}

              {notes.length === 0 && (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center opacity-40">
                  <Maximize2 className="mb-4 h-12 w-12" />
                  <p className="text-sm font-medium">
                    Capture your first note while watching
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Bar (Bottom of Editor) */}
            <div className="border-t border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <div className="group relative">
                <textarea
                  placeholder="Type a note... (Ctrl + S to save at current time)"
                  className="h-32 w-full resize-none rounded-2xl border border-zinc-200 bg-zinc-50 p-4 text-sm transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-950"
                />
                <div className="absolute right-4 bottom-4 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-[10px] font-bold text-zinc-500 dark:border-zinc-800 dark:bg-zinc-900">
                    <Clock className="h-3 w-3" />
                    {formatTime(currentTime)}
                  </div>
                  <button className="rounded-lg bg-indigo-600 p-2 text-white shadow-xl shadow-indigo-500/30">
                    <Save className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}
