import React, { useState } from 'react'
import { YStack } from 'tamagui'
import { useRouter, Stack } from 'expo-router'
import { InputStage } from './InputStage'
import { ConfirmStage } from './ConfirmStage'
import { ResultStage } from '../SendModalScreen/ResultStage' // Reuse ResultStage layout

type ReceiveStep = 'input' | 'confirm' | 'result';

export function ReceiveModalScreen() {
    const [step, setStep] = useState<ReceiveStep>('input')
    const [token, setToken] = useState('')
    const [status, setStatus] = useState<'success' | 'error'>('success')
    const router = useRouter()

    const handleNext = () => {
        if (step === 'input') setStep('confirm')
        else if (step === 'confirm') {
            // In a real app, this is where you'd call cocoService.claim(token)
            setStatus('success')
            setStep('result')
        }
    }

    const handleBack = () => {
        if (step === 'confirm') setStep('input')
        else router.back()
    }

    return (
        <YStack flex={1} bg="$background" px="$4">
            <Stack.Screen
                options={{
                    title: step === 'result' ? 'Success' : 'Receive Ecash',
                }}
            />

            {step === 'input' && (
                <InputStage
                    token={token}
                    setToken={setToken}
                    onContinue={handleNext}
                />
            )}

            {step === 'confirm' && (
                <ConfirmStage
                    token={token}
                    onConfirm={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 'result' && (
                <ResultStage
                    status={status}
                    amount="60" // Mock amount from image
                    onClose={() => router.back()}
                    title="Ecash Received"
                />
            )}
        </YStack>
    )
}
