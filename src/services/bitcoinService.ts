export interface BitcoinPriceData {
    price: number;
    change24h: number;
    updatedAt: number;
}

export const bitcoinService = {
    async fetchPrice(): Promise<BitcoinPriceData> {
        const priceRes = await fetch(
            'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd&include_24hr_change=true'
        );

        if (!priceRes.ok) {
            throw new Error(`Price API failed: ${priceRes.status}`);
        }

        const priceData = await priceRes.json();

        if (!priceData?.bitcoin?.usd) {
            throw new Error('Invalid price format from CoinGecko');
        }

        return {
            price: priceData.bitcoin.usd,
            change24h: priceData.bitcoin.usd_24h_change || 0,
            updatedAt: Math.floor(Date.now() / 1000),
        };
    }
};
