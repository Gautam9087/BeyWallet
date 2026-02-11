export type CurrencyCode = 'USD' | 'INR' | 'EUR';

export interface Currency {
    code: CurrencyCode;
    symbol: string;
    name: string;
    locale: string;
}

export const SUPPORTED_CURRENCIES: Currency[] = [
    { code: 'USD', symbol: '$', name: 'US Dollar', locale: 'en-US' },
    { code: 'INR', symbol: '₹', name: 'Indian Rupee', locale: 'en-IN' },
    { code: 'EUR', symbol: '€', name: 'Euro', locale: 'de-DE' },
];

export const currencyService = {
    formatValue(value: number, currencyCode: CurrencyCode): string {
        const currency = SUPPORTED_CURRENCIES.find(c => c.code === currencyCode) || SUPPORTED_CURRENCIES[0];
        return new Intl.NumberFormat(currency.locale, {
            style: 'currency',
            currency: currency.code,
            maximumFractionDigits: 2
        }).format(value);
    },

    getSymbol(currencyCode: CurrencyCode): string {
        return SUPPORTED_CURRENCIES.find(c => c.code === currencyCode)?.symbol || '$';
    },

    async fetchBitcoinPrice(currencyCode: CurrencyCode) {
        const vsCurrency = currencyCode.toLowerCase();
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

    convertSatsToCurrency(sats: number, btcPrice: number): number {
        // 1 BTC = 100,000,000 sats
        return (sats / 100000000) * btcPrice;
    },

    convertCurrencyToSats(fiatAmount: number, btcPrice: number): number {
        if (!btcPrice || btcPrice <= 0) return 0;
        return Math.floor((fiatAmount / btcPrice) * 100000000);
    }
};
