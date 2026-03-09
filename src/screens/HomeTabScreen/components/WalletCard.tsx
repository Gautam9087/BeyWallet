import React, { useEffect, useState } from 'react';
import { Text, YStack, XStack } from "tamagui";
import Balance from "./Balance";
import Blockies from 'components/UI/Blockies';
import { Copy, RefreshCw } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useToastController } from "@tamagui/toast";
import { useRouter } from "expo-router";
import { useSettingsStore } from "~/store/settingsStore";
import { useWalletStore } from "~/store/walletStore";
import { Animated, Easing } from 'react-native';

export default function WalletCard() {
    const npub = useSettingsStore(state => state.npub);
    const { isRestoring, restoringMintUrl } = useWalletStore();
    const toast = useToastController();
    const router = useRouter();

    // Countdown from 2 (displayed as "syncing 2s…", "syncing 1s…")
    const [countdown, setCountdown] = useState(2);

    // Spin animation for the sync icon
    const spin = React.useRef(new Animated.Value(0)).current;
    useEffect(() => {
        if (isRestoring) {
            setCountdown(2);
            Animated.loop(
                Animated.timing(spin, {
                    toValue: 1,
                    duration: 1200,
                    easing: Easing.linear,
                    useNativeDriver: true,
                })
            ).start();

            const interval = setInterval(() => {
                setCountdown(c => Math.max(0, c - 1));
            }, 1000);
            return () => clearInterval(interval);
        } else {
            spin.stopAnimation();
            Animated.spring(spin, { toValue: 0, useNativeDriver: true }).start();
        }
    }, [isRestoring]);

    const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

    const handleCopy = async () => {
        if (!npub) return;
        await Clipboard.setStringAsync(npub);
        toast.show("Copied npub to clipboard");
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    };

    const truncateNpub = (str: string) => {
        if (!str || str.length < 15) return str;
        return `${str.slice(0, 9)}...${str.slice(-4)}`;
    };

    const mintHostname = restoringMintUrl
        ? (() => { try { return new URL(restoringMintUrl).hostname; } catch { return restoringMintUrl; } })()
        : null;

    return (
        <YStack width={"100%"} gap="$2">
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
    );
}