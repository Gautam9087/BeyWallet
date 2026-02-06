import React from 'react';
import { YStack, XStack, Text, Button, ScrollView, Card, Separator, View } from 'tamagui';
import { RefreshCw, ArrowUpRight, ArrowDownLeft, Clock, Info, Zap, Coins } from '@tamagui/lucide-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { cocoService } from '../../services/cocoService';
import { Spinner } from '../../components/UI/Spinner';
import { RefreshControl } from 'react-native';

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
    const queryClient = useQueryClient();

    const { data: history = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['history'],
        queryFn: async () => {
            if (!cocoService.isInitialized()) {
                return [];
            }
            return cocoService.getHistory(50, 0) as Promise<HistoryEntry[]>;
        },
        enabled: cocoService.isInitialized(),
    });

    // Get icon and colors based on transaction type
    const getTransactionStyle = (type: string) => {
        const isOutgoing = type === 'send' || type === 'melt';
        return {
            icon: isOutgoing ? ArrowUpRight : ArrowDownLeft,
            iconColor: isOutgoing ? '$red10' : '$green10',
            bgColor: isOutgoing ? '$red2' : '$green2',
            sign: isOutgoing ? '-' : '+',
        };
    };

    // Get display label for transaction type
    const getTypeLabel = (type: string) => {
        switch (type) {
            case 'send': return 'Sent';
            case 'receive': return 'Received';
            case 'mint': return 'Minted';
            case 'melt': return 'Melted';
            default: return type;
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
            <XStack p="$4" justify="space-between" items="center">
                <YStack>
                    <Text fontSize="$6" fontWeight="bold">Transaction History</Text>
                    <Text fontSize="$3" color="$gray10">Your Recent Activity</Text>
                </YStack>
                <Button
                    size="$3"
                    circular
                    icon={<RefreshCw size={18} />}
                    onPress={() => refetch()}
                    chromeless
                />
            </XStack>

            <ScrollView
                flex={1}
                px="$4"
                pb="$4"
                refreshControl={
                    <RefreshControl
                        refreshing={isRefetching}
                        onRefresh={refetch}
                        tintColor="#FFD700"
                    />
                }
            >
                <YStack gap="$3">
                    {history.length === 0 ? (
                        <YStack py="$10" items="center" justify="center" gap="$2">
                            <Clock size={40} color="$gray8" />
                            <Text color="$gray10">No transactions yet</Text>
                            <Text fontSize="$2" color="$gray8" text="center" px="$4">
                                Mint some tokens or receive ecash to see your transaction history
                            </Text>
                        </YStack>
                    ) : (
                        history.map((entry: HistoryEntry) => {
                            const style = getTransactionStyle(entry.type);
                            const Icon = style.icon;

                            return (
                                <Card key={entry.id} p="$3" bg="$gray2" bordered>
                                    <XStack justify="space-between" items="center">
                                        <XStack gap="$3" items="center">
                                            <View
                                                p="$2"
                                                rounded={100}
                                                bg={style.bgColor as any}
                                            >
                                                <Icon size={20} color={style.iconColor as any} />
                                            </View>
                                            <YStack>
                                                <Text fontWeight="bold" fontSize="$4">
                                                    {getTypeLabel(entry.type)}
                                                </Text>
                                                <Text fontSize="$2" color="$gray10">
                                                    {new Date(entry.createdAt * 1000).toLocaleString()}
                                                </Text>
                                            </YStack>
                                        </XStack>
                                        <YStack items="flex-end">
                                            <Text
                                                fontWeight="bold"
                                                fontSize="$5"
                                                color={style.iconColor as any}
                                            >
                                                {style.sign}{entry.amount} {entry.unit || 'SAT'}
                                            </Text>
                                            <XStack items="center" gap="$1">
                                                <Text fontSize="$1" color="$gray8" textTransform="capitalize">
                                                    {entry.state || 'completed'}
                                                </Text>
                                            </XStack>
                                        </YStack>
                                    </XStack>

                                    <Separator my="$2" opacity={0.5} />

                                    <XStack items="center" gap="$1">
                                        <Info size={12} color="$gray9" />
                                        <Text fontSize="$1" color="$gray9" numberOfLines={1} flex={1}>
                                            {getMintDisplayName(entry.mintUrl)}
                                        </Text>
                                    </XStack>
                                </Card>
                            );
                        })
                    )}
                </YStack>
            </ScrollView>
        </YStack>
    );
}
