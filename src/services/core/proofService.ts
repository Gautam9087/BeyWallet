import { Wallet } from '@cashu/cashu-ts';
import { cleanToken, decodeToken } from './tokenUtils';
import type { CoreProof } from 'coco-cashu-core';
import { initService } from './initService';



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
        let decoded: any;
        try {
            decoded = decodeToken(cleaned);
        } catch (e) {
            console.warn('[ProofService] Failed to decode token for check:', e);
            return [];
        }

        if (!decoded || !decoded.proofs || decoded.proofs.length === 0) {
            return [];
        }

        try {
            console.log(`[ProofService] Checking state for ${decoded.mint} with ${decoded.proofs.length} proofs`);

            // We instantiate a new Wallet instance for the state check.
            // This is safer than relying on private services in the manager.
            const wallet = new Wallet(decoded.mint);


            // The library method handles the Y derivation internally from the secrets
            // It only needs the secret field, which we have in decoded.proofs
            console.log('[ProofService] Checking state via library...');
            const states = await wallet.checkProofsStates(decoded.proofs);

            console.log('[ProofService] States received:', states.length);

            // Map the states back to a consistent format if needed, 
            // though usually they match the NUT-07 response
            return states.map((s, i) => ({
                ...s,
                secret: decoded.proofs[i].secret // Attach secret for UI convenience
            }));
        } catch (err: any) {
            console.error(`[ProofService] Failed to check proof states at ${decoded.mint}:`, err);
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
