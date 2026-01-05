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
    <div className="flex flex-col h-[calc(100vh-64px)] overflow-hidden bg-white dark:bg-zinc-950">
      {/* Top Header Bar */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800 bg-white/50 dark:bg-zinc-900/50 backdrop-blur-md z-10">
        <div className="flex items-center gap-4 min-w-0">
          <Link
            href="/dashboard/library"
            className="p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors text-zinc-500"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div className="min-w-0">
            <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-50 truncate">
              {title}
            </h1>
            <div className="flex items-center gap-2 text-xs font-medium text-zinc-500 uppercase tracking-widest">
              <span>Deep Focus Mode</span>
              <span className="w-1 h-1 rounded-full bg-zinc-300" />
              <span className="text-indigo-500 font-bold">
                {notes.length} Notes
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsEditorOpen(!isEditorOpen)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all ${
              isEditorOpen
                ? "bg-indigo-50 text-indigo-600 border border-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-400 dark:border-indigo-800"
                : "bg-zinc-100 text-zinc-600 border border-zinc-200 dark:bg-zinc-800 dark:text-zinc-400 dark:border-zinc-700"
            }`}
          >
            <Layout className="w-4 h-4" />
            {isEditorOpen ? "Split View" : "Full Player"}
          </button>
        </div>
      </header>

      {/* Main Study Area */}
      <main className="flex-1 flex min-h-0 relative">
        {/* Left Side: Video Player (Occupies 60% or 100%) */}
        <div
          className={`flex-1 transition-all duration-500 ease-in-out bg-black flex items-center justify-center ${
            isEditorOpen ? "lg:flex-[0.6]" : "lg:flex-1"
          }`}
        >
          <div className="w-full aspect-video max-h-full">
            <div id="study-player" className="w-full h-full" />
          </div>
        </div>

        {/* Right Side: Notes & Editor (Occupies 40%) */}
        <aside
          className={`${
            isEditorOpen
              ? "lg:w-[40%] translate-x-0"
              : "w-0 translate-x-full lg:hidden"
          } absolute lg:relative right-0 top-0 bottom-0 transition-all duration-500 ease-in-out border-l border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950 flex flex-col z-20`}
        >
          <div className="flex-1 flex flex-col min-h-0">
            {/* Editor Controls */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-white dark:bg-zinc-900">
              <span className="text-sm font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
                <Type className="w-4 h-4 text-indigo-500" />
                Notes & Timeline
              </span>
              <button className="p-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-500/20 flex items-center gap-2 text-xs font-bold">
                <Plus className="w-4 h-4" />
                New Note
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notes.map((note) => (
                <div
                  key={note.id}
                  className="group p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/30 hover:shadow-xl transition-all duration-300"
                >
                  <div className="flex items-center justify-between mb-3">
                    <button
                      onClick={() => seekTo(note.timestamp)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-xs font-bold border border-indigo-100 dark:border-indigo-900/10 hover:bg-indigo-600 hover:text-white transition-all group-hover:scale-105"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      {formatTime(note.timestamp)}
                    </button>
                    <div className="opacity-0 group-hover:opacity-100 flex items-center gap-2 transition-opacity">
                      <button className="text-[10px] font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200">
                        Edit
                      </button>
                      <button className="text-[10px] font-bold text-red-400 hover:text-red-500">
                        Delete
                      </button>
                    </div>
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
                    {note.text}
                  </p>
                </div>
              ))}

              {notes.length === 0 && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center opacity-40">
                  <Maximize2 className="w-12 h-12 mb-4" />
                  <p className="text-sm font-medium">
                    Capture your first note while watching
                  </p>
                </div>
              )}
            </div>

            {/* Quick Action Bar (Bottom of Editor) */}
            <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
              <div className="relative group">
                <textarea
                  placeholder="Type a note... (Ctrl + S to save at current time)"
                  className="w-full h-32 p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none text-sm transition-all resize-none"
                />
                <div className="absolute bottom-4 right-4 flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 text-[10px] font-bold text-zinc-500">
                    <Clock className="w-3 h-3" />
                    {formatTime(currentTime)}
                  </div>
                  <button className="p-2 rounded-lg bg-indigo-600 text-white shadow-xl shadow-indigo-500/30">
                    <Save className="w-4 h-4" />
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
