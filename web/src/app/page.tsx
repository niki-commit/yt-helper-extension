import { createClient } from "@/lib/supabase/server";
import { Youtube, Zap, BookOpen, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="relative isolate overflow-hidden bg-white dark:bg-zinc-950">
      {/* Background decoration */}
      <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
        <div
          className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-20 sm:left-[calc(50%-30rem)] sm:w-288.75"
          style={{
            clipPath:
              "polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)",
          }}
        />
      </div>

      <div className="mx-auto max-w-7xl px-6 pb-24 pt-10 sm:pb-32 lg:flex lg:px-8 lg:py-40">
        <div className="mx-auto max-w-2xl shrink-0 lg:mx-0 lg:max-w-xl lg:pt-8">
          <div className="mt-24 sm:mt-32 lg:mt-16">
            <a href="#" className="inline-flex space-x-6">
              <span className="rounded-full bg-indigo-500/10 px-3 py-1 text-sm font-semibold leading-6 text-indigo-400 ring-1 ring-inset ring-indigo-500/20">
                What's new
              </span>
              <span className="inline-flex items-center space-x-2 text-sm font-medium leading-6 text-zinc-400">
                <span>Just shipped v1.0</span>
                <ArrowRight className="h-4 w-4" />
              </span>
            </a>
          </div>
          <h1 className="mt-10 text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-6xl text-balance">
            Master YouTube Learning with{" "}
            <span className="text-indigo-600 dark:text-indigo-400">
              YT Helper
            </span>
          </h1>
          <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
            The ultimate companion for students and lifelong learners. Take
            time-stamped notes, bookmark key moments, and organize your
            knowledge from any YouTube video.
          </p>
          <div className="mt-10 flex items-center gap-x-6">
            {user ? (
              <Link
                href="/dashboard"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all font-outfit"
              >
                Go to Dashboard
              </Link>
            ) : (
              <Link
                href="/login"
                className="rounded-xl bg-indigo-600 px-6 py-3.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 transition-all font-outfit"
              >
                Get Started
              </Link>
            )}
            <Link
              href="#features"
              className="text-sm font-semibold leading-6 text-zinc-900 dark:text-zinc-50"
            >
              Learn more <span aria-hidden="true">→</span>
            </Link>
          </div>
        </div>

        <div className="mx-auto mt-16 flex max-w-2xl sm:mt-24 lg:ml-10 lg:mr-0 lg:mt-0 lg:max-w-none lg:flex-none xl:ml-32">
          <div className="max-w-3xl flex-none sm:max-w-5xl lg:max-w-none">
            <div className="-m-2 rounded-xl bg-zinc-900/5 p-2 ring-1 ring-inset ring-zinc-900/10 lg:-m-4 lg:rounded-2xl lg:p-4 dark:bg-white/5 dark:ring-white/10">
              <div className="rounded-md bg-white dark:bg-zinc-900 shadow-2xl ring-1 ring-zinc-900/10 dark:ring-white/10 overflow-hidden aspect-video w-[600px] flex items-center justify-center">
                {/* Placeholder for product screenshot */}
                <div className="text-center p-8">
                  <Youtube className="h-16 w-16 text-red-600 mx-auto mb-4" />
                  <p className="text-zinc-500 font-medium">Extension Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-24 sm:py-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl lg:text-center">
            <h2 className="text-base font-semibold leading-7 text-indigo-400">
              Study Smarter
            </h2>
            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
              Everything you need to learn from video
            </p>
            <p className="mt-6 text-lg leading-8 text-zinc-600 dark:text-zinc-400">
              Stop pausing and switching tabs. Manage your learning experience
              directly within the YouTube player.
            </p>
          </div>
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                  <Zap
                    className="h-5 w-5 flex-none text-indigo-400"
                    aria-hidden="true"
                  />
                  Time-stamped Notes
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                  <p className="flex-auto">
                    Create notes tied to specific moments in the video. Click to
                    jump back anytime.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                  <BookOpen
                    className="h-5 w-5 flex-none text-indigo-400"
                    aria-hidden="true"
                  />
                  Smart Bookmarks
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                  <p className="flex-auto">
                    Save important chapters and segments to review later with
                    ease.
                  </p>
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-zinc-900 dark:text-zinc-50">
                  <Clock
                    className="h-5 w-5 flex-none text-indigo-400"
                    aria-hidden="true"
                  />
                  Auto-Sync
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-zinc-600 dark:text-zinc-400">
                  <p className="flex-auto">
                    All your data is synced instantly across devices. Access
                    your insights anywhere.
                  </p>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </div>
  );
}
