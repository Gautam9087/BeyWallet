import { initializeCoco, Manager, getDecodedToken, getEncodedToken } from 'coco-cashu-core';
import { ExpoSqliteRepositories } from '../store/test';
import * as SQLite from 'expo-sqlite';
import { seedService } from './seedService';
import { AppState, AppStateStatus } from 'react-native';

let cocoManager: Manager | null = null;
let repo: ExpoSqliteRepositories | null = null;
let appStateSubscription: any = null;

export const cocoService = {
    /**
     * Initializes the CocoManager with an EXISTING wallet.
     * Does NOT create a new wallet if none exists.
     * Use createWallet() for new wallet creation.
     */
    init: async (): Promise<Manager> => {
        if (cocoManager) {
            console.log('[CocoService] Already initialized');
            return cocoManager;
        }

        console.log('[CocoService] Checking for existing mnemonic...');
        const mnemonic = await seedService.getMnemonic();
        if (!mnemonic) {
            throw new Error('No wallet exists. Use createWallet() first.');
        }

        console.log('[CocoService] Mnemonic found, initializing...');
        return cocoService._initializeWithMnemonic(mnemonic);
    },

    /**
     * Creates a new wallet with the provided mnemonic.
     * Used during onboarding flow.
     */
    createWallet: async (mnemonic: string): Promise<Manager> => {
        if (cocoManager) {
            console.log('[CocoService] Manager already exists, resetting...');
            cocoService.reset();
        }

        console.log('[CocoService] Saving new mnemonic...');
        await seedService.saveMnemonic(mnemonic);
        console.log('[CocoService] Mnemonic saved, initializing wallet...');

        return cocoService._initializeWithMnemonic(mnemonic);
    },

    /**
     * Internal method to initialize with a mnemonic.
     */
    _initializeWithMnemonic: async (mnemonic: string): Promise<Manager> => {
        const seed = await seedService.deriveSeed(mnemonic);
        console.log('[CocoService] Seed derived');

        // Initializing Expo SQLite repository
        console.log('[CocoService] Opening database...');
        const db = await SQLite.openDatabaseAsync('coco_wallet.db');
        const repositoriesInstance = new ExpoSqliteRepositories({ database: db });

        console.log('[CocoService] Initializing repositories...');
        await repositoriesInstance.init();
        console.log('[CocoService] Repositories initialized');

        console.log('[CocoService] Initializing CocoManager with full config...');
        cocoManager = await initializeCoco({
            // Storage adapter - persists proofs, quotes, mints, etc.
            repo: repositoriesInstance,

            // BIP-39 seed getter - never persisted by coco, called when needed
            seedGetter: async () => new Uint8Array(seed),

            // Watchers configuration - auto-update quote and proof states
            watchers: {
                mintQuoteWatcher: {
                    disabled: false,
                    watchExistingPendingOnStart: true, // Resume watching pending quotes on init
                },
                proofStateWatcher: {
                    disabled: false, // Auto-check proof states
                },
            },

            // Processors configuration - auto-redeem paid mint quotes
            processors: {
                mintQuoteProcessor: {
                    disabled: false,
                    processIntervalMs: 5000, // Check every 5 seconds
                    maxRetries: 3,
                    baseRetryDelayMs: 1000,
                    initialEnqueueDelayMs: 500,
                },
            },
        });
        console.log('[CocoService] CocoManager ready with watchers and processors');

        repo = repositoriesInstance;

        // Setup app state listener for pause/resume subscriptions
        cocoService._setupAppStateListener();

        return cocoManager;
    },

    /**
     * Setup listener to pause/resume subscriptions based on app state.
     * This saves battery when app is in background.
     */
    _setupAppStateListener: () => {
        // Remove existing listener if any
        if (appStateSubscription) {
            appStateSubscription.remove();
        }

        appStateSubscription = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
            if (!cocoManager) return;

            try {
                if (nextAppState === 'background' || nextAppState === 'inactive') {
                    console.log('[CocoService] App going to background, pausing subscriptions...');
                    await cocoManager.pauseSubscriptions();
                } else if (nextAppState === 'active') {
                    console.log('[CocoService] App coming to foreground, resuming subscriptions...');
                    await cocoManager.resumeSubscriptions();
                }
            } catch (err) {
                console.error('[CocoService] Error managing subscriptions:', err);
            }
        });
    },

    /**
     * Checks if a wallet exists (without initializing).
     */
    walletExists: async (): Promise<boolean> => {
        return seedService.walletExists();
    },

    /**
     * Returns the repositories instance.
     */
    getRepo: (): ExpoSqliteRepositories => {
        if (!repo) {
            throw new Error('Repositories not initialized');
        }
        return repo;
    },

    /**
     * Debug method to check keysets in database.
     */
    debugKeysets: async (mintUrl: string) => {
        if (!repo) {
            throw new Error('Repositories not initialized');
        }
        const keysets = await repo.keysetRepository.getKeysetsByMintUrl(mintUrl);
        console.log('[CocoService Debug] Keysets for', mintUrl);
        keysets.forEach((k: any) => {
            console.log(`  - ${k.id}: unit=${k.unit}, active=${k.active}, feePpk=${k.feePpk}`);
        });
        return keysets;
    },

    /**
     * Repair keysets for a mint by setting proper unit values.
     * This fixes corrupted keysets that were stored without units.
     * Returns true if any repairs were made (caller should reinit manager).
     */
    repairMintKeysets: async (mintUrl: string, unit = 'sat'): Promise<boolean> => {
        if (!repo) {
            throw new Error('Repositories not initialized');
        }
        console.log(`[CocoService] Checking keysets for ${mintUrl}...`);

        const keysets = await repo.keysetRepository.getKeysetsByMintUrl(mintUrl);

        let repaired = false;
        for (const keyset of keysets) {
            const k = keyset as any;
            if (!k.unit || k.unit === '') {
                console.log(`  Fixing keyset ${k.id} (empty unit -> ${unit})...`);
                // Update the keyset with proper unit
                await repo.db.run(
                    'UPDATE coco_cashu_keysets SET unit = ? WHERE mintUrl = ? AND id = ?',
                    [unit, mintUrl, k.id]
                );
                repaired = true;
            }
        }

        if (repaired) {
            console.log('[CocoService] Keysets repaired!');
        } else {
            console.log('[CocoService] All keysets already have correct units.');
        }

        return repaired;
    },

    /**
     * Returns the CocoManager instance.
     * Throws if not initialized.
     */
    getManager: (): Manager => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        return cocoManager;
    },

    /**
     * Checks if manager is initialized.
     */
    isInitialized: (): boolean => {
        return cocoManager !== null;
    },

    /**
     * Resets the manager (for logout or dev purposes).
     */
    reset: () => {
        if (appStateSubscription) {
            appStateSubscription.remove();
            appStateSubscription = null;
        }
        cocoManager = null;
        repo = null;
    },

    /**
     * Add and trust a mint. Required before wallet operations.
     * @param mintUrl - The mint URL to add and trust
     * @param options - { trusted: boolean } - whether to trust immediately
     */
    addMint: async (mintUrl: string, options?: { trusted?: boolean }): Promise<void> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        await cocoManager.mint.addMint(mintUrl, options);
        console.log(`[CocoService] Mint added: ${mintUrl}, trusted: ${options?.trusted ?? false}`);
    },

    /**
     * Trust an existing mint.
     */
    trustMint: async (mintUrl: string): Promise<void> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        await cocoManager.mint.trustMint(mintUrl);
        console.log(`[CocoService] Mint trusted: ${mintUrl}`);
    },

    /**
     * Get all trusted mints.
     */
    getTrustedMints: async (): Promise<any[]> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        return cocoManager.mint.getAllTrustedMints();
    },

    /**
     * Get balances for all mints.
     */
    getBalances: async (): Promise<{ [mintUrl: string]: number }> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        const balances = await cocoManager.wallet.getBalances();
        console.log('[CocoService] getBalances result:', JSON.stringify(balances));
        return balances;
    },

    /**
     * Restore wallet from seed for a specific mint.
     * This recovers proofs and counters based on the BIP-39 seed.
     */
    restoreFromSeed: async (mintUrl: string): Promise<void> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        console.log(`[CocoService] Restoring wallet from seed for mint: ${mintUrl}`);
        await cocoManager.wallet.restore(mintUrl);
        console.log('[CocoService] Wallet restored');
    },

    /**
     * Get mint info (name, description, etc.) for preview.
     * This fetches and caches mint info without trusting.
     */
    getMintInfo: async (mintUrl: string): Promise<any> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        // Add the mint to fetch and cache its info
        await cocoManager.mint.addMint(mintUrl);
        // Now retrieve the cached info
        const info = await cocoManager.mint.getMintInfo(mintUrl);
        return info;
    },

    /**
     * Untrust a mint (cached info remains).
     */
    untrustMint: async (mintUrl: string): Promise<void> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        await cocoManager.mint.untrustMint(mintUrl);
        console.log(`[CocoService] Mint untrusted: ${mintUrl}`);
    },

    /**
     * Check if a mint is trusted.
     */
    isMintTrusted: async (mintUrl: string): Promise<boolean> => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        return cocoManager.mint.isTrustedMint(mintUrl);
    },

    // ==========================================
    // MINTING (Sats → Ecash via Lightning)
    // ==========================================

    /**
     * Create a mint quote (Lightning invoice to pay).
     * @param mintUrl - The mint to create quote from
     * @param amount - Amount in sats
     * @returns Quote with invoice to pay
     */
    createMintQuote: async (mintUrl: string, amount: number) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        console.log(`[CocoService] Creating mint quote: ${amount} sats from ${mintUrl}`);
        const quote = await cocoManager.quotes.createMintQuote(mintUrl, amount);
        console.log(`[CocoService] Mint quote created: ${quote.quote}`);
        return quote;
    },

    /**
     * Manually redeem a paid mint quote.
     * Note: With watchers enabled, this happens automatically.
     */
    redeemMintQuote: async (mintUrl: string, quoteId: string) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        console.log(`[CocoService] Redeeming mint quote: ${quoteId}`);
        await cocoManager.quotes.redeemMintQuote(mintUrl, quoteId);
        console.log('[CocoService] Mint quote redeemed');
    },

    // ==========================================
    // RECEIVING (Ecash Token → Balance)
    // ==========================================

    /**
     * Receive an ecash token and add proofs to wallet.
     * @param token - Encoded cashu token string or Token object
     */
    receive: async (token: string) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        console.log('[CocoService] Receiving token:', token.substring(0, 50) + '...');
        try {
            await cocoManager.wallet.receive(token);
            console.log('[CocoService] Token received successfully');
        } catch (err: any) {
            console.error('[CocoService] Receive failed:', err.message, err);
            throw err;
        }
    },

    /**
     * Decode a token to preview its contents (mint, amount, etc.)
     * @param tokenString - Encoded cashu token string
     */
    decodeToken: (tokenString: string) => {
        return getDecodedToken(tokenString);
    },

    // ==========================================
    // SENDING (Balance → Ecash Token)
    // ==========================================

    /**
     * Send tokens from a mint directly (no prepare/execute saga).
     * @param mintUrl - The mint to send from
     * @param amount - Amount to send in sats
     * @returns The token to share with recipient
     */
    send: async (mintUrl: string, amount: number) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        console.log(`[CocoService] Sending: ${amount} sats from ${mintUrl}`);
        const token = await cocoManager.wallet.send(mintUrl, amount);
        console.log('[CocoService] Send complete, token created');
        return token;
    },

    /**
     * Encode a token object to shareable string.
     */
    encodeToken: (token: any): string => {
        return getEncodedToken(token);
    },

    // ==========================================
    // HISTORY
    // ==========================================

    /**
     * Get paginated transaction history.
     * @param limit - Number of entries to fetch
     * @param offset - Offset for pagination
     */
    getHistory: async (limit = 25, offset = 0) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        return cocoManager.history.getPaginatedHistory(offset, limit);
    },



    // ==========================================
    // EVENT SUBSCRIPTIONS
    // ==========================================

    /**
     * Subscribe to a coco event.
     * Events: 'mint-quote:redeemed', 'receive:created', 'send:created', 'history:updated'
     */
    on: (event: any, callback: (...args: any[]) => void) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        return cocoManager.on(event, callback);
    },

    /**
     * Unsubscribe from a coco event.
     */
    off: (event: any, callback: (...args: any[]) => void) => {
        if (!cocoManager) {
            throw new Error('CocoManager not initialized');
        }
        cocoManager.off(event, callback);
    },
};
