import React from 'react'
import { YStack, XStack, Button, Text, Spinner, View } from 'tamagui'
import { ChevronLeft, Delete } from '@tamagui/lucide-icons'
import * as Haptics from 'expo-haptics'

interface NumericKeypadProps {
    value: string
    onValueChange: (value: string) => void
    onConfirm: () => void
    confirmLabel: string
    isLoading?: boolean
    maxAmount?: number
    currency?: string
    showBalance?: boolean
    showAmountDisplay?: boolean
    showConfirmButton?: boolean
    confirmDisabled?: boolean
    confirmIcon?: any
}

export function NumericKeypad({
    value,
    onValueChange,
    onConfirm,
    confirmLabel,
    isLoading = false,
    maxAmount,
    currency = 'SATS',
    showBalance = false,
    showAmountDisplay = true,
    showConfirmButton = true,
    confirmDisabled = false,
    confirmIcon = null
}: NumericKeypadProps) {

    const amountNum = Number(value) || 0
    const isOverBalance = maxAmount !== undefined && amountNum > maxAmount
    const isBalanceZero = maxAmount !== undefined && maxAmount === 0
    const canContinue = amountNum > 0 && !isOverBalance && !isLoading && !isBalanceZero

    const handlePress = (digit: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onValueChange(value === '0' ? digit : value + digit)
    }

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        if (value.length <= 1) {
            onValueChange('0')
        } else {
            onValueChange(value.slice(0, -1))
        }
    }

    const NumButton = ({ digit }: { digit: string }) => (
        <Button
            flex={1}
            height={70}
            chromeless
            onPress={() => handlePress(digit)}
            pressStyle={{ bg: "$colorTransparent", borderColor: "$colorTransparent", scale: 1.5 }}
        >
            <Text fontSize={32} fontWeight="600" color="$color">
                {digit}
            </Text>
        </Button>
    )

    return (
        <YStack flex={showAmountDisplay ? 1 : undefined} justify="space-between" width="100%">
            {/* Amount Display */}
            {showAmountDisplay && (
                <YStack items="center" py="$6" gap="$1">
                    <XStack items="baseline" gap="$2">
                        <Text
                            fontSize={56}
                            fontWeight="700"
                            color={isOverBalance || isBalanceZero ? '$red10' : '$color'}
                        >
                            {value}
                        </Text>
                        <Text fontSize={20} fontWeight="600" color="$gray10" mb="$2">
                            {currency}
                        </Text>
                    </XStack>
                    {showBalance && maxAmount !== undefined && (
                        <Text color="$gray10" fontSize="$3">
                            Balance: {maxAmount} {currency}
                        </Text>
                    )}
                </YStack>
            )}

            {/* Keypad and Action Button */}
            <YStack pb="$4" >
                {/* Confirm Button */}




                {/* Numpad */}
                {/* Keypad Layout */}
                <YStack width="100%" gap="$0" pb="$4" >
                    {[
                        ['1', '2', '3'],
                        ['4', '5', '6'],
                        ['7', '8', '9'],
                        ['.', '0', 'delete'],
                    ].map((row, i) => (
                        <XStack key={i} gap="$10">
                            {row.map((digit, j) => {
                                if (digit === 'delete') {
                                    return (
                                        <Button
                                            key="delete"
                                            flex={1}
                                            height={70}
                                            chromeless
                                            onPress={handleDelete}
                                            pressStyle={{ bg: "transparent", borderColor: "$colorTransparent", scale: 1.5 }}
                                            icon={<ChevronLeft size={32} color="$color" />}
                                        />
                                    )
                                }
                                if (digit === '') {
                                    return <View key={`empty-${i}-${j}`} flex={1} />
                                }
                                return <NumButton key={digit} digit={digit} />
                            })}
                        </XStack>
                    ))}
                </YStack>
                {showConfirmButton && (
                    <Button
                        size="$5"
                        fontSize="$6"
                        theme={canContinue && !confirmDisabled ? "accent" : "gray"}
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                            onConfirm()
                        }}
                        disabled={!canContinue || confirmDisabled}
                        opacity={(!canContinue || confirmDisabled) ? 0.5 : 1}
                        icon={isLoading ? <Spinner color="$color" /> : (confirmIcon || null)}
                    >
                        {isLoading ? 'Processing...' : confirmLabel}
                    </Button>
                )}
            </YStack>
        </YStack>
    )
}
