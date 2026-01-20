import { useState } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
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

function App() {
  const hideRecommendations = useHideRecommendations();
  const hideComments = useHideComments();
  const autoPause = useAutoPause();
  const autoResume = useAutoResume();
  const { theme, setTheme } = useTheme();

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
        defaultValue="settings"
        className="flex flex-1 flex-col overflow-hidden"
      >
        <TabsList className="bg-muted/50 grid w-full grid-cols-3 p-2">
          <TabsTrigger value="notes" className="gap-2">
            <FileText className="h-4 w-4" />
            Notes
          </TabsTrigger>
          <TabsTrigger value="bookmarks" className="gap-2">
            <Bookmark className="h-4 w-4" />
            Bookmarks
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-2">
            <Settings className="h-4 w-4" />
            Settings
          </TabsTrigger>
        </TabsList>

        {/* NOTES TAB */}
        <TabsContent
          value="notes"
          className="flex-1 content-start overflow-auto p-4"
        >
          <div className="relative mb-4">
            <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
            <input
              type="text"
              placeholder="Search notes..."
              className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring w-full rounded-md border py-2 pl-8 text-sm focus-visible:ring-2 focus-visible:outline-none"
            />
          </div>
          <div className="flex h-40 flex-col items-center justify-center text-center opacity-50">
            <FileText className="text-muted-foreground mb-2 h-10 w-10" />
            <p className="text-sm">No notes found yet.</p>
          </div>
        </TabsContent>

        {/* BOOKMARKS TAB */}
        <TabsContent
          value="bookmarks"
          className="flex flex-1 flex-col items-center justify-center overflow-auto p-4 text-center opacity-50"
        >
          <Bookmark className="text-muted-foreground mb-2 h-10 w-10" />
          <p className="text-sm">No bookmarks saved.</p>
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

          <div className="border-border bg-card flex flex-col rounded-lg border p-4 shadow-sm">
            <div className="mb-4 space-y-0.5">
              <Label className="text-base font-medium">Appearance</Label>
              <p className="text-muted-foreground text-xs">
                Customize your viewing theme
              </p>
            </div>

            <div className="bg-muted/50 grid grid-cols-3 gap-2 rounded-md p-1">
              {[
                { id: "system" as Theme, label: "System", icon: Monitor },
                { id: "light" as Theme, label: "Light", icon: Sun },
                { id: "dark" as Theme, label: "Dark", icon: Moon },
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className={`flex items-center justify-center gap-2 rounded-sm py-1.5 text-xs font-medium transition-all hover:cursor-pointer ${
                    theme === t.id
                      ? "bg-card text-foreground shadow-sm ring-1 ring-black/5"
                      : "text-muted-foreground hover:bg-card/50"
                  }`}
                >
                  <t.icon
                    className={`h-3.5 w-3.5 ${theme === t.id ? "text-primary" : ""}`}
                  />
                  {t.label}
                </button>
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export default App;
