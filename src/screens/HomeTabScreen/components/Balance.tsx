import { H1, H2, Paragraph, Text, View, XStack, YStack } from "tamagui";
import { useWalletStore } from "../../../store/walletStore";
import { RollingNumber } from "../../../components/UI/RollingNumber";

export default function Balance() {
    const { balance, activeMintUrl, refreshCounter, mints } = useWalletStore();
    const activeMint = mints.find(m => m.mintUrl === activeMintUrl);
    const mintName = activeMint?.name || activeMintUrl || "No Mint Selected";

    return (
        <YStack py="$2" gap="$2">
            <XStack width="100%" items="center">
                <Paragraph color="$accent9" fontSize="$2" fontWeight="600">
                    {mintName}
                </Paragraph>
            </XStack>
            <XStack justify="space-between" py="$2" items="flex-end">
                {/* Balance : Primary */}
                <RollingNumber
                    value={balance}
                    prefix="₿"
                    trigger={refreshCounter}
                    letterSpacing={-2}
                    fontSize={36}
                    fontWeight="800"
                    color="$accent3"
                    decimalOpacity={0.4}
                    showDecimals={false}
                />
                <Text color="$accent9" fontWeight="700">SATS</Text>
            </XStack>
            {/* Balance : Secondary */}
            <Paragraph color="$gray10">
                $0
            </Paragraph>
        </YStack>
    )
}