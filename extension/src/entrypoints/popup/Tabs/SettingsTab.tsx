import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Cloud, CloudOff, ArrowUpRight } from "lucide-react";
import { GlobalSettings } from "@/storage/settings";

interface SettingsTabProps {
  settings: GlobalSettings;
  isAuthenticated: boolean;
  isLinking: boolean;
  onToggleAutoPause: (checked: boolean) => void;
  onToggleDistraction: (checked: boolean) => void;
  onLinkAccount: () => void;
}

export function SettingsTab({
  settings,
  isAuthenticated,
  isLinking,
  onToggleAutoPause,
  onToggleDistraction,
  onLinkAccount,
}: SettingsTabProps) {
  return (
    <div className="space-y-6">
      {/* Settings Controls */}
      <div className="space-y-4">
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
            onCheckedChange={onToggleAutoPause}
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
            onCheckedChange={onToggleDistraction}
            className="data-[state=checked]:bg-indigo-600 border-zinc-700 bg-zinc-800/50"
          />
        </div>
      </div>

      {/* Auth Section */}
      <div className="pt-4 border-t border-zinc-200/5">
        {isAuthenticated === null ? (
          <div className="h-20 w-full bg-white/2 animate-pulse rounded-2xl" />
        ) : isAuthenticated ? (
          <div className="space-y-3">
            <div className="flex items-center gap-4 p-4 bg-white/3 rounded-2xl border border-zinc-200/5 hover:bg-white/5 transition-all group">
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
              onClick={onLinkAccount}
              disabled={isLinking}
            >
              {isLinking ? "Connecting..." : "Link My Account"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
