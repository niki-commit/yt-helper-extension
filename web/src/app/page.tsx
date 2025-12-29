import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Library, PlusCircle, Search } from "lucide-react";
import { VideoCard } from "@/components/VideoCard";
import { GalleryGrid } from "@/components/GalleryGrid";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Ensure Profile is up to date in Prisma
  await prisma.profile.upsert({
    where: { id: user.id },
    update: {
      fullName: user.user_metadata.full_name,
      avatarUrl: user.user_metadata.avatar_url,
      email: user.email!,
    },
    create: {
      id: user.id,
      fullName: user.user_metadata.full_name,
      avatarUrl: user.user_metadata.avatar_url,
      email: user.email!,
    },
  });

  // Fetch real data from Prisma
  const videos = await prisma.video.findMany({
    where: { userId: user.id },
    include: {
      _count: {
        select: { notes: true },
      },
    },
    orderBy: {
      lastWatchedAt: "desc",
    },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Hero Section */}
      <header className="mb-16 flex flex-col md:flex-row md:items-end md:justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Sync Active
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
            Welcome back,{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              {user.user_metadata.full_name?.split(" ")[0]}
            </span>
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium">
            Manage your study sessions and review your insights across{" "}
            {videos.length} videos.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center -space-x-2 overflow-hidden">
            {/* Mock avatars or real user circle */}
            <div className="inline-block h-10 w-10 rounded-full ring-2 ring-white dark:ring-zinc-900 bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-xs font-bold overflow-hidden">
              {user.user_metadata.avatar_url ? (
                <img src={user.user_metadata.avatar_url} alt="User" />
              ) : (
                user.user_metadata.full_name?.[0]
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Grid Content */}
      {videos.length > 0 ? (
        <GalleryGrid initialVideos={videos} />
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-center">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 mb-8">
            <Library className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            No sessions synced yet
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Open a YouTube video and use the VideoNotes extension to start
            taking notes. Your sessions will appear here automatically.
          </p>
          <div className="mt-8">
            <Link
              href="/login?source=extension"
              className="inline-flex items-center gap-2 rounded-xl bg-zinc-900 px-8 py-4 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg shadow-indigo-500/10"
            >
              Get Extension
              <PlusCircle className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
