import React from 'react';
import { YStack, XStack, Text, Button, H3, H4, Separator, H1 } from "tamagui";
import { Sprout, Check } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';

interface ConfirmStageProps {
    amount: string;
    onConfirm: () => void;
    onBack: () => void;
}

export function ConfirmStage({ amount, onConfirm, onBack }: ConfirmStageProps) {
    const sats = Number(amount) * 3000;

    return (
        <YStack flex={1} gap="$2">
            <YStack items="center" gap="$2" py="$2">
                <Text color="$gray10">Deposit Amount</Text>
                <H1 fontWeight={400}>${amount}</H1>
                <Text color="$gray10">{sats} SATS</Text>
            </YStack>

            <YStack bg="$color2" rounded="$5" p="$4" gap="$4">
                <XStack justify="space-between" items="center">
                    <Text color="$gray10">Mint</Text>
                    <XStack gap="$2" items="center">
                        <Sprout size={16} color="$green10" />
                        <Text fontWeight="600">Cashu Testnut</Text>
                    </XStack>
                </XStack>

                <Separator />

                <XStack justify="space-between" items="center">
                    <Text color="$gray10">Network</Text>
                    <Text fontWeight="600">Lightning</Text>
                </XStack>

                <Separator />

                <XStack justify="space-between" items="center">
                    <Text color="$gray10">Fee (estimated)</Text>
                    <Text fontWeight="600" color="$green10">0 SATS</Text>
                </XStack>
            </YStack>

            <YStack mt="auto" gap="$2">
                <Button theme="accent" size="$5" onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    onConfirm();
                }}>
                    Confirm and Generate Invoice
                </Button>
                <Button chromeless size="$5" onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onBack();
                }}>
                    Go Back
                </Button>
            </YStack>
        </YStack>
    );
}
