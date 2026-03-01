import React from 'react';
import { Text, YStack, XStack, Button } from "tamagui";
import Balance from "./Balance";
import Blockies from 'components/UI/Blockies';
import { Copy } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useToastController } from "@tamagui/toast";
import { useRouter } from "expo-router";
import { useSettingsStore } from "~/store/settingsStore";

export default function WalletCard() {
    const npub = useSettingsStore(state => state.npub);
    const toast = useToastController();
    const router = useRouter();

    const handleCopy = async () => {
        if (!npub) return;
        await Clipboard.setStringAsync(npub);
        toast.show("Copied npub to clipboard");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    // Helper to truncate npub like npub1...xyz
    const truncateNpub = (str: string) => {
        if (!str || str.length < 15) return str;
        return `${str.slice(0, 9)}...${str.slice(-4)}`;
    };
    return (
        <YStack width={"100%"} gap="$2" >
            <XStack gap="$2" items="center" justify="space-between">
                <XStack gap="$2" items="center">
                    <XStack
                        pressStyle={{ opacity: 0.7, scale: 0.95 }}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            router.push('/(modals)/nostr-profile');
                        }}
                    >
                        <Blockies
                            style={{ borderRadius: 3 }}
                            seed={npub || "bey-wallet"}
                            size={10}
                            scale={4}
                        />
                    </XStack>
                    <YStack items="center">
                        <XStack
                            gap="$2"
                            items="center"
                            pressStyle={{ opacity: 0.7 }}
                            onPress={handleCopy}
                        >
                            <Text fontSize="$5" fontWeight="700" color="$accent8">
                                {npub ? truncateNpub(npub) : "Bey Wallet"}
                            </Text>
                            {npub && <Copy size={14} color="$accent8" />}
                        </XStack>
                    </YStack>
                </XStack>
            </XStack>
            <Balance />
        </YStack>
    )
}