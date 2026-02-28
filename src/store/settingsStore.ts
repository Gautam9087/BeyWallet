import { create } from 'zustand';
import { initService } from '../services/core';
import { DEFAULT_MINT } from './walletStore';

export type ThemePreference = 'light' | 'dark' | 'system';

interface SettingsState {
    theme: ThemePreference;
    secondaryCurrency: string;
    defaultMintUrl: string;
    initialized: boolean;
    initialize: () => Promise<void>;
    setTheme: (theme: ThemePreference) => Promise<void>;
    setSecondaryCurrency: (currency: string) => Promise<void>;
    setDefaultMintUrl: (url: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
    theme: 'system',
    secondaryCurrency: 'USD',
    defaultMintUrl: DEFAULT_MINT,
    initialized: false,

    initialize: async () => {
        if (get().initialized) return;

        const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

        // Retry to wait for initService to initialize the repo, 
        // but only if a wallet exists.
        for (let i = 0; i < 15; i++) {
            try {
                // Check if wallet exists first. If not, we don't need to try getRepo.
                const exists = await initService.walletExists();
                if (!exists) {
                    set({ initialized: true });
                    return;
                }

                const repo = initService.getRepo();
                const storedTheme = await repo.settingsRepository.getSetting('theme');
                if (storedTheme) {
                    set({ theme: storedTheme as ThemePreference });
                }
                const storedCurrency = await repo.settingsRepository.getSetting('secondaryCurrency');
                if (storedCurrency) {
                    set({ secondaryCurrency: storedCurrency });
                }

                // Load default mint
                const storedMintUrl = await repo.settingsRepository.getSetting('defaultMintUrl');
                if (storedMintUrl) {
                    set({ defaultMintUrl: storedMintUrl });
                }

                set({ initialized: true });
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
            const exists = await initService.walletExists();
            if (exists) {
                const repo = initService.getRepo();
                await repo.settingsRepository.setSetting('theme', theme);
            }
            set({ theme });
        } catch (error) {
            console.error('[SettingsStore] Failed to set theme:', error);
            // Still set state so UI reflects choice even if save fails
            set({ theme });
        }
    },

    setSecondaryCurrency: async (currency: string) => {
        try {
            const exists = await initService.walletExists();
            if (exists) {
                const repo = initService.getRepo();
                await repo.settingsRepository.setSetting('secondaryCurrency', currency);
            }
            set({ secondaryCurrency: currency });
        } catch (error) {
            console.error('[SettingsStore] Failed to set secondary currency:', error);
            set({ secondaryCurrency: currency });
        }
    },

    setDefaultMintUrl: async (url: string) => {
        try {
            const exists = await initService.walletExists();
            if (exists) {
                const repo = initService.getRepo();
                await repo.settingsRepository.setSetting('defaultMintUrl', url);
            }
            set({ defaultMintUrl: url });
        } catch (error) {
            console.error('[SettingsStore] Failed to set default mint:', error);
            set({ defaultMintUrl: url });
        }
    },
}));
