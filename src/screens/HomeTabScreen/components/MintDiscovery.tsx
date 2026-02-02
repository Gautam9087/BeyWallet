import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H3, H4, Image, View } from 'tamagui';
import { Spinner } from '../../../components/UI/Spinner';
import { Search, Star, MessageSquare, Plus, RefreshCw, Check, Sprout, Info, ExternalLink } from '@tamagui/lucide-icons';
import { useQuery } from '@tanstack/react-query';
import { mintRecommendationService } from '../../../services/mintRecommendationService';
import { useWalletStore } from '../../../store/walletStore';
import { cocoService } from '../../../services/cocoService';
import * as Haptics from 'expo-haptics';
import { useToastController } from '@tamagui/toast';
import { useRouter } from 'expo-router';
import { AppBottomSheetRef } from '../../../components/UI/AppBottomSheet';
import { TrustingMint } from './TrustingMint';

interface MintDiscoveryProps {
    refreshTrigger?: number;
    onRefreshStarted?: () => void;
    onRefreshFinished?: () => void;
}

export function MintDiscovery({ refreshTrigger, onRefreshStarted, onRefreshFinished }: MintDiscoveryProps) {
    const [loadingMessage, setLoadingMessage] = React.useState('Loading...');
    const { data: recommendations = [], isLoading, error, refetch, isRefetching } = useQuery({
        queryKey: ['mint-recommendations'],
        queryFn: async () => {
            const repo = cocoService.getRepo();

            setLoadingMessage('Fetching from local database...');
            // 1. Try to get from Cache (DB)
            const cached = await repo.mintRecommendationRepository.getAll();

            // 2. If it's the first time (empty), or we explicitly want to refresh (handled by refetch)
            // Note: querySync in discoverMints is slow, so we only do it if necessary or triggered
            if (cached.length === 0) {
                setLoadingMessage('Searching the Nostr network...');
                const discovered = await mintRecommendationService.discoverMints();
                if (discovered.length > 0) {
                    await repo.mintRecommendationRepository.saveAll(discovered);
                    return discovered;
                }
            }

            return cached;
        },
        staleTime: Infinity, // Rely on manual refresh to update DB
    });

    const handleRefresh = async () => {
        onRefreshStarted?.();
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setLoadingMessage('Syncing with the Nostr network...');

        // Forced discovery and cache update
        try {
            const discovered = await mintRecommendationService.discoverMints();
            if (discovered.length > 0) {
                const repo = cocoService.getRepo();
                await repo.mintRecommendationRepository.deleteAll();
                await repo.mintRecommendationRepository.saveAll(discovered);
                refetch();
            }
        } catch (e) {
            console.error('[MintDiscovery] Refresh failed:', e);
        } finally {
            onRefreshFinished?.();
        }
    };

    // Watch for external refresh trigger
    React.useEffect(() => {
        if (refreshTrigger && refreshTrigger > 0) {
            handleRefresh();
        }
    }, [refreshTrigger]);
    const { addMint, mints } = useWalletStore();
    const toast = useToastController();
    const router = useRouter();

    const trustSheetRef = React.useRef<AppBottomSheetRef>(null!);
    const [pendingMintUrl, setPendingMintUrl] = React.useState<string>('');

    const handleAddMint = async (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setPendingMintUrl(url);
        trustSheetRef.current?.present();
    };

    const confirmAddMint = async (url: string) => {
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
    };


    const handleViewProfile = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: "/(modals)/mint-profile",
            params: { url }
        });
    };

    return (
        <YStack gap="$4" width="100%">
            <XStack items="center" justify="space-between">
                <H3>Discover Mints</H3>
                <Button
                    size="$2"
                    icon={(isLoading || isRefetching) ? <Spinner size="small" /> : <RefreshCw size={14} />}
                    onPress={handleRefresh}
                    disabled={isLoading || isRefetching}
                />
            </XStack>

            {(isLoading || isRefetching) && recommendations.length === 0 && (
                <YStack height={200} items="center" justify="center">
                    <Spinner size="large" color="$accentColor" />
                    <Text mt="$2" color="$gray10">{loadingMessage}</Text>
                </YStack>
            )}

            {error && recommendations.length === 0 && (
                <YStack height={100} items="center" justify="center" gap="$2">
                    <Text color="$red10">Failed to load recommendations</Text>
                    <Button size="$3" onPress={() => refetch()}>Retry</Button>
                </YStack>
            )}

            {!isLoading && recommendations.length === 0 && !error && (
                <YStack height={100} items="center" justify="center">
                    <Text color="$gray10">No mints found in your relays.</Text>
                </YStack>
            )}

            <YStack gap="$3">
                {recommendations.map((mint, index) => {
                    const isAlreadyAdded = mints.includes(mint.url) || mints.includes(mint.url + '/');
                    const isMostRecommended = index < 2;

                    return (
                        <Card
                            key={mint.url}
                            size="$4"
                            p="$3"
                            bg="$gray3"
                            minH={150}

                            pressStyle={{ scale: 0.98 }}
                        >
                            <YStack justify="space-between" flex={1}>
                                <XStack gap="$2" flex={1}>
                                    <View
                                        width={40}
                                        height={40}
                                        rounded="$3"
                                        bg="$gray4"
                                        items="center"
                                        justify="center"
                                        overflow="hidden"
                                    >
                                        {mint.icon ? (
                                            <Image source={{ uri: mint.icon, width: 40, height: 40 }} />
                                        ) : (
                                            <Sprout size={24} color="$gray10" />
                                        )}
                                    </View>

                                    <YStack flex={1} gap="$1">
                                        <XStack items="center" justify="space-between" width="100%">
                                            <H4 fontSize="$5" fontWeight="700" numberOfLines={1} flex={1}>
                                                {mint.name || (() => {
                                                    try { return new URL(mint.url).hostname }
                                                    catch (e) { return mint.url }
                                                })()}
                                            </H4>
                                            <Button
                                                size="$2"
                                                circular
                                                icon={<ExternalLink size={18} color="$gray10" />}
                                                onPress={() => handleViewProfile(mint.url)}
                                                chromeless
                                                mt="$-1"
                                                mr="$-1"
                                            />
                                        </XStack>

                                        <Text color="$gray10" fontSize="$3" numberOfLines={2}>
                                            {mint.description || mint.url}
                                        </Text>
                                    </YStack>
                                </XStack>

                                <XStack mt="$2" items="center" justify="space-between">
                                    <XStack gap="$3" items="center">
                                        <XStack items="center" gap="$1">
                                            <MessageSquare size={12} color="$gray9" />
                                            <Text fontSize="$2" color="$gray9">{mint.reviewsCount} reviews</Text>
                                        </XStack>

                                        <XStack items="center" gap="$1">
                                            <Star size={14} color="#FFD700" fill="#FFD700" />
                                            <Text fontSize="$3" fontWeight="bold">
                                                {mint.averageRating ? mint.averageRating.toFixed(1) : 'N/A'}
                                            </Text>
                                        </XStack>
                                    </XStack>

                                    <Button
                                        size="$3"
                                        fontWeight="bold"
                                        fontSize="$4"
                                        theme={isAlreadyAdded ? 'gray' : 'accent'}
                                        disabled={isAlreadyAdded}
                                        icon={isAlreadyAdded ? <Check strokeWidth={3} size={14} /> : <Plus strokeWidth={3} size={14} />}
                                        onPress={() => handleAddMint(mint.url)}
                                    >
                                        {isAlreadyAdded ? 'Added' : 'Connect'}
                                    </Button>
                                </XStack>
                            </YStack>

                            {isMostRecommended && (
                                <XStack
                                    position="absolute"
                                    t={-10}
                                    r={15}
                                    bg="gold"
                                    px="$2"
                                    py="$1"
                                    rounded="$2"
                                    borderWidth={1}
                                    borderColor="$yellow10"
                                    items="center"
                                    gap="$1"
                                    z={10}
                                    elevation={3}
                                >
                                    <Star size={10} color="black" fill="black" />
                                    <Text fontSize="$1" fontWeight="800" color="black" letterSpacing={0.5}>
                                        Top Best
                                    </Text>
                                </XStack>
                            )}
                        </Card>
                    );
                })}
            </YStack>

            <TrustingMint
                bottomSheetRef={trustSheetRef}
                mintUrl={pendingMintUrl}
                onConfirm={confirmAddMint}
            />
        </YStack>
    );
}
