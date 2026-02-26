import { create } from 'zustand';
import {
    initService,
    walletService,
    mintManager,
} from '../services/core';
import type { MintInfo } from '../services/core';

interface WalletState {
    activeMintUrl: string | null;
    balance: number;
    isInitializing: boolean;
    error: string | null;
    mints: MintInfo[];
    refreshCounter: number;
    balances: Record<string, number>;
    isRestoring: boolean;
    restoringMintUrl: string | null;
    restoreQueue: string[];

    // Actions
    initialize: () => Promise<void>;
    setActiveMint: (url: string) => void;
    addMint: (url: string, options?: { trusted?: boolean }) => Promise<void>;
    trustMint: (url: string) => Promise<void>;
    untrustMint: (url: string) => Promise<void>;
    removeMint: (url: string) => Promise<void>;
    setMintNickname: (url: string, nickname: string) => Promise<void>;
    fetchMintInfo: (url: string) => Promise<any>;
    refreshBalance: () => Promise<void>;
    refreshMintList: () => Promise<void>;
    restoreFromSeed: (mintUrl: string) => Promise<void>;
}

export const DEFAULT_MINT = "https://nofee.testnut.cashu.space";

export const useWalletStore = create<WalletState>((set, get) => ({
    activeMintUrl: null,
    balance: 0,
    isInitializing: false,
    error: null,
    mints: [],
    refreshCounter: 0,
    balances: {},
    isRestoring: false,
    restoringMintUrl: null,
    restoreQueue: [],

    initialize: async () => {
        set({ isInitializing: true, error: null });
        console.log('[WalletStore] Starting initialization...');
        try {
            const walletExists = await initService.walletExists();
            if (!walletExists) {
                console.log('[WalletStore] No wallet exists, skipping initialization');
                set({ isInitializing: false });
                return;
            }

            const manager = await initService.init();

            // Ensure default mint exists and is trusted
            const existingMints = await manager.mint.getAllMints();
            const hasDefault = existingMints.some(m => m.mintUrl === DEFAULT_MINT);

            if (!hasDefault) {
                await mintManager.addMint(DEFAULT_MINT, { trusted: true });
            } else {
                const isTrusted = await manager.mint.isTrustedMint(DEFAULT_MINT);
                if (!isTrusted) {
                    await mintManager.trustMint(DEFAULT_MINT);
                }
            }

            // Repair corrupted keysets for all mints
            const allMints = await manager.mint.getAllMints();
            let anyRepaired = false;
            for (const mint of allMints) {
                const repaired = await mintManager.repairMintKeysets(mint.mintUrl, 'sat');
                if (repaired) anyRepaired = true;
            }

            // Reinit if keysets were repaired
            if (anyRepaired) {
                console.log('[WalletStore] Reinitializing after keyset repair...');
                await manager.dispose?.();
                initService.reset();
                await initService.init();
            }

            // Set active mint if not set
            if (!get().activeMintUrl) {
                set({ activeMintUrl: DEFAULT_MINT });
            }

            await get().refreshBalance();

            // Build mint info list for UI
            const mintInfos = await mintManager.getMintInfoList();

            set({
                isInitializing: false,
                mints: mintInfos,
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

    addMint: async (url: string, options?: { trusted?: boolean }) => {
        try {
            await mintManager.addMint(url, options);
            await mintManager.repairMintKeysets(url, 'sat');

            const mintInfos = await mintManager.getMintInfoList();

            set({
                activeMintUrl: url,
                mints: mintInfos,
            });
            get().refreshBalance();
        } catch (err: any) {
            console.error('[WalletStore] Failed to add mint:', err);
            set({ error: err.message });
        }
    },

    trustMint: async (url: string) => {
        try {
            await mintManager.trustMint(url);
            const mintInfos = await mintManager.getMintInfoList();
            set({ mints: mintInfos });
        } catch (err: any) {
            console.error('[WalletStore] Failed to trust mint:', err);
            set({ error: err.message });
        }
    },

    refreshBalance: async () => {
        try {
            if (!initService.isInitialized()) {
                set({ balance: 0 });
                return;
            }

            const activeUrl = get().activeMintUrl;
            if (!activeUrl) {
                set({ balance: 0 });
                return;
            }

            const balances = await walletService.getBalances();
            const balance = await walletService.getBalanceForMint(activeUrl);

            console.log('[WalletStore] Balance:', balance);
            set({ balance, balances, refreshCounter: get().refreshCounter + 1 });
        } catch (err) {
            console.error('[WalletStore] Error refreshing balance:', err);
        }
    },

    restoreFromSeed: async (mintUrl: string) => {
        const state = get();
        if (state.restoreQueue.includes(mintUrl)) return;

        set({ restoreQueue: [...state.restoreQueue, mintUrl] });

        if (state.isRestoring || state.restoreQueue.length > 1) {
            console.log(`[WalletStore] ${mintUrl} added to background sync queue`);
            return;
        }

        while (get().restoreQueue.length > 0) {
            const nextUrl = get().restoreQueue[0];
            try {
                set({ isRestoring: true, restoringMintUrl: nextUrl });

                // Yield for UI responsiveness
                await new Promise(resolve => setTimeout(resolve, 300));

                console.log(`[WalletStore] 🔄 Deep Restore: ${nextUrl}`);

                // Strategy: Multi-unit discovery + standard restore
                // 1. Ensure we have all current keysets for this mint
                await mintManager.addMint(nextUrl, { trusted: true });

                // 2. Perform NIP-06 deterministic restore
                const timeoutPromise = new Promise((_, reject) =>
                    setTimeout(() => reject(new Error('Deep restore timed out after 3 minutes')), 180000)
                );

                await Promise.race([
                    walletService.restore(nextUrl),
                    timeoutPromise
                ]);

                console.log(`[WalletStore] ✅ Deep Restore complete for: ${nextUrl}`);

            } catch (err: any) {
                // coco-cashu-core throws if even *one* historical keyset is missing from the mint API.
                // However, it successfully restores balances for the valid keysets!
                // So we log it as a warning and continue, rather than hard-failing the UI.
                console.warn(`[WalletStore] ⚠️ Deep Restore partial success/failure for ${nextUrl}:`, err);
            } finally {
                // Rescue any valid proofs that got stuck in 'inflight' state when the restore routine crashed
                await walletService.restoreInflightProofs(nextUrl);

                // Refresh balances to capture whatever DID successfully restore
                await get().refreshBalance();

                set(s => ({
                    restoreQueue: s.restoreQueue.filter(u => u !== nextUrl),
                    isRestoring: false,
                    restoringMintUrl: null
                }));
                // Yield before next mint
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
    },

    untrustMint: async (url: string) => {
        try {
            await mintManager.untrustMint(url);
            await get().refreshMintList();
        } catch (err: any) {
            console.error('[WalletStore] Failed to untrust mint:', err);
            set({ error: err.message });
        }
    },

    removeMint: async (url: string) => {
        try {
            await mintManager.removeMint(url);
            await get().refreshMintList();
            if (get().activeMintUrl === url) {
                set({ activeMintUrl: DEFAULT_MINT });
            }
        } catch (err: any) {
            console.error('[WalletStore] Failed to remove mint:', err);
            set({ error: err.message });
        }
    },

    fetchMintInfo: async (url: string) => {
        try {
            return await mintManager.getMintInfo(url);
        } catch (err: any) {
            console.error('[WalletStore] Failed to fetch mint info:', err);
            throw err;
        }
    },

    refreshMintList: async () => {
        try {
            const mintInfos = await mintManager.getMintInfoList();
            set({ mints: mintInfos });
        } catch (err: any) {
            console.error('[WalletStore] Failed to refresh mint list:', err);
        }
    },

    setMintNickname: async (url: string, nickname: string) => {
        try {
            await mintManager.setMintNickname(url, nickname);
            await get().refreshMintList();
        } catch (err: any) {
            console.error('[WalletStore] Failed to set mint nickname:', err);
            set({ error: err.message });
        }
    },
}));
