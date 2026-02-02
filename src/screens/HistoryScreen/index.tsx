import React from 'react';
import { YStack, XStack, Text, Button, ScrollView, Card, Separator, View } from 'tamagui';
import { RefreshCw, Database, ArrowUpRight, ArrowDownLeft, Clock, Info } from '@tamagui/lucide-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cocoService } from '../../services/cocoService';
import { Spinner } from '../../components/UI/Spinner';
import { RefreshControl } from 'react-native';

export function HistoryScreen() {
    const queryClient = useQueryClient();

    const { data: history = [], isLoading, refetch, isRefetching } = useQuery({
        queryKey: ['history'],
        queryFn: async () => {
            const repo = cocoService.getRepo();
            return repo.historyRepository.getPaginatedHistoryEntries(50, 0);
        },
        enabled: !!cocoService.getManager(),
    });

    const seedMutation = useMutation({
        mutationFn: async () => {
            const repo = cocoService.getRepo();
            await repo.seedMockData();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['history'] });
        },
    });

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
                <XStack gap="$2">
                    <Button
                        size="$3"
                        circular
                        icon={<RefreshCw size={18} />}
                        onPress={() => refetch()}
                        chromeless
                    />
                    <Button
                        size="$3"
                        theme="yellow"
                        icon={<Database size={18} />}
                        onPress={() => seedMutation.mutate()}
                        disabled={seedMutation.isPending}
                    >
                        {seedMutation.isPending ? 'Seeding...' : 'Seed Data'}
                    </Button>
                </XStack>
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
                            <Text fontSize="$2" color="$gray8">
                                Tap "Seed Data" to test the database tables
                            </Text>
                        </YStack>
                    ) : (
                        history.map((entry: any) => (
                            <Card key={entry.id} p="$3" bg="$gray2" bordered>
                                <XStack justify="space-between" items="center">
                                    <XStack gap="$3" items="center">
                                        <View
                                            p="$2"
                                            rounded={100}
                                            bg={entry.type === 'send' || entry.type === 'melt' ? '$red2' : '$green2'}
                                        >
                                            {entry.type === 'send' || entry.type === 'melt' ? (
                                                <ArrowUpRight size={20} color="$red10" />
                                            ) : (
                                                <ArrowDownLeft size={20} color="$green10" />
                                            )}
                                        </View>
                                        <YStack>
                                            <Text fontWeight="bold" fontSize="$4" textTransform="capitalize">
                                                {entry.type}
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
                                            color={entry.type === 'send' || entry.type === 'melt' ? '$red10' : '$green10'}
                                        >
                                            {entry.type === 'send' || entry.type === 'melt' ? '-' : '+'}
                                            {entry.amount} {entry.unit}
                                        </Text>
                                        <XStack items="center" gap="$1">
                                            <Text fontSize="$1" color="$gray8" textTransform="capitalize">
                                                {entry.state || 'completed'}
                                            </Text>
                                        </XStack>
                                    </YStack>
                                </XStack>

                                <Separator my="$2" opacity={0.5} />

                                <YStack gap="$1">
                                    <XStack items="center" gap="$1">
                                        <Info size={12} color="$gray9" />
                                        <Text fontSize="$1" color="$gray9" numberOfLines={1}>
                                            Mint: {entry.mintUrl}
                                        </Text>
                                    </XStack>
                                    {entry.metadata && (
                                        <Text fontSize="$1" color="$gray8" fontStyle="italic">
                                            {JSON.stringify(entry.metadata)}
                                        </Text>
                                    )}
                                </YStack>
                            </Card>
                        ))
                    )}
                </YStack>
            </ScrollView>
        </YStack>
    );
}
