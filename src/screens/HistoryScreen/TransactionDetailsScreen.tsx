import React, { useState, useMemo, useEffect } from 'react';
import { YStack, XStack, Text, Button, ScrollView, View, Separator, Circle, Theme } from 'tamagui';
import { ChevronLeft, RefreshCw, Copy, Share2, ArrowUpRight, ArrowDownLeft, Calendar, Coins, Zap, ShieldCheck, ExternalLink, AlertCircle, CheckCircle2 } from '@tamagui/lucide-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from 'react-native-qrcode-svg';
import { formatFullLocalTime } from '~/utils/time';
import { cocoService } from '~/services/cocoService';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useSettingsStore } from '~/store/settingsStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Spinner } from '~/components/UI/Spinner';

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

export function TransactionDetailsScreen() {
    const router = useRouter();
    const queryClient = useQueryClient();
    const { id } = useLocalSearchParams<{ id: string }>();
    const { secondaryCurrency } = useSettingsStore();

    const { data: entry, refetch, isRefetching } = useQuery({
        queryKey: ['transaction', id],
        queryFn: async () => {
            const history = await cocoService.getHistory(100, 0);
            return history.find((e: any) => e.id === id) as HistoryEntry | undefined;
        },
        enabled: !!id,
    });

    const status = entry?.state || 'completed';

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

    const style = useMemo(() => {
        if (!entry) return null;
        const isOutgoing = entry.type === 'send' || entry.type === 'melt';
        return {
            icon: isOutgoing ? ArrowUpRight : ArrowDownLeft,
            iconColor: isOutgoing ? '$red10' : '$green10',
            bgColor: isOutgoing ? '$red2' : '$green2',
            title: entry.type.charAt(0).toUpperCase() + entry.type.slice(1),
        };
    }, [entry]);

    const handleCopyToken = async () => {
        if (entry?.metadata?.token) {
            await Clipboard.setStringAsync(entry.metadata.token);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleRefresh = async () => {
        if (isRefetching) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        if (entry?.metadata?.token) {
            try {
                const states = await cocoService.checkProofStates(entry.metadata.token);
                // If any proof is spent, it's claimed. If all are unspent, it's unclaimed.
                const isSpent = states.some((s: any) => s.state === 'SPENT');
                const isPending = states.some((s: any) => s.state === 'PENDING');

                let newState = entry.state;
                if (isSpent) newState = 'claimed';
                else if (isPending) newState = 'pending';
                else newState = 'unclaimed';

                // Update the state in the database if it changed
                if (newState !== entry.state) {
                    await (cocoService.getRepo().historyRepository as any).updateHistoryEntryState(entry.id, newState);
                }
            } catch (err) {
                console.warn('[TransactionDetails] Failed to refresh proof states:', err);
            }
        }

        await refetch();
        queryClient.invalidateQueries({ queryKey: ['history'] });
    };

    // Auto-refresh on mount if pending
    useEffect(() => {
        if (entry && (status === 'pending' || status === 'unclaimed')) {
            handleRefresh();
        }
    }, [entry?.id]);

    if (!entry || !style) {
        return (
            <YStack flex={1} bg="$background" items="center" justify="center" p="$4">
                <Spinner size="large" />
                <Text mt="$4" color="$gray10">Loading transaction...</Text>
            </YStack>
        );
    }

    const token = entry.metadata?.token;

    return (
        <YStack flex={1} bg="$background">
            {/* Colored Header Area */}
            <YStack bg={statusConfig.headerBg as any} pb="$4">
                <SafeAreaView edges={['top']}>
                    <XStack p="$4" items="center" justify="space-between">
                        <Button
                            circular
                            icon={<ChevronLeft size={24} color="white" />}
                            onPress={() => router.back()}
                            chromeless
                        />
                        <Text fontSize="$6" fontWeight="800" color="white">{statusConfig.label}</Text>
                        <Button
                            circular
                            icon={<RefreshCw size={20} color="white" animation={isRefetching ? "rotate" : undefined} />}
                            onPress={handleRefresh}
                            chromeless
                        />
                    </XStack>

                    <YStack items="center" gap="$2" pt="$2" pb="$4">
                        <Circle size={70} bg="rgba(255,255,255,0.2)" borderWidth={2} borderColor="rgba(255,255,255,0.5)">
                            <statusConfig.icon size={35} color="white" />
                        </Circle>
                        <YStack items="center">
                            <Text fontSize="$9" fontWeight="800" color="white">₿{entry.amount.toLocaleString()}</Text>
                            <Text color="rgba(255,255,255,0.8)" fontSize="$4" fontWeight="600">
                                {style.title} • {entry.unit?.toUpperCase() || 'SATS'}
                            </Text>
                        </YStack>
                    </YStack>
                </SafeAreaView>
            </YStack>

            <ScrollView showsVerticalScrollIndicator={false}>
                <YStack p="$4" gap="$6" pb="$10">
                    <YStack gap="$4">
                        <Text fontSize="$4" fontWeight="700" color="$gray11">Details</Text>

                        <YStack bg="$gray2" rounded="$4" p="$4" gap="$4" borderWidth={1} borderColor="$borderColor">
                            <DetailItem icon={Calendar} label="Date & Time" value={formatFullLocalTime(entry.createdAt)} />
                            <Separator borderColor="$borderColor" opacity={0.5} />
                            <DetailItem icon={Coins} label="Amount" value={`₿${entry.amount.toLocaleString()} ${entry.unit || 'sats'}`} />
                            <Separator borderColor="$borderColor" opacity={0.5} />
                            <DetailItem icon={Zap} label="Fee" value="0 sats" />
                            <Separator borderColor="$borderColor" opacity={0.5} />
                            <DetailItem icon={ShieldCheck} label="Mint" value={entry.mintUrl.replace(/^https?:\/\//, '').replace(/\/$/, '')} />
                            <Separator borderColor="$borderColor" opacity={0.5} />
                            <DetailItem
                                icon={statusConfig.icon}
                                label="Status"
                                value={status.charAt(0).toUpperCase() + status.slice(1)}
                                valueColor={statusConfig.color}
                            />
                        </YStack>
                    </YStack>

                    {token && (
                        <YStack gap="$4">
                            <XStack justify="space-between" items="center">
                                <Text fontSize="$4" fontWeight="700" color="$gray11">Token Address</Text>
                                <Button size="$2" chromeless icon={ExternalLink} onPress={() => { }}>View Details</Button>
                            </XStack>
                            <YStack bg="$gray2" rounded="$4" p="$6" items="center" gap="$6" borderWidth={1} borderColor="$borderColor">
                                <View p="$3" bg="white" rounded="$4" style={{ elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 }}>
                                    <QRCode value={token} size={220} />
                                </View>

                                <YStack gap="$3" width="100%">
                                    <View
                                        bg="$background"
                                        p="$4"
                                        rounded="$4"
                                        borderWidth={1}
                                        borderColor="$borderColor"
                                    >
                                        <Text fontSize="$2" color="$gray10" numberOfLines={3} style={{ fontFamily: 'monospace' }}>
                                            {token}
                                        </Text>
                                    </View>
                                    <XStack gap="$3">
                                        <Button flex={1} icon={Copy} onPress={handleCopyToken} bg="$gray4" fontWeight="700">Copy Token</Button>
                                        <Button circular icon={<Share2 size={20} />} bg="$gray4" />
                                    </XStack>
                                </YStack>
                            </YStack>
                        </YStack>
                    )}
                </YStack>
            </ScrollView>
        </YStack>
    );
}

function DetailItem({ icon: Icon, label, value, valueColor }: { icon: any, label: string, value: string, valueColor?: any }) {
    return (
        <XStack justify="space-between" items="center">
            <XStack gap="$3" items="center">
                <Icon size={18} color="$gray10" />
                <Text color="$gray10" fontWeight="500">{label}</Text>
            </XStack>
            <Text fontWeight="700" color={valueColor || '$color'} numberOfLines={1} style={{ maxWidth: '60%' }}>{value}</Text>
        </XStack>
    );
}
