import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Library, PlusCircle } from "lucide-react";
import { LibraryGrid } from "@/components/LibraryGrid";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function LibraryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

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

  // Fetch videos with notes/bookmarks (Smart Library Filter)
  const videos = await prisma.video.findMany({
    where: {
      userId: user.id,
      OR: [
        { notes: { some: {} } }, // Has at least one note
        { bookmarkTime: { not: null } }, // Has a bookmark
      ],
    },
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
      <header className="mb-12">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-900/10 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-widest animate-pulse">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
            </span>
            Live Sync Active
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Your Library
          </h1>
          <p className="text-lg text-zinc-600 dark:text-zinc-400 max-w-2xl font-medium">
            {videos.length} videos with notes or bookmarks
          </p>
        </div>
      </header>

      {/* Grid Content */}
      {videos.length > 0 ? (
        <LibraryGrid initialVideos={videos} />
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-2 border-dashed border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/20 text-center">
          <div className="p-6 bg-white dark:bg-zinc-900 rounded-2xl shadow-xl border border-zinc-100 dark:border-zinc-800 mb-8">
            <Library className="h-12 w-12 text-zinc-300 dark:text-zinc-700 mx-auto" />
          </div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
            No content yet
          </h2>
          <p className="mt-3 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
            Use the VideoNotes extension to save notes or bookmarks. Videos with
            content will appear here automatically.
          </p>
        </div>
      )}
    </div>
  );
}
