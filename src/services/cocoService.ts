import { initializeCoco, Manager } from 'coco-cashu-core';
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
        return cocoManager.wallet.getBalances();
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
};
