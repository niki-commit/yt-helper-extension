import { useState, useEffect } from "react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { useGlobalSearch } from "@/hooks/useGlobalSearch";
import { FileText, Video, Bookmark, Search } from "lucide-react";
import { Kbd } from "@/components/ui/kbd";

interface GlobalSearchProps {
  onSelectVideo?: (videoId: string) => void;
  onSelectNote?: (videoId: string, noteId: string) => void;
  onSelectBookmark?: (videoId: string, timestamp: number) => void;
}

export function GlobalSearch({
  onSelectVideo,
  onSelectNote,
  onSelectBookmark,
}: GlobalSearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { groupedResults, isLoading, isEmpty } = useGlobalSearch(query);

  // Keyboard shortcut to open search (Cmd+K or Ctrl+K)
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Reset query when dialog closes
  useEffect(() => {
    if (!open) {
      setQuery("");
    }
  }, [open]);

  const handleSelectVideo = (videoId: string) => {
    setOpen(false);
    onSelectVideo?.(videoId);
  };

  const handleSelectNote = (videoId: string, noteId: string) => {
    setOpen(false);
    onSelectNote?.(videoId, noteId);
  };

  const handleSelectBookmark = (videoId: string, timestamp: number) => {
    setOpen(false);
    onSelectBookmark?.(videoId, timestamp);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <>
      {/* Search Trigger Button */}
      <button
        onClick={() => setOpen(true)}
        className="bg-muted/50 hover:bg-muted text-muted-foreground flex h-9 w-full max-w-md items-center gap-2 rounded-md border px-3 text-sm transition-colors"
      >
        <Search className="size-4 shrink-0 opacity-50" />
        <span className="flex-1 text-left">Search notes, videos...</span>
        <div className="flex items-center gap-1">
          <Kbd>{navigator.platform.includes("Mac") ? "⌘" : "Ctrl"}</Kbd>
          <Kbd>K</Kbd>
        </div>
      </button>

      {/* Command Palette Dialog */}
      <CommandDialog
        open={open}
        onOpenChange={setOpen}
        title="Global Search"
        description="Search through all your notes, videos, and bookmarks"
        shouldFilter={false}
      >
        <CommandInput
          placeholder="Type to search..."
          value={query}
          onValueChange={setQuery}
        />
        <CommandList>
          {isLoading && (
            <div className="py-6 text-center text-sm">Searching...</div>
          )}

          {!isLoading && isEmpty && query.trim().length > 0 && (
            <CommandEmpty>No results found for "{query}"</CommandEmpty>
          )}

          {!isLoading && query.trim().length === 0 && (
            <div className="text-muted-foreground py-6 text-center text-sm">
              Start typing to search across all your content
            </div>
          )}

          {/* Notes Results */}
          {groupedResults.notes.length > 0 && (
            <>
              <CommandGroup heading="Notes">
                {groupedResults.notes.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelectNote(result.videoId, result.id)}
                    className="flex flex-col items-start gap-1"
                  >
                    <div className="flex w-full items-center gap-2">
                      <FileText className="size-4 shrink-0" />
                      <div className="flex-1 truncate">
                        <div className="truncate font-medium">
                          {result.videoTitle}
                        </div>
                        <div className="text-muted-foreground truncate text-xs">
                          {result.channelTitle}
                          {result.timestamp !== undefined && (
                            <> · {formatTime(result.timestamp)}</>
                          )}
                        </div>
                      </div>
                    </div>
                    {result.noteSnippet && (
                      <div className="text-muted-foreground ml-6 line-clamp-2 text-xs">
                        {result.noteSnippet}
                      </div>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Videos Results */}
          {groupedResults.videos.length > 0 && (
            <>
              <CommandGroup heading="Videos">
                {groupedResults.videos.map((result) => (
                  <CommandItem
                    key={result.id}
                    value={result.id}
                    onSelect={() => handleSelectVideo(result.videoId)}
                  >
                    <Video className="size-4 shrink-0" />
                    <div className="flex-1 truncate">
                      <div className="truncate font-medium">
                        {result.videoTitle}
                      </div>
                      <div className="text-muted-foreground truncate text-xs">
                        {result.channelTitle}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
              <CommandSeparator />
            </>
          )}

          {/* Bookmarks Results */}
          {groupedResults.bookmarks.length > 0 && (
            <CommandGroup heading="Bookmarks">
              {groupedResults.bookmarks.map((result) => (
                <CommandItem
                  key={result.id}
                  value={result.id}
                  onSelect={() =>
                    handleSelectBookmark(
                      result.videoId,
                      result.bookmarkTimestamp!
                    )
                  }
                >
                  <Bookmark className="size-4 shrink-0" />
                  <div className="flex-1 truncate">
                    <div className="truncate font-medium">
                      {result.videoTitle}
                    </div>
                    <div className="text-muted-foreground truncate text-xs">
                      {result.channelTitle} ·{" "}
                      {formatTime(result.bookmarkTimestamp!)}
                    </div>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
