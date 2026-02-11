import React from "react";
import { H1, H2, Paragraph, Text, View, XStack, YStack } from "tamagui";
import { useWalletStore } from "../../../store/walletStore";
import { RollingNumber } from "../../../components/UI/RollingNumber";
import { useSettingsStore } from "../../../store/settingsStore";
import { currencyService, CurrencyCode } from "../../../services/currencyService";
import { useQuery } from "@tanstack/react-query";
import { bitcoinService } from "../../../services/bitcoinService";

export default function Balance() {
    const { balance, activeMintUrl, refreshCounter, mints } = useWalletStore();
    const { secondaryCurrency } = useSettingsStore();

    const { data: btcData } = useQuery({
        queryKey: ['bitcoinPrice', secondaryCurrency],
        queryFn: () => bitcoinService.fetchPrice(secondaryCurrency),
        staleTime: 30000,
    })

    const activeMint = mints.find(m => m.mintUrl === activeMintUrl);
    const mintName = activeMint?.nickname || activeMintUrl || "No Mint Selected";

    const secondaryBalance = React.useMemo(() => {
        if (!btcData?.price) return 0;
        return currencyService.convertSatsToCurrency(balance, btcData.price);
    }, [balance, btcData?.price]);

    return (
        <YStack py="$2" gap="$2">
            <XStack width="100%" items="center">
                <Paragraph color="$accent9" px="$2" py="$0.5" rounded="$2" bg="$gray5" fontSize="$2" fontWeight="600">
                    {mintName}
                </Paragraph>
            </XStack>
            <XStack justify="space-between" py="$2" items="flex-end">

                <RollingNumber
                    value={balance}
                    prefix="₿"

                    trigger={refreshCounter}
                    letterSpacing={-1}
                    fontSize={30}
                    fontWeight="900"
                    color="$accent3"
                    decimalOpacity={0.4}
                    showDecimals={false}
                />
                <Text color="$accent9" fontWeight="700">SATS</Text>
            </XStack>
            {/* Balance : Secondary */}

            <RollingNumber
                value={secondaryBalance}
                trigger={refreshCounter}
                letterSpacing={-1}
                fontSize={16}
                fontWeight="900"
                color="$accent8"
                decimalOpacity={0.4}
                showDecimals={false}
            >

                {currencyService.formatValue(secondaryBalance, secondaryCurrency as CurrencyCode)}
            </RollingNumber>

        </YStack>
    )
}