import { View, Text, YStack, XStack, Square, H6, H4, H5 } from "tamagui";
import Balance from "./Balance";
import HomeHeaderMintSelector from "~/components/HomeMintSelector";
import Blockies from 'components/UI/Blockies';

export default function WalletCard() {
    return (
        <YStack width={"100%"} gap="$2">
            <XStack gap="$2" items="center" justify="space-between">
                <XStack gap="$2" items="center">
                    <Blockies
                        style={{ borderRadius: 3 }}
                        seed={"hussein@zaps.lol"}
                        size={8}
                        scale={7}
                    />
                    <YStack>
                        <H4 color="$accent4">hussein@zaps.lol</H4>
                        <H5 fontWeight={'300'} color="$accent9">124K21...diuy</H5>
                    </YStack>
                </XStack>
            </XStack>
            {/* <HomeHeaderMintSelector /> */}
            <Balance />
        </YStack>
    )
}