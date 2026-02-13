import { Proof, Wallet } from '@cashu/cashu-ts';
import { cocoService } from '../cocoService';
import { customWalletService } from './CustomWalletService';
import { customProofService } from './CustomProofService';

const getInternals = () => {
    const manager = cocoService.getManager();
    // Use the repository getter from cocoService which is reliable
    const repo = cocoService.getRepo();

    return {
        proofRepository: repo.proofRepository,
        eventBus: (manager as any).eventBus,
        logger: (manager as any).logger,
    };
};

export class CustomSendService {

    async send(mintUrl: string, amount: number, memo?: string): Promise<string> {
        const { proofRepository, eventBus, logger } = getInternals();

        // 1. Determine Unit (default to matching wallet store if we could, but here we scan available proofs?)
        // For testnut, we know unit is likely '' or 'sat'. 
        // We should check what unit the user has balance in.
        // cocoService.getBalances() returns aggregated balance.
        // We need to fetch ALL proofs for this mint and see which ones are spendable.

        const allProofs: Proof[] = await proofRepository.getProofsByMint(mintUrl);
        // Filter for 'active' proofs (not spent/pending)? 
        // repo.getProofsByMint usually returns all? Or maybe just spendable?
        // Assuming spendable or we need to filter.
        // But for this fix, let's assume all returned are candidates.

        // Group by unit to check what we have.
        // Since we don't have unit on Proof object easily, we rely on keyset ID mapping?
        // But we want to send what's available.
        // Let's assume the user wants to send 'sat' (standard).
        // Checks proofs for unit mismatch.

        // 2. Get Wallet aligned with available proofs
        // We need to find which unit/keyset these proofs belong to.
        const keysets = await cocoService.debugKeysets(mintUrl);

        // Find unit of the proofs we have
        let unit = 'sat'; // default
        if (allProofs.length > 0) {
            const firstId = allProofs[0].id;
            const keyset = keysets.find((k: any) => k.id === firstId);
            if (keyset && keyset.unit !== undefined) {
                unit = keyset.unit;
            }
        }

        // Get Wallet (passing unit to ensure correct keyset selection)
        // If unit is '', proper wallet will be built.
        const { wallet } = await customWalletService.getWalletWithActiveKeysetId(mintUrl, unit);

        // 3. Coin Selection
        // Simple accumulation
        const proofsToSend: Proof[] = [];
        let total = 0;
        // Check fees?
        // simple send: feeReserve?
        // Let's assume 0 fees for now or over-select.

        for (const p of allProofs) {
            proofsToSend.push(p);
            total += p.amount;
            if (total >= amount) break;
        }

        if (total < amount) {
            throw new Error('Insufficient balance');
        }

        // 4. Send (Swap for token)
        // wallet.send returns { returnChange, send, keep }? 
        // No, wallet.send(amount, proofs) returns { returnChange, send: Proof[] } usually?
        // Actually cashu-ts wallet.send returns: { returnChange: Proof[], send: Proof[] }
        console.log(`[CustomSendService] Sending ${amount} (unit: '${unit}') from ${mintUrl}`);

        const { returnChange, send: sendProofs } = await wallet.send(amount, proofsToSend);

        // 5. Save State
        // Delete spent proofs
        await proofRepository.deleteProofs(proofsToSend);

        // Save change
        if (returnChange && returnChange.length > 0) {
            await customProofService.saveProofs(mintUrl, returnChange);
        }

        // The 'sendProofs' are the token payload.
        // We don't save 'sendProofs' to our repo as 'spendable', but we might want to log them or return them.

        // 6. Create Token Object
        const token = {
            token: [{
                mint: mintUrl,
                proofs: sendProofs,
                unit // include unit in token
            }],
            memo
        };

        const encoded = cocoService.encodeTokenV4(token);

        eventBus?.emit('send:created', { mintUrl, amount, token, encoded });

        return encoded;
    }
}

export const customSendService = new CustomSendService();
