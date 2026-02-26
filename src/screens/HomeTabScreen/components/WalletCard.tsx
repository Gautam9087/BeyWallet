import React from 'react';
import { Text, YStack, XStack, Button } from "tamagui";
import Balance from "./Balance";
import Blockies from 'components/UI/Blockies';
import { Copy } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useToastController } from "@tamagui/toast";


export default function WalletCard() {
    return (
        <YStack width={"100%"} gap="$2" >
            <XStack gap="$2" items="center" justify="space-between">
                <XStack gap="$2" items="center">
                    <Blockies
                        style={{ borderRadius: 3 }}
                        seed="bey-wallet"
                        size={10}
                        scale={4}
                    />
                    <YStack items="center">
                        <XStack
                            gap="$2"
                            items="center"
                            pressStyle={{ opacity: 0.7 }}
                        >
                            <Text fontSize="$5" fontWeight="700" color="$accent8">Bey Wallet</Text>
                        </XStack>
                    </YStack>
                </XStack>
            </XStack>
            <Balance />
        </YStack>
    )
}