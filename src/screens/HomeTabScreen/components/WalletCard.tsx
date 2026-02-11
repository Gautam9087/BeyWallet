import { View, Text, YStack, XStack, Square, H6, H4, H5 } from "tamagui";
import Balance from "./Balance";
import HomeHeaderMintSelector from "~/components/HomeMintSelector";
import Blockies from 'components/UI/Blockies';

export default function WalletCard() {
    return (
        <YStack width={"100%"} gap="$2" >
            <XStack gap="$2" items="center" justify="space-between">
                <XStack gap="$2" items="center">
                    <Blockies
                        style={{ borderRadius: 3 }}
                        seed={"2dss4zahuvtcyggsrrdestd6ps.lol"}
                        size={10}
                        scale={4}
                    />
                    <YStack>
                        <Text fontSize="$5" fontWeight="700" color="$accent5">hussein@zaps.lol</Text>
                        <Text fontSize="$3" fontWeight="700" color="$accent10">npub78d...5gdcf</Text>
                    </YStack>
                </XStack>
            </XStack>
            {/* <HomeHeaderMintSelector /> */}
            <Balance />
        </YStack>
    )
}