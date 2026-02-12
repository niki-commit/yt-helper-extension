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
import { Library, Bookmark, Settings, Sparkles, FileText } from "lucide-react";

type View = "library" | "bookmarks" | "settings" | "integrations" | "review";

export function DashboardLayout() {
  const [activeView, setActiveView] = useState<View>("library");
  const [selectedVideoId, setSelectedVideoId] = useState<string | null>(null);

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
        <SidebarContent>
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
                      <span>{item.title}</span>
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
            <h1 className="text-lg font-semibold">
              {navigation.find((n) => n.view === activeView)?.title}
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
