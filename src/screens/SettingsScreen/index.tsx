import React, { useRef } from 'react';
import { YStack, ScrollView, Text, YGroup, ListItem, H6 } from 'tamagui';
import { ShieldCheck, Palette, Bell, Globe, Info, ChevronRight } from '@tamagui/lucide-icons';
import { ThemeModal } from './components/ThemeModal';
import { CurrencyModal } from './components/CurrencyModal';
import * as Haptics from 'expo-haptics';
import { useSettingsStore } from '~/store/settingsStore';
import { useRouter } from 'expo-router';
import { biometricService } from '~/services/biometricService';
import { AppBottomSheetRef } from '~/components/UI/AppBottomSheet';

export function SettingsScreen() {
    const router = useRouter();
    const themeSheetRef = useRef<AppBottomSheetRef>(null);
    const currencySheetRef = useRef<AppBottomSheetRef>(null);

    const { secondaryCurrency } = useSettingsStore();

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
            default:
                break;
        }
    };

    return (
        <ScrollView bg="$background" showsVerticalScrollIndicator={false}>
            <YStack flex={1} p="$4" gap="$6" pb="$20">

                {/* Security Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray10" px="$2">Security</Text>
                    <YGroup>
                        <YGroup.Item>
                            <ListItem
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                bg="$gray5"
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
                    <YGroup>
                        <YGroup.Item>
                            <ListItem
                                bg="$gray5"
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
                                bg="$gray5"
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
                    <YGroup>
                        <YGroup.Item>
                            <ListItem
                                bg="$gray5"
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
                                bg="$gray5"
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
                    <YGroup>
                        <YGroup.Item>
                            <ListItem
                                bg="$gray5"
                                fontWeight="600"
                                title="Version"
                                subTitle="1.0.0 (Alpha)"
                                icon={<Info size={24} />}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Bottom Sheets */}
                <ThemeModal ref={themeSheetRef} />
                <CurrencyModal ref={currencySheetRef} />
            </YStack>
        </ScrollView>
    );
}
