import React, { useState, useMemo, useEffect, useRef } from 'react';
import { YStack, XStack, Text, Button, ScrollView, View, Separator, Circle, Popover, ListItem, Adapt, Sheet, Square } from 'tamagui';
import { ChevronLeft, RefreshCw, Copy, Share2, ArrowUpRight, ArrowDownLeft, Calendar, Coins, Zap, ShieldCheck, ExternalLink, AlertCircle, CheckCircle2, Check, RotateCcw, MoreHorizontal, Link, Contact2, Scan, Trash2, Gauge, ZoomIn, Hexagon, History, X, Ban, CheckCircle } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import * as Sharing from 'expo-sharing';
import { Share as RNShare } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { UR, UREncoder } from "@gandlaf21/bc-ur";
import { Buffer } from 'buffer';
import { formatFullLocalTime, formatRelativeTime } from '~/utils/time';
import { historyService, initService, proofService, cleanToken, decodeToken, encodeToken, encodePeanut, encodeTokenV4, encodeTokenV3 } from '~/services/core';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '~/store/settingsStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spinner } from '~/components/UI/Spinner';
import { useToastController } from '@tamagui/toast';

// Ensure Buffer is available globally
if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
}

interface HistoryEntry {
    id: string;
    type: 'send' | 'receive' | 'mint' | 'melt';
    amount: number;
    unit: string;
    mintUrl: string;
    state?: string;
    createdAt: number;
    metadata?: any;
    token?: any;
}

