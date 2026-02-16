import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, Circle, View, Separator, ScrollView } from "tamagui";
import { Check, X, ArrowDownLeft, AlertCircle, CheckCircle2, Copy } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuery } from '@tanstack/react-query';
import { bitcoinService } from '../../services/bitcoinService';
import { currencyService, CurrencyCode } from '../../services/currencyService';

interface ReceiveResultStageProps {
    status: 'success' | 'error';
    amount: string;
    token?: string;
    mintUrl?: string;
    error?: string | null;
    onClose: () => void;
    title?: string;
}

export function ReceiveResultStage({
    status,
    amount,
    token,
    mintUrl,
    error,
    onClose,
    title = 'Receive Result'
}: ReceiveResultStageProps) {
    const isSuccess = status === 'success';
    const { secondaryCurrency } = useSettingsStore();

    const { data: btcData } = useQuery({
        queryKey: ['bitcoinPrice', secondaryCurrency],
        queryFn: () => bitcoinService.fetchPrice(secondaryCurrency),
        staleTime: 30000,
    });

    useEffect(() => {
        if (isSuccess) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [status]);

    const statusConfig = isSuccess
        ? { color: '$green10', icon: CheckCircle2, label: 'Success', subLabel: 'Ecash added to your wallet' }
        : { color: '$red10', icon: AlertCircle, label: 'Failed', subLabel: error || 'An error occurred' };

    return (
        <YStack flex={1} bg="$background">

            <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 100 }} showsVerticalScrollIndicator={false}>
                {/* Amount Display */}
                <YStack gap="$1" mb="$8" mt="$4">
                    <XStack items="center">
                        <Text fontSize={32} fontWeight="900" color={isSuccess ? '$green11' : '$red10'}>
                            {isSuccess ? '+' : ''}₿{Number(amount).toLocaleString()}
                        </Text>
                    </XStack>
                    <Text fontSize="$5" color="$gray10" fontWeight="600">
                        {btcData?.price
                            ? currencyService.formatValue(currencyService.convertSatsToCurrency(Number(amount), btcData.price), secondaryCurrency as CurrencyCode)
                            : '$0.00'
                        }
                    </Text>
                </YStack>

                {/* Status Timeline Card */}
                <YStack bg="$gray2" rounded="$4" p="$4" mb="$8">
                    <Text fontSize="$1" color="$gray10" fontWeight="700" mb="$2" textTransform='uppercase' letterSpacing={1}>
                        {isSuccess ? 'Transaction Complete' : 'Transaction Failed'}
                    </Text>
                    <Text fontSize="$5" fontWeight="900" color={isSuccess ? "$green10" : "$red10"} mb="$4">
                        {isSuccess ? 'RECEIVED' : 'ERROR'}
                    </Text>

                    <YStack>
                        {/* Step 1: Prepared (Always Green for Receive) */}
                        <XStack gap="$3">
                            <YStack items="center">
                                <Circle size={24} bg="$green10">
                                    <Check size={14} color="black" />
                                </Circle>
                                <View width={2} flex={1} bg={isSuccess ? "$green10" : "$gray8"} my="$1" />
                            </YStack>
                            <YStack pb="$4">
                                <Text fontSize="$4" fontWeight="700" color="$color">Token Decoded</Text>
                                <Text fontSize="$3" color="$gray10">Valid Ecash token found</Text>
                            </YStack>
                        </XStack>

                        {/* Step 2: Final Status */}
                        <XStack gap="$3">
                            <Circle size={24} bg={isSuccess ? "$green10" : "$red10"} items="center" justify="center">
                                {isSuccess ? <Check size={14} color="black" /> : <X size={14} color="white" />}
                            </Circle>
                            <YStack>
                                <Text fontSize="$4" fontWeight="700" color="$color">{statusConfig.label}</Text>
                                <Text fontSize="$3" color="$gray10">{statusConfig.subLabel}</Text>
                            </YStack>
                        </XStack>
                    </YStack>
                </YStack>

                {/* Details List */}
                <YStack gap="$0" mb="$8" p="$4" bg="$gray2" rounded="$4">
                    <DetailItem label="Total Amount" value={`${amount} sats`} />
                    <DetailItem label="Unit" value="SAT" />
                    <DetailItem
                        label="Mint"
                        value={mintUrl ? mintUrl.replace(/^https?:\/\//, '').split('/')[0] : 'Unknown'}
                    />
                    {token && (
                        <DetailItem
                            label="Token"
                            value={`${token.substring(0, 8)}...${token.substring(token.length - 8)}`}
                            isCopyable
                            onCopy={async () => {
                                await ExpoClipboard.setStringAsync(token);
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            }}
                        />
                    )}
                    {error && (
                        <DetailItem label="Error Details" value={error} color="$red10" />
                    )}
                </YStack>
            </ScrollView>

            {/* Bottom Action */}
            <YStack position="absolute" b={0} l={0} r={0} p="$4" bg="$background" borderTopWidth={1} borderColor="$gray3">
                <Button
                    bg={isSuccess ? "$green10" : "$red10"}
                    size="$5"
                    onPress={onClose}
                    fontWeight="800"
                    color="white"
                    rounded="$4"
                >
                    {isSuccess ? 'DONE' : 'CLOSE'}
                </Button>
            </YStack>
        </YStack>
    );
}

function DetailItem({ label, value, color, isCopyable, onCopy }: { label: string, value: string, color?: any, isCopyable?: boolean, onCopy?: () => void }) {
    return (
        <XStack justify="space-between" items="center" py="$3" borderBottomWidth={1} borderColor="$gray3">
            <Text fontSize="$4" color="$gray10" fontWeight="500">{label}</Text>
            <XStack gap="$2" items="center">
                <Text fontSize="$4" fontWeight="700" color={color || "$color"} numberOfLines={1} style={{ maxWidth: 200 }}>
                    {value}
                </Text>
                {isCopyable && (
                    <Button size="$2" chromeless icon={<Copy size={14} color="$gray10" />} onPress={onCopy} />
                )}
            </XStack>
        </XStack>
    );
}
