

export interface GlobalSettings {
  autoPauseEnabled: boolean;
  distractionFreeEnabled: boolean;
}

export const defaultSettings: GlobalSettings = {
  autoPauseEnabled: false,
  distractionFreeEnabled: false,
};

export const settingsStorage = storage.defineItem<GlobalSettings>('local:settings', {
  defaultValue: defaultSettings,
});

export const getSettings = async (): Promise<GlobalSettings> => {
  return await settingsStorage.getValue();
};

export const updateSettings = async (updates: Partial<GlobalSettings>) => {
  const current = await getSettings();
  await settingsStorage.setValue({ ...current, ...updates });
};

export const watchSettings = (callback: (settings: GlobalSettings) => void) => {
  return settingsStorage.watch(callback);
};
