/**
 * Initialization service — manages Manager lifecycle.
 *
 * Handles:
 * - Wallet existence check
 * - Manager initialization (existing wallet)
 * - Wallet creation (new mnemonic)
 * - AppState pause/resume for battery savings
 * - Singleton access to Manager and Repositories
 */

import { initializeCoco, type Manager } from 'coco-cashu-core';
import { ExpoSqliteRepositories } from '../../store/test';
import * as SQLite from 'expo-sqlite';
import { seedService } from '../seedService';
import { AppState, type AppStateStatus } from 'react-native';
import { nostrService } from '../nostrService';

// ─── Singleton State ──────────────────────────────────────────

let manager: Manager | null = null;
let repo: ExpoSqliteRepositories | null = null;
let appStateSubscription: any = null;

// ─── Internal Helpers ─────────────────────────────────────────

/**
 * Setup AppState listener to pause/resume WebSocket subscriptions
 * when the app goes to background/foreground. Saves battery.
 */
function setupAppStateListener(): void {
    if (appStateSubscription) {
        appStateSubscription.remove();
    }

    appStateSubscription = AppState.addEventListener(
        'change',
        async (nextAppState: AppStateStatus) => {
            if (!manager) return;

            try {
                if (nextAppState === 'background' || nextAppState === 'inactive') {
                    console.log('[InitService] App → background, pausing subscriptions');
                    await manager.pauseSubscriptions();
                } else if (nextAppState === 'active') {
                    console.log('[InitService] App → foreground, resuming subscriptions');
                    await manager.resumeSubscriptions();
                }
            } catch (err) {
                console.error('[InitService] Subscription lifecycle error:', err);
            }
        }
    );
}

/**
 * Core initialization with a mnemonic. Opens DB, creates repos,
 * calls initializeCoco() with full config.
 */
async function initializeWithMnemonic(mnemonic: string): Promise<Manager> {
    const seed = await seedService.deriveSeed(mnemonic);

    // Open Expo SQLite database
    const db = await SQLite.openDatabaseAsync('coco_wallet.db');
    const repositories = new ExpoSqliteRepositories({ database: db });
    await repositories.init();

    // Initialize coco-cashu-core Manager
    manager = await initializeCoco({
        repo: repositories,
        seedGetter: async () => new Uint8Array(seed),

        watchers: {
            mintQuoteWatcher: {
                disabled: false,
                watchExistingPendingOnStart: true,
            },
            proofStateWatcher: {
                disabled: false,
            },
        },

        processors: {
            mintQuoteProcessor: {
                disabled: false,
                processIntervalMs: 5000,
                maxRetries: 3,
                baseRetryDelayMs: 1000,
                initialEnqueueDelayMs: 500,
            },
        },
    });

    repo = repositories;
    setupAppStateListener();

    console.log('[InitService] Manager ready with watchers and processors');
    return manager;
}

// ─── Public API ───────────────────────────────────────────────

export const initService = {
    /**
     * Check if a wallet exists (mnemonic saved in secure storage).
     */
    walletExists: (): Promise<boolean> => {
        return seedService.walletExists();
    },

    /**
     * Initialize with an EXISTING wallet. Throws if no mnemonic found.
     */
    init: async (): Promise<Manager> => {
        if (manager) {
            console.log('[InitService] Already initialized');
            return manager;
        }

        const mnemonic = await seedService.getMnemonic();
        if (!mnemonic) {
            throw new Error('No wallet exists. Use createWallet() first.');
        }

        const m = await initializeWithMnemonic(mnemonic);

        // Initialize Nostr
        await nostrService.init(mnemonic);

        return m;
    },

    /**
     * Create a NEW wallet with the provided mnemonic.
     * Used during onboarding.
     */
    createWallet: async (mnemonic: string): Promise<Manager> => {
        if (manager) {
            initService.reset();
        }

        await seedService.saveMnemonic(mnemonic);
        const m = await initializeWithMnemonic(mnemonic);

        // Initialize Nostr
        await nostrService.init(mnemonic);

        return m;
    },

    /**
     * Get the Manager instance. Throws if not initialized.
     */
    getManager: (): Manager => {
        if (!manager) {
            throw new Error('Manager not initialized. Call init() or createWallet() first.');
        }
        return manager;
    },

    /**
     * Get the Repositories instance. Throws if not initialized.
     */
    getRepo: (): ExpoSqliteRepositories => {
        if (!repo) {
            throw new Error('Repositories not initialized.');
        }
        return repo;
    },

    /**
     * Check if the Manager is currently initialized.
     */
    isInitialized: (): boolean => {
        return manager !== null;
    },

    /**
     * Reset the Manager (for logout or dev purposes).
     * Cleans up AppState listener and nullifies references.
     */
    reset: (): void => {
        if (appStateSubscription) {
            appStateSubscription.remove();
            appStateSubscription = null;
        }
        manager = null;
        repo = null;
    },

    /**
     * Completely destroy the wallet — delete DB, clear seed, full wipe.
     * Used for "Delete Wallet" in settings.
     */
    destroyWallet: async (): Promise<void> => {
        console.log('[InitService] Destroying wallet...');

        // 1. Dispose manager if active
        if (manager) {
            try {
                await (manager as any).dispose?.();
            } catch (e) {
                console.warn('[InitService] Manager dispose error (non-fatal):', e);
            }
        }

        // 2. Reset singleton state
        initService.reset();

        // 3. Delete the SQLite database
        try {
            await SQLite.deleteDatabaseAsync('coco_wallet.db');
            console.log('[InitService] Database deleted');
        } catch (e) {
            console.warn('[InitService] DB delete error (may not exist):', e);
        }

        // 4. Clear the seed from secure storage
        await seedService.clearWallet();
        console.log('[InitService] Seed cleared');

        console.log('[InitService] Wallet destroyed');
    },
};
