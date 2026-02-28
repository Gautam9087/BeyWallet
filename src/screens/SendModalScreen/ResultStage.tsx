import React, { useEffect, useState, useRef, useMemo } from 'react';
import { YStack, XStack, Text, Button, Separator, View, Circle, H2, ScrollView } from "tamagui";
import { Copy, Share2, ArrowUpRight, ArrowUpDown, Building2, DollarSign, Layout, Zap, Check, RotateCcw, XCircle, Gauge, ZoomIn, Hexagon, AlertCircle } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { useRouter, Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Share as RNShare } from 'react-native';
import { useToastController } from '@tamagui/toast';

import { Spinner } from '../../components/UI/Spinner';
import { Buffer } from 'buffer';
import { UR, UREncoder } from "@gandlaf21/bc-ur";
import { useSettingsStore } from '../../store/settingsStore';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { bitcoinService } from '../../services/bitcoinService';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import { cleanToken, decodeToken, encodePeanut, encodeTokenV4, encodeTokenV3, eventService, proofService, initService } from '../../services/core';
import { notificationService } from '../../services/notificationService';

// Ensure Buffer is available globally
if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
}

interface ResultStageProps {
    status: 'success' | 'error';
    amount: string;
    token?: string | null;
    mintUrl?: string;
    fee?: number;
    operationId?: string;
    error?: string | null;
    onClose: () => void;
    onReclaim?: () => void;
    title?: string;
}

