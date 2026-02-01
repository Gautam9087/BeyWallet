import { initializeCoco, Manager } from 'coco-cashu-core';
import { ExpoSqliteRepositories } from '../store/test';
import * as SQLite from 'expo-sqlite';
import { seedService } from './seedService';

let cocoManager: Manager | null = null;

export const cocoService = {
    /**
     * Initializes the CocoManager instance.
     */
    init: async (): Promise<Manager> => {
        if (cocoManager) {
            console.log('[CocoService] Already initialized');
            return cocoManager;
        }

        console.log('[CocoService] Checking for mnemonic...');
        let mnemonic = await seedService.getMnemonic();
        if (!mnemonic) {
            console.log('[CocoService] No mnemonic found, generating new one...');
            mnemonic = seedService.generateMnemonic();
            await seedService.saveMnemonic(mnemonic);
            console.log('[CocoService] New mnemonic saved');
        } else {
            console.log('[CocoService] Mnemonic found');
        }

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
                    // console.log(`[CocoService] Accessing repo property: ${prop} (exists: ${value !== undefined})`);
                    if (value === undefined) {
                        console.warn(`[CocoService] WARNING: Property "${prop}" accessed on repositories but is UNDEFINED`);
                    }
                }
                return value;
            }
        });

        console.log('[CocoService] Initializing repositories...');
        // The init method should be called on the actual instance, not the proxy,
        // as the proxy is primarily for property access debugging.
        await repositoriesInstance.init();
        console.log('[CocoService] Repositories initialized');

        console.log('[CocoService] Initializing CocoManager...');
        cocoManager = await initializeCoco({
            repo: repositories,
            seedGetter: async () => new Uint8Array(seed),
        });
        console.log('[CocoService] CocoManager ready');

        return cocoManager;
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
     * Resets the manager (for logout or dev purposes).
     */
    reset: () => {
        cocoManager = null;
    }
};
