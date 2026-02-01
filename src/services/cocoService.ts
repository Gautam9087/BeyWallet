import { initializeCoco, CocoManager } from 'coco-cashu-core';
import { ExpoSqliteRepository } from 'coco-cashu-expo-sqlite';
import * as SQLite from 'expo-sqlite';
import { seedService } from './seedService';

let cocoManager: CocoManager | null = null;

export const cocoService = {
    /**
     * Initializes the CocoManager instance.
     */
    init: async (): Promise<CocoManager> => {
        if (cocoManager) return cocoManager;

        let mnemonic = await seedService.getMnemonic();
        if (!mnemonic) {
            mnemonic = seedService.generateMnemonic();
            await seedService.saveMnemonic(mnemonic);
        }

        const seed = await seedService.deriveSeed(mnemonic);

        // Initializing Expo SQLite repository
        const db = await SQLite.openDatabaseAsync('coco_wallet.db');
        const repository = new ExpoSqliteRepository(db);

        cocoManager = await initializeCoco({
            repository,
            seedGetter: async () => seed,
        });

        return cocoManager;
    },

    /**
     * Returns the CocoManager instance.
     * Throws if not initialized.
     */
    getManager: (): CocoManager => {
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
