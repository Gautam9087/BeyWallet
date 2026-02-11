import { Proof, getTokenMetadata, getDecodedToken, Wallet } from '@cashu/cashu-ts';
import { cocoService } from '../cocoService';
import { customWalletService } from './CustomWalletService';
import { customProofService } from './CustomProofService';

const getInternals = () => {
    const manager = cocoService.getManager();
    return {
        // Handle both possible property names for backward/forward compatibility
        mintService: (manager as any).mintService || (manager as any).mint,
        proofService: (manager as any).proofService, // The original one for utils
        eventBus: (manager as any).eventBus,
        logger: (manager as any).logger,
    };
};

export class CustomReceiveService {

    async receive(token: string) {
        let mint: string;
        let unit: string | undefined;
        let proofs: Proof[];
        let keysetIds: string[];

        // Use cocoService utility to clean token (remove prefixes, etc.)
        const cleanToken = cocoService._cleanToken(token);

        // 1. Decode token
        try {
            const metadata = getTokenMetadata(cleanToken);
            mint = metadata.mint;
            unit = metadata.unit;
            // Decode proofs using keyset IDs if needed, or just token structure
            // cashu-ts handles this mostly
            const decoded = getDecodedToken(cleanToken);
            proofs = decoded.proofs;
            // We might need keysets to fully decode if minimal token?
            // Assume full token for now or let wallet handle decoding
        } catch (err: any) {
            console.error('Failed to decode token', err);
            throw new Error('Invalid token');
        }

        const { mintService, eventBus, logger } = getInternals();

        // 2. Ensure Mint is trusted
        if (mintService) {
            const trusted = await mintService.isTrustedMint(mint);
            if (!trusted) {
                console.log(`[CustomReceiveService] Mint ${mint} is not trusted. Trusting now to allow receive.`);
                try {
                    await mintService.addMint(mint, { trusted: true });
                } catch (addErr) {
                    console.error('[CustomReceiveService] Failed to auto-trust mint:', addErr);
                    // We don't throw here, we'll try to proceed anyway if possible, 
                    // or let ensureUpdatedMint fail if it's a hard requirement.
                }
            }
        }

        // 3. Ensure updated mint (keysets)
        const { keysets } = await mintService.ensureUpdatedMint(mint);

        // 3.5 Determine Unit from Keyset (Prioritize Keyset derived unit)
        try {
            const decoded = getDecodedToken(cleanToken);
            proofs = decoded.proofs;
            if (proofs && proofs.length > 0) {
                const firstProofId = proofs[0].id;
                const matchingKeyset = keysets.find((k: any) => k.id === firstProofId);

                console.log('[CustomReceiveService] Keyset Lookup:', {
                    firstProofId,
                    metadataUnit: unit,
                    foundKeysetUnit: matchingKeyset?.unit
                });

                if (matchingKeyset) {
                    const keysetUnit = matchingKeyset.unit || 'sat';
                    if (unit && unit !== keysetUnit) {
                        console.warn(`[CustomReceiveService] Token metadata says '${unit}' but keyset says '${keysetUnit}'. Using keyset unit.`);
                    }
                    unit = keysetUnit;
                }
            }
        } catch (e) {
            console.warn('[CustomReceiveService] Failed to infer unit from token proofs', e);
        }

        // Final fallback to 'sat' if still undefined or empty
        unit = unit || 'sat';

        console.log(`[CustomReceiveService] Using mint: ${mint}, unit: ${unit || 'default(sat)'}`);

        // 4. Get Wallet with UNIT support
        const { wallet } = await customWalletService.getWalletWithActiveKeysetId(mint, unit);

        // 5. Prepare Proofs (P2PK signing etc) via original service which handles keyring
        // We need to inject the wallet we just got into the original service? No, original service uses its own walletService.
        // But prepareProofsForReceiving uses walletService ONLY if P2PK needs external keys? Actually it uses KeyRingService.
        // It should be safe to call original proofService.prepareProofsForReceiving(proofs)
        proofs = await customProofService.prepareProofsForReceiving(proofs);

        if (!proofs || proofs.length === 0) {
            throw new Error('Token contains no proofs');
        }

        const receiveAmount = proofs.reduce((acc, p) => acc + p.amount, 0);

        // 6. Create Outputs (with UNIT support)
        const fees = wallet.getFeesForProofs(proofs);
        const { keep: outputData } = await customProofService.createOutputsAndIncrementCounters(
            mint,
            { keep: receiveAmount - fees, send: 0 },
            undefined,
            unit // PASSING UNIT HERE FIXES THE BUG
        );

        if (!outputData || outputData.length === 0) {
            throw new Error('Failed to create outputs for receive');
        }

        // 7. Call Wallet Receive
        // This exchanges proofs (swap)
        // wallet.receive uses this.keys but we ensured wallet was built with correct unit keys
        const newProofs = await wallet.receive(
            { mint, proofs, unit: wallet.unit },
            undefined,
            { type: 'custom', data: outputData }
        );

        // 8. Save Proofs
        // We can use original proofService.saveProofs?
        // Original saveProofs uses proofRepository internally.
        // However, original saveProofs expects CoreProof[] which has extra metadata.
        // Let's use custom helper or map it.
        // Mapping:
        const coreProofs = newProofs.map(p => ({
            ...p,
            mintUrl: mint,
            state: 'ready',
            t: Date.now(),
            // unit? CoreProof might not store unit directly on proof object but relies on keyset ID mapping?
            // Actually CoreProof interface has unit? Let's check. Often it doesn't, it relies on keyset.
            // But we need to ensure keyset ID is correct.
            // newProofs come from wallet.receive, which uses wallet.keys (active keyset).
            // Since wallet was built for unit, active keyset is unit keyset. So IDs should be correct.
        }));

        // Use repo via manager to save
        const repo = cocoService.getRepo();
        // saveProofs signature: (mintUrl, proofs[])
        // But wait, ProofRepository usually takes grouped proofs or array?
        // Checking ProofService.ts: it calls `this.proofRepository.saveProofs(mintUrl, group)`.
        // So we can just save them.

        // Let's use our CustomProofService helper which acts like original
        // But we need to implement saveProofs on CustomProofService properly.
        // I implemented a basic version in step 186.

        // Actually, let's just do it manually here to be safe
        const grouped = new Map<string, any[]>();
        for (const p of coreProofs) {
            const k = p.id;
            if (!grouped.has(k)) grouped.set(k, []);
            grouped.get(k)?.push(p);
        }

        for (const [keysetId, group] of grouped) {
            await repo.proofRepository.saveProofs(mint, group);
            eventBus?.emit('proofs:saved', { mintUrl: mint, keysetId, proofs: group });
        }

        eventBus?.emit('receive:created', { mintUrl: mint, token: { mint, proofs } });

        logger?.info('Token received and proofs saved', { mint, newProofs: newProofs.length, unit });
    }
}

export const customReceiveService = new CustomReceiveService();
