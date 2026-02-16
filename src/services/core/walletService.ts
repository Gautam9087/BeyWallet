/**
 * Wallet service — send, receive, balances, restore.
 *
 * Uses Manager.wallet (WalletApi) which internally handles:
 * - Coin selection
 * - Proof management (save/delete/state transitions)
 * - Keyset alignment and unit matching
 * - Deterministic outputs (BIP-39 seed)
 * - History recording
 * - Event emission
 *
 * This replaces CustomSendService, CustomReceiveService,
 * CustomProofService, and CustomWalletService entirely.
 */

import { initService } from './initService';
import { cleanToken, encodeToken } from './tokenUtils';
import type { Token } from '@cashu/cashu-ts';

/**
 * Get the Manager or throw.
 */
function mgr() {
    return initService.getManager();
}

export const walletService = {
    // ─── Sending ──────────────────────────────────────────────

    /**
     * Send ecash from a specific mint.
     *
     * The Manager's WalletApi.send() handles:
     * - Proof selection (coin selection algorithm)
     * - Swap with the mint to create exact-amount proofs
     * - Saving change proofs back to the repository
     * - Deleting spent proofs
     * - Recording history entry
     * - Emitting 'send:created' event
     *
     * @param mintUrl - The mint to send from
     * @param amount - Amount to send in the mint's unit
     * @returns Encoded token string (V4) to share with recipient
     */
    send: async (mintUrl: string, amount: number): Promise<{ token: string; id: string }> => {
        console.log(`[WalletService] Sending ${amount} from ${mintUrl}`);

        const res = await mgr().wallet.send(mintUrl, amount);
        // coco-cashu-core returns a Token object if called directly,
        // but it also creates a history entry.
        // We need to find the history entry that was just created.

        const encoded = encodeToken(res);

        // Find the history entry by searching for the token in the metadata
        // or just getting the last entry since this is sequential.
        const history = await mgr().history.getPaginatedHistory(0, 1);
        const lastEntry = history[0];


        console.log('[WalletService] Send complete, history ID:', lastEntry?.id);
        return { token: encoded, id: lastEntry?.id || '' };
    },

    /**
     * Send and return both encoded string and raw Token object.
     */
    sendWithToken: async (
        mintUrl: string,
        amount: number
    ): Promise<{ encoded: string; token: Token }> => {
        const token: Token = await mgr().wallet.send(mintUrl, amount);
        const encoded = encodeToken(token);
        return { encoded, token };
    },

    // ─── Receiving ────────────────────────────────────────────

    /**
     * Receive an ecash token and add proofs to wallet.
     *
     * The Manager's WalletApi.receive() handles:
     * - Token decoding
     * - Mint trust verification
     * - Keyset fetching and alignment
     * - Proof swapping with correct unit
     * - Saving new proofs to repository
     * - Recording history entry
     * - Emitting 'receive:created' event
     *
     * @param token - Encoded cashu token string
     */
    receive: async (token: string): Promise<void> => {
        const cleaned = cleanToken(token);
        console.log('[WalletService] Receiving token:', cleaned.substring(0, 50) + '...');

        try {
            await mgr().wallet.receive(cleaned);
            console.log('[WalletService] Token received successfully');
        } catch (err: any) {
            console.error('[WalletService] Receive failed:', err?.message || err);
            console.error('[WalletService] Full error:', JSON.stringify(err, null, 2));

            // If it's an "untrusted mint" error, provide helpful message
            if (err?.message?.includes('not trusted') || err?.name === 'UnknownMintError') {
                throw new Error('Mint is not trusted. Please add and trust the mint first.');
            }

            // If it's a proof validation error, provide helpful message
            if (err?.message?.includes('Invalid token') || err?.name === 'ProofValidationError') {
                throw new Error('Invalid token format. Please check the token and try again.');
            }

            // If proofs could not be verified
            if (err?.message?.includes('could not be verified') || err?.message?.includes('outputs')) {
                throw new Error('Token proofs could not be verified. The token may have already been redeemed.');
            }

            throw err;
        }
    },

    // ─── Balance ──────────────────────────────────────────────

    /**
     * Get balances for all mints.
     * Returns { mintUrl: totalAmount } map.
     */
    getBalances: async (): Promise<Record<string, number>> => {
        return mgr().wallet.getBalances();
    },

    /**
     * Get balance for a specific mint across all units (summed).
     */
    getBalanceForMint: async (mintUrl: string): Promise<number> => {
        const balances = await mgr().wallet.getBalances();
        console.log('[WalletService] Raw balances:', JSON.stringify(balances));

        const normalize = (url: string) => url.replace(/\/$/, '');
        const normalizedTarget = normalize(mintUrl);

        for (const [url, bal] of Object.entries(balances)) {
            if (normalize(url) === normalizedTarget) {
                return bal;
            }
        }
        return 0;
    },

    // ─── Restore ──────────────────────────────────────────────

    restore: async (mintUrl: string): Promise<void> => {
        const start = Date.now();
        const manager = mgr();
        console.log(`[WalletService] 🔄 Starting deterministic NIP-06 restoration for: ${mintUrl}`);

        // Ensure the manager knows about the mint and its keysets
        await manager.mint.addMint(mintUrl);

        // standard coco-cashu-core restore
        await manager.wallet.restore(mintUrl);

        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[WalletService] ✅ NIP-06 backup restored for ${mintUrl} in ${duration}s`);
    },
};