export function ResultStage({
    status,
    amount,
    token,
    mintUrl,
    fee = 0,
    operationId,
    error,
    onClose,
    onReclaim,
    title = 'Pending Ecash'
}: ResultStageProps) {
    const isSuccess = status === 'success';
    const toast = useToastController();
    const router = useRouter();
    const queryClient = useQueryClient();
    const { secondaryCurrency } = useSettingsStore();

    const [copied, setCopied] = useState(false);
    const [isReclaiming, setIsReclaiming] = useState(false);
    const [isClaimed, setIsClaimed] = useState(false);

    // Animated QR states
    const [currentToken, setCurrentToken] = useState<string>(token || '');
    const [qrCodeFragment, setQrCodeFragment] = useState<string>(token || '');
    const [showAnimatedQR, setShowAnimatedQR] = useState(false);
    const [fragmentLength, setFragmentLength] = useState(150); // L=150, M=100, S=50
    const [intervalMs, setIntervalMs] = useState(140); // F=140, M=250, S=500
    const encoderRef = useRef<UREncoder | null>(null);
    const [tokenVersion, setTokenVersion] = useState<'V3' | 'V4'>(token?.startsWith('cashuB') ? 'V4' : 'V3');

    const { data: btcData } = useQuery({
        queryKey: ['bitcoinPrice', secondaryCurrency],
        queryFn: () => bitcoinService.fetchPrice(secondaryCurrency),
        staleTime: 30000,
    });

    // 1. Setup QR logic (same as TransactionDetails)
    useEffect(() => {
        if (!isSuccess || !currentToken) return;

        try {
            const clean = cleanToken(currentToken);
            const decoded = decodeToken(clean) as any;
            const proofs = decoded.token?.[0]?.proofs || [];

            const shouldAnimate = proofs.length > 2 || clean.length > 400;

            if (shouldAnimate) {
                setShowAnimatedQR(true);
                // External wallets (like cashu_pwa) expect the UR payload to be CBOR encoded
                const { encode: cborEncode } = require('cbor-x');
                const cborBuffer = cborEncode(clean);
                const ur = new UR(Buffer.from(cborBuffer), "cashu");
                encoderRef.current = new UREncoder(ur, fragmentLength, 0);
                setQrCodeFragment(encoderRef.current.nextPart());
            } else {
                setShowAnimatedQR(false);
                setQrCodeFragment(currentToken);
            }
        } catch (e) {
            console.error('[ResultStage] Failed to setup QR:', e);
            setShowAnimatedQR(false);
            setQrCodeFragment(currentToken);
        }
    }, [currentToken, isSuccess, fragmentLength]);

    useEffect(() => {
        if (!showAnimatedQR || !encoderRef.current) return;

        const interval = setInterval(() => {
            setQrCodeFragment(encoderRef.current!.nextPart());
        }, intervalMs);

        return () => clearInterval(interval);
    }, [showAnimatedQR, intervalMs]);

    // 2. Automated State Monitoring
    useEffect(() => {
        if (!isSuccess || !currentToken || !operationId) return;

        console.log('[ResultStage] Starting automated state monitoring for:', operationId);

        let isNavigating = false;

        const handleSuccess = () => {
            if (isNavigating) return;
            isNavigating = true;

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show('Claimed!', { message: 'The recipient has claimed your ecash' });
            if (useSettingsStore.getState().notificationsEnabled) {
                notificationService.sendLocalNotification('Claimed!', 'The recipient has claimed your ecash', { operationId });
            }

            // Invalidate queries to prevent infinite spinner on TransactionDetails
            queryClient.invalidateQueries({ queryKey: ['history'] });
            queryClient.invalidateQueries({ queryKey: ['transaction', operationId] });

            // Navigate to transaction details after a short delay
            setTimeout(() => {
                console.log('[ResultStage] Navigating to transaction details for:', operationId);
                router.replace(`/(modals)/transaction-details?id=${operationId}`);
            }, 300);
        };

        // Listen for history updates
        const unsubHistory = eventService.on('history:updated', (payload: any) => {
            if (payload.id === operationId && payload.state === 'claimed') {
                handleSuccess();
            }
        });

        // Fallback: poll proof state every 8 seconds
        const interval = setInterval(async () => {
            try {
                const states = await proofService.checkProofStates(currentToken);
                const isSpent = states.some((s: any) => s.state === 'SPENT');
                if (isSpent) {
                    console.log('[ResultStage] Polling detected SPENT state');
                    handleSuccess();
                }
            } catch (err) {
                console.warn('[ResultStage] Polling state check failed:', err);
            }
        }, 8000);

        return () => {
            unsubHistory();
            clearInterval(interval);
        };
    }, [isSuccess, currentToken, operationId]);

    const handleCopy = async () => {
        if (currentToken) {
            await Clipboard.setStringAsync(currentToken);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setCopied(true);
            toast.show('Copied!', { message: 'Token copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleShare = async () => {
        if (!currentToken) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const shareText = `cashu:${currentToken}`;
        try {
            await RNShare.share({ message: shareText });
        } catch (error) {
            console.error('[ResultStage] Error sharing:', error);
            handleCopy();
        }
    };


    const handleToggleVersion = () => {
        if (!currentToken) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const decoded = decodeToken(currentToken);
            if (tokenVersion === 'V3') {
                const encodedV4 = encodeTokenV4(decoded);
                setCurrentToken(encodedV4);
                setTokenVersion('V4');
                toast.show('Switched to V4', { message: 'Using compact CBOR encoding' });
            } else {
                const encodedV3 = encodeTokenV3(decoded);
                setCurrentToken(encodedV3);
                setTokenVersion('V3');
                toast.show('Switched to V3', { message: 'Using standard JSON encoding' });
            }
        } catch (e) {
            console.error('[ResultStage] Failed to toggle version:', e);
            toast.show('Error', { message: 'Failed to switch token version' });
        }
    };

    const handleReclaim = async () => {
        if (onReclaim) {
            setIsReclaiming(true);
            try {
                await onReclaim();
                toast.show('Reclaimed!', { message: 'Funds returned to your wallet' });
                onClose();
            } catch (e: any) {
                toast.show('Failed', { message: e.message });
            } finally {
                setIsReclaiming(false);
            }
        }
    };

    const changeSpeed = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (intervalMs === 250) setIntervalMs(500);
        else if (intervalMs === 500) setIntervalMs(140);
        else setIntervalMs(250);
    };

    const changeSize = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        if (fragmentLength === 100) setFragmentLength(50);
        else if (fragmentLength === 50) setFragmentLength(150);
        else setFragmentLength(100);
    };

    const speedLabel = intervalMs === 140 ? "F" : intervalMs === 250 ? "M" : "S";
    const sizeLabel = fragmentLength === 150 ? "L" : fragmentLength === 100 ? "M" : "S";

    if (!isSuccess) {
        return (
            <YStack flex={1} justify="center" items="center" gap="$4" p="$4" bg="$background">
                <XCircle size={80} color="$red10" />
                <Text color="$red10" fontSize="$6" fontWeight="700" text="center">Send Failed</Text>
                <Text color="$gray10" fontSize="$4" text="center" px="$4">{error || 'An error occurred while creating the token.'}</Text>
                <Button theme="accent" size="$5" width="100%" onPress={onClose} mt="$4">Go Back</Button>
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg="$background">
            <Stack.Screen options={{ title: title }} />
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ flexGrow: 1 } as any}
                px="$0"
            >

                {/* 2. QR Code (matching TransactionDetails) */}
                <YStack items="center" gap="$4" mb="$6">
                    <View
                        bg="white"
                        p="$2"
                        rounded="$5"
                    >
                        {(!showAnimatedQR && currentToken && currentToken.length > 400) ? (
                            <YStack width={330} height={330} items="center" justify="center">
                                <Spinner size="large" color="$color" />
                            </YStack>
                        ) : (
                            <QRCode
                                value={showAnimatedQR ? qrCodeFragment : (currentToken.startsWith('cashu:') ? currentToken : `cashu:${currentToken}`)}
                                size={330}
                                backgroundColor="white"
                                color="black"
                                quietZone={10}
                            />
                        )}
                    </View>

                    <XStack gap="$1.5" bg="$color3" px="$4" py="$2" rounded="$10" flexWrap="wrap" justify="center">
                        {showAnimatedQR && (
                            <>
                                <Button size="$2.5" chromeless icon={<Gauge size={16} />} onPress={changeSpeed} color="$color" fontWeight="700">{speedLabel}</Button>
                                <Separator vertical height={15} style={{ alignSelf: 'center' }} borderColor="$gray8" />
                                <Button size="$2.5" chromeless icon={<ZoomIn size={16} />} onPress={changeSize} color="$color" fontWeight="700">{sizeLabel}</Button>
                                <Separator vertical height={15} style={{ alignSelf: 'center' }} borderColor="$gray8" />
                            </>
                        )}
                        <Button size="$2.5" chromeless icon={<Hexagon size={16} />} onPress={handleToggleVersion} color="$color" fontWeight="700">{tokenVersion}</Button>
                    </XStack>
                </YStack>





                {/* 3. Details Table (matching TransactionDetails) */}
                <YStack gap="$0" mb="$6" bg="$gray2" rounded="$5" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                    <DetailItem label="Amount" value={`₿${amount} sats`} />
                    <DetailItem label="Fee" value={`₿${fee} sats`} />
                    <DetailItem label="Unit" value="SATOSHIS" />
                    <DetailItem label="Fiat" value={btcData?.price ? currencyService.formatValue(currencyService.convertSatsToCurrency(Number(amount), btcData.price), secondaryCurrency as CurrencyCode) : '...'} />
                    <DetailItem label="Mint" value={mintUrl ? mintUrl.replace(/^https?:\/\//, '').split('/')[0] : 'Unknown'} />
                </YStack>

                {/* 4. Action Buttons */}
                <YStack mt="auto" pb="$8">
                    <XStack gap="$2" width="100%">
                        {onReclaim && (
                            <Button
                                flex={1}
                                onPress={handleReclaim}
                                theme="gray"
                                size="$5"
                                fontWeight="800"
                                icon={isReclaiming ? <Spinner size="small" /> : <RotateCcw size={18} />}
                                disabled={isReclaiming}
                            >
                                {isReclaiming ? '' : 'Reclaim'}
                            </Button>
                        )}
                        <Button
                            flex={1}
                            onPress={handleShare}
                            theme="gray"
                            size="$5"
                            fontWeight="800"
                            icon={<Share2 size={18} />}
                        />
                        <Button
                            flex={2}
                            onPress={handleCopy}
                            size="$5"
                            theme="accent"
                            fontWeight="800"
                            icon={copied ? <Check size={18} /> : <Copy size={18} />}
                        >
                            {copied ? 'Copied!' : 'Copy Token'}
                        </Button>
                    </XStack>
                </YStack>
            </ScrollView>
        </YStack>
    );

}

function DetailItem({ label, value, isCopyable, copyValue, onCopy }: { label: string, value: string, isCopyable?: boolean, copyValue?: string, onCopy?: () => void }) {
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
