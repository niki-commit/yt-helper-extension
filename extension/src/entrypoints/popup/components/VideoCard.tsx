import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Monitor, Cloud, Play, X } from "lucide-react";

interface VideoCardProps {
  videoId: string;
  title: string;
  channelName?: string;
  thumbnailUrl?: string;
  isSynced?: boolean; // false = Local, true = Cloud (for future)
  timestamp?: number;
  onOpen?: () => void;
  onResume?: () => void;
  onDelete?: () => void;
}

export function VideoCard({
  videoId,
  title,
  channelName,
  thumbnailUrl,
  isSynced = false,
  timestamp,
  onOpen,
  onResume,
  onDelete,
}: VideoCardProps) {
  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="group relative overflow-hidden border-zinc-800 bg-zinc-900/50 hover:bg-zinc-900 transition-all hover:border-zinc-700">
      <div className="flex gap-3 p-3">
        {/* Thumbnail */}
        <div className="relative shrink-0 w-32 h-18 bg-zinc-800 rounded-md overflow-hidden">
          {thumbnailUrl ? (
            <img
              src={thumbnailUrl}
              alt={title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-600">
              <Play className="w-8 h-8" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 flex flex-col justify-between">
          {/* Title & Status */}
          <div className="space-y-1">
            <h3
              className="text-sm font-semibold text-zinc-200 line-clamp-2 group-hover:text-white transition-colors cursor-pointer"
              onClick={onOpen}
              title={title}
            >
              {title || "Untitled Video"}
            </h3>
            {channelName && (
              <p className="text-[11px] text-zinc-500 line-clamp-1">
                {channelName}
              </p>
            )}
            <div className="flex items-center gap-1.5">
              {isSynced ? (
                <div className="flex items-center gap-1 text-green-400">
                  <Cloud className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    Cloud
                  </span>
                </div>
              ) : (
                <div className="flex items-center gap-1 text-zinc-500">
                  <Monitor className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-wider">
                    Local
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 mt-2">
            {onResume && timestamp !== undefined && (
              <Button
                size="sm"
                variant="outline"
                onClick={onResume}
                className="h-7 px-2 text-[10px] font-bold uppercase tracking-wider bg-indigo-600/10 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/20 hover:border-indigo-500/50"
              >
                <Play className="w-3 h-3 mr-1 fill-current" />
                Resume {formatTime(timestamp)}
              </Button>
            )}
            {onDelete && (
              <Button
                size="sm"
                variant="ghost"
                onClick={onDelete}
                className="h-7 w-7 p-0 text-zinc-500 hover:text-red-500 hover:bg-red-500/10"
                title="Delete"
              >
                <X className="w-3.5 h-3.5" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
