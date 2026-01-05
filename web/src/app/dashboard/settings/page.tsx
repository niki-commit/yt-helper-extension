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
        <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Settings
        </h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">
          Manage your account and preferences
        </p>
      </header>

      {/* Settings Sections */}
      <div className="space-y-6">
        {/* Account Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <User className="w-5 h-5 text-indigo-500" />
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
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <CreditCard className="w-5 h-5 text-indigo-500" />
            <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
              Billing
            </h2>
          </div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Upgrade to Premium for cloud sync and advanced features
          </p>
          <button className="mt-4 px-6 py-2 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors">
            Upgrade Now
          </button>
        </div>

        {/* Preferences Section */}
        <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6">
          <div className="flex items-center gap-3 mb-4">
            <Bell className="w-5 h-5 text-indigo-500" />
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
