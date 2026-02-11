import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, H2, Separator, View, Popover, ListItem, Adapt, Sheet } from "tamagui";
import { Copy, Share, Zap, ArrowUpDown, Building2, DollarSign, Layout, MoreHorizontal, Link, Contact2, Trash2, Scan, Share2, Check, RotateCcw, XCircle, Gauge, ZoomIn } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useToastController } from '@tamagui/toast';
import { Spinner } from '../../components/UI/Spinner';
import { Buffer } from 'buffer';
import { UR, UREncoder } from "@gandlaf21/bc-ur";
import { getDecodedToken } from "@cashu/cashu-ts";
import { useSettingsStore } from '../../store/settingsStore';
import { useQuery } from '@tanstack/react-query';
import { bitcoinService } from '../../services/bitcoinService';
import { currencyService, CurrencyCode } from '../../services/currencyService';
import { cocoService } from '../../services/cocoService';
import { Hexagon } from "@tamagui/lucide-icons";

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
    const { secondaryCurrency } = useSettingsStore();

    const [copied, setCopied] = useState(false);
    const [isReclaiming, setIsReclaiming] = useState(false);

    // Animated QR states
    const [currentToken, setCurrentToken] = useState<string>(token || '');
    const [qrCodeFragment, setQrCodeFragment] = useState<string>(token || '');
    const [showAnimatedQR, setShowAnimatedQR] = useState(false);
    const [fragmentLength, setFragmentLength] = useState(150); // L=150, M=100, S=50
    const [intervalMs, setIntervalMs] = useState(140); // F=140, M=250, S=500
    const encoderRef = React.useRef<UREncoder | null>(null);
    const [tokenVersion, setTokenVersion] = useState<'V3' | 'V4'>(token?.startsWith('cashuB') ? 'V4' : 'V3');

    const { data: btcData } = useQuery({
        queryKey: ['bitcoinPrice', secondaryCurrency],
        queryFn: () => bitcoinService.fetchPrice(secondaryCurrency),
        staleTime: 30000,
    });

    useEffect(() => {
        if (!isSuccess || !currentToken) return;

        try {
            // Normalize token (strip prefix for decoding)
            const cleanToken = cocoService._cleanToken(currentToken);
            const decoded = cocoService.decodeToken(cleanToken) as any;
            const proofs = decoded.token?.[0]?.proofs || [];

            // Animate if the token is large (>400 chars) or has more than 2 proofs
            // This ensures readability as static QR modules become too small for some cameras
            const shouldAnimate = proofs.length > 2 || cleanToken.length > 400;

            if (shouldAnimate) {
                setShowAnimatedQR(true);
                const messageBuffer = Buffer.from(cleanToken);
                const ur = UR.fromBuffer(messageBuffer);
                encoderRef.current = new UREncoder(ur, fragmentLength, 0);
            } else {
                setShowAnimatedQR(false);
                setQrCodeFragment(currentToken);
            }
        } catch (e) {
            console.error('Failed to decode token for QR:', e);
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
    }, [showAnimatedQR, intervalMs, fragmentLength]);

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

    useEffect(() => {
        if (isSuccess) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [status]);

    const handleCopy = async () => {
        if (currentToken) {
            await Clipboard.setStringAsync(currentToken);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCopied(true);
            toast.show('Copied!', { message: 'Token copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleCopyEmoji = async () => {
        if (currentToken) {
            const peanut = cocoService.encodeTokenPeanut(cocoService._cleanToken(currentToken));
            await Clipboard.setStringAsync(peanut);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            toast.show('Copied as Emoji!', { message: 'Peanut token copied to clipboard' });
        }
    };

    const handleToggleVersion = () => {
        if (!currentToken) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            const decoded = cocoService.decodeToken(currentToken);
            if (tokenVersion === 'V3') {
                const encodedV4 = cocoService.encodeTokenV4(decoded);
                setCurrentToken(encodedV4);
                setTokenVersion('V4');
                toast.show('Switched to V4', { message: 'Using compact CBOR encoding' });
            } else {
                const encodedV3 = cocoService.encodeTokenV3(decoded);
                setCurrentToken(encodedV3);
                setTokenVersion('V3');
                toast.show('Switched to V3', { message: 'Using standard JSON encoding' });
            }
        } catch (e) {
            console.error('Failed to toggle token version:', e);
            toast.show('Error', { message: 'Failed to switch token version' });
        }
    };

    const handleReclaim = async () => {
        if (onReclaim) {
            setIsReclaiming(true);
            await onReclaim();
            setIsReclaiming(false);
        }
    };

    const handleShare = async () => {
        if (!currentToken) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        const shareText = `cashu:${currentToken}`;

        try {
            const isAvailable = await Sharing.isAvailableAsync();
            if (isAvailable) {
                // expo-sharing works best with files, but for text we might use Share from react-native
                // or just Clipboard if Sharing.shareAsync isn't what we want for text.
                // However, since we are in a mobile app, let's use Share from react-native for better text sharing.
                const { Share: RNShare } = require('react-native');
                await RNShare.share({
                    message: shareText,
                });
            } else {
                handleCopy();
            }
        } catch (error) {
            console.error('Error sharing:', error);
            handleCopy();
        }
    };

    // Get mint display name
    const getMintDisplayName = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    if (!isSuccess) {
        return (
            <YStack flex={1} justify="center" items="center" gap="$4" p="$4">
                <XCircle size={80} color="$red10" />
                <Text color="$red10" fontSize="$6" fontWeight="700" text="center">
                    Send Failed
                </Text>
                <Text color="$gray10" fontSize="$4" text="center" px="$4">
                    {error || 'An error occurred while creating the token.'}
                </Text>
                <Button theme="accent" size="$5" width="100%" onPress={onClose}>
                    Go Back
                </Button>
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg="$background" >
            <Stack.Screen
                options={{
                    title: title,
                    headerRight: () => (
                        <Popover size="$5" allowFlip placement="bottom-end">
                            <Adapt when="sm" platform="touch">
                                <Sheet modal dismissOnSnapToBottom animation="bouncy">
                                    <Sheet.Frame pb="$5" bg="$color2">
                                        <Adapt.Contents />
                                    </Sheet.Frame>
                                    <Sheet.Overlay
                                        animation="lazy"
                                        enterStyle={{ opacity: 0 }}
                                        exitStyle={{ opacity: 0 }}
                                    />
                                </Sheet>
                            </Adapt>

                            <Popover.Trigger asChild>
                                <Button
                                    circular
                                    icon={<MoreHorizontal size={24} />}
                                    chromeless
                                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                                />
                            </Popover.Trigger>

                            <Popover.Content
                                borderWidth={1}
                                borderColor="$borderColor"
                                enterStyle={{ y: -10, opacity: 0, scale: 0.95 }}
                                exitStyle={{ y: -10, opacity: 0, scale: 0.95 }}
                                elevate
                                animation="quick"
                                p={0}
                                width={220}
                            >
                                <Popover.Arrow borderWidth={1} borderColor="$borderColor" />
                                <YStack>
                                    <ListItem
                                        icon={Link}
                                        title="Copy as Emoji"
                                        onPress={handleCopyEmoji}
                                        pressStyle={{ bg: '$backgroundHover' }}
                                    />
                                    <ListItem
                                        icon={Link}
                                        title="Link Share"
                                        onPress={() => { }}
                                        pressStyle={{ bg: '$backgroundHover' }}
                                    />
                                    <ListItem
                                        icon={Contact2}
                                        title="NFC Sharing"
                                        onPress={() => { }}
                                        pressStyle={{ bg: '$backgroundHover' }}
                                    />
                                    <ListItem
                                        icon={Scan}
                                        title="Scanning"
                                        onPress={() => { }}
                                        pressStyle={{ bg: '$backgroundHover' }}
                                    />
                                    <Separator />
                                    {onReclaim && (
                                        <ListItem
                                            icon={RotateCcw}
                                            title="Reclaim Token"
                                            onPress={handleReclaim}
                                            pressStyle={{ bg: '$backgroundHover' }}
                                        />
                                    )}
                                    <ListItem
                                        icon={Trash2}
                                        title="Delete"
                                        color="$red10"
                                        onPress={() => { }}
                                        pressStyle={{ bg: '$backgroundHover' }}
                                    />
                                </YStack>
                            </Popover.Content>
                        </Popover>
                    )
                }}
            />

            {/* QR Code Segment */}
            <YStack items="center" gap="$4" pt="$4">
                <View
                    bg="white"
                    p="$3"
                    rounded="$6"
                    style={{
                        elevation: 15,
                        shadowColor: "rgba(0,0,0,0.2)",
                        shadowOffset: { width: 0, height: 8 },
                        shadowOpacity: 1,
                        shadowRadius: 12
                    }}
                >
                    <QRCode
                        value={showAnimatedQR ? qrCodeFragment : (currentToken.startsWith('cashu:') ? currentToken : `cashu:${currentToken}`)}
                        size={300}
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

            {/* Amount Section */}
            <YStack items="center" gap="$0" py="$4">
                <H2 fontWeight="400" text="center">₿{Number(amount).toLocaleString()}</H2>
            </YStack>

            {/* Details Table */}
            <YStack gap="$4" px="$0">
                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <ArrowUpDown size={18} opacity={0.7} />
                        <Text color="$gray10" fontSize="$4" fontWeight="500">Fee</Text>
                    </XStack>
                    <XStack items="center" gap="$1">
                        <Text fontWeight="700" fontSize="$4">₿{fee}</Text>
                    </XStack>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <View width={20} height={20} borderWidth={1.5} borderColor="$gray10" rounded="$1" justify="center" items="center">
                            <Layout size={12} color="$gray10" />
                        </View>
                        <Text color="$gray10" fontSize="$4" fontWeight="500">Unit</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$4">SAT</Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <View width={20} height={20} borderWidth={1.5} borderColor="$gray10" rounded="$1" justify="center" items="center">
                            <DollarSign size={14} color="$gray10" />
                        </View>
                        <Text color="$gray10" fontSize="$4" fontWeight="500">Fiat</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$4">
                        {btcData?.price
                            ? currencyService.formatValue(currencyService.convertSatsToCurrency(Number(amount), btcData.price), secondaryCurrency as CurrencyCode)
                            : '$0.00'}
                    </Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <Building2 size={18} opacity={0.7} />
                        <Text color="$gray10" fontSize="$4" fontWeight="500">Mint</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$4" opacity={0.9} numberOfLines={1} style={{ maxWidth: 200, textAlign: 'right' }}>
                        {mintUrl ? getMintDisplayName(mintUrl) : 'Unknown'}
                    </Text>
                </XStack>
            </YStack>

            {/* Action Buttons */}
            <XStack mt="auto" pb="$8" gap="$2" width="100%">
                {onReclaim && (
                    <Button
                        flex={1}
                        onPress={handleReclaim}
                        theme="gray"
                        size="$4"
                        fontWeight="800"
                        pressStyle={{ opacity: 0.8, scale: 0.98 }}
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
                    size="$4"
                    fontWeight="800"
                    pressStyle={{ opacity: 0.8, scale: 0.98 }}
                    icon={<Share2 size={18} />}
                />

                <Button
                    flex={1.5}
                    onPress={handleCopy}
                    size="$4"
                    theme="accent"
                    fontWeight="800"
                    pressStyle={{ opacity: 0.8, scale: 0.98 }}
                    icon={copied ? <Check size={18} /> : <Copy size={18} />}
                >
                    {copied ? 'Copied!' : 'Copy'}
                </Button>
            </XStack>
        </YStack>
    );
}
