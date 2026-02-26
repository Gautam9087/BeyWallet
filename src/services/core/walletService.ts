/**
 * Wallet service — send, receive, balances, restore.
 *
 * Uses Manager APIs:
 * - manager.send (SendApi) — two-step: prepareSend → executePreparedSend + rollback
 * - manager.wallet (WalletApi) — receive, getBalances, restore
 *
 * The two-step send flow prevents stuck/reserved proofs by allowing
 * rollback if the operation fails after preparation.
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
     * Send ecash from a specific mint using two-step flow.
     *
     * Step 1: prepareSend() — reserves proofs and prepares the operation
     * Step 2: executePreparedSend() — executes the swap and creates token
     *
     * On error after prepare, automatically rolls back to free reserved proofs.
     *
     * @param mintUrl - The mint to send from
     * @param amount - Amount to send in sats
     * @returns Encoded token string (V4) and operation ID
     */
    send: async (mintUrl: string, amount: number): Promise<{ token: string; id: string }> => {
        console.log(`[WalletService] Sending ${amount} from ${mintUrl}`);

        const m = mgr();
        let preparedId: string | null = null;

        try {
            // Step 1: Prepare the send operation
            const prepared = await m.send.prepareSend(mintUrl, amount);
            preparedId = prepared.id;
            console.log(`[WalletService] Send prepared: ${preparedId}`);

            // Step 2: Execute the prepared send
            const { token, operation } = await m.send.executePreparedSend(prepared.id);
            const encoded = encodeToken(token);

            console.log(`[WalletService] Send complete, operation: ${operation.id}`);
            return { token: encoded, id: operation.id };
        } catch (err: any) {
            // Rollback on failure to free reserved proofs
            if (preparedId) {
                try {
                    const operation = await m.send.getOperation(preparedId);
                    if (operation && ['prepared', 'executing', 'pending'].includes(operation.state)) {
                        await m.send.rollback(preparedId);
                        console.log(`[WalletService] Rolled back failed send: ${preparedId}`);
                    }
                } catch (rollbackErr) {
                    console.warn('[WalletService] Rollback failed:', rollbackErr);
                }
            }
            console.error('[WalletService] Send failed:', err?.message || err);
            throw err;
        }
    },

    /**
     * Send and return both encoded string and raw Token object.
     */
    sendWithToken: async (
        mintUrl: string,
        amount: number
    ): Promise<{ encoded: string; token: Token }> => {
        const m = mgr();
        let preparedId: string | null = null;

        try {
            const prepared = await m.send.prepareSend(mintUrl, amount);
            preparedId = prepared.id;
            const { token } = await m.send.executePreparedSend(prepared.id);
            const encoded = encodeToken(token);
            return { encoded, token };
        } catch (err) {
            if (preparedId) {
                try {
                    const op = await m.send.getOperation(preparedId);
                    if (op && ['prepared', 'executing', 'pending'].includes(op.state)) {
                        await m.send.rollback(preparedId);
                    }
                } catch (e) { /* ignore rollback errors */ }
            }
            throw err;
        }
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
        const m = mgr();
        console.log(`[WalletService] 🔄 Starting deterministic NIP-06 restoration for: ${mintUrl}`);

        // Ensure the manager knows about the mint and its keysets
        await m.mint.addMint(mintUrl);

        // standard coco-cashu-core restore
        await m.wallet.restore(mintUrl);

        const duration = ((Date.now() - start) / 1000).toFixed(1);
        console.log(`[WalletService] ✅ NIP-06 backup restored for ${mintUrl} in ${duration}s`);
    },

    // ─── Send Operations ──────────────────────────────────────

    /**
     * Rollback a pending send operation. Used to free stuck proofs.
     */
    rollbackSend: async (operationId: string): Promise<void> => {
        console.log(`[WalletService] Rolling back send: ${operationId}`);
        await mgr().send.rollback(operationId);
        console.log(`[WalletService] ✅ Send rolled back: ${operationId}`);
    },

    /**
     * Get a send operation by ID.
     */
    getSendOperation: async (operationId: string) => {
        return mgr().send.getOperation(operationId);
    },

    /**
     * Finalize a send (mark as completed after recipient claims).
     */
    finalizeSend: async (operationId: string): Promise<void> => {
        await mgr().send.finalize(operationId);
    },
};
