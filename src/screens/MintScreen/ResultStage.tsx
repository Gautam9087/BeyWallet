import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, H2, Separator, Circle } from "tamagui";
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
                return <CheckCircle size={40} color="white" />;
            case 'error':
                return <XCircle size={40} color="white" />;
            case 'cancelled':
                return <AlertCircle size={40} color="white" />;
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
        <YStack flex={1} bg="$background">
            <YStack flex={1}>
                {/* Status Header */}
                <YStack gap="$1" mb="$6" mt="$8" items="center">
                    <Circle size={80} bg={getStatusColor() as any} items="center" justify="center" mb="$4">
                        {getIcon()}
                    </Circle>
                    <H2 text="center">{getTitle()}</H2>
                    <Text color="$gray10" text="center" px="$4">
                        {getMessage()}
                    </Text>
                </YStack>

                {/* Details Table */}
                <YStack gap="$0" mb="$6" bg="$gray2" rounded="$5" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                    <DetailItem label="Total Amount" value={`₿${sats} sats`} />
                    <DetailItem label="Status" value={status} valueColor={getStatusColor()} />
                </YStack>
            </YStack>

            <YStack position="absolute" b={0} l={0} r={0} bg="$background" borderTopWidth={1} borderColor="$gray3">
                <Button
                    bg={status === 'success' ? "$green10" : "$gray3"}
                    size="$5"
                    height={55}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        onClose();
                    }}
                    fontWeight="800"
                    color={status === 'success' ? "white" : "$color"}
                    rounded="$4"
                >
                    DONE
                </Button>
            </YStack>
        </YStack>
    );
}

function DetailItem({ label, value, valueColor }: { label: string, value: string, valueColor?: any }) {
    return (
        <XStack justify="space-between" items="center" py="$3" px="$4">
            <Text fontSize="$4" color="$gray10" fontWeight="600">{label}</Text>
            <Text fontSize="$5" fontWeight="800" color={valueColor || '$color'} numberOfLines={1} textTransform={valueColor ? 'uppercase' : 'none'}>
                {value}
            </Text>
        </XStack>
    );
}
