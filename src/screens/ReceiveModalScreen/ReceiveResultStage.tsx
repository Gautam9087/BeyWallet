import React, { useEffect, useState, useRef, useMemo } from 'react';
import { Spinner, YStack, XStack, Text, Button, Circle, View, Separator, ScrollView } from "tamagui";
import { Check, X, ArrowDownLeft, AlertCircle, CheckCircle2, Copy, Share2, Gauge, ZoomIn, Hexagon, ArrowDown, Clock } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import * as ExpoClipboard from 'expo-clipboard';
import { Stack, useRouter } from 'expo-router';
import { useSettingsStore } from '../../store/settingsStore';
import { useQuery } from '@tanstack/react-query';
import { bitcoinService } from '../../services/bitcoinService';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import QRCode from 'react-native-qrcode-svg';
import { UR, UREncoder } from "@gandlaf21/bc-ur";
import { Buffer } from 'buffer';
import { cleanToken, decodeToken, encodeTokenV4, encodeTokenV3 } from '../../services/core';
import { Share as RNShare } from 'react-native';
import { useToastController } from '@tamagui/toast';

// Ensure Buffer is available globally
if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
}

interface ReceiveResultStageProps {
    status: 'success' | 'error';
    amount: string;
    token?: string;
    mintUrl?: string;
    error?: string | null;
    isReceiveLater?: boolean;
    isLoading?: boolean;
    onClose: () => void;
    onClaimNow?: () => void;
    title?: string;
}

