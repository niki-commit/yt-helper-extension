import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch'; // Need to install/add Switch
import { Label } from '@/components/ui/label';
import { getSettings, updateSettings, GlobalSettings, defaultSettings } from '@/storage/settings';
import '@/styles/globals.css';

function App() {
  const [settings, setSettings] = useState<GlobalSettings>(defaultSettings);

  useEffect(() => {
    // Load initial
    getSettings().then(setSettings);
  }, []);

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
    <div className="w-[350px] p-4 bg-slate-50 dark:bg-slate-950 min-h-[400px]">
      <Card className="border-none shadow-none bg-transparent">
        <CardHeader className="p-0 pb-4">
          <CardTitle className="text-xl">VideoNotes</CardTitle>
          <div className="text-sm text-slate-500">
            Distraction-free YouTube learning
          </div>
        </CardHeader>
        <CardContent className="p-0 space-y-6">
          
          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="auto-pause">Auto-Pause</Label>
              <div className="text-xs text-slate-500">
                Pause video when you switch tabs
              </div>
            </div>
            <Switch
              id="auto-pause"
              checked={settings.autoPauseEnabled}
              onCheckedChange={toggleAutoPause}
            />
          </div>

          <div className="flex items-center justify-between space-x-2">
            <div className="space-y-0.5">
              <Label htmlFor="distraction-free">No-Distraction Mode</Label>
              <div className="text-xs text-slate-500">
                Hide recommendations & sidebar
              </div>
            </div>
            <Switch
              id="distraction-free"
              checked={settings.distractionFreeEnabled}
              onCheckedChange={toggleDistraction}
            />
          </div>

          <div className="pt-4 border-t">
             <div className="text-xs text-center text-slate-400">
                Cloud Sync is disabled (Free Plan)
             </div>
          </div>

        </CardContent>
      </Card>
    </div>
  );
}

export default App;
