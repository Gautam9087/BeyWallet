import { H1, H2, Paragraph, Text, XStack, YStack } from "tamagui";
import { useWalletStore } from "../../../store/walletStore";
import { RollingNumber } from "../../../components/UI/RollingNumber";

export default function Balance() {
    const { balance, activeMintUrl, refreshCounter } = useWalletStore();

    return (
        <YStack py="$4">
            <Paragraph color="$accent8" size="$2" fontWeight="600" >
                {activeMintUrl ? "Mint Balance" : "No Mint Selected"}
            </Paragraph>
            <XStack justify="space-between" py="$2" items="flex-end">

                <RollingNumber
                    value={1364}
                    prefix="₿"
                    trigger={refreshCounter}
                    letterSpacing={-1}
                    fontSize={32}
                    fontWeight="800"
                    color="$accent1"
                    decimalOpacity={0.4}
                />
                <Text color="$accent9" fontWeight="700">SATS</Text>
            </XStack>
            <Paragraph color="$gray10">
                = ₹4,520.00
            </Paragraph>
        </YStack>
    )
}