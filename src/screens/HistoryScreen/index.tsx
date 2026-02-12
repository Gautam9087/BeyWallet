import React, { useEffect } from 'react';
import { YStack, XStack, Text, Button, ScrollView, Separator, View, Theme } from 'tamagui';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Clock, Info, ShieldCheck, ArrowUp } from '@tamagui/lucide-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cocoService } from '../../services/cocoService';
import { Spinner } from '../../components/UI/Spinner';
import { RefreshControl } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { formatLocalTime } from '~/utils/time';

interface HistoryEntry {
    id: string;
    type: 'send' | 'receive' | 'mint' | 'melt';
    amount: number;
    unit: string;
    mintUrl: string;
    state?: string;
    createdAt: number;
    metadata?: any;
}

export function HistoryScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();

    const { data: history = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['history'],
        queryFn: async () => {
            if (!cocoService.isInitialized()) {
                return [];
            }
            return cocoService.getHistory(100, 0) as Promise<HistoryEntry[]>;
        },
        enabled: cocoService.isInitialized(),
    });

    // Real-time updates via coco events
    useEffect(() => {
        if (!cocoService.isInitialized()) return;

        const handleUpdate = () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        };

        cocoService.on('history:updated', handleUpdate);
        cocoService.on('receive:created', handleUpdate);
        cocoService.on('send:created', handleUpdate);

        return () => {
            try {
                cocoService.off('history:updated', handleUpdate);
                cocoService.off('receive:created', handleUpdate);
                cocoService.off('send:created', handleUpdate);
            } catch (e) {
                // Ignore cleanup errors if manager is gone
            }
        };
    }, [queryClient]);

    const getTransactionStyle = (type: string) => {
        const isOutgoing = type === 'send' || type === 'melt';
        return {
            icon: isOutgoing ? ArrowUp : ArrowDownLeft,
            iconColor: isOutgoing ? '$red10' : '$green11',
            bgColor: isOutgoing ? '$red2' : '$green2',
            sign: isOutgoing ? '-' : '+',
        };
    };

    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'send': return 'Sent';
            case 'receive': return 'Received';
            case 'mint': return 'Minted';
            case 'melt': return 'Melted';
            default: return type;
        }
    };

    const handleTransactionPress = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/transaction-details',
            params: { id }
        });
    };

    if (isLoading && !isRefetching) {
        return (
            <YStack flex={1} items="center" justify="center" bg="$background">
                <Spinner size="large" />
                <Text mt="$2" color="$gray10">Loading history...</Text>
            </YStack>
        );
    }

    return (
        <YStack flex={1} bg="$background">

            <ScrollView
                flex={1}
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor="#FFD700"
                    />
                }
                showsVerticalScrollIndicator={false}
            >
                <YStack px="$4" pb="$10">
                    {history.length === 0 ? (
                        <YStack py="$10" items="center" justify="center" gap="$3">
                            <View p="$4" bg="$gray2" rounded="$10">
                                <Clock size={32} color="$gray9" />
                            </View>
                            <YStack items="center">
                                <Text fontWeight="700">No transactions yet</Text>
                                <Text fontSize="$3" color="$gray9" text="center" mt="$1">
                                    When you send or receive tokens, they will appear here.
                                </Text>
                            </YStack>
                        </YStack>
                    ) : (
                        <YStack gap="$4">
                            {history.map((entry: HistoryEntry) => {
                                const style = getTransactionStyle(entry.type);
                                const status = entry.state || 'completed';

                                return (
                                    <YStack
                                        key={entry.id}
                                        onPress={() => handleTransactionPress(entry.id)}
                                        pressStyle={{ opacity: 0.7, scale: 0.98 }}
                                    >
                                        <XStack justify="space-between" items="center"  >
                                            <XStack gap="$3" items="center">
                                                <View
                                                    p="$2.5"
                                                    rounded="$10"

                                                    borderWidth={2}
                                                    borderColor="$borderColor"
                                                >
                                                    <style.icon size={24} strokeWidth={3} color={style.iconColor as any} />
                                                </View>
                                                <YStack>
                                                    <XStack gap="$2" items="center">

                                                        <Text fontWeight="700" fontSize="$4">
                                                            {getTypeLabel(entry.type)}
                                                        </Text>
                                                        {status !== 'completed' && (
                                                            <XStack px="$1.5" py="$0.5" bg="$gray5" rounded="$2">
                                                                <Text fontSize="$1" fontWeight="800" textTransform="uppercase" color="$gray10">
                                                                    {status}
                                                                </Text>
                                                            </XStack>
                                                        )}
                                                    </XStack>
                                                    <Text fontSize="$2" color="$gray10">
                                                        {formatLocalTime(entry.createdAt)}
                                                    </Text>
                                                </YStack>
                                            </XStack>

                                            <YStack items="flex-end" gap="$1">
                                                <Text
                                                    fontWeight="800"
                                                    fontSize="$5"
                                                    color={style.iconColor as any}
                                                >
                                                    {style.sign}{entry.amount} {entry.unit?.toUpperCase() || 'SATS'}
                                                </Text>

                                            </YStack>
                                        </XStack>
                                    </YStack>
                                );
                            })}
                        </YStack>
                    )}
                </YStack>
            </ScrollView>
        </YStack>
    );
}
