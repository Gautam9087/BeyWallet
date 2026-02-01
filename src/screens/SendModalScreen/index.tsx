import React, { useState } from 'react'
import { YStack, XStack, Text, Button } from 'tamagui'
import { useRouter } from 'expo-router'
import * as Haptics from 'expo-haptics'
import { useToastController } from '@tamagui/toast'
import { useWalletStore } from '~/store/walletStore'
import { NumericKeypad } from '~/components/UI/NumericKeypad'
import { ArrowLeft } from '@tamagui/lucide-icons'

export function SendModalScreen() {
    const [amount, setAmount] = useState('0')
    const [isLoading, setIsLoading] = useState(false)
    const router = useRouter()
    const toast = useToastController()
    const { balance } = useWalletStore()

    const handleContinue = async () => {
        setIsLoading(true)
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        try {
            // --- ACTUAL SEND LOGIC WOULD GO HERE ---
            await new Promise(resolve => setTimeout(resolve, 2000))
            // --------------------------------------

            // Success Haptics
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)

            // Show Success Toast
            toast.show('Sent Successfully', {
                message: `${amount} SATS has been sent.`,
                theme: 'success'
            })

            // Go back after success
            router.back()
        } catch (error) {
            toast.show('Error', {
                message: 'Failed to send payment',
                theme: 'red'
            })
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <YStack flex={1} bg="$background" p="$4" pt="$0">

            <NumericKeypad
                value={amount}
                onValueChange={setAmount}
                onConfirm={handleContinue}
                confirmLabel="Continue"
                maxAmount={balance}
                isLoading={isLoading}
                showBalance={true}
            />
        </YStack>
    )
}
