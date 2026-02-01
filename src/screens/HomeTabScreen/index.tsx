import { ExternalLink } from '@tamagui/lucide-icons'
import { Anchor, H2, Paragraph, XStack, YStack, ScrollView } from 'tamagui'
import { ToastControl } from 'components/CurrentToast'
import { ThemeSelector } from './components/ThemeSelector'
import { LocalizationTest } from './components/LocalizationTest'
import { BiometricUnlock } from './components/BiometricUnlock'
import WalletCard from './components/WalletCard'
import ActionButtons from './components/ActionButtons'
import { WalletDebugInfo } from './components/WalletDebugInfo'
import { MintDiscovery } from './components/MintDiscovery'

export function HomeTabScreen() {
    return (
        <ScrollView bg="$background" showsVerticalScrollIndicator={false}>
            <YStack flex={1} items="center" gap="$2" px="$4" pt="$2" pb="$20">
                <WalletCard />
                <ActionButtons />

                {/* <MintDiscovery /> */}

                <ToastControl />

                <WalletDebugInfo />
            </YStack>
        </ScrollView>
    )
}
