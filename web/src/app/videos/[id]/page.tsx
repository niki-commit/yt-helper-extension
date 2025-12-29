import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { notFound } from "next/navigation";
import { ArrowLeft, Clock, Library, ExternalLink } from "lucide-react";
import Link from "next/link";
import { Metadata } from "next";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const video = await prisma.video.findUnique({
    where: { id },
  });
  return {
    title: video ? `${video.title} | VideoNotes` : "Video Not Found",
  };
}

export default async function VideoDetailPage(props: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ t?: string }>;
}) {
  const { id } = await props.params;
  const { t } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const video = await prisma.video.findUnique({
    where: {
      id,
      userId: user.id, // Security: Ensure user owns this video
    },
    include: {
      notes: {
        orderBy: {
          timestamp: "asc",
        },
      },
    },
  });

  if (!video) {
    notFound();
  }

  // Format timestamp helper
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const startTime = t ? Math.floor(parseFloat(t)) : 0;
  const embedUrl = `https://www.youtube.com/embed/${video.youtubeId}${
    startTime > 0 ? `?start=${startTime}` : ""
  }`;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Navigation */}
      <div className="mb-8">
        <Link
          href="/"
          className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50 transition-colors"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 group-hover:bg-zinc-100 dark:group-hover:bg-zinc-800 transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Main Content: Video Embed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="overflow-hidden rounded-3xl bg-zinc-100 dark:bg-zinc-800 shadow-2xl border border-zinc-200 dark:border-zinc-800 aspect-video relative group">
            <iframe
              src={embedUrl}
              className="absolute inset-0 h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>

          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                {video.title}
              </h1>
              <a
                href={`https://youtube.com/watch?v=${video.youtubeId}`}
                target="_blank"
                rel="noreferrer"
                className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
              >
                Watch on YouTube
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>

        {/* Sidebar: Notes List */}
        <div className="space-y-6">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50 flex items-center gap-2">
              <Library className="h-5 w-5 text-indigo-500" />
              All Notes
            </h2>
            <span className="text-xs font-bold text-zinc-500 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded-md border border-zinc-200 dark:border-zinc-700">
              {video.notes.length} Total
            </span>
          </div>

          <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
            {video.notes.length > 0 ? (
              video.notes.map((note) => (
                <div
                  key={note.id}
                  className="p-4 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-indigo-500/20 hover:shadow-lg transition-all"
                >
                  <div className="flex items-center gap-2 mb-2 text-indigo-600 dark:text-indigo-400 font-mono text-sm font-bold bg-indigo-50 dark:bg-indigo-900/20 w-fit px-2 py-0.5 rounded-lg border border-indigo-100 dark:border-indigo-900/10">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(note.timestamp)}
                  </div>
                  <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                    {note.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 px-6 rounded-2xl bg-zinc-50/50 dark:bg-zinc-950/20 border-2 border-dashed border-zinc-200 dark:border-zinc-800 text-center">
                <Library className="h-8 w-8 text-zinc-300 dark:text-zinc-700 mb-4" />
                <p className="text-sm font-medium text-zinc-500 dark:text-zinc-400">
                  No notes for this video yet.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
