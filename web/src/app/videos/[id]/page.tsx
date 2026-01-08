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
          className="group inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white transition-colors group-hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:group-hover:bg-zinc-800">
            <ArrowLeft className="h-4 w-4" />
          </div>
          Back to Dashboard
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-10 lg:grid-cols-3">
        {/* Main Content: Video Embed */}
        <div className="space-y-6 lg:col-span-2">
          <div className="group relative aspect-video overflow-hidden rounded-3xl border border-zinc-200 bg-zinc-100 shadow-2xl dark:border-zinc-800 dark:bg-zinc-800">
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
          <div className="mb-2 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-xl font-bold text-zinc-900 dark:text-zinc-50">
              <Library className="h-5 w-5 text-indigo-500" />
              All Notes
            </h2>
            <span className="rounded-md border border-zinc-200 bg-zinc-100 px-2 py-1 text-xs font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-800">
              {video.notes.length} Total
            </span>
          </div>

          <div className="custom-scrollbar max-h-[70vh] space-y-4 overflow-y-auto pr-2">
            {video.notes.length > 0 ? (
              video.notes.map((note) => (
                <div
                  key={note.id}
                  className="rounded-2xl border border-zinc-200 bg-white p-4 transition-all hover:border-indigo-500/20 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
                >
                  <div className="mb-2 flex w-fit items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 font-mono text-sm font-bold text-indigo-600 dark:border-indigo-900/10 dark:bg-indigo-900/20 dark:text-indigo-400">
                    <Clock className="h-3.5 w-3.5" />
                    {formatTime(note.timestamp)}
                  </div>
                  <p className="text-sm leading-relaxed whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
                    {note.text}
                  </p>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50/50 px-6 py-12 text-center dark:border-zinc-800 dark:bg-zinc-950/20">
                <Library className="mb-4 h-8 w-8 text-zinc-300 dark:text-zinc-700" />
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
