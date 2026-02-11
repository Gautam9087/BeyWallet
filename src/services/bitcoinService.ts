export interface BitcoinPriceData {
    price: number;
    change24h: number;
    updatedAt: number;
}

export const bitcoinService = {
    async fetchPrice(currency: string = 'usd'): Promise<BitcoinPriceData> {
        const vsCurrency = currency.toLowerCase();
        const priceRes = await fetch(
            `https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=${vsCurrency}&include_24hr_change=true`
        );

        if (!priceRes.ok) {
            throw new Error(`Price API failed: ${priceRes.status}`);
        }

        const priceData = await priceRes.json();

        if (!priceData?.bitcoin?.[vsCurrency]) {
            throw new Error(`Invalid price format from CoinGecko for ${vsCurrency}`);
        }

        return {
            price: priceData.bitcoin[vsCurrency],
            change24h: priceData.bitcoin[`${vsCurrency}_24h_change`] || 0,
            updatedAt: Math.floor(Date.now() / 1000),
        };
    },

    async getFromDb(): Promise<BitcoinPriceData | null> {
        // Placeholder for matching the store's loadFromCache call if needed
        return null;
    }
};
