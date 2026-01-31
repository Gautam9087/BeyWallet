import React, { useState } from 'react'
import { YStack, XStack, Text, Button, Spinner } from 'tamagui'
import { NumPad } from './components/NumPad'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useToastController } from '@tamagui/toast'

export function SendModalScreen() {
    const [amount, setAmount] = useState('0')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const toast = useToastController()

    const handleNumPress = (val: string) => {
        if (isLoading) return
        setAmount((prev) => {
            if (prev === '0' && val !== '.') return val
            if (val === '.' && prev.includes('.')) return prev
            return prev + val
        })
    }

    const handleDelete = () => {
        if (isLoading) return
        setAmount((prev) => {
            if (prev.length <= 1) return '0'
            return prev.slice(0, -1)
        })
    }

    const handleContinue = async () => {
        setIsLoading(true)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        // --- REPLACE WITH ACTUAL SEND LOGIC ---
        // Simulate network request/transaction
        await new Promise(resolve => setTimeout(resolve, 2000))
        // --------------------------------------

        setIsLoading(false)

        // Success Haptics
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

        // Show Success Toast
        toast.show('Sent Successfully', {
            message: `₹${amount} has been sent.`,
            type: 'success'
        })

        // Go back after success
        router.back()
    }

    const hasAmount = amount !== '0' && amount !== '0.' && amount !== ''

    return (
        <YStack flex={1} bg="$background" justify="space-between">
            <YStack items="center" pt="$10" gap="$2">
                <Text fontSize="$4" color="$gray11" fontWeight="500">
                    Sending Amount
                </Text>
                <XStack items="baseline" gap="$2">
                    <Text fontSize={50} fontWeight="700" color="$color">
                        ₹{amount}
                    </Text>
                </XStack>
            </YStack>

            <YStack>
                {hasAmount && (
                    <YStack px="$6" pb="$4">
                        <Button
                            size="$5"
                            theme='accent'
                            onPress={handleContinue}
                            disabled={isLoading}
                            icon={isLoading ? <Spinner color="$color" /> : null}
                            animation="quick"
                            enterStyle={{ opacity: 0, scale: 0.9, y: 10 }}
                            fontWeight="700"
                        >
                            {isLoading ? 'Sending...' : 'Continue'}
                        </Button>
                    </YStack>
                )}
                <NumPad onPress={handleNumPress} onDelete={handleDelete} />
            </YStack>
        </YStack>
    )
}