export function TransactionDetailsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const toast = useToastController();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { secondaryCurrency } = useSettingsStore();

    const { data: entry, refetch, isRefetching } = useQuery({
        queryKey: ['transaction', id],
        queryFn: async () => {
            const history = await historyService.getHistory(100, 0);
            return history.find((e: any) => e.id === id) as HistoryEntry | undefined;
        },
        enabled: !!id,
    });

    const [token, setToken] = useState<string>('');

    useEffect(() => {
        if (!entry) return;

        // Priority 1: Token in metadata (already encoded string)
        if (entry.metadata?.token) {
            if (typeof entry.metadata.token === 'string') {
                setToken(entry.metadata.token);
            } else {
                try {
                    const encoded = encodeToken(entry.metadata.token);
                    setToken(encoded);
                } catch (e) {
                    console.warn('[TransactionDetails] Failed to encode metadata token:', e);
                }
            }
            return;
        }

        // Priority 2: Token object in entry (needs encoding)
        if (entry.token) {
            try {
                // Ensure we have a valid token object or string
                const encoded = typeof entry.token === 'string'
                    ? entry.token
                    : encodeToken(entry.token);
                setToken(encoded);
            } catch (e) {
                console.warn('[TransactionDetails] Failed to encode token from entry:', e);
            }
        }
    }, [entry]);

    const status = entry?.state || 'completed';

    // Animated QR states
    const [qrCodeFragment, setQrCodeFragment] = useState<string>('');
    const [showAnimatedQR, setShowAnimatedQR] = useState(false);
    const [fragmentLength, setFragmentLength] = useState(150); // L=150, M=100, S=50
    const [intervalMs, setIntervalMs] = useState(140); // F=140, M=250, S=500
    const encoderRef = useRef<UREncoder | null>(null);
    const [tokenVersion, setTokenVersion] = useState<'V3' | 'V4'>(token?.startsWith('cashuB') ? 'V4' : 'V3');

    // Initialize/Update token version and fragment when token changes
    useEffect(() => {
        if (token) {
            setTokenVersion(token.startsWith('cashuB') ? 'V4' : 'V3');
            if (!showAnimatedQR) {
                setQrCodeFragment(token);
            }
        }
    }, [token]);

    useEffect(() => {
        if (!token) return;

        try {
            const clean = cleanToken(token);
            const decoded = decodeToken(clean) as any;
            const proofs = decoded.token?.[0]?.proofs || [];

            // Animate if the token is large (>400 chars) or has more than 2 proofs
            const shouldAnimate = proofs.length > 2 || clean.length > 400;

            if (shouldAnimate) {
                setShowAnimatedQR(true);
                const messageBuffer = Buffer.from(clean);
                const ur = UR.fromBuffer(messageBuffer);
                encoderRef.current = new UREncoder(ur, fragmentLength, 0);
            } else {
                setShowAnimatedQR(false);
                setQrCodeFragment(token);
            }
        } catch (e) {
            console.error('[TransactionDetails] Failed to setup QR:', e);
            setShowAnimatedQR(false);
            setQrCodeFragment(token);
        }
    }, [token, fragmentLength]);

    useEffect(() => {
        if (!showAnimatedQR || !encoderRef.current) return;

        const interval = setInterval(() => {
            setQrCodeFragment(encoderRef.current!.nextPart());
        }, intervalMs);

        return () => clearInterval(interval);
    }, [showAnimatedQR, intervalMs]);

    const statusConfig = useMemo(() => {
        if (status === 'claimed' || status === 'completed' || entry?.type === 'receive' || entry?.type === 'mint') {
            return { color: '$green10', bg: '$green3', headerBg: '$green9', icon: CheckCircle2, label: 'Success' };
        }
        if (status === 'pending' || status === 'unclaimed') {
            return { color: '$orange10', bg: '$orange3', headerBg: '$orange9', icon: RefreshCw, label: 'Pending' };
        }
        if (status === 'failed' || status === 'error') {
            return { color: '$red10', bg: '$red3', headerBg: '$red9', icon: AlertCircle, label: 'Failed' };
        }
        return { color: '$gray10', bg: '$gray3', headerBg: '$gray9', icon: AlertCircle, label: status };
    }, [status, entry?.type]);

    const title = useMemo(() => {
        if (!entry) return '';
        switch (entry.type) {
            case 'send': return 'Send Ecash';
            case 'receive': return 'Receive Ecash';
            case 'mint': return 'Mint Ecash';
            case 'melt': return 'Melt Ecash';
            default: return 'Transaction';
        }
    }, [entry]);


    const handleCopyToken = async () => {
        if (token) {
            await Clipboard.setStringAsync(token);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast.show('Copied!', { message: 'Token copied to clipboard' });
        }
    };

    const handleCopyEmoji = async () => {
        if (token) {
            const peanut = encodePeanut(cleanToken(token));
            await Clipboard.setStringAsync(peanut);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toast.show('Copied as Emoji!', { message: 'Peanut token copied to clipboard' });
        }
    };

    const handleShare = async () => {
        if (!token) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const shareText = `cashu:${token}`;
        try {
            await RNShare.share({ message: shareText });
        } catch (error) {
            console.error('[TransactionDetails] Error sharing:', error);
            handleCopyToken();
        }
    };

    const handleToggleVersion = () => {
        if (!token) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const decoded = decodeToken(token);
            if (tokenVersion === 'V3') {
                const encodedV4 = encodeTokenV4(decoded);
                setToken(encodedV4);
                setTokenVersion('V4');
                toast.show('Switched to V4', { message: 'Using compact CBOR encoding' });
            } else {
                const encodedV3 = encodeTokenV3(decoded);
                setToken(encodedV3);
                setTokenVersion('V3');
                toast.show('Switched to V3', { message: 'Using standard JSON encoding' });
            }
        } catch (e) {
            console.error('[TransactionDetails] Failed to toggle version:', e);
            toast.show('Error', { message: 'Failed to switch token version' });
        }
    };

    const handleRefresh = async () => {
        if (isRefetching) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (token) {
            try {
                const states = await proofService.checkProofStates(token);
                const isSpent = states.some((s: any) => s.state === 'SPENT');
                const isPending = states.some((s: any) => s.state === 'PENDING');

                let newState = entry?.state;
                if (isSpent) newState = 'claimed';
                else if (isPending) newState = 'pending';
                else newState = 'unclaimed';

                if (entry && newState !== entry.state) {
                    await (initService.getRepo().historyRepository as any).updateHistoryEntryState(entry.id, newState);
                }
            } catch (err) {
                console.warn('[TransactionDetails] Failed to refresh proof states:', err);
            }
        }

        await refetch();
        queryClient.invalidateQueries({ queryKey: ['history'] });
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

    // Auto-refresh on mount if pending
    useEffect(() => {
        if (entry && (status === 'pending' || status === 'unclaimed') && entry.type === 'send' && initService.isInitialized()) {
            handleRefresh();
        }
    }, [entry?.id, entry?.state]);

    if (!entry) {
        return (
            <YStack flex={1} bg="$background" items="center" justify="center" p="$4">
                <Spinner size="large" />
                <Text mt="$4" color="$gray10">Loading transaction...</Text>
            </YStack>
        );
    }

    const speedLabel = intervalMs === 140 ? "F" : intervalMs === 250 ? "M" : "S";
    const sizeLabel = fragmentLength === 150 ? "L" : fragmentLength === 100 ? "M" : "S";

    const isOutgoing = entry.type === 'send' || entry.type === 'melt';
    const amountColor = isOutgoing ? '$red10' : '$green11';
    const amountSign = isOutgoing ? '-' : '+';

    // Status text formatting
    const formattedStatus = useMemo(() => {
        if (!status) return 'Unknown';
        return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }, [status]);

    return (

        <ScrollView p="$4" pb="$2" bg="$background" showsVerticalScrollIndicator={false}>
            {/* Header */}


            {/* Amount Display */}
            <YStack gap="$1" mb="$6" >
                <XStack items="center">
                    <Text fontSize="$9" fontWeight="800" color={amountColor}>
                        {amountSign}₿{entry.amount.toLocaleString()}
                    </Text>
                </XStack>
                <Text fontSize="$5" color="$gray10">
                    $0.00
                </Text>
            </YStack>

            {/* Timeline / Status Card */}
            <YStack bg="$gray2" rounded="$4" p="$4" mb="$6">
                <Text fontSize="$1" color="$gray10" fontWeight="700" mb="$2" textTransform='uppercase' letterSpacing={1}>
                    {entry.type} • {formattedStatus}
                </Text>
                <Text fontSize="$5" fontWeight="800" color="$orange10" mb="$4">
                    {formattedStatus.toUpperCase()}
                </Text>

                <YStack>
                    {/* Step 1: Prepared */}
                    <XStack gap="$3">
                        <YStack items="center">
                            <Circle size={24} bg="$green10">
                                <Check size={14} color="black" />
                            </Circle>
                            <View width={2} flex={1} bg={status === 'completed' || status === 'claimed' ? "$green10" : "$gray8"} my="$1" />
                        </YStack>
                        <YStack pb="$4">
                            <Text fontSize="$4" fontWeight="700" color="$color">Prepared</Text>
                            <Text fontSize="$3" color="$gray10">{formatFullLocalTime(entry.createdAt)}</Text>
                        </YStack>
                    </XStack>

                    {/* Step 2: Current Status */}
                    <XStack gap="$3">
                        <Circle size={24} bg={statusConfig.color as any} items="center" justify="center">
                            <statusConfig.icon size={14} color={status === 'completed' || status === 'claimed' ? "black" : "$color"} />
                        </Circle>
                        <YStack>
                            <Text fontSize="$4" fontWeight="700" color="$color">{formattedStatus}</Text>
                            <Text fontSize="$3" color="$gray10">
                                {status === 'pending' ? 'Waiting for recipient...' :
                                    status === 'claimed' ? 'Tokens claimed by recipient' :
                                        status === 'completed' ? 'Transaction completed' :
                                            'Token funds returned to your balance'}
                            </Text>
                        </YStack>
                    </XStack>
                </YStack>
            </YStack>



            {/* Details List */}
            <YStack gap="$0" mb="$6" p="$3" bg="$gray2" rounded="$4">
                <DetailItem label="Amount" value={`${entry.amount} ${entry.unit || 'sats'}`} />
                <DetailItem label="Date" value={formatFullLocalTime(entry.createdAt)} />
                <DetailItem label="Type" value={`${title} • ${entry.type === 'send' ? 'Send' : 'Receive'}`} />
                <DetailItem label="Status" value={formattedStatus} />
                <DetailItem label="Token" value={token && typeof token === 'string' ? `${token.substring(0, 10)}...${token.substring(token.length - 6)}` : 'N/A'} isCopyable copyValue={token} onCopy={handleCopyToken} />
                <DetailItem label="Mint" value={entry.mintUrl.replace(/^https?:\/\//, '').split('/')[0]} />
            </YStack>

            {token && typeof token === 'string' && (status === 'pending' || status === 'unclaimed') && entry.type === 'send' && (
                <YStack gap="$4" pb="$10" mt="$4">
                    <YStack items="center" gap="$4">
                        <View
                            bg="white"
                            p="$3"
                            rounded="$6"

                        >
                            <QRCode
                                value={showAnimatedQR ? (qrCodeFragment || 'cashu:') : (token.startsWith('cashu:') ? token : `cashu:${token}`)}
                                size={280}
                                backgroundColor="white"
                                color="black"
                                quietZone={10}
                            />
                        </View>

                        <XStack gap="$1.5" bg="$color3" px="$4" py="$2" rounded="$10" flexWrap="wrap" justify="center">
                            {showAnimatedQR && (
                                <>
                                    <Button
                                        size="$2.5"
                                        chromeless
                                        icon={<Gauge size={16} />}
                                        onPress={changeSpeed}
                                        color="$color"
                                        fontWeight="700"
                                    >
                                        {speedLabel}
                                    </Button>
                                    <Separator vertical height={15} style={{ alignSelf: 'center' }} borderColor="$gray8" />
                                    <Button
                                        size="$2.5"
                                        chromeless
                                        icon={<ZoomIn size={16} />}
                                        onPress={changeSize}
                                        color="$color"
                                        fontWeight="700"
                                    >
                                        {sizeLabel}
                                    </Button>
                                    <Separator vertical height={15} style={{ alignSelf: 'center' }} borderColor="$gray8" />
                                </>
                            )}
                            <Button
                                size="$2.5"
                                chromeless
                                icon={<Hexagon size={16} />}
                                onPress={handleToggleVersion}
                                color="$color"
                                fontWeight="700"
                            >
                                {tokenVersion}
                            </Button>
                        </XStack>
                    </YStack>

                    <XStack gap="$2">
                        <Button
                            flex={1}
                            bg="$gray3"
                            color="$color"
                            icon={<Copy size={18} />}
                            onPress={handleCopyToken}
                            fontWeight="800"
                        >
                            Copy
                        </Button>
                        <Button
                            flex={1}
                            bg="$gray3"
                            color="$color"
                            icon={<Share2 size={18} />}
                            onPress={handleShare}
                            fontWeight="800"
                        >
                            Share
                        </Button>
                    </XStack>
                </YStack>
            )}

            {token && typeof token === 'string' && (status === 'claimed' || status === 'completed') && (
                <YStack gap="$4" pb="$10" mt="$4">
                    <Button
                        bg="$gray3"
                        color="$color"
                        icon={<Copy size={18} />}
                        onPress={handleCopyToken}
                        fontWeight="800"
                    >
                        Copy Token
                    </Button>
                </YStack>
            )}


        </ScrollView>

    );
}

function DetailItem({ label, value, isCopyable, copyValue, onCopy }: { label: string, value: string, isCopyable?: boolean, copyValue?: string, onCopy?: () => void }) {
    return (
        <XStack justify="space-between" items="center" py="$3" borderBottomWidth={1} borderColor="$gray3">
            <Text fontSize="$4" color="$gray10" fontWeight="500">{label}</Text>
            <XStack gap="$2" items="center">
                <Text fontSize="$4" fontWeight="600" color="$color" numberOfLines={1} style={{ maxWidth: 200 }}>
                    {value}
                </Text>
                {isCopyable && (
                    <Button size="$2" chromeless icon={<Copy size={14} color="$gray10" />} onPress={onCopy} />
                )}
            </XStack>
        </XStack>
    );
}
