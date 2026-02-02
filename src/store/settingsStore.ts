import { create } from 'zustand';
import { cocoService } from '../services/cocoService';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
    theme: ThemePreference;
    initialized: boolean;
    initialize: () => Promise<void>;
    setTheme: (theme: ThemePreference) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    theme: 'system',
    initialized: false,

    initialize: async () => {
        if (get().initialized) return;

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        // Retry a few times to wait for cocoService to initialize the repo
        for (let i = 0; i < 10; i++) {
            try {
                const repo = cocoService.getRepo();
                const storedTheme = await repo.settingsRepository.getSetting('theme');
                if (storedTheme) {
                    set({ theme: storedTheme as ThemePreference, initialized: true });
                } else {
                    set({ initialized: true });
                }
                return;
            } catch (error) {
                // Only log error on the last attempt
                if (i === 9) {
                    console.error('[SettingsStore] Failed to initialize settings after retries:', error);
                    set({ initialized: true });
                }
                // Wait 200ms before retrying
                await delay(200);
            }
        }
    },

    setTheme: async (theme: ThemePreference) => {
        try {
            const repo = cocoService.getRepo();
            await repo.settingsRepository.setSetting('theme', theme);
            set({ theme });
        } catch (error) {
            console.error('[SettingsStore] Failed to set theme:', error);
        }
    },
}));
