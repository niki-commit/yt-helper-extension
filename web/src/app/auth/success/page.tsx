"use client";

import { useEffect, useState } from "react";
import { CheckCircle2, Puzzle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function AuthSuccessPage() {
  const [code, setCode] = useState<string | null>(null);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    async function fetchHandshake() {
      try {
        const res = await fetch("/api/auth/handshake", { method: "POST" });
        if (!res.ok) throw new Error("Handshake failed");
        const data = await res.json();
        setCode(data.code);

        // Dispatch an event that the extension can listen for
        window.dispatchEvent(
          new CustomEvent("VIDEO_NOTES_AUTH_COMPLETED", {
            detail: { code: data.code },
          })
        );
      } catch (err) {
        console.error(err);
        setError(true);
      }
    }

    fetchHandshake();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-200 bg-white p-10 text-center shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mb-6 flex justify-center">
          <div className="animate-bounce rounded-full bg-green-50 p-4 dark:bg-green-900/30">
            <CheckCircle2 className="h-12 w-12 text-green-600 dark:text-green-400" />
          </div>
        </div>

        <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
          Account Linked!
        </h1>

        <p className="text-zinc-600 dark:text-zinc-400">
          Your extension is now connected to your Note Hub account. You can
          close this tab and start taking notes!
        </p>

        {error && (
          <p className="text-sm font-medium text-red-600 dark:text-red-400">
            Something went wrong. Please try linking again from the extension.
          </p>
        )}

        <div className="pt-6">
          <Link
            href="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-zinc-900 px-6 py-3 text-sm font-semibold text-white transition-all hover:bg-zinc-800 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            Go to Dashboard
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* Hidden element for content script to read if event fails */}
        {code && (
          <div id="handshake-code" data-code={code} className="hidden" />
        )}
      </div>
    </div>
  );
}
