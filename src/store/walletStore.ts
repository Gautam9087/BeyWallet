import { create } from 'zustand';
import { cocoService } from '../services/cocoService';
import { mintService } from '../services/mintService';
import { seedService } from '../services/seedService';

interface WalletState {
    activeMintUrl: string | null;
    balance: number;
    isInitializing: boolean;
    error: string | null;

    // Actions
    initialize: () => Promise<void>;
    setActiveMint: (url: string) => void;
    addMint: (url: string) => Promise<void>;
    refreshBalance: () => void;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    activeMintUrl: null,
    balance: 0,
    isInitializing: false,
    error: null,

    initialize: async () => {
        set({ isInitializing: true, error: null });
        try {
            const manager = await cocoService.init();
            const defaultMint = "https://testnut.cashu.space";

            // Check if we already have mints
            const existingMints = manager.mintManager.mints;
            const hasDefault = existingMints.some(m => m.url === defaultMint);

            if (!hasDefault) {
                // Add the default mint if it doesn't exist
                await mintService.addMint(defaultMint);
            }

            // Always ensure the default test mint is active for the user's request
            set({ activeMintUrl: defaultMint });

            // Sync balance (initially)
            get().refreshBalance();

            set({ isInitializing: false });
        } catch (err: any) {
            set({ error: err.message, isInitializing: false });
        }
    },

    setActiveMint: (url: string) => {
        set({ activeMintUrl: url });
        get().refreshBalance();
    },

    addMint: async (url: string) => {
        try {
            await mintService.addMint(url);
            set({ activeMintUrl: url });
            get().refreshBalance();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    refreshBalance: () => {
        try {
            const manager = cocoService.getManager();
            const activeUrl = get().activeMintUrl;
            if (!activeUrl) {
                set({ balance: 0 });
                return;
            }

            // Calculate balance for the active mint
            const balance = manager.proofManager.getBalance(activeUrl);
            set({ balance });
        } catch (err) {
            console.error('Error refreshing balance:', err);
        }
    }
}));
