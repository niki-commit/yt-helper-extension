import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cloud, CloudOff, CheckCircle2, ArrowUpRight } from "lucide-react";
import {
  getSettings,
  updateSettings,
  GlobalSettings,
  defaultSettings,
} from "@/storage/settings";
import { authActions } from "@/utils/auth";
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
    <div className="dark w-[360px] p-6 bg-[#020617] text-zinc-200 font-sans antialiased selection:bg-indigo-500/30">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 pb-8 flex flex-row items-start justify-between">
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

        <CardContent className="p-0 space-y-8">
          <div className="space-y-5">
            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label
                  htmlFor="auto-pause"
                  className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors cursor-pointer"
                >
                  Auto-Pause
                </Label>
                <div className="text-[11px] text-zinc-500 font-medium">
                  Pause when switching focus
                </div>
              </div>
              <Switch
                id="auto-pause"
                checked={settings.autoPauseEnabled}
                onCheckedChange={toggleAutoPause}
                className="data-[state=checked]:bg-indigo-600 border-zinc-700 bg-zinc-800/50"
              />
            </div>

            <div className="flex items-center justify-between group">
              <div className="space-y-1">
                <Label
                  htmlFor="distraction-free"
                  className="text-sm font-bold text-zinc-200 group-hover:text-white transition-colors cursor-pointer"
                >
                  Focus Mode
                </Label>
                <div className="text-[11px] text-zinc-500 font-medium">
                  Hide sidebars & comments
                </div>
              </div>
              <Switch
                id="distraction-free"
                checked={settings.distractionFreeEnabled}
                onCheckedChange={toggleDistraction}
                className="data-[state=checked]:bg-indigo-600 border-zinc-700 bg-zinc-800/50"
              />
            </div>
          </div>

          <div className="pt-8 border-t border-zinc-200/5">
            {isAuthenticated === null ? (
              <div className="h-20 w-full bg-white/[0.02] animate-pulse rounded-2xl" />
            ) : isAuthenticated ? (
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-4 bg-white/[0.03] rounded-2xl border border-zinc-200/5 hover:bg-white/[0.05] transition-all group">
                  <div className="p-2.5 bg-indigo-500/10 rounded-xl">
                    <Cloud className="w-5 h-5 text-indigo-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[13px] font-bold text-white">
                      Dashboard Live
                    </p>
                    <p className="text-[10px] text-zinc-500 font-medium font-mono uppercase tracking-tighter">
                      100% Security Guaranteed
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-xl hover:bg-zinc-800 transition-all"
                    asChild
                  >
                    <a
                      href="http://localhost:3000"
                      target="_blank"
                      rel="noreferrer"
                    >
                      <ArrowUpRight className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                    </a>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-5">
                <div className="text-center space-y-2 px-4">
                  <p className="text-[13px] font-bold text-white italic">
                    Unlock Global Learning
                  </p>
                  <p className="text-[11px] text-zinc-500 leading-relaxed">
                    Enable cloud sync to access your library on all devices.
                  </p>
                </div>
                <Button
                  className="w-full bg-white text-black hover:bg-zinc-200 font-black text-xs uppercase tracking-widest rounded-xl h-12 shadow-lg transition-transform active:scale-95"
                  onClick={handleLinkAccount}
                  disabled={isLinking}
                >
                  {isLinking ? "Connecting..." : "Link My Account"}
                </Button>
              </div>
            )}
          </div>
        </CardContent>
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
