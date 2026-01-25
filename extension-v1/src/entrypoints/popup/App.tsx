import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  FileText,
  Bookmark,
  Settings,
  Search,
  Sun,
  Moon,
  Monitor,
} from "lucide-react";
import { useTheme, type Theme } from "@/hooks/useTheme";
import { useHideRecommendations } from "@/hooks/useHideRecommendations";
import { useHideComments } from "@/hooks/useHideComments";
import { useAutoPause } from "@/hooks/useAutoPause";
import { useAutoResume } from "@/hooks/useAutoResume";

import { useAllNotes } from "@/hooks/useAllNotes";
import { useAllBookmarks } from "@/hooks/useAllBookmarks";
import { formatTime } from "@/lib/utils";

function App() {
  const hideRecommendations = useHideRecommendations();
  const hideComments = useHideComments();
  const autoPause = useAutoPause();
  const autoResume = useAutoResume();
  const { theme, setTheme } = useTheme();

  const { data: noteGroups = [], isLoading: isLoadingNotes } = useAllNotes();
  const { data: bookmarks = [], isLoading: isLoadingBookmarks } =
    useAllBookmarks();
  const [searchTerm, setSearchTerm] = useState("");

  const filteredNotes = (noteGroups as any[]).filter(
    (g: any) =>
      g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      g.channel.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredBookmarks = (bookmarks as any[]).filter(
    (b: any) =>
      b.video_title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.channel_title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-background text-foreground flex h-[450px] w-[350px] flex-col font-sans">
      {/* Header */}
      <div className="border-border bg-card/50 border-b p-4 backdrop-blur-sm">
        <h1 className="from-primary to-secondary-foreground bg-linear-to-r bg-clip-text text-xl font-bold text-transparent">
          VideoNotes
        </h1>
        <p className="text-muted-foreground text-xs">
          Your Personal Learning Companion
        </p>
      </div>

      <Tabs
        defaultValue="notes"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="bg-muted/50 grid w-full grid-cols-3 p-2">
          <TabsTrigger value="notes" className="gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Notes
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>View your timestamped notes</p>
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Bookmark className="h-4 w-4" />
                  Bookmarks
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Quick jump to saved moments</p>
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p>Configure focus mode & preferences</p>
              </TooltipContent>
            </Tooltip>
          </TabsTrigger>
        </TabsList>

        {/* NOTES TAB */}
        <TabsContent
          value="notes"
          className="flex-1 content-start overflow-auto p-4"
        >
          <div className="relative mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Search by title or channel</p>
              </TooltipContent>
            </Tooltip>
            <input
              type="text"
              placeholder="Search notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border py-2 pl-8 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>

          <div className="space-y-3 pb-4">
            {filteredNotes.length > 0 ? (
              filteredNotes.map((group: any) => (
                <div
                  key={group.video_id}
                  className="bg-card hover:bg-accent/40 border-border group flex cursor-pointer gap-3 rounded-lg border p-3 transition-all"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${group.video_id}`,
                      "_blank"
                    )
                  }
                >
                  {/* Thumbnail / Icon */}
                  <div className="bg-muted shrink-0 overflow-hidden rounded-md">
                    {group.thumbnail_url ? (
                      <img
                        src={group.thumbnail_url}
                        alt=""
                        className="h-10 w-16 object-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          // Try fallback to medium quality if HQ fails
                          if (
                            img.src.includes("hqdefault.jpg") &&
                            group.video_id
                          ) {
                            img.src = `https://i.ytimg.com/vi/${group.video_id}/mqdefault.jpg`;
                          } else {
                            // Final fallback to icon
                            img.style.display = "none";
                            img.nextElementSibling?.classList.remove("hidden");
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`flex h-10 w-16 items-center justify-center ${
                        group.thumbnail_url ? "hidden" : ""
                      }`}
                    >
                      <FileText className="text-muted-foreground h-4 w-4" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4 className="line-clamp-2 cursor-help text-xs leading-tight font-semibold">
                          {group.title}
                        </h4>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p>{group.title}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground line-clamp-1 text-[10px]">
                        {group.channel}
                      </span>
                      <span className="bg-primary/10 text-primary shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold">
                        {group.count} {group.count === 1 ? "note" : "notes"}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center opacity-50">
                <FileText className="text-muted-foreground mb-2 h-10 w-10" />
                <p className="text-sm">No notes found yet.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* BOOKMARKS TAB */}
        <TabsContent
          value="bookmarks"
          className="flex-1 content-start overflow-auto p-4"
        >
          <div className="relative mb-4">
            <Tooltip>
              <TooltipTrigger asChild>
                <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4 cursor-help" />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Search bookmarks</p>
              </TooltipContent>
            </Tooltip>
            <input
              type="text"
              placeholder="Search bookmarks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border py-2 pl-8 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>

          <div className="space-y-3 pb-4">
            {filteredBookmarks.length > 0 ? (
              filteredBookmarks.map((bookmark: any) => (
                <div
                  key={bookmark.videoId}
                  className="bg-card hover:bg-accent/40 border-border group flex cursor-pointer gap-3 rounded-lg border p-3 transition-all"
                  onClick={() =>
                    window.open(
                      `https://www.youtube.com/watch?v=${bookmark.videoId}&t=${Math.floor(
                        bookmark.timestamp
                      )}s`,
                      "_blank"
                    )
                  }
                >
                  {/* Thumbnail / Icon */}
                  <div className="bg-muted shrink-0 overflow-hidden rounded-md">
                    {bookmark.thumbnail_url ? (
                      <img
                        src={bookmark.thumbnail_url}
                        alt=""
                        className="h-10 w-16 object-cover"
                        onError={(e) => {
                          const img = e.currentTarget;
                          // Try fallback to medium quality if HQ fails
                          if (
                            img.src.includes("hqdefault.jpg") &&
                            bookmark.videoId
                          ) {
                            img.src = `https://i.ytimg.com/vi/${bookmark.videoId}/mqdefault.jpg`;
                          } else {
                            // Final fallback to icon
                            img.style.display = "none";
                            img.nextElementSibling?.classList.remove("hidden");
                          }
                        }}
                      />
                    ) : null}
                    <div
                      className={`flex h-10 w-16 items-center justify-center ${
                        bookmark.thumbnail_url ? "hidden" : ""
                      }`}
                    >
                      <Bookmark className="text-muted-foreground h-4 w-4" />
                    </div>
                  </div>

                  <div className="min-w-0 flex-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <h4 className="line-clamp-2 cursor-help text-xs leading-tight font-semibold">
                          {bookmark.video_title}
                        </h4>
                      </TooltipTrigger>
                      <TooltipContent side="top" className="max-w-[280px]">
                        <p>{bookmark.video_title}</p>
                      </TooltipContent>
                    </Tooltip>
                    <div className="mt-1 flex items-center justify-between gap-2">
                      <span className="text-muted-foreground line-clamp-1 text-[10px]">
                        {bookmark.channel_title}
                      </span>
                      <span className="bg-secondary/20 text-secondary-foreground shrink-0 rounded-full px-2 py-0.5 font-mono text-[9px] font-bold">
                        {formatTime(bookmark.timestamp)}
                      </span>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex h-40 flex-col items-center justify-center text-center opacity-50">
                <Bookmark className="text-muted-foreground mb-2 h-10 w-10" />
                <p className="text-sm">No bookmarks found.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* SETTINGS TAB */}
        <TabsContent
          value="settings"
          className="flex-1 space-y-4 overflow-auto p-4"
        >
          {/* Focus Mode Section */}
          <div className="border-border bg-card space-y-3 rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Focus Mode</Label>
              <p className="text-muted-foreground text-xs">
                Control distractions on YouTube
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label
                  htmlFor="hide-recommendations"
                  className="text-sm font-medium"
                >
                  Hide Recommendations
                </Label>
                <p className="text-muted-foreground text-xs">
                  Hide sidebar suggestions
                </p>
              </div>
              <Switch
                id="hide-recommendations"
                checked={hideRecommendations.isEnabled}
                onCheckedChange={hideRecommendations.setIsEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="hide-comments" className="text-sm font-medium">
                  Hide Comments
                </Label>
                <p className="text-muted-foreground text-xs">
                  Hide comment section
                </p>
              </div>
              <Switch
                id="hide-comments"
                checked={hideComments.isEnabled}
                onCheckedChange={hideComments.setIsEnabled}
              />
            </div>
          </div>

          {/* Auto-Pause Section */}
          <div className="border-border bg-card space-y-3 rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">Video Playback</Label>
              <p className="text-muted-foreground text-xs">
                Control auto-pause behavior
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-pause" className="text-sm font-medium">
                  Auto-Pause on Switch
                </Label>
                <p className="text-muted-foreground text-xs">
                  Pause when switching tabs
                </p>
              </div>
              <Switch
                id="auto-pause"
                checked={autoPause.isAutoPauseEnabled}
                onCheckedChange={autoPause.setIsAutoPauseEnabled}
              />
            </div>

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="auto-resume" className="text-sm font-medium">
                  Auto-Resume on Return
                </Label>
                <p className="text-muted-foreground text-xs">
                  Resume when returning to tab
                </p>
              </div>
              <Switch
                id="auto-resume"
                checked={autoResume.isEnabled}
                onCheckedChange={autoResume.setIsEnabled}
              />
            </div>
          </div>

          {/* Keyboard Shortcuts Section */}
          <div className="border-border bg-card space-y-3 rounded-lg border p-4 shadow-sm">
            <div className="space-y-0.5">
              <Label className="text-base font-medium">
                Keyboard Shortcuts
              </Label>
              <p className="text-muted-foreground text-xs">
                Quick commands for faster note taking
              </p>
            </div>

            <div className="space-y-2">
              {[
                { label: "New Note", key: "N", desc: "Stamp & open editor" },
                { label: "Toggle UI", key: "S", desc: "Show/hide workspace" },
                { label: "Quick Save", key: "B", desc: "Instant bookmark" },
              ].map((s) => (
                <div
                  key={s.key}
                  className="flex items-center justify-between text-xs"
                >
                  <div className="flex flex-col">
                    <span className="font-medium">{s.label}</span>
                    <span className="text-muted-foreground text-[10px]">
                      {s.desc}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 font-mono">
                    <span className="bg-muted text-muted-foreground flex h-5 min-w-8 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold">
                      {window.navigator.userAgent.toLowerCase().includes("mac")
                        ? "⌥"
                        : "Alt"}
                    </span>
                    <span className="text-muted-foreground">+</span>
                    <span className="bg-muted text-muted-foreground flex h-5 min-w-5 items-center justify-center rounded-sm px-1.5 text-[10px] font-bold">
                      {s.key}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-border bg-card flex flex-col rounded-lg border p-4 shadow-sm">
            <div className="mb-4 space-y-0.5">
              <Label className="text-base font-medium">Appearance</Label>
              <p className="text-muted-foreground text-xs">
                Customize your viewing theme
              </p>
            </div>

            <div className="bg-muted/50 grid grid-cols-3 gap-2 rounded-md p-1">
              {[
                {
                  id: "system" as Theme,
                  label: "System",
                  icon: Monitor,
                  tooltip: "Follow system theme",
                },
                {
                  id: "light" as Theme,
                  label: "Light",
                  icon: Sun,
                  tooltip: "Light mode",
                },
                {
                  id: "dark" as Theme,
                  label: "Dark",
                  icon: Moon,
                  tooltip: "Dark mode",
                },
              ].map((t) => (
                <Tooltip key={t.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => setTheme(t.id)}
                      className={`flex items-center justify-center gap-2 rounded-md py-1.5 text-xs font-medium transition-all hover:cursor-pointer ${
                        theme === t.id
                          ? "bg-primary/10 text-primary border-primary/20 border shadow-xs"
                          : "text-muted-foreground hover:bg-muted/50 border border-transparent"
                      }`}
                    >
                      <t.icon
                        className={`h-3.5 w-3.5 ${theme === t.id ? "text-primary" : ""}`}
                      />
                      {t.label}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">
                    <p>{t.tooltip}</p>
                  </TooltipContent>
                </Tooltip>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
