import Image from "next/image";
import { Library, Calendar, Clock, Monitor, Cloud } from "lucide-react";
import Link from "next/link";

interface VideoCardProps {
  id: string;
  youtubeId: string;
  title: string;
  thumbnailUrl?: string | null;
  noteCount: number;
  lastWatchedAt: Date;
  isLocal?: boolean;
}

export function VideoCard({
  id,
  youtubeId,
  title,
  thumbnailUrl,
  noteCount,
  lastWatchedAt,
  isLocal = false,
}: VideoCardProps) {
  // Format dates
  const diffDays = Math.ceil(
    (lastWatchedAt.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <Link href={`/dashboard/videos/${id}`}>
      <div className="group relative flex flex-col overflow-hidden rounded-3xl bg-white transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
        {/* Thumbnail Wrapper */}
        <div className="relative aspect-video w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
          {thumbnailUrl ? (
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          ) : (
            <div className="flex h-full items-center justify-center">
              <Library className="h-12 w-12 text-zinc-300 dark:text-zinc-700" />
            </div>
          )}

          {/* Note Count Badge */}
          <div className="absolute top-3 left-3 flex items-center gap-1.5 rounded-lg bg-black/60 px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-[11px] font-bold text-white">
            <Library className="h-3.5 w-3.5" />
            {noteCount} {noteCount === 1 ? "Note" : "Notes"}
          </div>

          {/* Sync Status Badge */}
          <div
            className={`absolute top-3 right-3 flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-wider text-white ${
              isLocal ? "bg-zinc-500/60" : "bg-indigo-500/60"
            }`}
          >
            {isLocal ? (
              <>
                <Monitor className="h-3 w-3" />
                <span>Local</span>
              </>
            ) : (
              <>
                <Cloud className="h-3 w-3" />
                <span>Synced</span>
              </>
            )}
          </div>
        </div>

        {/* Content */}
        <div className="flex flex-1 flex-col p-5">
          <h3 className="line-clamp-2 text-base font-bold text-zinc-900 dark:text-zinc-50 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            {title}
          </h3>

          <div className="mt-4 flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400 font-bold uppercase tracking-wider">
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{lastWatchedAt.toLocaleDateString()}</span>
            </div>

            <div className="flex items-center gap-1.5 opacity-60">
              <Clock className="h-3.5 w-3.5" />
              <span>
                {Math.abs(diffDays) < 1
                  ? "Today"
                  : Math.abs(diffDays) < 7
                  ? `${Math.abs(diffDays)}d ago`
                  : lastWatchedAt.toLocaleDateString(undefined, {
                      month: "short",
                      day: "numeric",
                    })}
              </span>
            </div>
          </div>
        </div>

        {/* Hover Overlay Gradient */}
        <div className="absolute inset-0 pointer-events-none rounded-3xl ring-1 ring-inset ring-zinc-950/5 group-hover:ring-indigo-500/20 transition-all duration-300" />
      </div>
    </Link>
  );
}
