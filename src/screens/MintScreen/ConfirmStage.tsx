import React from 'react';
import { YStack, XStack, Text, Button, H1, Separator } from "tamagui";
import { Sprout, Zap } from "@tamagui/lucide-icons";
import { Spinner } from '../../components/UI/Spinner';
import * as Haptics from 'expo-haptics';

interface ConfirmStageProps {
    amount: string;
    mintUrl: string;
    isLoading?: boolean;
    onConfirm: () => void;
    onBack: () => void;
}

export function ConfirmStage({ amount, mintUrl, isLoading, onConfirm, onBack }: ConfirmStageProps) {
    const sats = parseInt(amount, 10);

    // Extract mint name from URL
    const getMintName = (url: string) => {
        try {
            const hostname = new URL(url).hostname;
            return hostname.replace('testnut.', '').replace('.cashu.space', '');
        } catch {
            return url;
        }
    };

    return (
        <YStack flex={1} gap="$2">
            <YStack items="center" gap="$2" py="$2">
                <Text color="$gray10">Deposit Amount</Text>
                <H1 fontWeight={400}>{sats} SATS</H1>
            </YStack>

            <YStack bg="$color2" rounded="$5" p="$4" gap="$4">
                <XStack justify="space-between" items="center">
                    <Text color="$gray10">Mint</Text>
                    <XStack gap="$2" items="center">
                        <Sprout size={16} color="$green10" />
                        <Text fontWeight="600" numberOfLines={1} maxWidth={200}>
                            {getMintName(mintUrl)}
                        </Text>
                    </XStack>
                </XStack>

                <Separator />

                <XStack justify="space-between" items="center">
                    <Text color="$gray10">Network</Text>
                    <XStack gap="$2" items="center">
                        <Zap size={16} color="$yellow10" />
                        <Text fontWeight="600">Lightning</Text>
                    </XStack>
                </XStack>

                <Separator />

                <XStack justify="space-between" items="center">
                    <Text color="$gray10">Amount</Text>
                    <Text fontWeight="600">{sats} SATS</Text>
                </XStack>
            </YStack>

            <YStack mt="auto" gap="$2">
                <Button
                    theme="accent"
                    size="$5"
                    disabled={isLoading}
                    icon={isLoading ? <Spinner size="small" color="white" /> : undefined}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onConfirm();
                    }}
                >
                    {isLoading ? 'Creating Invoice...' : 'Confirm and Generate Invoice'}
                </Button>
                <Button
                    chromeless
                    size="$5"
                    disabled={isLoading}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onBack();
                    }}
                >
                    Go Back
                </Button>
            </YStack>
        </YStack>
    );
}
