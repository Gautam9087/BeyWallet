import { create } from 'zustand';
import { cocoService } from '../services/cocoService';
import { mintService } from '../services/mintService';
import { seedService } from '../services/seedService';

interface WalletState {
    activeMintUrl: string | null;
    balance: number;
    isInitializing: boolean;
    error: string | null;
    mints: string[]; // List of registered mint URLs

    // Actions
    initialize: () => Promise<void>;
    setActiveMint: (url: string) => void;
    addMint: (url: string) => Promise<void>;
    refreshBalance: () => Promise<void>;
}

export const useWalletStore = create<WalletState>((set, get) => ({
    activeMintUrl: null,
    balance: 0,
    isInitializing: false,
    error: null,
    mints: [],

    initialize: async () => {
        set({ isInitializing: true, error: null });
        console.log('[WalletStore] Starting initialization...');
        try {
            console.log('[WalletStore] Calling cocoService.init()');
            const manager = await cocoService.init();
            console.log('[WalletStore] cocoService initialized');

            const defaultMint = "https://testnut.cashu.space";

            // Check if we already have mints
            const existingMints = await manager.mint.getAllMints();
            console.log(`[WalletStore] Existing mints: ${existingMints.length}`);
            const hasDefault = existingMints.some(m => m.mintUrl === defaultMint);

            if (!hasDefault) {
                console.log(`[WalletStore] Adding default mint: ${defaultMint}`);
                // Add the default mint if it doesn't exist
                await manager.mint.addMint(defaultMint);
                console.log('[WalletStore] Default mint added');
            }

            // Always ensure the default test mint is active for the user's request
            if (!get().activeMintUrl) {
                console.log('[WalletStore] Setting active mint URL');
                set({ activeMintUrl: defaultMint });
            }

            // Sync balance (initially)
            console.log('[WalletStore] Refreshing balance');
            await get().refreshBalance();

            // Store list of mint URLs
            const finalMints = await manager.mint.getAllMints();
            set({
                isInitializing: false,
                mints: finalMints.map(m => m.mintUrl)
            });
            console.log('[WalletStore] Initialization complete');
        } catch (err: any) {
            console.error('[WalletStore] Initialization failed:', err);
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
            const manager = cocoService.getManager();
            const allMints = await manager.mint.getAllMints();
            set({
                activeMintUrl: url,
                mints: allMints.map(m => m.mintUrl)
            });
            get().refreshBalance();
        } catch (err: any) {
            set({ error: err.message });
        }
    },

    refreshBalance: async () => {
        try {
            const manager = cocoService.getManager();
            const activeUrl = get().activeMintUrl;
            if (!activeUrl) {
                set({ balance: 0 });
                return;
            }

            // Calculate balance for the active mint
            const balances = await manager.wallet.getBalances();
            const balance = balances[activeUrl] || 0;
            set({ balance });
        } catch (err) {
            console.error('Error refreshing balance:', err);
        }
    }
}));
