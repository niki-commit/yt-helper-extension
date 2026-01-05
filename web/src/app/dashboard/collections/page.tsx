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
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
            Collections
          </h1>
          <Crown className="w-8 h-8 text-amber-500" />
        </div>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Organize your library with custom folders
        </p>
      </header>

      {/* Premium Feature Notice */}
      <div className="flex flex-col items-center justify-center py-20 px-6 rounded-3xl border-2 border-dashed border-amber-200 dark:border-amber-900/30 bg-amber-50/50 dark:bg-amber-950/10 text-center">
        <div className="p-6 bg-linear-to-br from-amber-500 to-orange-500 rounded-2xl shadow-xl mb-8">
          <Crown className="h-12 w-12 text-white mx-auto" />
        </div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Premium Feature
        </h2>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400 max-w-sm mx-auto">
          Create custom collections and organize your learning path. Upgrade to
          Premium to unlock this feature.
        </p>
        <button className="mt-6 px-6 py-3 bg-linear-to-r from-amber-500 to-orange-500 text-white font-bold rounded-xl hover:shadow-lg transition-all">
          Upgrade to Premium
        </button>
      </div>
    </div>
  );
}
