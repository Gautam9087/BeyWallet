import React, { useState, useMemo, useRef } from 'react';
import { YStack, XStack, Text, ScrollView, Button, View, Separator, Circle, ListItem, Avatar, Square } from 'tamagui';
import { ChevronLeft, ChevronDown, RefreshCw, ArrowUpRight, ArrowDownLeft, Check, History as HistoryIcon, Building2, BanknoteArrowUp, BanknoteArrowDown, Landmark, Clock, Trash2 } from '@tamagui/lucide-icons';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useQuery } from '@tanstack/react-query';
import { historyService } from '~/services/core';
import { useWalletStore } from '~/store/walletStore';
import { formatLocalTime } from '~/utils/time';
import { RollingNumber } from '~/components/UI/RollingNumber';
import AppBottomSheet, { AppBottomSheetRef } from '~/components/UI/AppBottomSheet';

export default function EcashModal() {
    const router = useRouter();
    const { mints } = useWalletStore();
    const [selectedMint, setSelectedMint] = useState('all');
    const sheetRef = useRef<AppBottomSheetRef>(null);

    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const confirmSheetRef = useRef<AppBottomSheetRef>(null);

    const { data: history = [], isFetching, refetch } = useQuery({
        queryKey: ['history', 'pending'],
        queryFn: async () => {
            const entries = await historyService.getHistory(500, 0);
            return entries.filter((e: any) => e.state === 'pending' || e.state === 'unclaimed');
        }
    });

    const filteredHistory = useMemo(() => {
        let result = history;
        if (selectedMint !== 'all') {
            result = result.filter((e: any) => e.mintUrl.replace(/\/$/, '') === selectedMint.replace(/\/$/, ''));
        }
        return result;
    }, [history, selectedMint]);

    const totalPending = useMemo(() => {
        return filteredHistory.reduce((sum, entry) => sum + (entry.amount || 0), 0);
    }, [filteredHistory]);

    const handleItemPress = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({
            pathname: '/(modals)/transaction-details',
            params: { id }
        });
    };

    const handleSelectMint = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setSelectedMint(url);
        sheetRef.current?.dismiss();
        setSelectionMode(false);
        setSelectedIds(new Set());
    };

    const toggleSelection = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedIds(next);
    };

    const toggleSelectAll = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (selectedIds.size === filteredHistory.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredHistory.map((e: any) => e.id)));
        }
    };

    const handleDelete = async () => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        try {
            await historyService.deleteHistoryEntries(Array.from(selectedIds));
            setSelectionMode(false);
            setSelectedIds(new Set());
            confirmSheetRef.current?.dismiss();
            refetch();
        } catch (err) {
            console.error('Delete failed:', err);
        }
    };

    const getMintLabel = (url: string) => {
        if (url === 'all') return 'All Mints';
        const mint = mints.find(m => m.mintUrl === url);
        return mint?.nickname || mint?.name || url.replace(/^https?:\/\//, '').substring(0, 15);
    };

    const getTransactionStyle = (type: string) => {
        const isOutgoing = type === 'send' || type === 'melt';
        return {
            icon: type === 'mint' ? Landmark : (isOutgoing ? BanknoteArrowUp : BanknoteArrowDown),
            iconColor: isOutgoing ? '$red10' : '$green11',
            bgColor: isOutgoing ? '$red2' : '$green2',
            sign: isOutgoing ? '-' : '+',
        };
    };

    const activeMint = mints.find(m => m.mintUrl === selectedMint);

    return (
        <YStack flex={1} bg="$background">
            <Stack.Screen
                options={{
                    headerTitle: selectionMode ? `${selectedIds.size} Selected` : 'E-Cash',
                    headerLeft: () => selectionMode ? (
                        <Button
                            chromeless
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectionMode(false);
                                setSelectedIds(new Set());
                            }}
                        >
                            <Text color="$color11" fontWeight="600">Cancel</Text>
                        </Button>
                    ) : (
                        <Button
                            circular
                            chromeless
                            icon={<ChevronLeft size={24} />}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                router.back();
                            }}
                        />
                    ),
                    headerRight: () => selectionMode ? (
                        <XStack items="center" gap="$2">
                            <Button
                                circular
                                chromeless
                                icon={<Check size={20} color={selectedIds.size === filteredHistory.length ? "$accent10" : "$gray10"} />}
                                onPress={toggleSelectAll}
                            />
                            <Button
                                circular
                                chromeless
                                disabled={selectedIds.size === 0}
                                opacity={selectedIds.size === 0 ? 0.3 : 1}
                                icon={<Trash2 size={20} color="$red10" />}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    confirmSheetRef.current?.present();
                                }}
                            />
                        </XStack>
                    ) : (
                        <XStack items="center" gap="$0">
                            <Button
                                chromeless
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    setSelectionMode(true);
                                }}
                                disabled={filteredHistory.length === 0}
                                opacity={filteredHistory.length === 0 ? 0.3 : 1}
                            >
                                <Text color="$accent4" fontWeight="700">Edit</Text>
                            </Button>
                            <Button
                                circular
                                chromeless
                                icon={<RefreshCw size={20} className={isFetching ? 'spin' : ''} />}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    refetch();
                                }}
                            />
                        </XStack>
                    )
                }}
            />

            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <YStack px="$4" pt="$4" gap="$2" >
                    <XStack>

                        <Button
                            size="$2.5"
                            theme="gray"
                            px="$1.5"
                            rounded="$3"
                            borderWidth={1}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                                sheetRef.current?.present();
                            }}

                            pressStyle={{ scale: 0.97, opacity: 0.9 }}
                            icon={
                                <Avatar rounded="$3" size="$1.5">
                                    <Avatar.Image src={activeMint?.icon} />
                                    <Avatar.Fallback backgroundColor="$color5" alignItems="center" justifyContent="center">
                                        <Building2 size={12} color="$color10" />
                                    </Avatar.Fallback>
                                </Avatar>
                            }
                            iconAfter={
                                <Square size="$1.5" bg="$color2" rounded="$3">
                                    <ChevronDown size={12} strokeWidth={2.5} color="$color" />
                                </Square>
                            }
                            textProps={{ numberOfLines: 1, ellipsizeMode: 'tail', maxW: 100 }}
                        >
                            {getMintLabel(selectedMint)}
                        </Button>
                    </XStack>
                    <XStack items="baseline" gap="$0" py="$2">
                        <Text fontSize={30} fontWeight="900" color="$accent4">₿</Text>
                        <RollingNumber
                            fontSize={30}
                            fontWeight="900"
                            color="$accent4"
                            showDecimals={false}
                            letterSpacing={-2}
                        >
                            {totalPending}
                        </RollingNumber>
                    </XStack>
                    <Text fontSize="$3" color="$gray10">
                        {filteredHistory.length} tokens ready to be claimed
                    </Text>

                    <YStack pt="$4">
                        <XStack justify="space-between" themeInverse pb="$4" items="center">
                            <Text fontSize="$5" color="$color4" fontWeight="800">Available Tokens</Text>
                            <View bg="$gray2" px="$2" py="$1" rounded="$3">
                                <Text fontSize="$3" color="$color" fontWeight="800">{filteredHistory.length}</Text>
                            </View>

                        </XStack>

                        <YStack gap="$4">
                            {filteredHistory.length === 0 ? (
                                <YStack py="$10" items="center" justify="center" gap="$3" opacity={0.5}>
                                    <View p="$4" bg="$gray2" rounded="$10">
                                        <HistoryIcon size={32} color="$gray9" />
                                    </View>
                                    <YStack items="center">
                                        <Text fontWeight="700">No pending tokens</Text>
                                        <Text fontSize="$3" color="$gray9" text="center" mt="$1">
                                            Tokens waiting to be claimed will appear here.
                                        </Text>
                                    </YStack>
                                </YStack>
                            ) : (
                                filteredHistory.map((entry: any) => {
                                    const style = getTransactionStyle(entry.type);
                                    const status = entry.state || 'pending';

                                    return (
                                        <YStack
                                            key={entry.id}
                                            onPress={() => {
                                                if (selectionMode) {
                                                    toggleSelection(entry.id);
                                                } else {
                                                    handleItemPress(entry.id);
                                                }
                                            }}
                                            pressStyle={{ opacity: 0.7, scale: 0.98 }}
                                        >
                                            <XStack justify="space-between" items="center">
                                                <XStack gap="$3" items="center">
                                                    {selectionMode && (
                                                        <View
                                                            width={22} height={22} rounded="$10"
                                                            borderWidth={2}
                                                            borderColor={selectedIds.has(entry.id) ? "$accent10" : "$gray8"}
                                                            bg={selectedIds.has(entry.id) ? "$accent10" : "transparent"}
                                                            items="center" justify="center"
                                                        >
                                                            {selectedIds.has(entry.id) && <Check size={14} color="white" strokeWidth={3} />}
                                                        </View>
                                                    )}
                                                    <View
                                                        p="$2.5"
                                                        rounded="$10"
                                                        borderWidth={1}
                                                        borderColor="$borderColor"
                                                        bg="$gray2"
                                                    >
                                                        <style.icon size={22} strokeWidth={2.5} color={style.iconColor as any} />
                                                    </View>
                                                    <YStack>
                                                        <XStack gap="$2" items="center">
                                                            <Text fontWeight="700" fontSize="$4" textTransform="capitalize">
                                                                {entry.type}
                                                            </Text>
                                                            <XStack px="$1.5" py="$0.5" bg="$gray5" rounded="$2">
                                                                <Text fontSize="$1" fontWeight="800" textTransform="uppercase" color="$gray10">
                                                                    {status}
                                                                </Text>
                                                            </XStack>
                                                        </XStack>

                                                    </YStack>
                                                </XStack>

                                                <YStack items="flex-end">
                                                    <Text
                                                        fontWeight="900"
                                                        fontSize="$5"
                                                        color={style.iconColor as any}
                                                    >
                                                        {style.sign}{entry.amount.toLocaleString()}
                                                    </Text>
                                                    <Text fontSize="$1" color="$gray10" fontWeight="600">{entry.unit?.toUpperCase() || 'SATS'}</Text>
                                                </YStack>
                                            </XStack>
                                        </YStack>
                                    );
                                })
                            )}
                        </YStack>
                    </YStack>
                </YStack>
            </ScrollView>

            <AppBottomSheet ref={confirmSheetRef}>
                <YStack p="$4" gap="$5">
                    <YStack gap="$2" items="center">
                        <View p="$4" bg="$red2" rounded="$10">
                            <Trash2 size={32} color="$red10" />
                        </View>
                        <Text fontSize="$6" fontWeight="800">Delete E-Cash?</Text>
                        <Text color="$gray10" text="center" px="$4">
                            You are about to delete {selectedIds.size} token{selectedIds.size > 1 ? 's' : ''} from your database. This cannot be undone.
                        </Text>
                    </YStack>

                    <YStack gap="$3">
                        <Button
                            theme="red"
                            size="$5"
                            fontWeight="800"
                            onPress={handleDelete}
                        >
                            Confirm Delete
                        </Button>
                        <Button
                            chromeless
                            size="$5"
                            fontWeight="800"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                confirmSheetRef.current?.dismiss();
                            }}
                        >
                            Cancel
                        </Button>
                    </YStack>
                </YStack>
            </AppBottomSheet>

            <AppBottomSheet ref={sheetRef} snapPoints={["50%", "85%"]}>
                <YStack p="$4" gap="$4">
                    <Text fontSize="$6" fontWeight="700">Filter by Mint</Text>
                    <ScrollView showsVerticalScrollIndicator={false}>
                        <YStack gap="$2" pb="$4">
                            <ListItem
                                title="All Mints"
                                icon={<Building2 size={20} color="$gray10" />}
                                iconAfter={selectedMint === 'all' ? <Check size={18} color="$green10" /> : null}
                                onPress={() => handleSelectMint('all')}
                                bg={selectedMint === 'all' ? "$gray3" : "transparent"}
                                rounded="$4"
                            />
                            {mints.map((mint) => (
                                <ListItem
                                    key={mint.mintUrl}
                                    title={mint.nickname || mint.name || mint.mintUrl.replace(/^https?:\/\//, '')}
                                    subTitle={mint.mintUrl}
                                    icon={
                                        <Avatar rounded="$3" size="$2">
                                            <Avatar.Image src={mint.icon} />
                                            <Avatar.Fallback backgroundColor="$gray5" alignItems="center" justifyContent="center">
                                                <Building2 size={16} color="$gray10" />
                                            </Avatar.Fallback>
                                        </Avatar>
                                    }
                                    iconAfter={selectedMint === mint.mintUrl ? <Check size={18} color="$green10" /> : null}
                                    onPress={() => handleSelectMint(mint.mintUrl)}
                                    bg={selectedMint === mint.mintUrl ? "$gray3" : "transparent"}
                                    rounded="$4"
                                />
                            ))}
                        </YStack>
                    </ScrollView>
                </YStack>
            </AppBottomSheet>
        </YStack>
    );
}

