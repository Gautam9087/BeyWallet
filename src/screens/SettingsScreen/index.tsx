import React, { useRef, useState } from 'react';
import { YStack, ScrollView, Text, YGroup, ListItem, H6, H2, H4, Button, XStack, View, Separator } from 'tamagui';
import { ShieldCheck, Palette, Bell, Globe, Info, ChevronRight, Trash2, AlertTriangle, Eye, EyeOff, Radio, Cloud, Clipboard, RefreshCw, Server } from '@tamagui/lucide-icons';
import { ThemeModal } from './components/ThemeModal';
import { CurrencyModal } from './components/CurrencyModal';
import { MintModal } from './components/MintModal';
import * as Haptics from 'expo-haptics';
import * as ClipboardStore from 'expo-clipboard';
import { useSettingsStore } from '~/store/settingsStore';
import { useRouter } from 'expo-router';
import { biometricService } from '~/services/biometricService';
import { seedService } from '~/services/seedService';
import { initService } from '~/services/core';
import { useOnboardingStore } from '~/store/onboardingStore';
import { useWalletStore } from '~/store/walletStore';
import { AppBottomSheetRef } from '~/components/UI/AppBottomSheet';
import AppBottomSheet from '~/components/UI/AppBottomSheet';
import { ActivityIndicator, Alert, DevSettings } from 'react-native';

