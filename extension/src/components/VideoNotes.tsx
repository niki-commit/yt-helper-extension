import React, { useEffect, useState } from "react";
import { browser } from "wxt/browser";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { localStore } from "@/storage/dexie";
import { Note } from "@/storage/types";
import {
  getCurrentTime,
  seekTo,
  formatTime,
  pauseVideo,
  playVideo,
  waitForPlayer,
  isAdRunning,
} from "@/utils/youtube";
import {
  Bookmark,
  Play,
  Pause,
  Save,
  Trash2,
  Plus,
  Search,
  Pencil,
  Download,
  X,
  Clock,
} from "lucide-react";
import { v4 as uuidv4 } from "uuid";

interface VideoNotesProps {
  videoId: string;
  isMobile?: boolean; // New prop for responsive mode
}

export default function VideoNotes({
  videoId,
  isMobile = false,
}: VideoNotesProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [currentTimestamp, setCurrentTimestamp] = useState(0);
  const [noteText, setNoteText] = useState("");
  const [hasBookmark, setHasBookmark] = useState(false);
  const [bookmarkTime, setBookmarkTime] = useState<number | null>(null);

  // New features state
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");

  const [isAdActive, setIsAdActive] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(isMobile); // Default collapsed on mobile
  const [isExternalNoteActive, setIsExternalNoteActive] = useState(false);
  const [isBookmarkedFlash, setIsBookmarkedFlash] = useState(false);

  useEffect(() => {
    const handleExpand = () => {
      if (isCollapsed) setIsCollapsed(false);
    };

    const handleNoteUpdated = (e: any) => {
      if (e.detail?.videoId === videoId) {
        loadNotes();
        checkBookmark();
      }
    };

    window.addEventListener("yt-helper-expand-notes", handleExpand);
    window.addEventListener("yt-helper-note-updated", handleNoteUpdated);

    return () => {
      window.removeEventListener("yt-helper-expand-notes", handleExpand);
      window.removeEventListener("yt-helper-note-updated", handleNoteUpdated);
    };
  }, [videoId, isCollapsed]);

  useEffect(() => {
    loadNotes();
    checkBookmark();

    // Ad detection loop
    const adCheckInterval = setInterval(() => {
      try {
        if (!browser.runtime?.id) {
          clearInterval(adCheckInterval);
          return;
        }
        const adRunning = isAdRunning();
        setIsAdActive(adRunning);
      } catch (e) {
        clearInterval(adCheckInterval);
      }
    }, 1000);

    const handleNoteStatus = (e: any) => {
      if (e.detail?.status === "open") setIsExternalNoteActive(true);
      else setIsExternalNoteActive(false);
    };

    const handleBookmarkUpdated = (e: any) => {
      if (e.detail?.videoId === videoId) {
        setHasBookmark(e.detail.hasBookmark);
        setBookmarkTime(e.detail.bookmarkTime);
      }
    };

    window.addEventListener("yt-helper-note-status", handleNoteStatus);
    window.addEventListener(
      "yt-helper-bookmark-updated",
      handleBookmarkUpdated
    );

    return () => {
      window.removeEventListener("yt-helper-note-status", handleNoteStatus);
      window.removeEventListener(
        "yt-helper-bookmark-updated",
        handleBookmarkUpdated
      );
      clearInterval(adCheckInterval);
    };
  }, [videoId]);

  const loadNotes = async () => {
    try {
      const loaded = await localStore.getNotes(videoId);
      setNotes(loaded);
      // Sort by timestamp descending (latest in video first)
      // const sorted = [...loaded].sort((a, b) => b.timestamp - a.timestamp);
      // setNotes(sorted);
    } catch (err) {
      // Silently fail or handle gracefully in production
    }
  };

  const checkBookmark = async () => {
    const video = await localStore.getVideo(videoId);
    if (
      video &&
      video.bookmarkTimestamp !== null &&
      video.bookmarkTimestamp !== undefined
    ) {
      setHasBookmark(true);
      setBookmarkTime(video.bookmarkTimestamp);
    } else {
      setHasBookmark(false);
      setBookmarkTime(null);
    }
  };

  const handleAddNote = async () => {
    if (isAdActive) return;

    // Wait for player to be ready before capturing timestamp
    const isReady = await waitForPlayer();
    if (!isReady) {
      console.warn("Player not ready, cannot add note");
      return;
    }

    const time = getCurrentTime();
    setCurrentTimestamp(time);
    setNoteText("");
    setIsAdding(true);
    pauseVideo();
    window.dispatchEvent(
      new CustomEvent("yt-helper-note-status", { detail: { status: "open" } })
    );
  };

  const handleSaveNote = async () => {
    if (!noteText.trim()) return;

    const newNote: Note = {
      id: uuidv4(),
      videoId: videoId,
      timestamp: currentTimestamp,
      text: noteText,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    try {
      // Capture video metadata for better sync/gallery display
      const title = document.title.replace(" - YouTube", "") || "YouTube Video";
      const channelName =
        document
          .querySelector("ytd-video-owner-renderer #channel-name a")
          ?.textContent?.trim() ||
        (
          document.querySelector(
            '[itemprop="author"] [itemprop="name"]'
          ) as HTMLMetaElement
        )?.content ||
        "";
      const video = await localStore.getVideo(videoId);
      await localStore.saveVideo({
        ...video,
        videoId: videoId,
        title: title,
        channelName: channelName,
        thumbnailUrl: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
        lastVisitedAt: Date.now(),
      });

      await localStore.saveNote(newNote);
      await loadNotes();
      setIsAdding(false);
      window.dispatchEvent(
        new CustomEvent("yt-helper-note-status", {
          detail: { status: "closed" },
        })
      );
      playVideo();
    } catch (err) {
      console.error("Failed to save note:", err);
    }
  };

  const handleCancelNote = () => {
    setIsAdding(false);
    window.dispatchEvent(
      new CustomEvent("yt-helper-note-status", { detail: { status: "closed" } })
    );
    playVideo();
  };

  const handleDeleteNote = async (id: string) => {
    await localStore.deleteNote(id);
    await loadNotes();
  };

  const handleNoteClick = (timestamp: number) => {
    if (isAdActive) return;
    seekTo(timestamp);
  };

  const startEditing = (note: Note) => {
    if (isAdActive) return;
    setEditingId(note.id);
    setEditingText(note.text);
    pauseVideo();
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingText("");
    playVideo();
  };

  const handleUpdateNote = async (id: string) => {
    const note = notes.find((n) => n.id === id);
    if (!note || !editingText.trim()) return;

    const updatedNote: Note = {
      ...note,
      text: editingText,
      updatedAt: Date.now(),
    };

    try {
      await localStore.saveNote(updatedNote);
      await loadNotes();
      setEditingId(null);
      setEditingText("");
      playVideo();
    } catch (err) {
      // Handle error
    }
  };

  const handleExport = () => {
    if (notes.length === 0) return;

    const title = document.title.replace(" - YouTube", "") || "Video Notes";
    const url = window.location.href.split("&")[0];

    let md = `# Notes for: ${title}\n`;
    md += `Source: ${url}\n`;
    if (bookmarkTime !== null) {
      const timestamp = formatTime(bookmarkTime);
      const seekUrl = `${url}&t=${Math.floor(bookmarkTime)}s`;
      md += `Bookmark: [${timestamp}](${seekUrl})\n`;
    }
    md += `\n`;

    notes.forEach((note) => {
      const timestamp = formatTime(note.timestamp);
      const seekUrl = `${url}&t=${Math.floor(note.timestamp)}s`;
      md += `### [${timestamp}](${seekUrl})\n${note.text}\n\n`;
    });

    const blob = new Blob([md], { type: "text/markdown" });
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}_notes.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
  };

  const filteredNotes = notes.filter((n) =>
    n.text.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const updateBookmark = async () => {
    if (isAdActive) return;

    // Wait for player to be ready before capturing timestamp
    const isReady = await waitForPlayer();
    if (!isReady) {
      console.warn("Player not ready, cannot set bookmark");
      return;
    }

    const time = getCurrentTime();
    await localStore.setBookmark(videoId, time);
    setHasBookmark(true);
    setBookmarkTime(time);

    // Trigger Success Flash
    setIsBookmarkedFlash(true);
    setTimeout(() => setIsBookmarkedFlash(false), 800);

    window.dispatchEvent(
      new CustomEvent("yt-helper-bookmark-updated", {
        detail: { videoId, hasBookmark: true, bookmarkTime: time },
      })
    );
  };

  const deleteBookmark = async () => {
    if (isAdActive) return;
    await localStore.setBookmark(videoId, null);
    setHasBookmark(false);
    setBookmarkTime(null);
    window.dispatchEvent(
      new CustomEvent("yt-helper-bookmark-updated", {
        detail: { videoId, hasBookmark: false, bookmarkTime: null },
      })
    );
  };

  const resumeVideo = () => {
    if (isAdActive) return;
    if (bookmarkTime !== null) {
      seekTo(bookmarkTime);
    }
  };

  // Toggle collapse
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div
      onKeyDown={(e) => e.stopPropagation()}
      onKeyUp={(e) => e.stopPropagation()}
      className={`my-6 w-full mx-auto font-sans text-[13px] antialiased text-zinc-200 selection:bg-indigo-500/30 ${
        isMobile ? "max-w-full px-4" : "max-w-[450px]"
      }`}
    >
      <Card className="w-full border-zinc-200/15 bg-[#020617] shadow-[0_12px_40px_rgba(0,0,0,0.6)] overflow-hidden rounded-2xl relative">
        {/* Ad Overlay */}
        {isAdActive && (
          <div className="absolute inset-0 z-50 bg-black/70 backdrop-blur-lg flex flex-col items-center justify-center p-8 text-center animate-in fade-in zoom-in-95 duration-500">
            <div className="w-16 h-16 rounded-3xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mb-6 rotate-3 hover:rotate-0 transition-transform">
              <X className="w-8 h-8 text-amber-500" />
            </div>
            <h3 className="text-2xl font-black tracking-tight text-white mb-2">
              Viewing Advertisement
            </h3>
            <p className="text-sm text-zinc-400 max-w-[260px] leading-relaxed">
              Note-taking is temporarily paused to keep your timeline accurate.
            </p>
          </div>
        )}

        <CardHeader
          className={`p-5 border-b border-zinc-200/5 flex flex-row items-center justify-between space-y-0 bg-white/3 ${
            isMobile ? "cursor-pointer" : ""
          }`}
          onClick={isMobile ? toggleCollapse : undefined}
        >
          <div className="flex items-center gap-3">
            <CardTitle className="text-2xl font-black tracking-tighter text-white flex items-center gap-2">
              Video<span className="text-indigo-500">Notes</span>
              {isMobile && (
                <span className="text-xs text-zinc-500 font-normal ml-2">
                  {isCollapsed ? "(Tap to expand)" : "(Tap to collapse)"}
                </span>
              )}
            </CardTitle>
            <div className="px-2.5 py-0.5 rounded-full bg-zinc-800 text-[10px] font-black text-indigo-400 border border-indigo-500/20">
              {notes.length}
            </div>
          </div>

          <div
            className="flex items-center gap-2"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Only show buttons if not collapsed or on desktop */}
            {(!isMobile || !isCollapsed) && (
              <>
                {hasBookmark && (
                  <div className="flex items-center group/resume">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={resumeVideo}
                      className="h-9 px-4 text-[11px] font-black uppercase tracking-[0.05em] border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 hover:text-white transition-all rounded-l-xl rounded-r-none border-r-0 gap-2 group"
                      disabled={isAdActive}
                    >
                      <Play className="w-4 h-4 fill-current group-hover:scale-110 transition-transform" />
                      Resume {bookmarkTime ? formatTime(bookmarkTime) : ""}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteBookmark();
                      }}
                      className="h-9 w-8 border-zinc-800 bg-zinc-900/50 hover:bg-red-500/10 hover:text-red-500 transition-all rounded-r-xl rounded-l-none border-l-0 text-zinc-500"
                      disabled={isAdActive}
                      title="Delete Bookmark"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                <Button
                  variant={isBookmarkedFlash ? "default" : "ghost"}
                  size="icon"
                  className={`h-9 w-9 rounded-xl transition-all duration-300 ${
                    isBookmarkedFlash
                      ? "bg-indigo-600 text-white scale-110 shadow-[0_0_20px_rgba(79,70,229,0.5)]"
                      : "text-zinc-300 hover:text-white hover:bg-zinc-800 border border-transparent hover:border-zinc-700"
                  }`}
                  onClick={updateBookmark}
                  title={
                    hasBookmark
                      ? "Update Bookmark to current time"
                      : "Bookmark Moment"
                  }
                  disabled={isAdActive}
                >
                  <Bookmark
                    className={`h-5 w-5 transition-all duration-300 ${
                      isBookmarkedFlash && !isAdActive
                        ? "fill-current text-white scale-110"
                        : "text-zinc-400"
                    }`}
                  />
                </Button>

                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 rounded-xl text-zinc-300 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
                  onClick={handleExport}
                  title="Export as Markdown"
                  disabled={notes.length === 0 || isAdActive}
                >
                  <Download className="h-5 w-5" />
                </Button>

                <Button
                  size="sm"
                  onClick={handleAddNote}
                  className="h-9 px-4 gap-2 bg-white text-black hover:bg-zinc-200 font-extrabold text-[11px] uppercase tracking-wider rounded-xl shadow-lg disabled:opacity-50 ml-1 transition-all active:scale-95"
                  disabled={isAdActive || isExternalNoteActive}
                  title={
                    isAdActive
                      ? "Disabled during ads"
                      : isExternalNoteActive
                      ? "Note already in progress"
                      : "Add Note"
                  }
                >
                  <Plus className="h-4 w-4 stroke-[3px]" /> Note
                </Button>
              </>
            )}
          </div>
        </CardHeader>

        {(!isMobile || !isCollapsed) && (
          <div className="animate-in slide-in-from-top-2 duration-300">
            <CardContent className="p-0">
              {/* Search Bar Area */}
              <div className="p-5 bg-black/40 border-b border-zinc-200/10">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-300 group-focus-within:text-indigo-400 transition-colors" />
                  <Input
                    type="search"
                    placeholder="Search through notes..."
                    className="pl-12 h-12 text-sm font-medium text-white bg-zinc-950/50 border-zinc-800 focus:border-indigo-500/50 focus:ring-0 rounded-xl transition-all placeholder:text-zinc-400 shadow-inner"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    disabled={isAdActive}
                  />
                </div>
              </div>

              <ScrollArea className="h-[480px]">
                <div className="p-5 space-y-4">
                  {isAdding && (
                    <div className="space-y-4 border border-indigo-500/25 rounded-2xl p-5 bg-indigo-500/5 animate-in slide-in-from-top-4 duration-500">
                      <div className="flex items-center gap-2.5 text-[10px] font-black uppercase tracking-[0.25em] text-indigo-400">
                        <Clock className="w-3.5 h-3.5" />
                        Moment: {formatTime(currentTimestamp)}
                      </div>
                      <div className="relative">
                        <Textarea
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          placeholder="Capture your thought..."
                          maxLength={1000}
                          className="min-h-[110px] text-[14px] leading-relaxed bg-zinc-950/50 border-zinc-800/80 focus:border-indigo-500/50 focus:ring-0 rounded-xl resize-none placeholder:text-zinc-700 pr-12"
                          autoFocus
                          onFocus={(e) =>
                            e.currentTarget.setSelectionRange(
                              e.currentTarget.value.length,
                              e.currentTarget.value.length
                            )
                          }
                          onKeyDown={(
                            e: React.KeyboardEvent<HTMLTextAreaElement>
                          ) => {
                            if (e.key === "Enter" && e.ctrlKey)
                              handleSaveNote();
                            if (e.key === "Escape") handleCancelNote();
                          }}
                        />
                        <div
                          className={`absolute bottom-3 right-3 text-[10px] font-bold ${
                            noteText.length >= 1000
                              ? "text-red-500"
                              : "text-zinc-500"
                          }`}
                        >
                          {noteText.length}/1000
                        </div>
                      </div>
                      <div className="flex justify-end gap-2.5">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={handleCancelNote}
                          className="h-9 px-5 text-xs font-bold text-zinc-500 hover:text-white transition-colors"
                        >
                          Discard
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleSaveNote}
                          className="h-9 px-6 text-xs font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl gap-2 shadow-[0_4px_15px_rgba(79,70,229,0.3)] transition-all active:scale-95"
                        >
                          <Save className="h-4 w-4" /> Save
                        </Button>
                      </div>
                    </div>
                  )}

                  {notes.length === 0 && !isAdding && (
                    <div className="flex flex-col items-center justify-center py-24 text-center opacity-20">
                      <div className="w-16 h-16 rounded-full border-2 border-dashed border-zinc-700 flex items-center justify-center mb-5 animate-pulse">
                        <Search className="w-7 h-7 text-zinc-600" />
                      </div>
                      <p className="text-[12px] font-black uppercase tracking-[0.2em] text-zinc-400">
                        Insight Vault Empty
                      </p>
                    </div>
                  )}

                  <div className="space-y-1.5">
                    {filteredNotes.map((note) => (
                      <div
                        key={note.id}
                        className="group relative p-4 rounded-xl transition-all duration-300 hover:bg-white/4 border border-transparent hover:border-zinc-800/60"
                      >
                        <div className="flex items-start gap-4">
                          {/* Left: Timestamp */}
                          <button
                            onClick={() => handleNoteClick(note.timestamp)}
                            disabled={isAdActive}
                            className="shrink-0 mt-0.5 px-2 py-1 bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 font-mono text-[11px] font-bold rounded-md transition-all border border-indigo-500/10 hover:border-indigo-500/30"
                          >
                            {formatTime(note.timestamp)}
                          </button>

                          <div className="grow min-w-0">
                            {editingId === note.id ? (
                              <div className="space-y-3 animate-in fade-in duration-300">
                                <div className="relative">
                                  <Textarea
                                    value={editingText}
                                    onChange={(e) =>
                                      setEditingText(e.target.value)
                                    }
                                    maxLength={1000}
                                    className="min-h-[90px] text-[14px] leading-relaxed bg-zinc-950 border-zinc-800 focus:border-indigo-500 focus:ring-0 rounded-xl resize-none pr-12"
                                    autoFocus
                                    onFocus={(e) =>
                                      e.currentTarget.setSelectionRange(
                                        e.currentTarget.value.length,
                                        e.currentTarget.value.length
                                      )
                                    }
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" && e.ctrlKey)
                                        handleUpdateNote(note.id);
                                      if (e.key === "Escape") cancelEditing();
                                    }}
                                  />
                                  <div
                                    className={`absolute bottom-3 right-3 text-[10px] font-bold ${
                                      editingText.length >= 1000
                                        ? "text-red-500"
                                        : "text-zinc-500"
                                    }`}
                                  >
                                    {editingText.length}/1000
                                  </div>
                                </div>
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={cancelEditing}
                                    className="h-8 px-4 text-[11px] font-bold text-zinc-500 hover:text-white"
                                  >
                                    Discard
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => handleUpdateNote(note.id)}
                                    className="h-8 px-5 text-[11px] font-black bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg"
                                  >
                                    Confirm
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <p className="text-[14px] leading-relaxed text-zinc-200/90 group-hover:text-white transition-colors whitespace-pre-wrap">
                                  {note.text}
                                </p>

                                <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-all duration-500 translate-y-1 group-hover:translate-y-0">
                                  <button
                                    onClick={() => startEditing(note)}
                                    disabled={isAdActive}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-indigo-400 transition-colors"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    disabled={isAdActive}
                                    className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 hover:text-red-500 transition-colors"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                    <span>Delete</span>
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="h-8 w-full" />
              </ScrollArea>
            </CardContent>
          </div> // End of slide-in animation wrapper
        )}
      </Card>

      {/* Footer Vibe */}
      <div className="mt-4 px-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.2em] text-zinc-600">
        <span>Learning session</span>
        <div className="flex items-center gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)] animate-pulse" />
          Live Sync Cloud
        </div>
      </div>
    </div>
  );
}
