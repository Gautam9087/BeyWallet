import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, H2, Separator, View, H4, H1, Popover, ListItem, Adapt, Sheet } from "tamagui";
import { Copy, Share, Zap, Maximize, ExternalLink, ArrowUpDown, Coins, Building2, DollarSign, X, Layout, MoreHorizontal, Link, Contact2, Trash2, Scan, Share2 } from "@tamagui/lucide-icons";
import * as Haptics from 'expo-haptics';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Stack } from 'expo-router';

interface ResultStageProps {
    status: 'success' | 'error';
    amount: string;
    onClose: () => void;
    title?: string;
}

export function ResultStage({ status, amount, onClose, title = 'Pending Ecash' }: ResultStageProps) {
    const isSuccess = status === 'success';

    useEffect(() => {
        if (isSuccess) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    }, [status]);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(`cashu:Token...${amount}`);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    };

    if (!isSuccess) {
        return (
            <YStack flex={1} justify="center" items="center" gap="$4">
                <Text color="$red10" fontSize="$6" fontWeight="700">Payment Failed</Text>
                <Button onPress={onClose}>Go Back</Button>
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
                        value={`cashu:token_placeholder_for_${amount}_sats`}
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
                        <Text fontWeight="700" fontSize="$4">₿1</Text>
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
                    <Text fontWeight="700" fontSize="$4" opacity={0.9} text="right">testnut.cashu.space</Text>
                </XStack>
            </YStack>

            {/* Action Buttons */}
            <XStack mt="auto" pb="$8" gap="$2" width="100%">
                <Button
                    flex={1.5}
                    onPress={() => { }}
                    theme="gray"
                    size="$4"
                    fontWeight="800"
                    pressStyle={{ opacity: 0.8, scale: 0.98 }}
                    icon={<Zap size={18} />}
                >
                    Nostr
                </Button>
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
                    flex={1}
                    onPress={handleCopy}

                    size="$4"
                    theme="accent"
                    fontWeight="800"
                    pressStyle={{ opacity: 0.8, scale: 0.98 }}
                    icon={<Copy size={18} />}
                />


            </XStack>
        </YStack>
    );
}
