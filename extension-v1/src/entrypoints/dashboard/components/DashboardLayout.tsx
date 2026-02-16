import { useState } from "react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { LibraryView } from "../views/LibraryView";
import { BookmarksView } from "../views/BookmarksView";
import { SettingsView } from "../views/SettingsView";
import { ReviewMode } from "../views/ReviewMode";
import { GlobalSearch } from "./GlobalSearch";
import {
  Library,
  Bookmark,
  Settings,
  Sparkles,
  FileText,
  Youtube,
  LifeBuoy,
  Coffee,
  ExternalLink,
  Instagram,
  Twitter,
} from "lucide-react";
import { useTotalStats } from "@/hooks/useTotalStats";
import { EXTERNAL_LINKS } from "@/lib/constants";

type View = "library" | "bookmarks" | "settings" | "integrations" | "review";

export function DashboardLayout() {
  const [activeView, setActiveView] = useState<View>("library");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);
  const { totalNotes, totalBookmarks } = useTotalStats();

  const handleSelectVideo = (videoId: string) => {
    setSelectedVideoId(videoId);
    setActiveView("review");
  };

  const handleSelectNote = (videoId: string, _noteId: string) => {
    // Navigate to the video in ReviewMode
    // Note: Deep-linking to specific note can be added later
    setSelectedVideoId(videoId);
    setActiveView("review");
  };

  const handleSelectBookmark = (videoId: string, _timestamp: number) => {
    // Open the video on YouTube at the bookmarked timestamp
    window.open(
      `https://www.youtube.com/watch?v=${videoId}&t=${Math.floor(_timestamp)}s`,
      "_blank"
    );
  };

  const navigation = [
    {
      title: "Library",
      icon: Library,
      view: "library" as View,
    },
    {
      title: "Bookmarks",
      icon: Bookmark,
      view: "bookmarks" as View,
    },
    {
      title: "Integrations",
      icon: Sparkles,
      view: "integrations" as View,
      badge: "Soon",
    },
    {
      title: "Settings",
      icon: Settings,
      view: "settings" as View,
    },
  ];

  const renderView = () => {
    switch (activeView) {
      case "library":
        return <LibraryView onSelectVideo={handleSelectVideo} />;
      case "bookmarks":
        return <BookmarksView onSelectVideo={handleSelectVideo} />;
      case "review":
        return selectedVideoId ? (
          <ReviewMode
            videoId={selectedVideoId}
            onBack={() => setActiveView("library")}
          />
        ) : (
          <LibraryView onSelectVideo={handleSelectVideo} />
        );
      case "settings":
        return <SettingsView />;
      case "integrations":
        return (
          <div className="flex h-full items-center justify-center">
            <div className="text-center">
              <Sparkles className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
              <h2 className="mb-2 text-2xl font-semibold">Coming Soon</h2>
              <p className="text-muted-foreground">
                Notion, Evernote, and more integrations are on the way!
              </p>
            </div>
          </div>
        );
      default:
        return <LibraryView onSelectVideo={handleSelectVideo} />;
    }
  };

  return (
    <SidebarProvider>
      <Sidebar>
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[state=open]:bg-sidebar-accent"
              >
                <div className="bg-primary text-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <FileText className="size-4" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold">VideoNotes</span>
                  <span className="text-xs">Dashboard</span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent className="overflow-x-hidden">
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {navigation.map((item) => (
                  <SidebarMenuItem key={item.view}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.view)}
                      isActive={activeView === item.view}
                      tooltip={item.title}
                    >
                      <item.icon className="size-4" />
                      <span className="truncate">{item.title}</span>
                      {item.badge && (
                        <span className="bg-primary/10 text-primary ml-auto rounded-full px-2 py-0.5 text-xs">
                          {item.badge}
                        </span>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <Separator className="opacity-50" />

          <SidebarGroup>
            <SidebarGroupLabel>Support & Resources</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Watch Tutorial">
                    <a
                      href={EXTERNAL_LINKS.TUTORIAL}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Youtube className="size-4 text-red-500" />
                      <span>Tutorial Video</span>
                      <ExternalLink className="ml-auto size-3 opacity-50" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Report a Bug">
                    <a
                      href={EXTERNAL_LINKS.BUG_REPORT}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <LifeBuoy className="size-4 text-blue-500" />
                      <span>Feedback/Report Bug</span>
                      <ExternalLink className="ml-auto size-3 opacity-50" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Follow on X">
                    <a
                      href={EXTERNAL_LINKS.X}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="size-4 text-sky-500" />
                      <span>Follow on X</span>
                      <ExternalLink className="ml-auto size-3 opacity-50" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Instagram">
                    <a
                      href={EXTERNAL_LINKS.INSTAGRAM}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Instagram className="size-4 text-pink-500" />
                      <span>Follow on Instagram</span>
                      <ExternalLink className="ml-auto size-3 opacity-50" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild tooltip="Buy me a coffee">
                    <a
                      href={EXTERNAL_LINKS.COFFEE}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Coffee className="size-4 text-orange-500" />
                      <span className="truncate">Support Creator</span>
                      <ExternalLink className="ml-auto size-3 opacity-50" />
                    </a>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <div className="text-muted-foreground p-4 text-xs">
            VideoNotes v1.0
          </div>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mr-2 h-4" />
            <h1 className="flex items-center gap-3 text-lg font-semibold">
              {navigation.find((n) => n.view === activeView)?.title ||
                "Review Mode"}

              <div className="border-border/50 bg-muted/30 text-muted-foreground flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[10px] font-medium">
                <span className="text-primary/80 font-bold">{totalNotes}</span>{" "}
                Notes
                <span className="bg-border/50 h-2 w-px"></span>
                <span className="text-primary/80 font-bold">
                  {totalBookmarks}
                </span>{" "}
                Bookmarks
              </div>
            </h1>
          </div>
          <div className="mx-auto max-w-md flex-1">
            <GlobalSearch
              onSelectVideo={handleSelectVideo}
              onSelectNote={handleSelectNote}
              onSelectBookmark={handleSelectBookmark}
            />
          </div>
          <div className="w-10" />
        </header>
        <div className="flex flex-1 flex-col gap-4 overflow-auto p-4">
          {renderView()}
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
