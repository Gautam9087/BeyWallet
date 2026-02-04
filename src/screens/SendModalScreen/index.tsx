import React, { useState } from 'react'
import { YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useWalletStore } from '~/store/walletStore'
import { AmountStage } from './AmountStage'
import { ResultStage } from './ResultStage'
import { biometricService } from '~/services/biometricService'
import * as Haptics from 'expo-haptics'

type SendStep = 'amount' | 'result';

export function SendModalScreen() {
    const [step, setStep] = useState<SendStep>('amount')
    const [amount, setAmount] = useState('0')
    const [status, setStatus] = useState<'success' | 'error'>('success')
    const router = useRouter()
    const { balance } = useWalletStore()

    const handleAuthenticate = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        try {
            const success = await biometricService.authenticateAsync(`Authorize creating ₿${amount} ecash`)

            if (success) {
                setStatus('success')
                setStep('result')
            } else {
                // If they cancel or fail, we stay on amount stage or show error
                // For now, let's just stay on amount stage unless it's a hard error
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            }
        } catch (error) {
            setStatus('error')
            setStep('result')
        }
    }

    const handleNext = () => {
        if (step === 'amount') {
            handleAuthenticate()
        }
    }

    return (
        <YStack flex={1} bg="$background" p="$4">
            {step === 'amount' && (
                <AmountStage
                    amount={amount}
                    setAmount={setAmount}
                    onContinue={handleNext}
                    balance={balance}
                />
            )}

            {step === 'result' && (
                <ResultStage
                    status={status}
                    amount={amount}
                    onClose={() => router.back()}
                />
            )}
        </YStack>
    )
}


