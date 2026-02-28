import React, { forwardRef } from 'react';
import { YStack, Text, ListItem, YGroup, Separator, ScrollView } from 'tamagui';
import { Check, Server } from '@tamagui/lucide-icons';
import AppBottomSheet, { AppBottomSheetRef } from '~/components/UI/AppBottomSheet';
import { useSettingsStore } from '~/store/settingsStore';
import { useWalletStore } from '~/store/walletStore';
import * as Haptics from 'expo-haptics';

export const MintModal = forwardRef<AppBottomSheetRef>((_, ref) => {
    const { defaultMintUrl, setDefaultMintUrl } = useSettingsStore();
    const { mints, setActiveMint } = useWalletStore();

    const handleSelect = (url: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        setDefaultMintUrl(url);
        // Also update the currently active session mint to match the new preference
        setActiveMint(url);
        (ref as React.RefObject<AppBottomSheetRef>).current?.dismiss();
    };

    return (
        <AppBottomSheet ref={ref} snapPoints={['60%']}>
            <YStack p="$4" gap="$4" flex={1}>
                <YStack gap="$1">
                    <Text fontSize="$6" fontWeight="700">Default Mint</Text>
                    <Text fontSize="$3" color="$gray11">Choose the primary mint for operations</Text>
                </YStack>

                <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
                    <YGroup bordered separator={<Separator />}>
                        {mints.map((mint) => {
                            const isSelected = mint.mintUrl === defaultMintUrl;
                            const hostname = new URL(mint.mintUrl).hostname;

                            return (
                                <YGroup.Item key={mint.mintUrl}>
                                    <ListItem
                                        hoverStyle={{ bg: '$backgroundHover' }}
                                        pressStyle={{ bg: '$backgroundPress' }}
                                        icon={<Server size={20} color={isSelected ? "$accentColor" : "$gray10"} />}
                                        title={<Text fontWeight={isSelected ? "700" : "500"}>{mint.nickname || hostname}</Text>}
                                        subTitle={mint.mintUrl}
                                        iconAfter={isSelected ? <Check color="$accentColor" /> : null}
                                        onPress={() => handleSelect(mint.mintUrl)}
                                    />
                                </YGroup.Item>
                            );
                        })}
                    </YGroup>
                </ScrollView>
            </YStack>
        </AppBottomSheet>
    );
});

MintModal.displayName = 'MintModal';
