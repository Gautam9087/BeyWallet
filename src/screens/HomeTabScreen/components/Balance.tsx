import { H2, Paragraph, Text, XStack, YStack } from "tamagui";
import { useWalletStore } from "../../../store/walletStore";

export default function Balance() {
    const { balance, activeMintUrl } = useWalletStore();

    return (
        <YStack py="$4">
            <Paragraph color="$accent8">
                {activeMintUrl ? "Mint Balance" : "No Mint Selected"}
            </Paragraph>
            <XStack justify="space-between" py="$2" items="flex-end">

                <Text
                    letterSpacing={-1}
                    fontSize={35}
                    fontWeight="500"
                    maxW={"82%"}
                    color="$accent4"
                    numberOfLines={1}
                    ellipsizeMode="tail"
                    fontVariant={['tabular-nums']}
                >
                    {balance.toLocaleString()}
                </Text>
                <Text color="$accent9">SATS</Text>
            </XStack>
            <Paragraph color="$gray11">
                {activeMintUrl || "Please add a mint"}
            </Paragraph>
        </YStack>
    )
}