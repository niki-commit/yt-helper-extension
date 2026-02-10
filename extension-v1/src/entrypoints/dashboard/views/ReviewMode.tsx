import { useState, useEffect, useRef } from "react";
import { ArrowLeft, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { NoteWorkspace } from "@/components/NoteWorkspace";
import { Separator } from "@/components/ui/separator";
import { useVideoMetadata } from "@/hooks/useVideoMetadata";
import { getThumbnailUrl } from "@/lib/thumbnail-utils";

interface ReviewModeProps {
  videoId: string;
  onBack: () => void;
}

export function ReviewMode({ videoId, onBack }: ReviewModeProps) {
  const { videoMetadata } = useVideoMetadata(videoId);

  const watchUrl = `https://www.youtube.com/watch?v=${videoId}`;

  return (
    <div className="flex h-full flex-col gap-6">
      {/* Top Navbar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={onBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Library
          </Button>
          <Separator orientation="vertical" className="h-4" />
          <h1 className="max-w-[500px] truncate text-xl font-semibold tracking-tight">
            {videoMetadata?.title || "Video Details"}
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-primary border-primary/20 bg-primary/5 hover:bg-primary/10 hover:border-primary/30 gap-2"
          onClick={() => window.open(watchUrl, "_blank")}
        >
          <ExternalLink className="h-4 w-4" />
          Watch on YouTube
        </Button>
      </div>

      <div className="flex flex-1 gap-8 overflow-hidden">
        {/* Left: Video Info Card */}
        <div className="flex w-[320px] shrink-0 flex-col gap-4 overflow-y-auto pr-2">
          <div className="bg-card group relative aspect-video overflow-hidden rounded-xl border shadow-sm">
            {videoMetadata?.thumbnail_url ? (
              <img
                src={getThumbnailUrl(videoMetadata.thumbnail_url)}
                alt={videoMetadata.title}
                className="h-full w-full object-cover transition-transform group-hover:scale-105"
              />
            ) : (
              <div className="bg-muted flex h-full w-full items-center justify-center">
                <span className="text-muted-foreground text-xs">
                  No Thumbnail
                </span>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
              <Button
                variant="secondary"
                size="sm"
                className="gap-2"
                onClick={() => window.open(watchUrl, "_blank")}
              >
                <ExternalLink className="h-4 w-4" />
                Open
              </Button>
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="text-muted-foreground text-sm font-semibold tracking-wider uppercase">
              Video Metadata
            </h3>
            <div className="bg-muted/30 space-y-3 rounded-lg border p-4">
              <div className="space-y-1">
                <span className="text-muted-foreground/70 text-[10px] font-bold uppercase">
                  Video ID
                </span>
                <p className="truncate font-mono text-xs">{videoId}</p>
              </div>
              {videoMetadata?.author && (
                <div className="space-y-1">
                  <span className="text-muted-foreground/70 text-[10px] font-bold uppercase">
                    Author
                  </span>
                  <p className="truncate text-sm font-medium">
                    {videoMetadata.author}
                  </p>
                </div>
              )}
              <div className="text-muted-foreground pt-2 text-[11px] leading-relaxed italic">
                You can capture more notes by opening this video in YouTube. All
                captured notes will sync here instantly.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Management Workspace */}
        <div className="bg-card relative flex flex-1 flex-col overflow-hidden rounded-xl border shadow-md">
          <div className="bg-primary/20 absolute top-0 right-0 left-0 h-1" />
          <div className="flex-1 overflow-hidden p-6">
            <NoteWorkspace
              videoId={videoId}
              isDashboard={true}
              onSaveComplete={() => {}}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
