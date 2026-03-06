import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { sqliteStorage } from './sqliteStorage';
import {
    initService,
    walletService,
    mintManager,
} from '../services/core';
import type { MintInfo } from '../services/core';
import { useSettingsStore } from './settingsStore';
import { DEFAULT_MINT } from './constants';

export type MintRestoreStatus = 'pending' | 'scanning' | 'done' | 'error';

export interface MintRestoreEntry {
    mintUrl: string;
    status: MintRestoreStatus;
    restoredBalance: number;
    error?: string;
}

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
    scannerResult: string | null;
    isRefreshing: boolean;
    mintRestoreStatuses: MintRestoreEntry[];

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
    restoreAllMints: (extraMintUrls?: string[]) => Promise<void>;
    setScannerResult: (result: string | null) => void;
}



export const useWalletStore = create<WalletState>()(
    persist(
        (set, get) => ({
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
            scannerResult: null,
            isRefreshing: false,
            mintRestoreStatuses: [],


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

                    // Ensure the user's default mint exists and is trusted
                    const userDefaultMint = useSettingsStore.getState().defaultMintUrl || DEFAULT_MINT;
                    const existingMints = await manager.mint.getAllMints();
                    const hasDefault = existingMints.some(m => m.mintUrl === userDefaultMint);

                    if (!hasDefault) {
                        await mintManager.addMint(userDefaultMint, { trusted: true });
                    } else {
                        const isTrusted = await manager.mint.isTrustedMint(userDefaultMint);
                        if (!isTrusted) {
                            await mintManager.trustMint(userDefaultMint);
                        }
                    }

                    // Repair corrupted keysets for all mints in PARALLEL
                    const allMints = await manager.mint.getAllMints();
                    const repairResults = await Promise.all(
                        allMints.map(mint => mintManager.repairMintKeysets(mint.mintUrl, 'sat'))
                    );

                    const anyRepaired = repairResults.some(r => r === true);

                    // Reinit if keysets were repaired (rare but necessary)
                    if (anyRepaired) {
                        console.log('[WalletStore] Reinitializing after keyset repair...');
                        await manager.dispose?.();
                        initService.reset();
                        await initService.init();
                    }

                    // Set active mint if not set
                    if (!get().activeMintUrl) {
                        const userDefaultMint = useSettingsStore.getState().defaultMintUrl || DEFAULT_MINT;
                        set({ activeMintUrl: userDefaultMint });
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
                    set({ isRefreshing: true, error: null });
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
                    set({ balance, balances, refreshCounter: get().refreshCounter + 1, isRefreshing: false });
                } catch (err: any) {
                    console.error('[WalletStore] Error refreshing balance:', err);
                    set({ error: err.message, isRefreshing: false });
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

                        // Yield briefly for UI responsiveness
                        await new Promise(resolve => setTimeout(resolve, 50));

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
                        // Yield briefly before next mint
                        await new Promise(resolve => setTimeout(resolve, 200));
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
                        const userDefaultMint = useSettingsStore.getState().defaultMintUrl || DEFAULT_MINT;
                        // Don't set active if the newly removed mint WAS the default mint
                        if (url !== userDefaultMint) {
                            set({ activeMintUrl: userDefaultMint });
                        } else {
                            const nextActive = get().mints.find(m => m.mintUrl !== url)?.mintUrl;
                            set({ activeMintUrl: nextActive || null });
                        }
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
                    set({ isRefreshing: true });
                    const mintInfos = await mintManager.getMintInfoList();
                    set({ mints: mintInfos, isRefreshing: false });
                } catch (err: any) {
                    console.error('[WalletStore] Failed to refresh mint list:', err);
                    set({ isRefreshing: false });
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

            /**
             * Restore all mints: DEFAULT_MINT + all trusted mints already in DB
             * + any extra mint URLs passed in (e.g. from a backup file).
             * Populates mintRestoreStatuses for progress UI.
             */
            restoreAllMints: async (extraMintUrls: string[] = []) => {
                // Build deduplicated list of mints to restore
                const urlSet = new Set<string>([DEFAULT_MINT, ...extraMintUrls]);
                try {
                    const trustedMints = await mintManager.getAllTrustedMints();
                    for (const m of trustedMints) urlSet.add(m.mintUrl);
                } catch (e) {
                    console.warn('[WalletStore] Could not fetch trusted mints for restore:', e);
                }

                const mintUrls = Array.from(urlSet);

                // Initialise status entries
                set({
                    mintRestoreStatuses: mintUrls.map(url => ({
                        mintUrl: url,
                        status: 'pending',
                        restoredBalance: 0,
                    })),
                    isRestoring: true,
                });

                for (const mintUrl of mintUrls) {
                    // Mark as scanning
                    set(s => ({
                        mintRestoreStatuses: s.mintRestoreStatuses.map(e =>
                            e.mintUrl === mintUrl ? { ...e, status: 'scanning' } : e
                        ),
                        restoringMintUrl: mintUrl,
                    }));

                    try {
                        // Ensure mint is added and trusted before restoring
                        await mintManager.addMint(mintUrl, { trusted: true });
                        await walletService.restore(mintUrl);

                        // Get restored balance for this mint
                        const allBalances = await walletService.getBalances();
                        const restoredBalance = allBalances[mintUrl] ?? 0;

                        set(s => ({
                            mintRestoreStatuses: s.mintRestoreStatuses.map(e =>
                                e.mintUrl === mintUrl
                                    ? { ...e, status: 'done', restoredBalance }
                                    : e
                            ),
                        }));
                    } catch (err: any) {
                        console.warn(`[WalletStore] Restore failed for ${mintUrl}:`, err?.message);
                        set(s => ({
                            mintRestoreStatuses: s.mintRestoreStatuses.map(e =>
                                e.mintUrl === mintUrl
                                    ? { ...e, status: 'error', error: err?.message }
                                    : e
                            ),
                        }));
                    }
                }

                // Final refresh
                await get().refreshBalance();
                const mintInfos = await mintManager.getMintInfoList();
                set({ isRestoring: false, restoringMintUrl: null, mints: mintInfos });
                console.log('[WalletStore] ✅ All mints restored');
            },

            setScannerResult: (result: string | null) => {
                set({ scannerResult: result });
            },

        }),
        {
            name: 'wallet-storage',
            storage: createJSONStorage(() => sqliteStorage),
            partialize: (state) => ({
                activeMintUrl: state.activeMintUrl,
                balance: state.balance,
                balances: state.balances,
                mints: state.mints,
            }),
        }
    )
);
