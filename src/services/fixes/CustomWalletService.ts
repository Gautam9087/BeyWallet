import { Wallet, Mint, Keyset } from '@cashu/cashu-ts';
import { cocoService } from '../cocoService';
import { useWalletStore } from '../../store/walletStore';

// Access internals via existing cocoService
const getInternals = () => {
    const manager = cocoService.getManager();
    return {
        manager,
        mintService: (manager as any).mintService,
        seedService: (manager as any).seedService,
        // requestProvider: (manager as any).mintRequestProvider, // Removing for now
    };
};

const DEFAULT_UNIT = 'sat';

export class CustomWalletService {
    private walletCache: Map<string, { wallet: Wallet; lastCheck: number }> = new Map();
    private inFlight: Map<string, Promise<Wallet>> = new Map();
    private readonly CACHE_TTL = 5 * 60 * 1000;

    async getWallet(mintUrl: string, unit?: string): Promise<Wallet> {
        if (!mintUrl || mintUrl.trim().length === 0) {
            throw new Error('mintUrl is required');
        }

        const cacheKey = unit ? `${mintUrl}:${unit}` : mintUrl;
        const cached = this.walletCache.get(cacheKey);
        const now = Date.now();
        if (cached && now - cached.lastCheck < this.CACHE_TTL) {
            return cached.wallet;
        }

        const existing = this.inFlight.get(cacheKey);
        if (existing) return existing;

        const promise = this.buildWallet(mintUrl, unit).finally(() => {
            this.inFlight.delete(cacheKey);
        });
        this.inFlight.set(cacheKey, promise);
        return promise;
    }

    async getWalletWithActiveKeysetId(
        mintUrl: string,
        unit?: string
    ): Promise<{
        wallet: Wallet;
        keysetId: string;
        keyset: any; // MintKeyset
        keys: any; // MintKeys
    }> {
        const wallet = await this.getWallet(mintUrl, unit);
        const keyset = wallet.keyChain.getCheapestKeyset();
        const mintKeys = keyset.toMintKeys(); // This might return null/undefined if empty?
        // WalletService.ts handles null check, let's replicate
        if (!mintKeys) {
            throw new Error('MintKeys is null. Cannot return a valid response.');
        }

        return {
            wallet,
            keysetId: keyset.id,
            keyset: keyset.toMintKeyset(),
            keys: mintKeys,
        };
    }

    private async buildWallet(mintUrl: string, unit?: string): Promise<Wallet> {
        const { mintService, seedService } = getInternals();

        // This calls the existing MintService to get cached/fresh keysets
        const { mint, keysets } = await mintService.ensureUpdatedMint(mintUrl);

        // Default to 'sat' ONLY if unit is undefined. If unit is "" (empty string), respect it.
        const targetUnit = unit !== undefined ? unit : DEFAULT_UNIT;

        // Filter keysets matching the requested unit
        const validKeysets = keysets.filter(
            (keyset: any) =>
                keyset.keypairs &&
                Object.keys(keyset.keypairs).length > 0 &&
                (keyset.unit === targetUnit || (!keyset.unit && targetUnit === DEFAULT_UNIT))
        );

        if (validKeysets.length === 0) {
            throw new Error(`No valid keysets found for mint ${mintUrl} and unit ${targetUnit}`);
        }

        const walletUnit = validKeysets[0].unit ?? DEFAULT_UNIT;

        // Construct cache for Wallet
        const keysetCache = validKeysets.map((keyset: any) => ({
            id: keyset.id,
            unit: keyset.unit,
            active: keyset.active,
            input_fee_ppk: keyset.feePpk,
            keys: keyset.keypairs,
        }));

        const cache = {
            mintUrl: mint.mintUrl,
            unit: walletUnit,
            keysets: keysetCache,
        };

        const seed = await seedService.getSeed();
        // const requestFn = requestProvider.getRequestFn(mintUrl);

        const wallet = new Wallet(new Mint(mintUrl), { // Removed customRequest
            unit: walletUnit,
            bip39seed: seed,
        });

        // Load keysets into wallet from our constructed cache
        wallet.loadMintFromCache(mint.mintInfo, cache);

        const cacheKey = unit ? `${mintUrl}:${unit}` : mintUrl;
        this.walletCache.set(cacheKey, {
            wallet,
            lastCheck: Date.now(),
        });

        console.log(`[CustomWalletService] Wallet built for ${mintUrl} (unit: ${walletUnit})`);
        return wallet;
    }
}

export const customWalletService = new CustomWalletService();
