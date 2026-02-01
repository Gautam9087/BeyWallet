import { cocoService } from './cocoService';

export const mintService = {
    /**
     * Adds a mint to the wallet.
     */
    addMint: async (url: string): Promise<void> => {
        const manager = cocoService.getManager();
        await manager.mintManager.addMint(url);
    },

    /**
     * Returns all mints registered in the wallet.
     */
    getMints: async () => {
        const manager = cocoService.getManager();
        return manager.mintManager.mints;
    },

    /**
     * Fetches metadata for a mint URL.
     */
    getMintInfo: async (url: string) => {
        // This usually involves calling the /info endpoint of the mint
        // coco-cashu might have a helper for this
        try {
            const response = await fetch(`${url}/info`);
            if (!response.ok) throw new Error('Failed to fetch mint info');
            return await response.json();
        } catch (error) {
            console.error('Error fetching mint info:', error);
            return null;
        }
    },

    /**
     * Requests a mint quote (invoice) for depositing funds.
     */
    requestMintQuote: async (url: string, amount: number) => {
        const manager = cocoService.getManager();
        const mint = manager.mintManager.mints.find(m => m.url === url);
        if (!mint) throw new Error('Mint not found');

        return await manager.mintManager.requestMintQuote(url, amount);
    },

    /**
     * Checks the status of a mint quote and mints tokens if paid.
     */
    checkAndMint: async (quoteId: string) => {
        const manager = cocoService.getManager();
        return await manager.mintManager.mint(quoteId);
    }
};
