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
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-zinc-900 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-800"
      >
        {isMobileOpen ? (
          <X className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
        ) : (
          <Menu className="w-5 h-5 text-zinc-900 dark:text-zinc-50" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 h-screen w-[280px] bg-white dark:bg-zinc-950 border-r border-zinc-200 dark:border-zinc-800 z-40 transition-transform duration-300
          ${
            isMobileOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="flex flex-col h-full p-6">
          {/* Logo */}
          <div className="mb-8">
            <h2 className="text-2xl font-black tracking-tighter text-zinc-900 dark:text-zinc-50">
              Video<span className="text-indigo-500">Notes</span>
            </h2>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-1">
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
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-all group
                    ${
                      isActive
                        ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                        : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-50 dark:hover:bg-zinc-900"
                    }
                  `}
                >
                  <Icon className="w-5 h-5" />
                  <span className="font-semibold text-sm">{item.label}</span>
                  {item.premium && (
                    <Crown className="w-4 h-4 ml-auto text-amber-500" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* User Section */}
          <div className="pt-6 border-t border-zinc-200 dark:border-zinc-800">
            <div className="flex items-center gap-3 text-sm">
              <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
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
