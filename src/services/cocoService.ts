import { initializeCoco, Manager } from 'coco-cashu-core';
import { ExpoSqliteRepositories } from '../store/test';
import * as SQLite from 'expo-sqlite';
import { seedService } from './seedService';

let cocoManager: Manager | null = null;
let repo: ExpoSqliteRepositories | null = null;

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

        // Wrap repositories in a proxy to track access
        const repositories = new Proxy(repositoriesInstance, {
            get(target, prop, receiver) {
                const value = Reflect.get(target, prop, receiver);
                if (typeof prop === 'string') {
                    if (value === undefined) {
                        console.warn(`[CocoService] WARNING: Property "${prop}" accessed on repositories but is UNDEFINED`);
                    }
                }
                return value;
            }
        });

        console.log('[CocoService] Initializing repositories...');
        await repositoriesInstance.init();
        console.log('[CocoService] Repositories initialized');

        console.log('[CocoService] Initializing CocoManager...');
        cocoManager = await initializeCoco({
            repo: repositories,
            seedGetter: async () => new Uint8Array(seed),
        });
        console.log('[CocoService] CocoManager ready');

        repo = repositoriesInstance;

        return cocoManager;
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
        cocoManager = null;
        repo = null;
    }
};
