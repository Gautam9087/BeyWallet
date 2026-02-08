import { OutputData, Proof } from '@cashu/cashu-ts';
import { cocoService } from '../cocoService';
import { customWalletService } from './CustomWalletService';

// Access internals via existing cocoService
const getInternals = () => {
    const manager = cocoService.getManager();
    return {
        counterService: (manager as any).counterService,
        seedService: (manager as any).seedService,
        proofRepository: (manager as any).proofRepository,
        eventBus: (manager as any).eventBus,
        keyRingService: (manager as any).keyRingService,
    };
};

export class CustomProofService {
    async createOutputsAndIncrementCounters(
        mintUrl: string,
        amount: { keep: number; send: number },
        options?: { includeFees?: boolean },
        unit?: string
    ): Promise<{ keep: OutputData[]; send: OutputData[]; sendAmount: number; keepAmount: number }> {
        const { counterService, seedService } = getInternals();

        if (!mintUrl || mintUrl.trim().length === 0) {
            throw new Error('mintUrl is required');
        }
        if (
            !Number.isFinite(amount.keep) ||
            !Number.isFinite(amount.send) ||
            amount.keep < 0 ||
            amount.send < 0
        ) {
            return { keep: [], send: [], sendAmount: 0, keepAmount: 0 };
        }

        // Use our CustomWalletService with unit support
        const { wallet, keys, keysetId } =
            await customWalletService.getWalletWithActiveKeysetId(mintUrl, unit);

        const seed = await seedService.getSeed();
        const currentCounter = await counterService.getCounter(mintUrl, keys.id);
        const data: { keep: OutputData[]; send: OutputData[] } = { keep: [], send: [] };

        // Calculate send amount with fees if needed
        let sendAmount = amount.send;
        let keepAmount = amount.keep;
        if (options?.includeFees && amount.send > 0) {
            // Re-implement fee calculation locally to avoid circular dependencies or complex imports
            sendAmount = await this.calculateSendAmountWithFees(mintUrl, amount.send, unit);
            const feeAmount = sendAmount - amount.send;
            // Adjust keep amount: if send increases due to fees, keep decreases
            keepAmount = Math.max(0, amount.keep - feeAmount);
        }

        if (keepAmount > 0) {
            data.keep = OutputData.createDeterministicData(
                keepAmount,
                seed,
                currentCounter.counter,
                keys
            );
            if (data.keep.length > 0) {
                await counterService.incrementCounter(mintUrl, keys.id, data.keep.length);
            }
        }
        if (sendAmount > 0) {
            data.send = OutputData.createDeterministicData(
                sendAmount,
                seed,
                currentCounter.counter + data.keep.length,
                keys
            );
            if (data.send.length > 0) {
                await counterService.incrementCounter(mintUrl, keys.id, data.send.length);
            }
        }

        console.log(`[CustomProofService] Outputs created for ${mintUrl} (unit: ${unit || 'sat'})`, {
            outputs: data.keep.length + data.send.length,
        });
        return { keep: data.keep, send: data.send, sendAmount, keepAmount };
    }

    async calculateSendAmountWithFees(mintUrl: string, sendAmount: number, unit?: string): Promise<number> {
        const { wallet, keys, keysetId } =
            await customWalletService.getWalletWithActiveKeysetId(mintUrl, unit);

        // We need splitAmount utility. Since it's internal to coco/cashu-ts, we re-implement a simple version or use wallet internal
        // Wallet instance has access to keys, so we can use its helper or just basic logic.
        // Actually, wallet.getFeesForKeyset takes number of proofs.
        // We need to know how many proofs `sendAmount` will be split into.

        // Simple split logic (greedy)
        const sortedKeyAmounts = Object.keys(keys.keys)
            .map(Number)
            .sort((a, b) => b - a);

        const getCount = (val: number) => {
            let count = 0;
            for (const amt of sortedKeyAmounts) {
                if (amt <= 0) continue;
                const multiple = Math.floor(val / amt);
                count += multiple;
                val -= amt * multiple;
                if (val === 0) break;
            }
            return count;
        };

        let denominationsCount = getCount(sendAmount);
        let receiveFee = wallet.getFeesForKeyset(denominationsCount, keysetId);

        // Iterate for stabilisation
        let prevFee = 0;
        while (receiveFee > prevFee) {
            prevFee = receiveFee;
            const feeCount = getCount(receiveFee);
            const newFee = wallet.getFeesForKeyset(denominationsCount + feeCount, keysetId);
            if (newFee > receiveFee) {
                receiveFee = newFee;
            } else {
                break;
            }
        }

        return sendAmount + receiveFee;
    }

    // Helper to map Proof to CoreProof format expected by repositories
    private mapProofToCoreProof(mintUrl: string, state: 'ready' | 'inflight' | 'spent', proofs: Proof[]) {
        return proofs.map(p => ({
            ...p,
            mintUrl,
            state,
            t: Date.now(),
            // proofs don't strictly require all fields for simple save, but repo might complain
            // Let's hope repo handles partial or we add missing fields if ts complains
        }));
    }

    async saveProofs(mintUrl: string, proofs: Proof[]): Promise<void> {
        const { proofRepository, eventBus } = getInternals();
        if (!proofs.length) return;

        // We need to convert cashu-ts Proof[] to CoreProof[]
        // CoreProof usually extends Proof with mintUrl, state, t, etc.
        const coreProofs = this.mapProofToCoreProof(mintUrl, 'ready', proofs);

        // Save to repo
        // proofRepository.saveProofs expects CoreProof[]
        // We might need to handle grouping by keysetId if repo requires it (ProofService does it)

        // Grouping logic (simplified from ProofService)
        const grouped = new Map<string, any[]>();
        for (const p of coreProofs) {
            const k = p.id;
            if (!grouped.has(k)) grouped.set(k, []);
            grouped.get(k)?.push(p);
        }

        for (const [keysetId, group] of grouped) {
            await proofRepository.saveProofs(mintUrl, group);
            eventBus?.emit('proofs:saved', { mintUrl, keysetId, proofs: group });
        }
    }

    // Proxy for prepareProofsForReceiving using internal ProofService if possible, or just skip if not P2PK
    // For now, let's assume we can reuse the internal ProofService's logic OR rely on the fact that simple receive doesn't need complex preparation for standard tokens.
    // However, if the token is P2PK, we need to sign it.
    // Let's access the REAL proofService for this utility method as it doesn't depend on unit/wallet as much (it uses keyring).
    async prepareProofsForReceiving(proofs: Proof[]): Promise<Proof[]> {
        const manager = cocoService.getManager();
        // accessing private proofService
        const service = (manager as any).proofService;
        if (service && typeof service.prepareProofsForReceiving === 'function') {
            return service.prepareProofsForReceiving(proofs);
        }
        // Fallback: If it's not available, just return proofs. 
        // This means P2PK won't work if the user is receiving P2PK, but standard ecash works.
        console.warn('[CustomProofService] prepareProofsForReceiving not found on ProofService. P2PK might not work.');
        return proofs;
    }
}

export const customProofService = new CustomProofService();
