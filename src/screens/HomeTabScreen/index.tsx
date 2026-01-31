import { ExternalLink } from '@tamagui/lucide-icons'
import { Anchor, H2, Paragraph, XStack, YStack, ScrollView } from 'tamagui'
import { ToastControl } from 'components/CurrentToast'
import { ThemeSelector } from './components/ThemeSelector'
import { LocalizationTest } from './components/LocalizationTest'
import { BiometricUnlock } from './components/BiometricUnlock'
import WalletCard from './components/WalletCard'
import ActionButtons from './components/ActionButtons'

export function HomeTabScreen() {
    return (
        <ScrollView bg="$background" showsVerticalScrollIndicator={false}>
            <YStack flex={1} items="center" gap="$2" px="$4" pt="$2" pb="$20">
                <WalletCard />
                <ActionButtons />

                <ToastControl />

                <YStack items="center" gap="$4" width="100%" mt="$4">
                    <Paragraph fontSize="$4">
                        Configure your app in
                    </Paragraph>

                    <XStack
                        items="center"
                        gap="$2"
                        px="$4"
                        py="$2"
                        rounded="$4"
                        bg="$blue5"
                        borderWidth={1}
                        borderColor="$blue10"
                    >
                        <Paragraph fontWeight="600" color="$blue10">
                            tamagui.config.ts
                        </Paragraph>
                    </XStack>

                    <XStack
                        items="center"
                        gap="$2"
                        px="$4"
                        py="$2"
                        rounded="$4"
                        bg="$green5"
                        hoverStyle={{ bg: '$green6' }}
                        pressStyle={{ bg: '$green4' }}
                    >
                        <Anchor
                            href="https://tamagui.dev/docs/core/configuration"
                            textDecorationLine="none"
                            color="$green10"
                            fontSize="$4"
                            fontWeight="600"
                        >
                            Configuration guide
                        </Anchor>
                        <ExternalLink size={16} color="$green10" />
                    </XStack>
                </YStack>
            </YStack>
        </ScrollView>
    )
}
