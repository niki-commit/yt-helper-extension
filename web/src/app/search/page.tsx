import { createClient } from "@/lib/supabase/server";
import prisma from "@/lib/prisma";
import { Search, ArrowLeft, Clock, Play, Library } from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default async function SearchPage(props: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q: query } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Fetch performance: Only search if query is 2+ chars
  const searchResults =
    query && query.length >= 2
      ? await prisma.note.findMany({
          where: {
            userId: user.id,
            text: {
              contains: query,
              mode: "insensitive",
            },
          },
          include: {
            video: true,
          },
          orderBy: {
            createdAt: "desc",
          },
        })
      : [];

  // Group by video for better UX
  const groupedResults = searchResults.reduce(
    (acc, note) => {
      const videoId = note.video.id;
      if (!acc[videoId]) {
        acc[videoId] = {
          video: note.video,
          notes: [],
        };
      }
      acc[videoId].notes.push(note);
      return acc;
    },
    {} as Record<string, { video: any; notes: any[] }>
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header & Search UI */}
      <div className="mb-12">
        <Link
          href="/"
          className="group mb-8 inline-flex items-center gap-2 text-sm font-medium text-zinc-500 transition-colors hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-50"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Collection
        </Link>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl dark:text-zinc-50">
          Global Search
        </h1>
        <p className="mt-2 text-zinc-600 dark:text-zinc-400">
          Find anything across all your video notes instantly.
        </p>

        <form
          action="/search"
          method="GET"
          className="group relative mt-8 max-w-2xl"
        >
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search className="h-5 w-5 text-zinc-400 transition-colors group-focus-within:text-indigo-500" />
          </div>
          <input
            type="text"
            name="q"
            defaultValue={query}
            placeholder="Type to search (e.g. 'react hooks', 'database')..."
            className="block w-full rounded-2xl border border-zinc-200 bg-white/50 py-4 pr-4 pl-12 text-sm text-zinc-900 placeholder-zinc-500 backdrop-blur-md transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 focus:outline-none dark:border-zinc-800 dark:bg-zinc-900/50 dark:text-zinc-50 dark:placeholder-zinc-400"
          />
        </form>
      </div>

      {/* Results Container */}
      <div className="space-y-12">
        {query && query.length >= 2 ? (
          Object.values(groupedResults).length > 0 ? (
            Object.values(groupedResults).map(({ video, notes }) => (
              <div
                key={video.id}
                className="animate-in fade-in slide-in-from-bottom-4 space-y-4 duration-500"
              >
                {/* Video Header Badge */}
                <Link
                  href={`/videos/${video.id}`}
                  className="group flex items-center gap-4"
                >
                  <div className="relative h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800">
                    {video.thumbnailUrl && (
                      <Image
                        src={video.thumbnailUrl}
                        alt={video.title}
                        fill
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div>
                    <h2 className="line-clamp-1 text-lg font-bold text-zinc-900 transition-colors group-hover:text-indigo-600 dark:text-zinc-50 dark:group-hover:text-indigo-400">
                      {video.title}
                    </h2>
                    <p className="text-xs font-medium text-zinc-500">
                      {notes.length} matching{" "}
                      {notes.length === 1 ? "note" : "notes"}
                    </p>
                  </div>
                </Link>

                {/* Individual Note Results */}
                <div className="grid grid-cols-1 gap-4 pl-4 sm:pl-0">
                  {notes.map((note) => (
                    <div
                      key={note.id}
                      className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-5 transition-all hover:border-indigo-500/30 hover:shadow-xl dark:border-zinc-800 dark:bg-zinc-900"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-3">
                          <div className="flex w-fit items-center gap-2 rounded-lg border border-indigo-100 bg-indigo-50 px-2 py-0.5 font-mono text-xs font-bold text-indigo-600 dark:border-indigo-900/10 dark:bg-indigo-900/20 dark:text-indigo-400">
                            <Clock className="h-3 w-3" />
                            {Math.floor(note.timestamp / 60)}:
                            {(note.timestamp % 60).toString().padStart(2, "0")}
                          </div>
                          <p className="text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
                            {/* We could add highlighting here */}
                            {note.text}
                          </p>
                        </div>
                        <Link
                          href={`/videos/${video.id}?t=${note.timestamp}`}
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-zinc-100 transition-all group-hover:border-indigo-600 group-hover:bg-indigo-600 group-hover:text-white dark:border-zinc-700 dark:bg-zinc-800"
                        >
                          <Play className="h-4 w-4 fill-current" />
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          ) : (
            /* No Results State */
            <div className="animate-in fade-in zoom-in flex flex-col items-center justify-center py-20 text-center duration-300">
              <div className="mb-6 rounded-full bg-zinc-100 p-5 dark:bg-zinc-800">
                <Search className="h-10 w-10 text-zinc-300 dark:text-zinc-600" />
              </div>
              <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
                No notes found
              </h2>
              <p className="mx-auto mt-2 max-w-xs text-zinc-600 dark:text-zinc-400">
                We searched your entire collection but couldn't find any notes
                matching "
                <span className="font-semibold text-zinc-900 dark:text-zinc-50">
                  {query}
                </span>
                ".
              </p>
            </div>
          )
        ) : (
          /* Initial State */
          <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
            <Library className="mb-6 h-16 w-16 text-zinc-200 dark:text-zinc-800" />
            <h2 className="text-lg font-medium text-zinc-500">
              Search for terms, concepts, or scripts...
            </h2>
          </div>
        )}
      </div>
    </div>
  );
}
