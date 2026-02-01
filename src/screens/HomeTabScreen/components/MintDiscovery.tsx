import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, Card, H3, H4, Spinner, Image, View } from 'tamagui';
import { Search, Star, MessageSquare, Plus, RefreshCw, Check, Sprout, Info, ExternalLink } from '@tamagui/lucide-icons';
import { useMintRecommendationStore } from '../../../store/mintRecommendationStore';
import { useWalletStore } from '../../../store/walletStore';
import * as Haptics from 'expo-haptics';
import { useToastController } from '@tamagui/toast';
import { useRouter } from 'expo-router';

export function MintDiscovery() {
    const { recommendations, isLoading, fetchRecommendations, error } = useMintRecommendationStore();
    const { addMint, mints } = useWalletStore();
    const toast = useToastController();
    const router = useRouter();

    useEffect(() => {
        fetchRecommendations();
    }, []);

    const handleAddMint = async (url: string) => {
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

    const handleRefresh = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        fetchRecommendations(true);
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

                    icon={isLoading ? <Spinner size="small" /> : <RefreshCw size={14} />}
                    onPress={handleRefresh}
                    disabled={isLoading}
                />
            </XStack>

            {isLoading && recommendations.length === 0 && (
                <YStack height={200} items="center" justify="center">
                    <Spinner size="large" color="$accentColor" />
                    <Text mt="$2" color="$gray10">Searching the Nostr network...</Text>
                </YStack>
            )}

            {error && recommendations.length === 0 && (
                <YStack height={100} items="center" justify="center" gap="$2">
                    <Text color="$red10">Failed to load recommendations</Text>
                    <Button size="$3" onPress={() => fetchRecommendations(true)}>Retry</Button>
                </YStack>
            )}

            {!isLoading && recommendations.length === 0 && !error && (
                <YStack height={100} items="center" justify="center">
                    <Text color="$gray10">No mints found in your relays.</Text>
                </YStack>
            )}

            <YStack gap="$3">
                {recommendations.map((mint) => {
                    const isAlreadyAdded = mints.includes(mint.url) || mints.includes(mint.url + '/');

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
                        </Card>
                    );
                })}
            </YStack>
        </YStack>
    );
}
