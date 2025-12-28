import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { Library, PlusCircle, Search, Settings } from "lucide-react";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Happy Learning, {user?.user_metadata.full_name?.split(" ")[0]}! 👋
        </h1>
        <p className="mt-4 text-xl text-zinc-600 dark:text-zinc-400">
          Your centralized hub for all YouTube study notes.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Quick Actions Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600 text-white group-hover:scale-110 transition-transform">
            <Library className="h-6 w-6" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            My Study Collection
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            View all videos you've taken notes on.
          </p>
          <div className="mt-6">
            <Link
              href="/videos"
              className="inline-flex items-center text-sm font-semibold text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 dark:hover:text-indigo-300"
            >
              Browse Gallery →
            </Link>
          </div>
        </div>

        {/* Search Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900 transition-all hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 group-hover:scale-110 transition-transform">
            <Search className="h-6 w-6" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Global Search
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Find specific concepts across all your saved videos.
          </p>
          <div className="mt-6 text-zinc-400 text-sm">
            Coming soon to web...
          </div>
        </div>

        {/* Extension Info Card */}
        <div className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 p-8 dark:border-zinc-800 dark:bg-zinc-950/50 transition-all hover:shadow-lg">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-600 text-white group-hover:scale-110 transition-transform">
            <PlusCircle className="h-6 w-6" />
          </div>
          <h3 className="mt-6 text-xl font-bold text-zinc-900 dark:text-zinc-50">
            Sync in Progress
          </h3>
          <p className="mt-2 text-zinc-600 dark:text-zinc-400">
            Notes taken in the extension appear here instantly.
          </p>
          <div className="mt-6 flex gap-1">
            <span className="flex h-2 w-2 rounded-full bg-green-500 my-auto"></span>
            <span className="text-xs font-bold text-green-600 uppercase tracking-wider">
              Cloud Connected
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
