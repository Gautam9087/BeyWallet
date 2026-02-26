import React from 'react';
import { YStack, XStack, Text, Button, View } from 'tamagui';
import { CheckCircle, XCircle, Zap, ArrowLeft, Copy, ExternalLink } from '@tamagui/lucide-icons';
import * as Haptics from 'expo-haptics';

interface MeltResultStageProps {
    status: 'success' | 'error';
    amount: number;
    feeReserve: number;
    error?: string | null;
    onClose: () => void;
}

export function MeltResultStage({ status, amount, feeReserve, error, onClose }: MeltResultStageProps) {
    React.useEffect(() => {
        if (status === 'success') {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [status]);

    return (
        <YStack flex={1} items="center" justify="center" gap="$6" px="$4">
            {status === 'success' ? (
                <>
                    <View bg="$green4" p="$5" rounded="$12">
                        <CheckCircle size={48} color="$green10" strokeWidth={2} />
                    </View>

                    <YStack items="center" gap="$2">
                        <Text fontSize="$8" fontWeight="800">Payment Sent!</Text>
                        <Text color="$gray10" fontSize="$4" textAlign="center">
                            Successfully paid Lightning invoice
                        </Text>
                    </YStack>

                    <YStack
                        width="100%"
                        borderWidth={1}
                        borderColor="$color4"
                        rounded="$4"
                        overflow="hidden"
                    >
                        <XStack justify="space-between" items="center" p="$4">
                            <Text color="$gray10">Amount Paid</Text>
                            <Text fontWeight="800" fontSize="$6">₿{amount} sats</Text>
                        </XStack>

                        <View height={1} bg="$color4" />

                        <XStack justify="space-between" items="center" p="$4">
                            <Text color="$gray10">Fee Reserve</Text>
                            <Text fontWeight="600" color="$orange10">~{feeReserve} sats</Text>
                        </XStack>

                        <View height={1} bg="$color4" />

                        <XStack justify="space-between" items="center" p="$4">
                            <XStack gap="$2" items="center">
                                <Zap size={16} color="$green10" />
                                <Text color="$gray10">Status</Text>
                            </XStack>
                            <XStack bg="$green3" px="$3" py="$1" rounded="$3">
                                <Text color="$green10" fontWeight="700" fontSize="$2">PAID</Text>
                            </XStack>
                        </XStack>
                    </YStack>
                </>
            ) : (
                <>
                    <View bg="$red4" p="$5" rounded="$12">
                        <XCircle size={48} color="$red10" strokeWidth={2} />
                    </View>

                    <YStack items="center" gap="$2">
                        <Text fontSize="$8" fontWeight="800">Payment Failed</Text>
                        <Text color="$gray10" fontSize="$4" textAlign="center" px="$4">
                            {error || 'The Lightning payment could not be completed.'}
                        </Text>
                    </YStack>
                </>
            )}

            <YStack width="100%" gap="$3" pt="$4">
                <Button
                    theme="accent"
                    size="$5"
                    fontWeight="800"
                    onPress={onClose}
                >
                    Done
                </Button>
            </YStack>
        </YStack>
    );
}
