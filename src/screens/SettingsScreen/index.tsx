import React, { useState } from 'react'
import { YStack, ScrollView, Text, YGroup, ListItem, Separator, View } from 'tamagui'
import { ShieldCheck, Palette, Bell, Globe, Info, ChevronRight } from '@tamagui/lucide-icons'
import { ThemeModal } from './components/ThemeModal'
import { BackupMnemonicModal } from './components/BackupMnemonicModal'
import * as Haptics from 'expo-haptics'

export function SettingsScreen() {
    const [isMnemonicOpen, setIsMnemonicOpen] = useState(false)
    const [isThemeOpen, setIsThemeOpen] = useState(false)

    const handleSettingPress = (id: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        if (id === 'backup') {
            setIsMnemonicOpen(true)
        } else if (id === 'theme') {
            setIsThemeOpen(true)
        }
    }

    return (
        <ScrollView bg="$background" showsVerticalScrollIndicator={false}>
            <YStack flex={1} p="$4" gap="$6" pb="$20">
                {/* Visual Header / Title */}
                <YStack gap="$1">
                    <Text fontSize="$8" fontWeight="700" color="$color">Settings</Text>
                    <Text fontSize="$3" color="$gray11">Manage your wallet preferences</Text>
                </YStack>

                {/* Security Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray11" px="$2">Security</Text>
                    <YGroup bordered separator={<Separator />}>
                        <YGroup.Item>
                            <ListItem
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                title="Backup Recovery Phrase"
                                subTitle="View your secret 12 words"
                                icon={ShieldCheck}
                                iconAfter={ChevronRight}
                                onPress={() => handleSettingPress('backup')}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Appearance Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray11" px="$2">Appearance</Text>
                    <YGroup bordered separator={<Separator />}>
                        <YGroup.Item>
                            <ListItem
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                title="Theme"
                                subTitle="Light, Dark or System"
                                icon={Palette}
                                iconAfter={ChevronRight}
                                onPress={() => handleSettingPress('theme')}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Other Settings (Placeholders) */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray11" px="$2">General</Text>
                    <YGroup bordered separator={<Separator />}>
                        <YGroup.Item>
                            <ListItem
                                opacity={0.5}
                                title="Notifications"
                                subTitle="Manage alerts and updates"
                                icon={Bell}
                                iconAfter={ChevronRight}
                            />
                        </YGroup.Item>
                        <YGroup.Item>
                            <ListItem
                                opacity={0.5}
                                title="Language"
                                subTitle="English (US)"
                                icon={Globe}
                                iconAfter={ChevronRight}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* About Section */}
                <YStack gap="$3">
                    <Text fontSize="$4" fontWeight="600" color="$gray11" px="$2">About</Text>
                    <YGroup bordered separator={<Separator />}>
                        <YGroup.Item>
                            <ListItem
                                title="Version"
                                subTitle="1.0.0 (Alpha)"
                                icon={Info}
                            />
                        </YGroup.Item>
                    </YGroup>
                </YStack>

                {/* Modals */}
                <ThemeModal
                    open={isThemeOpen}
                    onOpenChange={setIsThemeOpen}
                />
                <BackupMnemonicModal
                    open={isMnemonicOpen}
                    onOpenChange={setIsMnemonicOpen}
                />
            </YStack>
        </ScrollView>
    )
}
