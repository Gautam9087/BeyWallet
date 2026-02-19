import React, { useState, useMemo, useRef } from 'react';
import { YStack, XStack, Text, ScrollView, Button, View, Separator, Circle, ListItem, Avatar, Square, Input } from 'tamagui';
import { ChevronLeft, ChevronDown, RefreshCw, Check, Building2, Globe, ShieldCheck, ShieldAlert, Plus, Trash2, Copy, ExternalLink, ArrowRight, ChevronRight, AlertCircle } from '@tamagui/lucide-icons';
import { useRouter, Stack } from 'expo-router';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import QRCode from "react-native-qrcode-svg";
import { useWalletStore } from '~/store/walletStore';
import { RollingNumber } from '~/components/UI/RollingNumber';
import AppBottomSheet, { AppBottomSheetRef } from '~/components/UI/AppBottomSheet';
import AddMintModal, { AddMintModalRef } from '~/components/AddMintModal';
import { mintService } from '~/services/mintService';

export default function MintsModal() {
    const router = useRouter();
    const { mints, balances, refreshBalance, isInitializing, activeMintUrl, setActiveMint, untrustMint, refreshMintList } = useWalletStore();

    const [selectedMintForSheet, setSelectedMintForSheet] = useState<any>(null);
    const [amount, setAmount] = useState("1000");
    const [quote, setQuote] = useState<{ pr: string, quoteId: string } | null>(null);
    const [isRequesting, setIsRequesting] = useState(false);
    const [isChecking, setIsChecking] = useState(false);

    const sheetRef = useRef<AppBottomSheetRef>(null);
    const confirmDeleteSheetRef = useRef<AppBottomSheetRef>(null);
    const addMintModalRef = useRef<AddMintModalRef>(null);
    const [selectionMode, setSelectionMode] = useState(false);
    const [selectedUrls, setSelectedUrls] = useState<Set<string>>(new Set());

    const totalBalance = useMemo(() => {
        return Object.values(balances).reduce((a, b) => a + b, 0);
    }, [balances]);

    const canDeleteCount = useMemo(() => {
        return Array.from(selectedUrls).filter(url => (balances[url] || 0) === 0).length;
    }, [selectedUrls, balances]);

    const handleRefresh = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await refreshBalance();
    };

    const handleMintPress = (mint: any) => {
        if (selectionMode) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            const next = new Set(selectedUrls);
            if (next.has(mint.mintUrl)) next.delete(mint.mintUrl);
            else next.add(mint.mintUrl);
            setSelectedUrls(next);
        } else {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setSelectedMintForSheet(mint);
            setQuote(null);
            sheetRef.current?.present();
        }
    };

    const handleRequestMint = async () => {
        if (!selectedMintForSheet || !amount) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setIsRequesting(true);
        try {
            const res = await mintService.requestMintQuote(selectedMintForSheet.mintUrl, parseInt(amount));
            setQuote({ pr: res.request, quoteId: res.quote });
        } catch (err) {
            console.error(err);
        } finally {
            setIsRequesting(false);
        }
    };

    const handleCheckPayment = async () => {
        if (!quote) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setIsChecking(true);
        try {
            await mintService.checkAndMint(quote.quoteId);
            refreshBalance();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sheetRef.current?.dismiss();
        } catch (err) {
            console.error(err);
        } finally {
            setIsChecking(false);
        }
    };

    const copyToClipboard = async () => {
        if (quote) {
            await Clipboard.setStringAsync(quote.pr);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const toggleSelectAll = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        if (selectedUrls.size === mints.length) {
            setSelectedUrls(new Set());
        } else {
            setSelectedUrls(new Set(mints.map((e: any) => e.mintUrl)));
        }
    };

    const handleDeleteMints = async () => {
        const toDelete = Array.from(selectedUrls).filter(url => (balances[url] || 0) === 0);

        if (toDelete.length > 0) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            for (const url of toDelete) {
                await untrustMint(url);
            }
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }

        setSelectionMode(false);
        setSelectedUrls(new Set());
        confirmDeleteSheetRef.current?.dismiss();
        refreshBalance();
        refreshMintList();
    };

    return (
        <YStack flex={1} bg="$background">
            <Stack.Screen
                options={{
                    headerTitle: selectionMode ? `${selectedUrls.size} Selected` : 'Mints',
                    headerLeft: () => selectionMode ? (
                        <Button
                            chromeless
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                setSelectionMode(false);
                                setSelectedUrls(new Set());
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
                                icon={<Check size={20} color={selectedUrls.size === mints.length ? "$accent10" : "$gray10"} />}
                                onPress={toggleSelectAll}
                            />
                            <Button
                                circular
                                chromeless
                                disabled={selectedUrls.size === 0}
                                opacity={selectedUrls.size === 0 ? 0.3 : 1}
                                icon={<Trash2 size={20} color="$red10" />}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                    confirmDeleteSheetRef.current?.present();
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
                                disabled={mints.length === 0}
                                opacity={mints.length === 0 ? 0.3 : 1}
                            >
                                <Text color="$accent10" fontWeight="700">Edit</Text>
                            </Button>
                            <Button
                                circular
                                chromeless
                                icon={<RefreshCw size={20} className={isInitializing ? 'spin' : ''} />}
                                onPress={handleRefresh}
                            />
                        </XStack>
                    )
                }}
            />

            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <YStack px="$4" pt="$4" gap="$2">
                    <XStack>
                        <Button
                            size="$2.5"
                            theme="gray"
                            bg="$color5"
                            px="$3"
                            rounded="$12"
                            icon={<Plus size={14} />}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                                addMintModalRef.current?.present();
                            }}
                            pressStyle={{ scale: 0.97, opacity: 0.9 }}
                        >
                            <Text fontWeight="700" fontSize="$3">Add New Mint</Text>
                        </Button>
                    </XStack>

                    <YStack py="$2">
                        <Text fontSize="$4" color="$gray10" fontWeight="700">Total Balance</Text>
                        <XStack items="baseline" gap="$0" py="$2">
                            <Text fontSize={34} fontWeight="900" color="$accent4">₿</Text>
                            <RollingNumber
                                fontSize={30}
                                fontWeight="900"
                                color="$accent4"
                                showDecimals={false}
                                letterSpacing={-2}

                            >
                                {totalBalance}
                            </RollingNumber>
                        </XStack>
                        <Text fontSize="$3" color="$gray10">
                            Across {mints.filter(m => m.trusted).length} trusted mints
                        </Text>
                    </YStack>

                    <YStack pt="$4">
                        <XStack justify="space-between" themeInverse pb="$4" items="center">
                            <Text fontSize="$5" color="$color4" fontWeight="800">Connected Mints</Text>
                            <View bg="$gray2" px="$2" py="$1" rounded="$3">
                                <Text fontSize="$3" color="$color" fontWeight="800">{mints.length}</Text>
                            </View>
                        </XStack>

                        <YStack rounded="$5" bg="$gray2" borderWidth={1}
                            borderColor="$gray6"
                            overflow="hidden">
                            {mints.length === 0 ? (
                                <YStack py="$10" items="center" justify="center" gap="$3" opacity={0.5} p="$3">
                                    <View p="$4" bg="$gray2" rounded="$10">
                                        <Globe size={32} color="$gray9" />
                                    </View>
                                    <YStack items="center">
                                        <Text fontWeight="700">No mints connected</Text>
                                        <Text fontSize="$3" color="$gray9" text="center" mt="$1">
                                            Trusted mints will appear here.
                                        </Text>
                                    </YStack>
                                </YStack>
                            ) : (
                                mints.map((mint, index) => {
                                    const balance = balances[mint.mintUrl] || 0;
                                    const isActive = mint.mintUrl === activeMintUrl;

                                    return (
                                        <React.Fragment key={mint.mintUrl}>
                                            <YStack
                                                onPress={() => handleMintPress(mint)}
                                                pressStyle={{ opacity: 0.7, scale: 0.98 }}
                                                py="$2"
                                                px="$2"

                                            >
                                                <XStack justify="space-between" items="center">
                                                    <XStack gap="$3" items="center">
                                                        {selectionMode && (
                                                            <View
                                                                width={22} height={22} rounded="$10"
                                                                borderWidth={2}
                                                                borderColor={selectedUrls.has(mint.mintUrl) ? "$accent10" : "$gray8"}
                                                                bg={selectedUrls.has(mint.mintUrl) ? "$accent10" : "transparent"}
                                                                items="center" justify="center"
                                                            >
                                                                {selectedUrls.has(mint.mintUrl) && <Check size={14} color="white" strokeWidth={3} />}
                                                            </View>
                                                        )}
                                                        <Avatar rounded="$4" size="$3" borderWidth={1} borderColor="$borderColor">
                                                            <Avatar.Image src={mint.icon} />
                                                            <Avatar.Fallback backgroundColor="$gray2" alignItems="center" justifyContent="center">
                                                                <Building2 size={24} color="$gray10" />
                                                            </Avatar.Fallback>
                                                        </Avatar>
                                                        <YStack>
                                                            <XStack gap="$2" items="center" >
                                                                {mint.trusted ? (
                                                                    <ShieldCheck size={16} color="$green10" />
                                                                ) : (
                                                                    <ShieldAlert size={16} color="$orange10" />
                                                                )}
                                                                <Text fontWeight="800" fontSize="$4" numberOfLines={2} color="$accent4" style={{ maxWidth: 100 }}>
                                                                    {mint.nickname || mint.name || 'Unnamed Mint'}
                                                                </Text>
                                                                {isActive && (
                                                                    <XStack px="$1.5" py="$0.5" bg="$accent3" rounded="$2">
                                                                        <Text fontSize="$1" fontWeight="800" color="$accent11">ACTIVE</Text>
                                                                    </XStack>
                                                                )}
                                                            </XStack>
                                                        </YStack>
                                                    </XStack>

                                                    <YStack items="flex-end">
                                                        <Text fontWeight="900" fontSize="$5" color="$accent4">
                                                            ₿{balance.toLocaleString()}
                                                        </Text>
                                                    </YStack>
                                                </XStack>
                                            </YStack>
                                            {index < mints.length - 1 && <Separator borderColor="$borderColor" opacity={0.5} />}
                                        </React.Fragment>
                                    );
                                })
                            )}
                        </YStack>
                    </YStack>
                </YStack>
            </ScrollView>

            <AppBottomSheet ref={sheetRef} snapPoints={["85%"]}>
                <ScrollView showsVerticalScrollIndicator={false}>
                    <YStack p="$4" gap="$5">
                        {/* Mint Profile Header */}
                        <XStack gap="$4" items="center">
                            <Avatar rounded="$6" size="$6" borderWidth={2} borderColor="$borderColor">
                                <Avatar.Image src={selectedMintForSheet?.icon} />
                                <Avatar.Fallback bg="$gray2" items="center" justify="center">
                                    <Building2 size={48} color="$gray10" />
                                </Avatar.Fallback>
                            </Avatar>
                            <YStack flex={1}>
                                <Text fontSize="$7" fontWeight="900">{selectedMintForSheet?.nickname || selectedMintForSheet?.name}</Text>
                                <Text fontSize="$3" color="$gray10">{selectedMintForSheet?.mintUrl}</Text>
                                <XStack mt="$2" gap="$2">
                                    {selectedMintForSheet?.trusted ? (
                                        <XStack px="$2" py="$1" bg="$green2" rounded="$2" items="center" gap="$1">
                                            <ShieldCheck size={14} color="$green10" />
                                            <Text fontSize="$1" fontWeight="800" color="$green10">TRUSTED</Text>
                                        </XStack>
                                    ) : (
                                        <XStack px="$2" py="$1" bg="$orange2" rounded="$2" items="center" gap="$1">
                                            <ShieldAlert size={14} color="$orange10" />
                                            <Text fontSize="$1" fontWeight="800" color="$orange10">UNTRUSTED</Text>
                                        </XStack>
                                    )}
                                </XStack>
                            </YStack>
                        </XStack>

                        <Separator />

                        {/* Balance Section */}
                        <YStack gap="$2" items="center" bg="$gray2" p="$4" rounded="$6">
                            <Text fontSize="$4" color="$gray10" fontWeight="700">Spendable Balance</Text>
                            <XStack items="baseline" gap="$0">

                                <RollingNumber
                                    letterSpacing={-1}
                                    prefix='₿'
                                    fontSize={32}
                                    fontWeight="900"
                                    color="$accent4"
                                    showDecimals={false}
                                >
                                    {selectedMintForSheet ? (balances[selectedMintForSheet.mintUrl] || 0) : 0}
                                </RollingNumber>
                            </XStack>
                        </YStack>

                        {/* Deposit Section */}
                        <YStack gap="$4">
                            <Text fontSize="$6" fontWeight="800">Direct Deposit</Text>
                            {!quote ? (
                                <YStack gap="$3">
                                    <Text color="$gray10" fontSize="$3">Enter amount to generate a Lightning invoice for this mint.</Text>
                                    <Input
                                        size="$5"
                                        placeholder="Amount in SATS"
                                        value={amount}
                                        onChangeText={setAmount}
                                        keyboardType="numeric"
                                        fontWeight="700"
                                        text="center"
                                        fontSize="$6"
                                    />
                                    <Button
                                        theme="accent"
                                        size="$5"
                                        fontWeight="800"
                                        disabled={isRequesting || !amount}
                                        onPress={handleRequestMint}
                                        icon={isRequesting ? <RefreshCw className="spin" size={20} /> : <Plus size={20} />}
                                    >
                                        {isRequesting ? "Requesting Invoice..." : "Generate Invoice"}
                                    </Button>
                                </YStack>
                            ) : (
                                <YStack items="center" gap="$4">
                                    <View bg="white" p="$4" rounded="$8" style={{ elevation: 10 }}>
                                        <QRCode value={quote.pr} size={220} />
                                    </View>

                                    <XStack gap="$2" width="100%">
                                        <Button flex={1} variant="outlined" size="$4" onPress={copyToClipboard} icon={<Copy size={16} />}>
                                            Copy
                                        </Button>
                                        <Button flex={1} variant="outlined" size="$4" onPress={() => setQuote(null)} icon={<RefreshCw size={16} />}>
                                            Retry
                                        </Button>
                                    </XStack>

                                    <Button
                                        theme="green"
                                        size="$5"
                                        width="100%"
                                        disabled={isChecking}
                                        onPress={handleCheckPayment}
                                        fontWeight="800"
                                    >
                                        {isChecking ? "Checking..." : "I've Paid"}
                                    </Button>

                                    <Text fontSize="$2" color="$gray10" text="center">
                                        Tokens will be added to your balance automatically once the invoice is paid.
                                    </Text>
                                </YStack>
                            )}
                        </YStack>

                        <YStack gap="$2" pb="$10">
                            <Button
                                theme="gray"
                                size="$4"
                                chromeless
                                onPress={() => {
                                    sheetRef.current?.dismiss();
                                    router.push({
                                        pathname: '/(modals)/mint-profile',
                                        params: { mintUrl: selectedMintForSheet.mintUrl }
                                    });
                                }}
                                iconAfter={<ChevronRight size={18} />}
                            >
                                View Detailed Profile
                            </Button>
                        </YStack>
                    </YStack>
                </ScrollView>
            </AppBottomSheet>

            <AppBottomSheet ref={confirmDeleteSheetRef}>
                <YStack p="$4" gap="$4">
                    <XStack justify="center" items="center" gap="$2">
                        <AlertCircle size={24} color="$red10" />
                        <Text fontSize="$6" fontWeight="800" color="$red10">Remove Mints?</Text>
                    </XStack>

                    <Text text="center" fontSize="$4" color="$gray11">
                        Are you sure you want to untrust the selected mints?
                        <Text fontWeight="800" color="$red11"> Note: Only mints with zero balance will be removed. </Text>
                        Their tokens will remain in your wallet but won't be spendable until re-trusted.
                    </Text>

                    <YStack gap="$3" mt="$2">
                        <Button
                            bg="$red10"
                            color="white"
                            size="$5"
                            fontWeight="800"
                            disabled={canDeleteCount === 0}
                            opacity={canDeleteCount === 0 ? 0.5 : 1}
                            onPress={handleDeleteMints}
                        >
                            Untrust {canDeleteCount} Mints
                        </Button>
                        <Button
                            variant="outlined"
                            size="$5"
                            fontWeight="800"
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                confirmDeleteSheetRef.current?.dismiss();
                            }}
                        >
                            Cancel
                        </Button>
                    </YStack>
                </YStack>
            </AppBottomSheet>

            <AddMintModal ref={addMintModalRef} />
        </YStack>
    );
}