export function SettingsScreen() {
    const router = useRouter();
    const themeSheetRef = useRef<AppBottomSheetRef>(null);
    const currencySheetRef = useRef<AppBottomSheetRef>(null);
    const mintSheetRef = useRef<AppBottomSheetRef>(null);
    const deleteSheetRef = useRef<AppBottomSheetRef>(null);

    const { secondaryCurrency, defaultMintUrl } = useSettingsStore();
    const resetOnboarding = useOnboardingStore(state => state.resetOnboarding);

    const [seedWords, setSeedWords] = useState<string[]>([]);
    const [isSeedVisible, setIsSeedVisible] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleSettingPress = async (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        switch (id) {
            case 'backup':
                const success = await biometricService.authenticateAsync('Authorize to view your secret backup phrase');
                if (success) {
                    router.push('/backup-seed');
                } else {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                }
                break;
            case 'theme':
                themeSheetRef.current?.present();
                break;
            case 'currency':
                currencySheetRef.current?.present();
                break;
            case 'mint':
                mintSheetRef.current?.present();
                break;
            default:
                break;
        }
    };

    const handleDeleteWallet = async () => {
        // Step 1: Biometric authentication
        const authed = await biometricService.authenticateAsync(
            'Authenticate to delete your wallet'
        );

        if (!authed) {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Step 2: Fetch and show seed
        try {
            const mnemonic = await seedService.getMnemonic();
            if (mnemonic) {
                setSeedWords(mnemonic.split(' '));
            } else {
                setSeedWords([]);
            }
            setIsSeedVisible(false);
            deleteSheetRef.current?.present();
        } catch (err) {
            console.error('[Settings] Failed to fetch seed:', err);
            Alert.alert('Error', 'Could not retrieve recovery phrase.');
        }
    };

    const executeWalletDeletion = async () => {
        setIsDeleting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);

        try {
            // 1. Destroy wallet (Manager + DB + Seed)
            await initService.destroyWallet();

            // 2. Reset onboarding state
            await resetOnboarding();

            // 3. Dismiss sheet
            deleteSheetRef.current?.dismiss();

            console.log('[Settings] Wallet deleted, reloading app...');

            // 4. Reload the app to return to onboarding
            try {
                if (__DEV__ && DevSettings?.reload) {
                    DevSettings.reload();
                } else {
                    Alert.alert(
                        'Wallet Deleted',
                        'Please restart the app to complete the reset.',
                        [{ text: 'OK' }]
                    );
                }
            } catch {
                Alert.alert(
                    'Wallet Deleted',
                    'Please restart the app to complete the reset.',
                    [{ text: 'OK' }]
                );
            }
        } catch (err: any) {
            console.error('[Settings] Delete failed:', err);
            Alert.alert('Error', `Failed to delete wallet: ${err.message}`);
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <ScrollView bg="$background" showsVerticalScrollIndicator={false}>
            <YStack flex={1} p="$4" gap="$6" pb="$20">

                {/* Security Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray10" px="$2">Security</Text>
                    <YGroup rounded="$5" bg="$gray2" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                        <YGroup.Item>
                            <ListItem
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                bg="transparent"
                                fontWeight="600"
                                title={<H6>Backup Recovery Phrase</H6>}
                                subTitle="View your secret 12 words"
                                icon={<ShieldCheck size={24} />}
                                iconAfter={<ChevronRight size={24} />}
                                onPress={() => handleSettingPress('backup')}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Appearance Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray10" px="$2">Appearance</Text>
                    <YGroup rounded="$5" bg="$gray2" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                title={<H6>Theme</H6>}
                                subTitle="Light, Dark or System"
                                icon={<Palette size={24} />}
                                iconAfter={<ChevronRight size={24} />}
                                onPress={() => handleSettingPress('theme')}
                            />
                        </YGroup.Item>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                title={<H6>Currency</H6>}
                                subTitle={`Secondary: ${secondaryCurrency}`}
                                icon={<Globe size={24} />}
                                iconAfter={<ChevronRight size={24} />}
                                onPress={() => handleSettingPress('currency')}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* General Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray10" px="$2">General</Text>
                    <YGroup rounded="$5" bg="$gray2" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                title={<H6>Default Mint</H6>}
                                subTitle={defaultMintUrl ? new URL(defaultMintUrl).hostname : 'None selected'}
                                icon={<Server size={24} />}
                                iconAfter={<ChevronRight size={24} />}
                                onPress={() => handleSettingPress('mint')}
                            />
                        </YGroup.Item>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                opacity={0.5}
                                title={<H6>Notifications</H6>}
                                subTitle="Manage alerts and updates"
                                icon={<Bell size={24} />}
                                iconAfter={<ChevronRight size={24} />}
                            />
                        </YGroup.Item>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                opacity={0.5}
                                title={<H6>Language</H6>}
                                subTitle="English (US)"
                                icon={<Globe size={24} />}
                                iconAfter={<ChevronRight size={24} />}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* About Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray10" px="$2">About</Text>
                    <YGroup rounded="$5" bg="$gray2" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                title="Version"
                                subTitle="1.0.0 (Alpha)"
                                icon={<Info size={24} />}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Danger Zone */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$red10" px="$2">Danger Zone</Text>
                    <YGroup rounded="$5" bg="$red3" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                        <YGroup.Item>
                            <ListItem
                                bg="transparent"
                                fontWeight="600"
                                hoverStyle={{ bg: '$red4' }}
                                pressStyle={{ bg: '$red5' }}
                                title={<H6 color="$red10">Delete Wallet</H6>}
                                subTitle="Permanently erase all wallet data"
                                icon={<Trash2 size={24} color="$red10" />}
                                iconAfter={<ChevronRight size={24} color="$red10" />}
                                onPress={handleDeleteWallet}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Bottom Sheets */}
                <ThemeModal ref={themeSheetRef} />
                <CurrencyModal ref={currencySheetRef} />
                <MintModal ref={mintSheetRef} />

                {/* Delete Wallet Sheet */}
                <AppBottomSheet ref={deleteSheetRef} snapPoints={['85%']}>
                    <YStack p="$4" gap="$4">
                        {/* Warning */}
                        <View bg="$red3" p="$4" rounded="$4" borderWidth={1} borderColor="$red8">
                            <XStack gap="$3">
                                <AlertTriangle color="$red10" size={24} />
                                <YStack flex={1}>
                                    <Text color="$red10" fontWeight="700" fontSize="$5">
                                        Delete Wallet
                                    </Text>
                                    <Text color="$red10" fontSize="$3" mt="$1">
                                        This will permanently delete all wallet data including proofs, mints, and history. Back up your seed phrase before proceeding!
                                    </Text>
                                </YStack>
                            </XStack>
                        </View>

                        {/* Seed Display */}
                        <YStack gap="$3">
                            <XStack justify="space-between" items="center">
                                <Text fontWeight="700" fontSize="$5">Recovery Phrase</Text>
                                <Button
                                    size="$3"
                                    chromeless
                                    icon={isSeedVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                        setIsSeedVisible(!isSeedVisible);
                                    }}
                                >
                                    {isSeedVisible ? 'Hide' : 'Show'}
                                </Button>
                            </XStack>

                            <View
                                bg="$gray3"
                                p="$3"
                                rounded="$4"
                                borderWidth={1}
                                borderColor="$borderColor"
                            >
                                <XStack flexWrap="wrap" gap="$2" justify="center">
                                    {seedWords.map((word, index) => (
                                        <XStack
                                            key={index}
                                            bg="$background"
                                            px="$3"
                                            py="$2"
                                            rounded="$3"
                                            borderWidth={1}
                                            borderColor="$borderColor"
                                            minW="45%"
                                            items="center"
                                        >
                                            <Text fontSize="$2" color="$gray10" mr="$2" width={20}>
                                                {index + 1}
                                            </Text>
                                            <Text
                                                fontSize="$4"
                                                fontWeight="600"
                                                filter={isSeedVisible ? undefined : 'blur(5px)'}
                                            >
                                                {word}
                                            </Text>
                                        </XStack>
                                    ))}
                                </XStack>
                            </View>
                        </YStack>

                        {/* Delete Buttons */}
                        <YStack gap="$3" mt="$2">
                            {isDeleting ? (
                                <YStack items="center" gap="$3" py="$4">
                                    <ActivityIndicator size="large" color="#ff0000" />
                                    <Text color="$red10" fontWeight="600">Deleting wallet...</Text>
                                </YStack>
                            ) : (
                                <>
                                    <Button
                                        size="$5"
                                        bg="$red9"
                                        color="white"
                                        fontWeight="700"
                                        rounded="$4"
                                        onPress={executeWalletDeletion}
                                        pressStyle={{ scale: 0.98, bg: '$red10' }}
                                        icon={<Trash2 size={20} color="white" />}
                                    >
                                        I've Backed Up, Delete Everything
                                    </Button>
                                    <Button
                                        size="$5"
                                        theme="gray"
                                        fontWeight="700"
                                        rounded="$4"
                                        onPress={() => deleteSheetRef.current?.dismiss()}
                                    >
                                        Cancel
                                    </Button>
                                </>
                            )}
                        </YStack>
                    </YStack>
                </AppBottomSheet>
            </YStack>
        </ScrollView >
    );
}
