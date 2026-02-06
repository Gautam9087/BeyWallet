import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, H2, Separator } from "tamagui";
import { CheckCircle, XCircle, AlertCircle } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';

interface ResultStageProps {
    status: 'success' | 'error' | 'cancelled';
    amount: string;
    error?: string | null;
    onClose: () => void;
}

export function ResultStage({ status, amount, error, onClose }: ResultStageProps) {
    const isSuccess = status === 'success';
    const sats = parseInt(amount, 10);

    useEffect(() => {
        if (isSuccess) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else if (status === 'error') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    }, [status]);

    const getIcon = () => {
        switch (status) {
            case 'success':
                return <CheckCircle size={80} color="$green10" />;
            case 'error':
                return <XCircle size={80} color="$red10" />;
            case 'cancelled':
                return <AlertCircle size={80} color="$orange10" />;
        }
    };

    const getTitle = () => {
        switch (status) {
            case 'success':
                return 'Deposit Successful';
            case 'error':
                return 'Deposit Failed';
            case 'cancelled':
                return 'Deposit Cancelled';
        }
    };

    const getMessage = () => {
        switch (status) {
            case 'success':
                return `Successfully minted ${sats} SATS to your wallet.`;
            case 'error':
                return error || 'An error occurred while processing your deposit.';
            case 'cancelled':
                return 'The transaction was cancelled.';
        }
    };

    const getStatusColor = () => {
        switch (status) {
            case 'success':
                return '$green10';
            case 'error':
                return '$red10';
            case 'cancelled':
                return '$orange10';
        }
    };

    return (
        <YStack flex={1} justify="space-between" items="center" gap="$4">
            <YStack items="center" gap="$4" width="100%">
                {getIcon()}

                <YStack items="center" gap="$1">
                    <H2 text="center">{getTitle()}</H2>
                    <Text color="$gray10" text="center" px="$4">
                        {getMessage()}
                    </Text>
                </YStack>

                <YStack bg="$color2" rounded="$5" width="100%" p="$4" gap="$4">
                    <XStack justify="space-between">
                        <Text color="$gray10">Amount</Text>
                        <Text fontWeight="600">{sats} SATS</Text>
                    </XStack>
                    <Separator />
                    <XStack justify="space-between">
                        <Text color="$gray10">Status</Text>
                        <Text fontWeight="600" color={getStatusColor()} textTransform="capitalize">
                            {status}
                        </Text>
                    </XStack>
                </YStack>
            </YStack>

            <Button
                theme="accent"
                width="100%"
                size="$5"
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    onClose();
                }}
            >
                Done
            </Button>
        </YStack>
    );
}
