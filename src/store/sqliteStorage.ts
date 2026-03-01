import * as SQLite from 'expo-sqlite';
import type { StateStorage } from 'zustand/middleware';

// Open or create the main database synchronously.
// This is non-blocking on the React thread because it's synchronous native bridge access.
const db = SQLite.openDatabaseSync('coco_wallet.db');

// Ensure the settings table exists so we don't crash on completely fresh installs
db.execSync(`
  CREATE TABLE IF NOT EXISTS coco_cashu_settings (
    key   TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
  );
`);

/**
 * A fast, synchronous storage driver for Zustand using expo-sqlite.
 * Enables zero-delay hydration on app start by fetching state before the first React render frame.
 */
export const sqliteStorage: StateStorage = {
    getItem: (name: string): string | null => {
        try {
            const row = db.getFirstSync<{ value: string }>(
                'SELECT value FROM coco_cashu_settings WHERE key = ?',
                [name]
            );
            return row ? row.value : null;
        } catch (error) {
            console.warn(`[SqliteStorage] Failed to get item ${name}:`, error);
            return null;
        }
    },
    setItem: (name: string, value: string): void => {
        try {
            db.runSync(
                'INSERT OR REPLACE INTO coco_cashu_settings (key, value) VALUES (?, ?)',
                [name, value]
            );
        } catch (error) {
            console.warn(`[SqliteStorage] Failed to set item ${name}:`, error);
        }
    },
    removeItem: (name: string): void => {
        try {
            db.runSync('DELETE FROM coco_cashu_settings WHERE key = ?', [name]);
        } catch (error) {
            console.warn(`[SqliteStorage] Failed to remove item ${name}:`, error);
        }
    },
};
