import React from 'react';
import { YStack, XStack, Text, Button, H2, View, Separator } from "tamagui";
import { CheckCircle, XCircle, Clock } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import * as Haptics from 'expo-haptics';
import { useEffect } from 'react';

interface ResultStageProps {
    status: 'success' | 'error' | 'cancelled';
    amount: string;
    onClose: () => void;
}

export function ResultStage({ status, amount, onClose }: ResultStageProps) {
    const isSuccess = status === 'success';
    const sats = Number(amount) * 3000;

    useEffect(() => {
        if (isSuccess) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (status === 'error') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, [status]);

    return (
        <YStack flex={1} justify="space-between" items="center" gap="$4">
            <YStack items="center" gap="$4" width="100%">
                {isSuccess ? (
                    <CheckCircle size={80} color="$green10" />
                ) : (
                    <XCircle size={80} color="$red10" />
                )}

                <YStack items="center" gap="$1">
                    <H2 text="center">
                        {isSuccess ? 'Deposit Successful' : 'Deposit Failed'}
                    </H2>
                    <Text color="$gray10" text="center">
                        {isSuccess
                            ? `Successfully minted ${sats} SATS to your wallet.`
                            : status === 'cancelled'
                                ? 'The transaction was cancelled by the user.'
                                : 'An error occurred while processing your deposit.'
                        }
                    </Text>
                </YStack>
                <YStack bg="$color2" rounded="$5" width="100%" p="$4" gap="$4">
                    <XStack justify="space-between">
                        <Text color="$gray10">Amount</Text>
                        <Text fontWeight="600">${amount}</Text>
                    </XStack>
                    <Separator />
                    <XStack justify="space-between">
                        <Text color="$gray10">Value</Text>
                        <Text fontWeight="600">{sats} SATS</Text>
                    </XStack>
                    <Separator />
                    <XStack justify="space-between">
                        <Text color="$gray10">Status</Text>
                        <XStack gap="$1" items="center">
                            <Text fontWeight="600" color={isSuccess ? '$green10' : '$red10'}>
                                {status.toUpperCase()}
                            </Text>
                        </XStack>
                    </XStack>
                </YStack>
            </YStack>


            <Button theme="accent" width="100%" size="$5" onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                onClose();
            }}>
                Done
            </Button>
        </YStack>
    );
}
