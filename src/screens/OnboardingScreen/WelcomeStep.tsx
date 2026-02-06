import React from 'react'
import { YStack, Text, Button, H1, Image, View } from 'tamagui'
import { Wallet } from '@tamagui/lucide-icons'
import * as Haptics from 'expo-haptics'
import { useAppTheme } from '../../context/ThemeContext'

interface WelcomeStepProps {
    onCreateWallet: () => void
}

export function WelcomeStep({ onCreateWallet }: WelcomeStepProps) {
    const { resolvedTheme } = useAppTheme()

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onCreateWallet()
    }

    return (
        <YStack flex={1} bg="$background" px="$4" py="$6" justify="space-between">
            {/* Top spacer */}
            <View />

            {/* Center - Logo and Title */}
            <YStack items="center" gap="$6">
                <View
                    width={140}
                    height={140}
                    rounded="$10"
                    bg="$color"
                    items="center"
                    justify="center"
                    overflow="hidden"
                    borderWidth={1}
                    borderColor="$borderColor"
                >
                    <Image
                        source={resolvedTheme === 'dark'
                            ? require('../../assets/icons/Bey-light-logo.png')
                            : require('../../assets/icons/Bey-dark-logo.png')}
                        style={{ width: 90, height: 90 }}
                        resizeMode="contain"
                    />
                </View>

                <YStack items="center" gap="$2">
                    <H1 fontSize="$9" fontWeight="700" color="$color">
                        Welcome to Bey
                    </H1>
                    <Text color="$gray10" fontSize="$4" text="center" px="$4">
                        Your self-custodial Cashu wallet for private, instant Bitcoin payments
                    </Text>
                </YStack>
            </YStack>

            {/* Bottom - CTA */}
            <YStack gap="$4" items="center" pb="$4">
                <Button
                    size="$5"
                    theme="accent"
                    width="100%"
                    onPress={handlePress}
                    icon={<Wallet size={24} />}
                    fontSize="$5"
                    fontWeight="700"
                    rounded="$4"
                    pressStyle={{ scale: 0.98, opacity: 0.9 }}
                >
                    Create New Wallet
                </Button>

                <Text color="$gray9" fontSize="$2" text="center">
                    Your keys, your coins
                </Text>
            </YStack>
        </YStack>
    )
}
