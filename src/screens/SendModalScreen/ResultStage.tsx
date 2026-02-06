import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, H2, Separator, View, Popover, ListItem, Adapt, Sheet } from "tamagui";
import { Copy, Share, Zap, ArrowUpDown, Building2, DollarSign, Layout, MoreHorizontal, Link, Contact2, Trash2, Scan, Share2, Check, RotateCcw, XCircle } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';
import { useToastController } from '@tamagui/toast';
import { Spinner } from '../../components/UI/Spinner';

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
    const [copied, setCopied] = useState(false);
    const [isReclaiming, setIsReclaiming] = useState(false);

    useEffect(() => {
        if (isSuccess) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [status]);

    const handleCopy = async () => {
        if (token) {
            await Clipboard.setStringAsync(token);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setCopied(true);
            toast.show('Copied!', { message: 'Token copied to clipboard' });
            setTimeout(() => setCopied(false), 2000);
        }
    };

    const handleReclaim = async () => {
        if (onReclaim) {
            setIsReclaiming(true);
            await onReclaim();
            setIsReclaiming(false);
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
            <YStack items="center" gap="$5" pt="$4">
                <View
                    bg="white"
                    p="$3"
                    rounded="$2"
                >
                    <QRCode
                        value={token || `cashu:placeholder_${amount}`}
                        size={320}
                        backgroundColor="white"
                        color="black"
                        quietZone={10}
                    />
                </View>
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
                    <Text fontWeight="700" fontSize="$4">${(Number(amount) * 0.00078).toFixed(2)}</Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <Building2 size={18} opacity={0.7} />
                        <Text color="$gray10" fontSize="$4" fontWeight="500">Mint</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$4" opacity={0.9} text="right" numberOfLines={1} maxWidth={200}>
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
                    onPress={() => { }}
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
