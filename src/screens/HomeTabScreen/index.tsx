import { RefreshControl } from 'react-native'
import { Anchor, H2, Paragraph, XStack, YStack, ScrollView } from 'tamagui'
import { ToastControl } from 'components/CurrentToast'
import { ThemeSelector } from './components/ThemeSelector'
import { LocalizationTest } from './components/LocalizationTest'
import { BiometricUnlock } from './components/BiometricUnlock'
import WalletCard from './components/WalletCard'
import ActionButtons from './components/ActionButtons'
import { WalletDebugInfo } from './components/WalletDebugInfo'
import { MintDiscovery } from './components/MintDiscovery'
import { useWalletStore } from '../../store/walletStore'
import React from 'react'
import ManageBalances from './components/ManageBalances'
import BitcoinPriceCard from './components/BitcoinPriceCard'

export function HomeTabScreen() {
    const { refreshBalance } = useWalletStore()
    const [refreshing, setRefreshing] = React.useState(false)

    const onRefresh = React.useCallback(async () => {
        setRefreshing(true)
        try {
            await refreshBalance()
        } finally {
            setRefreshing(false)
        }
    }, [refreshBalance])

    return (
        <ScrollView
            bg="$background"
            showsVerticalScrollIndicator={false}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD700" />
            }
        >
            <YStack flex={1} items="center" gap="$4" px="$4" pt="$2" pb="$20">
                <WalletCard />
                <ActionButtons />
                <BitcoinPriceCard />
                <ManageBalances />
                {/* <MintDiscovery /> */}
                {/* 
                <ToastControl />

                <WalletDebugInfo /> */}
            </YStack>
        </ScrollView>
    )
}
