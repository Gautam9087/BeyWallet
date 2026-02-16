import { Text, YStack, XStack } from "tamagui";
import Balance from "./Balance";
import Blockies from 'components/UI/Blockies';
import { useNostrStore } from "~/store/nostrStore";

export default function WalletCard() {
    const { npub } = useNostrStore();
    const shortenedNpub = npub ? `${npub.substring(0, 10)}...${npub.substring(npub.length - 8)}` : 'npub...';

    return (
        <YStack width={"100%"} gap="$2" >
            <XStack gap="$2" items="center" justify="space-between">
                <XStack gap="$2" items="center">
                    <Blockies
                        style={{ borderRadius: 3 }}
                        seed={npub || "bey-wallet"}
                        size={10}
                        scale={4}
                    />
                    <YStack>
                        <Text fontSize="$5" fontWeight="700" color="$accent5">zup@bey.lol</Text>
                        <Text fontSize="$3" fontWeight="700" color="$accent10">{shortenedNpub}</Text>
                    </YStack>
                </XStack>
            </XStack>
            <Balance />
        </YStack>
    )
}