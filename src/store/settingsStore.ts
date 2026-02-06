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

        // Retry to wait for cocoService to initialize the repo, 
        // but only if a wallet exists.
        for (let i = 0; i < 15; i++) {
            try {
                // Check if wallet exists first. If not, we don't need to try getRepo.
                const exists = await cocoService.walletExists();
                if (!exists) {
                    set({ initialized: true });
                    return;
                }

                const repo = cocoService.getRepo();
                const storedTheme = await repo.settingsRepository.getSetting('theme');
                if (storedTheme) {
                    set({ theme: storedTheme as ThemePreference, initialized: true });
                } else {
                    set({ initialized: true });
                }
                return;
            } catch (error) {
                // If it's a "Repositories not initialized" error, we just wait.
                // Other errors we might want to know about eventually.
                if (i === 14) {
                    console.log('[SettingsStore] Repo not available yet, using defaults.');
                    set({ initialized: true });
                }
                await delay(300);
            }
        }
    },

    setTheme: async (theme: ThemePreference) => {
        try {
            const exists = await cocoService.walletExists();
            if (exists) {
                const repo = cocoService.getRepo();
                await repo.settingsRepository.setSetting('theme', theme);
            }
            set({ theme });
        } catch (error) {
            console.error('[SettingsStore] Failed to set theme:', error);
            // Still set state so UI reflects choice even if save fails
            set({ theme });
        }
    },
}));
