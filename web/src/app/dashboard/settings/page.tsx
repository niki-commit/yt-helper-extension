import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Settings as SettingsIcon, User, CreditCard, Bell } from "lucide-react";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
      {/* Header */}
      <header className="mb-12">
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 sm:text-5xl dark:text-zinc-50">
          Settings
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Manage your account and preferences
        </p>
      </header>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Account Section */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-3">
            <User className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Account
            </h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Email
              </label>
              <p className="text-zinc-900 dark:text-zinc-50">{user.email}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                Plan
              </label>
              <p className="text-zinc-900 dark:text-zinc-50">Free</p>
            </div>
          </div>
        </div>

        {/* Billing Section */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-3">
            <CreditCard className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Billing
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Upgrade to Premium for cloud sync and advanced features
          </p>
          <button className="mt-4 rounded-xl bg-indigo-600 px-6 py-2 font-bold text-white transition-colors hover:bg-indigo-700">
            Upgrade Now
          </button>
        </div>

        {/* Preferences Section */}
        <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-4 flex items-center gap-3">
            <Bell className="h-5 w-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Preferences
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Customize your learning experience
          </p>
        </div>
      </div>
    </div>
  );
}
