"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Library,
  FileText,
  Bookmark,
  FolderKanban,
  Settings,
  Menu,
  X,
  Crown,
} from "lucide-react";

const navItems = [
  { href: "/dashboard/library", label: "Library", icon: Library },
  { href: "/dashboard/notes", label: "All Notes", icon: FileText },
  { href: "/dashboard/bookmarks", label: "Bookmarks", icon: Bookmark },
  {
    href: "/dashboard/collections",
    label: "Collections",
    icon: FolderKanban,
    premium: true,
  },
  { href: "/dashboard/settings", label: "Settings", icon: Settings },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  return (
    <>
      {/* Mobile Hamburger Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="fixed top-4 left-4 z-50 rounded-lg border border-zinc-200 bg-white p-2 shadow-lg lg:hidden dark:border-zinc-800 dark:bg-zinc-900"
      >
        {isMobileOpen ? (
          <X className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
        ) : (
          <Menu className="h-5 w-5 text-zinc-900 dark:text-zinc-50" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 z-40 h-screen w-[280px] border-r border-zinc-200 bg-white transition-transform duration-300 lg:sticky dark:border-zinc-800 dark:bg-zinc-950 ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        } `}
      >
        <div className="flex h-full flex-col p-6">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              Video<span className="text-indigo-500">Notes</span>
            </h2>
            <p className="mt-1 text-[10px] font-black tracking-[0.2em] text-zinc-500 uppercase">
              Learning Hub
            </p>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname?.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setIsMobileOpen(false)}
                  className={`group flex items-center gap-3 rounded-xl px-4 py-3 transition-all ${
                    isActive
                      ? "bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400"
                      : "text-zinc-600 hover:bg-zinc-50 dark:text-zinc-400 dark:hover:bg-zinc-900"
                  } `}
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-sm font-semibold">{item.label}</span>
                  {item.premium && (
                    <Crown className="ml-auto h-4 w-4 text-amber-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="border-t border-zinc-200 pt-6 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-sm">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-linear-to-br from-indigo-500 to-purple-500 font-bold text-white">
                U
              </div>
              <div className="flex-1">
                <p className="font-semibold text-zinc-900 dark:text-zinc-50">
                  User
                </p>
                <p className="text-xs text-zinc-500">Free Plan</p>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
