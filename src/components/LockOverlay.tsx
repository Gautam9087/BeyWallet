import React, { useEffect, useState } from 'react'
import { YStack, Text, Button, Spinner, H2, Image, View } from 'tamagui'
import { Fingerprint } from '@tamagui/lucide-icons'
import { biometricService } from '../services/biometricService'
import * as Haptics from 'expo-haptics'
import { AppState, AppStateStatus, StyleSheet } from 'react-native'
import { useAppTheme } from '../context/ThemeContext'

export function LockOverlay({ onUnlock }: { onUnlock: () => void }) {
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const { resolvedTheme } = useAppTheme()

    const handleAuthenticate = async () => {
        if (isAuthenticating) return

        setIsAuthenticating(true)
        setError(null)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        try {
            const success = await biometricService.authenticateAsync('Unlock Bey Wallet to continue')
            if (success) {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                onUnlock()
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
                setError('Authentication failed. Please try again.')
            }
        } catch (e) {
            setError('An error occurred during authentication.')
        } finally {
            setIsAuthenticating(false)
        }
    }

    // Handle auto-trigger on mount and on foreground
    useEffect(() => {
        // Small delay to ensure the native side is ready after app transitions
        const timer = setTimeout(() => {
            handleAuthenticate()
        }, 1200)

        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            if (nextAppState === 'active') {
                handleAuthenticate()
            }
        })

        return () => {
            clearTimeout(timer)
            subscription.remove()
        }
    }, [])

    return (
        <YStack
            position="absolute"
            top={0}
            left={0}
            right={0}
            bottom={0}
            style={StyleSheet.absoluteFill}
            zIndex={9999}
            bg="$background"
            px="$3"
            py="$5"
            justify="space-between"
        >
            {/* Top Section */}
            <YStack items="center" gap="$3" mt="$4">
                <YStack items="center" gap="$1">
                    <H2 fontSize="$8" fontWeight="700" color="$color">Wallet Locked</H2>
                    <Text color="$gray10" fontSize="$3">Authenticate to continue</Text>
                </YStack>
            </YStack>

            {/* Middle Section - App Logo */}
            <YStack flex={1} justify="center" items="center">
                <View
                    width={160}
                    height={160}
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
                            ? require('../assets/icons/Bey-light-logo.png')
                            : require('../assets/icons/Bey-dark-logo.png')}
                        style={{ width: 100, height: 100 }}
                        resizeMode="contain"
                    />
                </View>
            </YStack>

            {/* Bottom Section - Unlock Button */}
            <YStack gap="$4" height={200} items="center" justify="flex-end">
                {error && (
                    <View px="$2" items="center">
                        <Text
                            color="$red10"
                            bg="$red2"
                            px="$4"
                            py="$2"
                            rounded="$2"
                            text="center"
                            fontSize="$3"
                            fontWeight="600"
                            animation="quick"
                            enterStyle={{ opacity: 0, y: 10 }}
                        >
                            {error}
                        </Text>
                    </View>
                )}
                <View items="center">
                    <Button
                        size="$5"
                        theme="accent"
                        onPress={handleAuthenticate}
                        icon={isAuthenticating ? <Spinner /> : <Fingerprint size={24} />}
                        fontSize="$6"
                        fontWeight="700"
                        rounded="$6"
                        pressStyle={{ scale: 0.98, opacity: 0.9 }}
                    >
                        {isAuthenticating ? 'Authenticating...' : 'Unlock'}
                    </Button>
                </View>

                <Text text="center" color="$gray9" fontSize="$2" opacity={0.7}>
                    Supports FaceID, TouchID or Passcode
                </Text>
            </YStack>
        </YStack>
    )
}
