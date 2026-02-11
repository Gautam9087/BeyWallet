import React from 'react'
import { YStack, Text, XStack, ListItem, YGroup, Separator } from 'tamagui'
import { Check } from '@tamagui/lucide-icons'
import AppBottomSheet, { AppBottomSheetRef } from '~/components/UI/AppBottomSheet'
import { SUPPORTED_CURRENCIES, CurrencyCode } from '~/services/currencyService'
import { useSettingsStore } from '~/store/settingsStore'
import * as Haptics from 'expo-haptics'

interface CurrencyModalProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function CurrencyModal({ open, onOpenChange }: CurrencyModalProps) {
    const bottomSheetRef = React.useRef<AppBottomSheetRef>(null)
    const { secondaryCurrency, setSecondaryCurrency } = useSettingsStore()

    React.useEffect(() => {
        if (open) {
            bottomSheetRef.current?.present()
        } else {
            bottomSheetRef.current?.dismiss()
        }
    }, [open])

    const handleSelect = (code: CurrencyCode) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        setSecondaryCurrency(code)
        bottomSheetRef.current?.dismiss()
    }

    return (
        <AppBottomSheet
            ref={bottomSheetRef}
            onClose={() => onOpenChange(false)}
        >
            <YStack p="$4" gap="$4">
                <YStack gap="$1">
                    <Text fontSize="$6" fontWeight="700">Select Currency</Text>
                    <Text fontSize="$3" color="$gray11">Choose your secondary display currency</Text>
                </YStack>

                <YGroup bordered separator={<Separator />}>
                    {SUPPORTED_CURRENCIES.map((currency) => (
                        <YGroup.Item key={currency.code}>
                            <ListItem
                                hoverStyle={{ bg: '$backgroundHover' }}
                                pressStyle={{ bg: '$backgroundPress' }}
                                title={currency.name}
                                subTitle={`${currency.code} (${currency.symbol})`}
                                iconAfter={secondaryCurrency === currency.code ? Check : null}
                                onPress={() => handleSelect(currency.code as CurrencyCode)}
                            />
                        </YGroup.Item>
                    ))}
                </YGroup>
            </YStack>
        </AppBottomSheet>
    )
}
