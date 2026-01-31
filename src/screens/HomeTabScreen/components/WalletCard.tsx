import { View, Text, YStack, XStack, Square, H6, H4, H5 } from "tamagui";
import Balance from "./Balance";
import HomeHeaderMintSelector from "~/components/HomeMintSelector";

export default function WalletCard() {
    return (
        <YStack width={"100%"} gap="$2">
            <XStack gap="$2" items="center">
                <Square size="$5" rounded="$1" bg="orange" />
                <YStack>

                    <H4>hussein@zaps.lol</H4>
                    <H5 fontWeight={'300'} color="$accent9">124K21...diuy</H5>
                </YStack>
            </XStack>
            {/* <HomeHeaderMintSelector /> */}
            <Balance />
        </YStack>
    )
}