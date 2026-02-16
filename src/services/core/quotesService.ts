/**
 * Quotes service — mint quotes (deposit LN → ecash) and melt quotes (ecash → LN).
 *
 * Uses Manager.quotes (QuotesApi).
 */

import { initService } from './initService';
import type { MintQuoteResponse, MeltQuoteResponse } from '@cashu/cashu-ts';

function mgr() {
    return initService.getManager();
}

export const quotesService = {
    // ─── Minting (Lightning → Ecash) ─────────────────────────

    /**
     * Create a mint quote — returns a Lightning invoice to pay.
     *
     * @param mintUrl - The mint to create quote from
     * @param amount - Amount in sats to mint
     * @returns MintQuoteResponse with `quote` (id) and Lightning `request` (invoice)
     */
    createMintQuote: async (mintUrl: string, amount: number): Promise<MintQuoteResponse> => {
        console.log(`[QuotesService] Creating mint quote: ${amount} sats from ${mintUrl}`);
        const quote = await mgr().quotes.createMintQuote(mintUrl, amount);
        console.log(`[QuotesService] Mint quote created: ${quote.quote}`);
        return quote;
    },

    /**
     * Manually redeem a paid mint quote to get ecash.
     * Note: With watchers/processors enabled, this happens automatically.
     */
    redeemMintQuote: async (mintUrl: string, quoteId: string): Promise<void> => {
        console.log(`[QuotesService] Redeeming mint quote: ${quoteId}`);
        await mgr().quotes.redeemMintQuote(mintUrl, quoteId);
        console.log('[QuotesService] Mint quote redeemed');
    },

    /**
     * Add existing mint quotes (e.g. imported from another wallet).
     */
    addMintQuotes: async (
        mintUrl: string,
        quotes: MintQuoteResponse[]
    ): Promise<{ added: string[]; skipped: string[] }> => {
        return mgr().quotes.addMintQuote(mintUrl, quotes);
    },

    /**
     * Requeue all PAID (but not yet ISSUED) quotes for processing.
     */
    requeuePaidQuotes: async (mintUrl?: string): Promise<{ requeued: string[] }> => {
        return mgr().quotes.requeuePaidMintQuotes(mintUrl);
    },

    // ─── Melting (Ecash → Lightning) ──────────────────────────

    /**
     * Create a melt quote — estimates cost to pay a Lightning invoice.
     *
     * @param mintUrl - The mint to melt from
     * @param invoice - Lightning invoice (bolt11) to pay
     * @returns MeltQuoteResponse with amount, fee_reserve, and quote id
     */
    createMeltQuote: async (mintUrl: string, invoice: string): Promise<MeltQuoteResponse> => {
        console.log(`[QuotesService] Creating melt quote from ${mintUrl}`);
        const quote = await mgr().quotes.createMeltQuote(mintUrl, invoice);
        console.log(`[QuotesService] Melt quote created: ${quote.quote}`);
        return quote;
    },

    /**
     * Pay a Lightning invoice using ecash (melt).
     *
     * The Manager handles:
     * - Proof selection for the melt amount + fee reserve
     * - Sending the proofs to the mint
     * - Recording history entry
     * - Saving any change proofs
     */
    payMeltQuote: async (mintUrl: string, quoteId: string): Promise<void> => {
        console.log(`[QuotesService] Paying melt quote: ${quoteId}`);
        await mgr().quotes.payMeltQuote(mintUrl, quoteId);
        console.log('[QuotesService] Melt quote paid');
    },
};
