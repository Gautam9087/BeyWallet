import React, { useEffect, useState } from 'react'
import { YStack, Text, Button, Spinner, H2 } from 'tamagui'
import { Fingerprint, Lock } from '@tamagui/lucide-icons'
import { biometricService } from '../services/biometricService'
import * as Haptics from 'expo-haptics'

import { AppState, AppStateStatus } from 'react-native'

export function LockScreen({ onUnlock }: { onUnlock: () => void }) {
    const [isAuthenticating, setIsAuthenticating] = useState(false)
    const [error, setError] = useState<string | null>(null)

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
        }, 500)

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
        <YStack flex={1} bg="$background" px="$6" py="$10">
            <YStack flex={1} items="center" justify="center" gap="$10">

                <YStack items="center" gap="$6" width="100%">
                    <Button
                        size="$8"
                        circular
                        width={120}
                        height={120}
                        theme="blue"
                        onPress={handleAuthenticate}
                        disabled={isAuthenticating}
                        elevation={20}
                        shadowColor="$blue10"
                        shadowRadius={30}
                        pressStyle={{ scale: 0.95 }}
                    >
                        {isAuthenticating ? (
                            <Spinner size="large" color="white" />
                        ) : (
                            <Fingerprint size={56} color="white" />
                        )}
                    </Button>

                    <YStack height={60} justify="center" items="center" width="100%">
                        <Text
                            color={error ? "$red10" : "$gray9"}
                            fontWeight={error ? "600" : "400"}
                            fontSize={error ? "$4" : "$3"}
                            animation="quick"
                            enterStyle={{ opacity: 0, y: 10 }}
                        >
                            {error || 'Tap fingerprint to unlock'}
                        </Text>
                    </YStack>
                </YStack>

                <Button
                    size="$5"
                    onPress={handleAuthenticate}
                    disabled={isAuthenticating}

                    borderWidth={1}
                    borderColor="$borderColor"
                    hoverStyle={{ bg: '$backgroundHover' }}
                    pressStyle={{ scale: 0.98 }}
                >
                    Try Again
                </Button>
            </YStack>
        </YStack>
    )
}