export function ReceiveResultStage({
    status,
    amount,
    token,
    mintUrl,
    error,
    isReceiveLater,
    isLoading,
    onClose,
    onClaimNow,
    title = 'Receive Result'
}: ReceiveResultStageProps) {
    const isSuccess = status === 'success';
    const { secondaryCurrency } = useSettingsStore();
    const router = useRouter();
    const toast = useToastController();
    const [copied, setCopied] = useState(false);

    // Filtered states
    const [currentToken] = useState<string>(token || '');

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

    const handleCopy = async () => {
        if (currentToken) {
            await ExpoClipboard.setStringAsync(currentToken);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCopied(true);
            toast.show('Copied!', { message: 'Token copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    if (!isSuccess) {
        return (
            <YStack flex={1} justify="center" items="center" gap="$4" p="$4" bg="$background">
                <AlertCircle size={80} color="$red10" />
                <Text color="$red10" fontSize="$6" fontWeight="700" text="center">Receive Failed</Text>
                <Text color="$gray10" fontSize="$4" text="center" px="$4">{error || 'An error occurred while receiving the token.'}</Text>
                <Button theme="accent" size="$5" width="100%" onPress={onClose} mt="$4">Go Back</Button>
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg="$background">
            <Stack.Screen options={{ title: isReceiveLater ? 'Token Saved' : title }} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1, paddingBottom: 150 } as any}
                px="$0"
            >
                {/* 1. Amount Display */}
                <YStack gap="$1" mb="$6" mt="$8" items="center">
                    <Circle size={40} bg="$green10" items="center" justify="center">
                        <ArrowDownLeft size={20} color="white" />
                    </Circle>
                    <Text fontSize={48} fontWeight="900" color="$green11">
                        +₿{Number(amount || 0).toLocaleString()}
                    </Text>
                    <Text fontSize="$6" color="$gray10" fontWeight="600">
                        Ecash SATS
                    </Text>
                </YStack>

                {/* 2. Status Timeline Card */}
                <YStack mx="$4" bg="$gray2" rounded="$4" p="$4" mb="$6">
                    <Text fontSize="$1" color="$gray10" fontWeight="700" mb="$2" textTransform='uppercase' letterSpacing={1}>
                        {isReceiveLater ? 'SAVED FOR LATER' : 'TRANSACTION COMPLETE'}
                    </Text>
                    <Text fontSize="$5" fontWeight="900" color={isReceiveLater ? "$orange10" : "$green10"} mb="$4">
                        {isReceiveLater ? 'UNCLAIMED' : 'RECEIVED'}
                    </Text>

                    <YStack>
                        <XStack gap="$3">
                            <YStack items="center">
                                <Circle size={24} bg="$green10">
                                    <Check size={14} color="black" />
                                </Circle>
                                <View width={2} flex={1} bg={!isReceiveLater ? "$green10" : "$gray8"} my="$1" />
                            </YStack>
                            <YStack pb="$4">
                                <Text fontSize="$4" fontWeight="700" color="$color">Token Valid</Text>
                                <Text fontSize="$3" color="$gray10">Verification successful</Text>
                            </YStack>
                        </XStack>

                        <XStack gap="$3">
                            <Circle size={24} bg={isReceiveLater ? "$orange10" : "$green10"} items="center" justify="center">
                                {isReceiveLater ? <Clock size={14} color="black" /> : <CheckCircle2 size={14} color="black" />}
                            </Circle>
                            <YStack>
                                <Text fontSize="$4" fontWeight="700" color="$color">{isReceiveLater ? 'Saved to History' : 'Added to Wallet'}</Text>
                                <Text fontSize="$3" color="$gray10">{isReceiveLater ? 'You can claim this later from History' : 'Funds are now spendable'}</Text>
                            </YStack>
                        </XStack>
                    </YStack>
                </YStack>

                {/* 3. Details Table */}
                <YStack gap="$0" mx="$4" mb="$6" bg="$gray2" rounded="$5" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                    <DetailItem label="Total Amount" value={`₿${amount} sats`} />
                    <DetailItem label="Unit" value="SATOSHIS" />
                    <DetailItem label="Fiat" value={btcData?.price ? currencyService.formatValue(currencyService.convertSatsToCurrency(Number(amount), btcData.price), secondaryCurrency as CurrencyCode) : '...'} />
                    <DetailItem label="Mint" value={mintUrl ? mintUrl.replace(/^https?:\/\//, '').split('/')[0] : 'Unknown'} />
                </YStack>

                {/* 4. Action Buttons (If Receive Later) */}
                {isReceiveLater && currentToken && (
                    <YStack px="$4" gap="$2" mb="$8">
                        <Button
                            onPress={onClaimNow}
                            bg="$accent10"
                            color="white"
                            size="$5"
                            height={55}
                            rounded="$4"
                            fontWeight="800"
                            disabled={isLoading}
                            icon={isLoading ? <Spinner size="small" color="white" /> : <ArrowDownLeft size={20} color="white" />}
                        >
                            CLAIM NOW
                        </Button>
                        <Button
                            onPress={handleCopy}
                            size="$5"
                            height={55}
                            rounded="$4"
                            bg="$gray3"
                            color="$color"
                            fontWeight="800"
                            icon={copied ? <Check size={20} /> : <Copy size={20} />}
                        >
                            {copied ? 'Copied!' : 'Copy Token'}
                        </Button>
                    </YStack>
                )}
            </ScrollView>

            {/* Final Done Button (Only if not receive later OR if not busy claiming) */}
            <YStack position="absolute" b={0} l={0} r={0} p="$4" bg="$background" borderTopWidth={1} borderColor="$gray3">
                <Button
                    bg={isReceiveLater ? "$gray3" : "$green10"}
                    size="$5"
                    height={50}
                    onPress={onClose}
                    fontWeight="800"
                    color={isReceiveLater ? "$color" : "white"}
                    rounded="$4"
                    disabled={isLoading}
                >
                    DONE
                </Button>
            </YStack>
        </YStack>
    );
}

function DetailItem({ label, value, isCopyable, onCopy }: { label: string, value: string, isCopyable?: boolean, onCopy?: () => void }) {
    return (
        <XStack justify="space-between" items="center" py="$3" px="$4">
            <Text fontSize="$4" color="$gray10" fontWeight="600">{label}</Text>
            <XStack gap="$2" items="center">
                <Text fontSize="$5" fontWeight="800" color="$color" numberOfLines={1} style={{ maxWidth: 200 }}>
                    {value}
                </Text>
                {isCopyable && (
                    <Button size="$2" chromeless icon={<Copy size={16} color="$gray10" />} onPress={onCopy} />
                )}
            </XStack>
        </XStack>
    );
}

