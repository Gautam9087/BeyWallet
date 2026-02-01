import React, { useEffect, useState } from 'react';
import { YStack, XStack, Text, Button, H2, H3, H4, Separator, ScrollView, View, Image, Card } from 'tamagui';
import { Spinner } from '../../components/UI/Spinner';
import { Link, Mail, Globe, Info, Copy, Check, ChevronLeft, Sprout, Share2, MessageSquare, ShieldCheck, Cpu, Plus } from '@tamagui/lucide-icons';
import { useRouter, Stack } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import QRCode from "react-native-qrcode-svg";
import { mintRecommendationService } from '../../services/mintRecommendationService';
import { useToastController } from '@tamagui/toast';
import { useQuery } from '@tanstack/react-query';
import { useWalletStore } from '../../store/walletStore';
import { AppBottomSheetRef } from '../../components/UI/AppBottomSheet';
import { TrustingMint } from '../HomeTabScreen/components/TrustingMint';

interface MintProfileScreenProps {
    url: string;
}

export function MintProfileScreen({ url }: MintProfileScreenProps) {
    const [showQr, setShowQr] = useState(false);
    const router = useRouter();
    const toast = useToastController();
    const { addMint, mints } = useWalletStore();

    const trustSheetRef = React.useRef<AppBottomSheetRef>(null!);
    const isAlreadyAdded = mints.includes(url) || mints.includes(url + '/');

    const { data: info, isLoading, error: fetchError } = useQuery({
        queryKey: ['mint-metadata', url],
        queryFn: () => mintRecommendationService.fetchMintMetadata(url),
        staleTime: 1000 * 60 * 5, // Cache for 5 minutes
        retry: 2,
    });

    const handleCopy = async (text: string, label: string) => {
        await Clipboard.setStringAsync(text);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        toast.show('Copied', {
            message: `${label} copied to clipboard`,
        });
    };

    if (isLoading) {
        return (
            <YStack flex={1} items="center" justify="center" bg="$background">
                <Spinner size="large" color="$accentColor" />
                <Text mt="$4" color="$gray10">Fetching mint details...</Text>
            </YStack>
        );
    }

    if (fetchError || !info) {
        return (
            <YStack flex={1} items="center" justify="center" bg="$background" p="$4" gap="$4">
                <Text color="$red10">Failed to fetch mint information.</Text>
                <Button onPress={() => router.back()}>Go Back</Button>
            </YStack>
        );
    }

    const name = info.name || (() => {
        try { return new URL(url).hostname }
        catch (e) { return url }
    })();
    const description = info.description || info.description_long;
    const motd = info.motd;
    const version = info.version;
    const nuts = info.nuts || {};

    const hostname = (() => {
        try { return new URL(url).hostname }
        catch (e) { return url }
    })();

    return (
        <YStack flex={1} bg="$background">
            <Stack.Screen
                options={{
                    title: name,
                    headerRight: () => (
                        <Button
                            circular
                            size="$3"
                            chromeless
                            icon={<Share2 size={20} color="$color" />}
                            onPress={() => handleCopy(url, 'Mint URL')}
                        />
                    )
                }}
            />

            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <YStack px="$4" pb="$10" gap="$6">
                    {/* Header Section */}
                    <YStack items="center" gap="$3">
                        <View
                            width={100}
                            height={100}
                            rounded="$5"
                            bg="$gray3"
                            items="center"
                            justify="center"
                            overflow="hidden"
                            borderWidth={1}
                            borderColor="$color5"
                        >
                            {info.icon_url ? (
                                <Image source={{ uri: info.icon_url, width: 100, height: 100 }} />
                            ) : (
                                <Sprout size={60} color="$accentColor" />
                            )}
                        </View>
                        <H2 text="center">{name}</H2>
                        <XStack
                            bg="$gray3"
                            px="$3"
                            py="$1"
                            rounded={100}
                            items="center"
                            gap="$2"
                            onPress={() => handleCopy(url, 'URL')}
                        >
                            <Globe size={14} color="$gray10" />
                            <Text color="$gray10" fontSize="$3">{hostname}</Text>
                        </XStack>
                    </YStack>

                    {/* MOTD */}
                    {motd && (
                        <View bg="$color5" rounded="$4" p="$4" >
                            <XStack gap="$3">
                                <MessageSquare color="$color" size={20} />
                                <YStack flex={1}>
                                    <Text fontWeight="bold" color="$color">Message of the Day</Text>
                                    <Text color="$color" mt="$1">{motd}</Text>
                                </YStack>
                            </XStack>
                        </View>
                    )}

                    {/* Description */}
                    {description && (
                        <YStack gap="$2">
                            <H4 color="$gray10" fontSize="$4">About</H4>
                            <Text lineHeight={22} color="$color">{description}</Text>
                        </YStack>
                    )}

                    {/* Connection Info */}
                    <YStack gap="$3">
                        <H4 color="$gray10" fontSize="$4">Connection Details</H4>
                        <Card p="$3" bg="$gray2">
                            <YStack gap="$4">
                                <YStack gap="$1">
                                    <Text color="$gray10" fontSize="$2" fontWeight="700">MINT URL</Text>
                                    <XStack justify="space-between" items="center">
                                        <Text flex={1} numberOfLines={1} fontSize="$3">{url}</Text>
                                        <Button
                                            size="$2"
                                            circular
                                            icon={<Copy size={14} />}
                                            onPress={() => handleCopy(url, 'URL')}
                                            chromeless
                                        />
                                    </XStack>
                                </YStack>

                                <Button
                                    size="$3"
                                    theme="gray"
                                    icon={showQr ? <Info size={14} /> : <Globe size={14} />}
                                    onPress={() => setShowQr(!showQr)}
                                >
                                    {showQr ? 'Hide QR Code' : 'Show Mint QR Code'}
                                </Button>

                                {showQr && (
                                    <YStack items="center" py="$4" bg="white" rounded="$4">
                                        <QRCode value={url} size={200} />
                                    </YStack>
                                )}
                            </YStack>
                        </Card>
                    </YStack>

                    {/* Features / NUTs */}
                    <YStack gap="$3">
                        <H4 color="$gray10" fontSize="$4">Supported Features</H4>
                        <XStack flexWrap="wrap" gap="$2">
                            {Object.keys(nuts).map((nut) => (
                                <View key={nut} bg="$gray3" px="$3" py="$1.5" rounded="$3" grow={0} self="flex-start" borderWidth={1} borderColor="$color4">
                                    <XStack items="center" gap="$2">
                                        <ShieldCheck size={12} color="$green10" />
                                        <Text fontSize="$2" fontWeight="600">NUT-{nut}</Text>
                                    </XStack>
                                </View>
                            ))}
                            {version && (
                                <View bg="$gray3" px="$3" py="$1.5" rounded="$3" borderWidth={1} borderColor="$color4">
                                    <XStack items="center" gap="$2">
                                        <Cpu size={12} color="$blue10" />
                                        <Text fontSize="$2" fontWeight="600">{version}</Text>
                                    </XStack>
                                </View>
                            )}
                        </XStack>
                    </YStack>

                    {/* Contact */}
                    {info.contact && info.contact.length > 0 && (
                        <YStack gap="$3">
                            <H4 color="$gray10" fontSize="$4">Contact & Support</H4>
                            <YStack gap="$2">
                                {info.contact.map((c: any, i: number) => {
                                    // Handle both standard [method, info] and object formats
                                    const method = Array.isArray(c) ? c[0] : (c.method || 'Contact');
                                    const contactInfo = Array.isArray(c) ? c[1] : (c.info || '');

                                    if (!contactInfo) return null;

                                    return (
                                        <XStack key={i} bg="$gray2" p="$3" rounded="$4" items="center" justify="space-between">
                                            <XStack items="center" gap="$3">
                                                {method.toLowerCase() === 'email' ? <Mail size={18} color="$gray10" /> : <Globe size={18} color="$gray10" />}
                                                <YStack>
                                                    <Text fontWeight="600" textTransform="capitalize">{method}</Text>
                                                    <Text color="$color5" maxW={200} fontSize="$3">{contactInfo}</Text>
                                                </YStack>
                                            </XStack>
                                            <Button
                                                size="$2"
                                                circular
                                                icon={<Copy size={12} />}
                                                onPress={() => handleCopy(contactInfo, method)}
                                                chromeless
                                            />
                                        </XStack>
                                    );
                                })}
                            </YStack>
                        </YStack>
                    )}
                </YStack>
            </ScrollView>

            <YStack p="$4" bg="$background" borderTopWidth={1} borderTopColor="$gray4">
                <Button
                    size="$4"
                    fontWeight="bold"
                    theme={isAlreadyAdded ? 'gray' : 'accent'}
                    disabled={isAlreadyAdded}
                    icon={isAlreadyAdded ? <Check size={18} /> : <Plus size={18} />}
                    onPress={() => trustSheetRef.current?.present()}
                >
                    {isAlreadyAdded ? 'Already Connected' : 'Connect to this Mint'}
                </Button>
            </YStack>

            <TrustingMint
                bottomSheetRef={trustSheetRef}
                mintUrl={url}
                onConfirm={async (url) => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    try {
                        await addMint(url);
                        toast.show('Mint Added', {
                            message: `Successfully connected to ${url}`,
                            type: 'success'
                        });
                    } catch (err: any) {
                        toast.show('Error', {
                            message: err.message || 'Failed to add mint',
                            theme: 'red'
                        });
                    }
                }}
            />
        </YStack>
    );
}
