import React from 'react';
import { Text, YStack, XStack, Button } from "tamagui";
import Balance from "./Balance";
import Blockies from 'components/UI/Blockies';
import { useNostrStore } from "~/store/nostrStore";
import { Copy } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useToastController } from "@tamagui/toast";


export default function WalletCard() {
    const { npub } = useNostrStore();
    const shortenedNpub = npub ? `${npub.substring(0, 8)}...${npub.substring(npub.length - 4)}` : 'npub...';
    const toast = useToastController();

    const handleCopy = async () => {
        if (npub) {
            await Clipboard.setStringAsync(npub);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show('Public key copied!');

        }
    };


    return (
        <YStack width={"100%"} gap="$2" >
            <XStack gap="$2" items="center" justify="space-between">

                {/* XStack only when username if not YStack  */}
                <XStack gap="$2" items="center">
                    {/* Blockie border radius 300 when username does'nt exist if username exist border radius 3 */}
                    <Blockies
                        style={{ borderRadius: 3 }}
                        seed={npub || "bey-wallet"}
                        size={10}
                        scale={4}
                    />
                    <YStack items="center">

                        {/* don't show username if it doesn't exist no fallbacks */}

                        {/* <Text fontSize="$5" fontWeight="700" color="$accent5">zup@bey.lol</Text> */}
                        <XStack
                            gap="$2"
                            items="center"
                            onPress={handleCopy}
                            pressStyle={{ opacity: 0.7 }}
                            cursor="pointer"
                        >
                            <Text fontSize="$5" fontWeight="700" color="$accent8">{shortenedNpub}</Text>
                            <Copy size={18} color="$accent8" />
                        </XStack>

                    </YStack>
                </XStack>
            </XStack>
            <Balance />
        </YStack>
    )
}