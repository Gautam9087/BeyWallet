import { create } from 'zustand';
import { cocoService } from '../services/cocoService';

interface MintInfo {
    mintUrl: string;
    name?: string;
    nickname?: string;
    description?: string;
    trusted: boolean;
}

interface WalletState {
    activeMintUrl: string | null;
    balance: number;
    isInitializing: boolean;
    error: string | null;
    mints: MintInfo[]; // List of registered mints with trust status
    refreshCounter: number;

    // Actions
    initialize: () => Promise<void>;
    setActiveMint: (url: string) => void;
    addMint: (url: string, options?: { trusted?: boolean }) => Promise<void>;
    trustMint: (url: string) => Promise<void>;
    untrustMint: (url: string) => Promise<void>;
    setMintNickname: (url: string, nickname: string) => Promise<void>;
    fetchMintInfo: (url: string) => Promise<any>;
    refreshBalance: () => Promise<void>;
    refreshMintList: () => Promise<void>;
    restoreFromSeed: (mintUrl: string) => Promise<void>;
}

const DEFAULT_MINT = "https://testnut.cashu.space";

export const useWalletStore = create<WalletState>((set, get) => ({
    activeMintUrl: null,
    balance: 0,
    isInitializing: false,
    error: null,
    mints: [],
    refreshCounter: 0,

    initialize: async () => {
        set({ isInitializing: true, error: null });
        console.log('[WalletStore] Starting initialization...');
        try {
            // Check if wallet exists first
            const walletExists = await cocoService.walletExists();
            if (!walletExists) {
                console.log('[WalletStore] No wallet exists, skipping initialization');
                set({ isInitializing: false });
                return;
            }

            console.log('[WalletStore] Calling cocoService.init()');
            const manager = await cocoService.init();
            console.log('[WalletStore] cocoService initialized');

            // Check if we already have mints
            const existingMints = await manager.mint.getAllMints();
            console.log(`[WalletStore] Existing mints: ${existingMints.length}`);

            const hasDefault = existingMints.some(m => m.mintUrl === DEFAULT_MINT);

            if (!hasDefault) {
                console.log(`[WalletStore] Adding default mint: ${DEFAULT_MINT}`);
                // Add and trust the default mint
                await cocoService.addMint(DEFAULT_MINT, { trusted: true });
                console.log('[WalletStore] Default mint added and trusted');
            } else {
                // Ensure it's trusted if it exists
                const isTrusted = await manager.mint.isTrustedMint(DEFAULT_MINT);
                if (!isTrusted) {
                    await cocoService.trustMint(DEFAULT_MINT);
                    console.log('[WalletStore] Default mint trusted');
                }
            }

            // Set active mint if not set
            if (!get().activeMintUrl) {
                console.log('[WalletStore] Setting active mint URL');
                set({ activeMintUrl: DEFAULT_MINT });
            }

            // Sync balance
            console.log('[WalletStore] Refreshing balance');
            await get().refreshBalance();

            // Store list of mints with trust status
            const finalMints = await manager.mint.getAllMints();
            const trustedMints = await manager.mint.getAllTrustedMints();
            const trustedUrls = new Set(trustedMints.map(m => m.mintUrl));

            const mintInfos: MintInfo[] = finalMints.map(m => ({
                mintUrl: m.mintUrl,
                name: m.name,
                nickname: (m as any).nickname,
                trusted: trustedUrls.has(m.mintUrl),
            }));

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
            await cocoService.addMint(url, options);

            const manager = cocoService.getManager();
            const allMints = await manager.mint.getAllMints();
            const trustedMints = await manager.mint.getAllTrustedMints();
            const trustedUrls = new Set(trustedMints.map(m => m.mintUrl));

            const mintInfos: MintInfo[] = allMints.map(m => ({
                mintUrl: m.mintUrl,
                name: m.name,
                nickname: (m as any).nickname,
                trusted: trustedUrls.has(m.mintUrl),
            }));

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
            await cocoService.trustMint(url);

            // Update mint list with new trust status
            const manager = cocoService.getManager();
            const allMints = await manager.mint.getAllMints();
            const trustedMints = await manager.mint.getAllTrustedMints();
            const trustedUrls = new Set(trustedMints.map(m => m.mintUrl));

            const mintInfos: MintInfo[] = allMints.map(m => ({
                mintUrl: m.mintUrl,
                name: m.name,
                nickname: (m as any).nickname,
                trusted: trustedUrls.has(m.mintUrl),
            }));

            set({ mints: mintInfos });
        } catch (err: any) {
            console.error('[WalletStore] Failed to trust mint:', err);
            set({ error: err.message });
        }
    },

    refreshBalance: async () => {
        try {
            if (!cocoService.isInitialized()) {
                set({ balance: 0 });
                return;
            }

            const activeUrl = get().activeMintUrl;
            if (!activeUrl) {
                set({ balance: 0 });
                return;
            }

            // Get balances from coco
            const balances = await cocoService.getBalances();
            const balance = balances[activeUrl] || 0;
            set({ balance, refreshCounter: get().refreshCounter + 1 });
        } catch (err) {
            console.error('[WalletStore] Error refreshing balance:', err);
        }
    },

    restoreFromSeed: async (mintUrl: string) => {
        try {
            console.log(`[WalletStore] Restoring from seed for mint: ${mintUrl}`);
            await cocoService.restoreFromSeed(mintUrl);
            await get().refreshBalance();
            console.log('[WalletStore] Restore complete');
        } catch (err: any) {
            console.error('[WalletStore] Failed to restore from seed:', err);
            set({ error: err.message });
        }
    },

    untrustMint: async (url: string) => {
        try {
            await cocoService.untrustMint(url);
            await get().refreshMintList();
        } catch (err: any) {
            console.error('[WalletStore] Failed to untrust mint:', err);
            set({ error: err.message });
        }
    },

    fetchMintInfo: async (url: string) => {
        try {
            const info = await cocoService.getMintInfo(url);
            return info;
        } catch (err: any) {
            console.error('[WalletStore] Failed to fetch mint info:', err);
            throw err;
        }
    },

    refreshMintList: async () => {
        try {
            const manager = cocoService.getManager();
            const allMints = await manager.mint.getAllMints();
            const trustedMints = await manager.mint.getAllTrustedMints();
            const trustedUrls = new Set(trustedMints.map(m => m.mintUrl));

            const mintInfos: MintInfo[] = allMints.map(m => ({
                mintUrl: m.mintUrl,
                name: m.name,
                nickname: (m as any).nickname,
                description: (m as any).description,
                trusted: trustedUrls.has(m.mintUrl),
            }));

            set({ mints: mintInfos });
        } catch (err: any) {
            console.error('[WalletStore] Failed to refresh mint list:', err);
        }
    },

    setMintNickname: async (url: string, nickname: string) => {
        try {
            const repo = cocoService.getRepo();
            await (repo.mintRepository as any).setMintNickname(url, nickname);
            await get().refreshMintList();
        } catch (err: any) {
            console.error('[WalletStore] Failed to set mint nickname:', err);
            set({ error: err.message });
        }
    },
}));
