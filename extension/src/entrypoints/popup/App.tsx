import React, { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { CloudOff } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import {
  getSettings,
  updateSettings,
  GlobalSettings,
  defaultSettings,
} from "@/storage/settings";
import { authActions } from "@/utils/auth";
import { SettingsTab } from "./Tabs/SettingsTab";
import { NotesTab } from "./Tabs/NotesTab";
import { BookmarksTab } from "./Tabs/BookmarksTab";
import "@/styles/globals.css";

function App() {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLinking, setIsLinking] = useState<boolean>(false);

  useEffect(() => {
    // Load settings
    getSettings().then(setSettings);

    // Check auth status
    authActions.isAuthenticated().then((authenticated) => {
      setIsAuthenticated(authenticated);
      if (authenticated) {
        // Trigger a sync check whenever popup is opened
        browser.runtime.sendMessage({ type: "TRIGGER_SYNC" }).catch(() => {});
      }
    });

    // Listen for auth updates
    const listener = (message: any) => {
      if (message.type === "AUTH_UPDATED") {
        setIsAuthenticated(message.authenticated);
        setIsLinking(false);
      }
    };
    browser.runtime.onMessage.addListener(listener);
    return () => browser.runtime.onMessage.removeListener(listener);
  }, []);

  const handleLinkAccount = () => {
    setIsLinking(true);
    browser.tabs.create({
      url: "http://localhost:3000/login?source=extension",
    });
  };

  const toggleAutoPause = async (checked: boolean) => {
    const newSettings = { ...settings, autoPauseEnabled: checked };
    setSettings(newSettings);
    await updateSettings({ autoPauseEnabled: checked });
  };

  const toggleDistraction = async (checked: boolean) => {
    const newSettings = { ...settings, distractionFreeEnabled: checked };
    setSettings(newSettings);
    await updateSettings({ distractionFreeEnabled: checked });
  };

  return (
    <div className="dark w-[420px] p-4 bg-[#020617] text-zinc-200 font-sans antialiased selection:bg-indigo-500/30">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 pb-3 flex flex-row items-start justify-between">
          <div className="space-y-1">
            <CardTitle className="text-2xl font-black tracking-tighter text-white">
              Video<span className="text-indigo-500">Notes</span>
            </CardTitle>
            <div className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">
              Insight Engine
            </div>
          </div>
          {isAuthenticated === null ? (
            <div className="h-6 w-16 bg-zinc-800 animate-pulse rounded-full" />
          ) : isAuthenticated ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Synced
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-zinc-800 text-zinc-500 rounded-full border border-zinc-700">
              <CloudOff className="w-3.5 h-3.5" />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Offline
              </span>
            </div>
          )}
        </CardHeader>

        <Tabs defaultValue="notes" className="w-full">
          <TabsList className="w-full grid grid-cols-3 mb-2">
            <TabsTrigger value="notes">Notes</TabsTrigger>
            <TabsTrigger value="bookmarks">Bookmarks</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="notes" className="mt-0">
            <NotesTab />
          </TabsContent>

          <TabsContent value="bookmarks" className="mt-0">
            <BookmarksTab />
          </TabsContent>

          <TabsContent value="settings" className="mt-1">
            <SettingsTab
              settings={settings}
              isAuthenticated={isAuthenticated}
              isLinking={isLinking}
              onToggleAutoPause={toggleAutoPause}
              onToggleDistraction={toggleDistraction}
              onLinkAccount={handleLinkAccount}
            />
          </TabsContent>
        </Tabs>
      </Card>

      <div className="mt-6 flex justify-center">
        <div className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-700">
          Build v1.2.0
        </div>
      </div>
    </div>
  );
}

export default App;
