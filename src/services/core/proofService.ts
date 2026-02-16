/**
 * Proof service — proof state checks and direct proof queries.
 *
 * For most operations (send, receive, mint, melt), proof management
 * is handled internally by the Manager. This service provides
 * additional utilities for proof status checking and direct queries.
 */

import { CashuMint } from '@cashu/cashu-ts';
import { initService } from './initService';
import { cleanToken, decodeToken } from './tokenUtils';
import type { CoreProof } from 'coco-cashu-core';

export const proofService = {
    /**
     * Check the state of proofs from a token string.
     * Queries the mint to get current proof states (UNSPENT, SPENT, PENDING).
     *
     * @param tokenString - Encoded cashu token string
     * @returns Array of proof state objects from the mint
     */
    checkProofStates: async (tokenString: string) => {
        const cleaned = cleanToken(tokenString);
        const decoded = decodeToken(cleaned);

        if (!decoded || !decoded.proofs || decoded.proofs.length === 0) {
            throw new Error('Could not decode token for status check');
        }

        try {
            const mint = new CashuMint(decoded.mint);
            const states = await mint.check({ Ys: decoded.proofs.map((p: any) => p.Y || p.secret) });
            return states;
        } catch (err) {
            console.warn(`[ProofService] Failed to check proof states at ${decoded.mint}:`, err);
            return [];
        }
    },

    /**
     * Get all ready (spendable) proofs for a specific mint from the local DB.
     */
    getReadyProofs: async (mintUrl: string): Promise<CoreProof[]> => {
        const repo = initService.getRepo();
        return repo.proofRepository.getReadyProofs(mintUrl);
    },

    /**
     * Get all ready proofs across all mints.
     */
    getAllReadyProofs: async (): Promise<CoreProof[]> => {
        const repo = initService.getRepo();
        return repo.proofRepository.getAllReadyProofs();
    },

    /**
     * Get proofs for a specific keyset ID from the local DB.
     */
    getProofsByKeysetId: async (mintUrl: string, keysetId: string): Promise<CoreProof[]> => {
        const repo = initService.getRepo();
        return repo.proofRepository.getProofsByKeysetId(mintUrl, keysetId);
    },
};
