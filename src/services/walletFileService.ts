/**
 * Wallet File Service — Export & Import wallet backup as a .bey file.
 *
 * Backup JSON shape (v2):
 * {
 *   version: 3,
 *   mnemonic: "...",
 *   mints: [...], // Full coco_cashu_mints records
 *   keysets: [...], // Full coco_cashu_keysets records
 *   proofs: [...],
 *   counters: [...],
 *   history: [...],
 *   mintQuotes: [...],
 *   defaultMintUrl: "...",
 *   secondaryCurrency: "USD",
 *   theme: "system" | "light" | "dark",
 *   exportedAt: "ISO date"
 * }
 * }
 * }
 *
 * Export flow:
 *   1. Reads mnemonic, trusted mints, and settings from the live stores/repos
 *   2. Serialises to JSON and writes to cache dir
 *   3. Opens OS share sheet via expo-sharing
 *
 * Import flow:
 *   1. Opens document picker
 *   2. Reads + parses JSON, validates mnemonic
 *   3. Returns the full backup payload for the caller to handle
 */

import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import * as bip39 from 'bip39';

const BACKUP_FILENAME = 'bey-wallet-backup.bey';
const BACKUP_VERSION = 2;

export interface MintEntry {
    url: string;
    nickname: string | null;
}

export interface WalletBackup {
    version: number;
    mnemonic: string;
    mints: any[]; // Changed from MintEntry[] to any[] for full records in v3
    keysets?: any[];
    proofs?: any[];
    counters?: any[];
    history?: any[];
    mintQuotes?: any[];
    defaultMintUrl: string;
    secondaryCurrency: string;
    theme: 'system' | 'light' | 'dark';
    exportedAt: string;
}

export const walletFileService = {
    /**
     * Export the full wallet backup as a shareable .bey file.
     * Requires the wallet to be initialized (repos must be accessible).
     */
    exportWallet: async (
        mnemonic: string,
        opts: {
            mints: any[];
            keysets: any[];
            proofs: any[];
            counters: any[];
            history: any[];
            mintQuotes: any[];
            defaultMintUrl: string;
            secondaryCurrency: string;
            theme: 'system' | 'light' | 'dark';
        }
    ): Promise<void> => {
        console.log('[WalletFileService] Exporting wallet backup...');

        if (!bip39.validateMnemonic(mnemonic)) {
            throw new Error('Invalid mnemonic — cannot export.');
        }

        const backup: WalletBackup = {
            version: 3,
            mnemonic,
            mints: opts.mints,
            keysets: opts.keysets,
            proofs: opts.proofs,
            counters: opts.counters,
            history: opts.history,
            mintQuotes: opts.mintQuotes,
            defaultMintUrl: opts.defaultMintUrl,
            secondaryCurrency: opts.secondaryCurrency,
            theme: opts.theme,
            exportedAt: new Date().toISOString(),
        };

        const filePath =
            (FileSystem.cacheDirectory ?? FileSystem.documentDirectory ?? '') +
            BACKUP_FILENAME;

        await FileSystem.writeAsStringAsync(filePath, JSON.stringify(backup, null, 2), {
            encoding: 'utf8',
        });

        const isAvailable = await Sharing.isAvailableAsync();
        if (!isAvailable) {
            throw new Error('Sharing is not available on this device.');
        }

        await Sharing.shareAsync(filePath, {
            mimeType: 'application/json',
            dialogTitle: 'Save your Bey Wallet backup',
            UTI: 'public.json',
        });

        console.log('[WalletFileService] ✅ Wallet backup shared successfully.');
    },

    /**
     * Open the document picker and parse a .bey backup file.
     * Returns the full WalletBackup payload so the caller can restore everything.
     * Throws a user-friendly error on cancellation or bad file.
     */
    importWalletFromFile: async (): Promise<WalletBackup> => {
        console.log('[WalletFileService] Opening document picker...');

        const result = await DocumentPicker.getDocumentAsync({
            copyToCacheDirectory: true,
            multiple: false,
        });

        if (result.canceled || !result.assets || result.assets.length === 0) {
            throw new Error('File selection was cancelled.');
        }

        const asset = result.assets[0];
        console.log('[WalletFileService] File selected:', asset.name);

        const contents = await FileSystem.readAsStringAsync(asset.uri, {
            encoding: 'utf8',
        });

        let backup: Partial<WalletBackup>;
        try {
            backup = JSON.parse(contents);
        } catch {
            throw new Error('The selected file is not a valid Bey wallet backup.');
        }

        if (!backup.mnemonic || typeof backup.mnemonic !== 'string') {
            throw new Error('The backup file does not contain a mnemonic.');
        }

        if (!bip39.validateMnemonic(backup.mnemonic.trim())) {
            throw new Error('The mnemonic in the backup file is invalid. It may be corrupted.');
        }

        console.log('[WalletFileService] ✅ Valid wallet backup parsed successfully.');

        // Return with safe defaults for fields that may be missing in older v1/v2 backups
        return {
            version: backup.version ?? 1,
            mnemonic: backup.mnemonic.trim(),
            mints: backup.mints ?? [],
            keysets: backup.keysets ?? [],
            proofs: backup.proofs ?? [],
            counters: backup.counters ?? [],
            history: backup.history ?? [],
            mintQuotes: backup.mintQuotes ?? [],
            defaultMintUrl: backup.defaultMintUrl ?? '',
            secondaryCurrency: backup.secondaryCurrency ?? 'USD',
            theme: backup.theme ?? 'system',
            exportedAt: backup.exportedAt ?? '',
        };
    },
};
