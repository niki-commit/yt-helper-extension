import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import prisma from "@/lib/prisma";
import { BookmarksList } from "@/components/BookmarksList";

export default async function BookmarksPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  // Fetch only videos that have a bookmark set
  const cloudBookmarks = await prisma.video.findMany({
    where: {
      userId: user.id,
      bookmarkTime: {
        not: null,
      },
    },
    orderBy: {
      lastWatchedAt: "desc",
    },
  });

  const formattedBookmarks = cloudBookmarks.map((v) => ({
    id: v.id,
    youtubeId: v.youtubeId,
    title: v.title,
    thumbnailUrl: v.thumbnailUrl,
    bookmarkTime: v.bookmarkTime || 0,
    updatedAt: v.lastWatchedAt.getTime(),
    isLocal: false,
  }));

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3 mb-2 uppercase tracking-widest text-[10px] font-black text-pink-500">
          <div className="w-10 h-0.5 bg-pink-500" />
          <span>Saved Moments</span>
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Bookmarks
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Jump back into your key learning moments
        </p>
      </header>

      <BookmarksList initialCloudBookmarks={formattedBookmarks} />
    </div>
  );
}
