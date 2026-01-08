import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { FolderKanban, Crown } from "lucide-react";

export default async function CollectionsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-12">
        <div className="flex items-center gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
            Collections
          </h1>
          <Crown className="h-8 w-8 text-amber-500" />
        </div>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Organize your library with custom folders
        </p>
      </header>

      {/* Premium Feature Notice */}
      <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-amber-200 bg-amber-50/50 px-6 py-20 text-center dark:border-amber-900/30 dark:bg-amber-950/10">
        <div className="mb-8 rounded-2xl bg-linear-to-br from-amber-500 to-orange-500 p-6 shadow-xl">
          <Crown className="mx-auto h-12 w-12 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Premium Feature
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-zinc-600 dark:text-zinc-400">
          Create custom collections and organize your learning path. Upgrade to
          Premium to unlock this feature.
        </p>
        <button className="mt-6 rounded-xl bg-linear-to-r from-amber-500 to-orange-500 px-6 py-3 font-bold text-white transition-all hover:shadow-lg">
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}
