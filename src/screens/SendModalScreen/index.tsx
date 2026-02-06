import React, { useState, useCallback } from 'react'
import { YStack } from 'tamagui'
import { useRouter } from 'expo-router'
import { useWalletStore } from '~/store/walletStore'
import { AmountStage } from './AmountStage'
import { ResultStage } from './ResultStage'
import { biometricService } from '~/services/biometricService'
import { cocoService } from '~/services/cocoService'
import * as Haptics from 'expo-haptics'

type SendStep = 'amount' | 'result';

export function SendModalScreen() {
    const [step, setStep] = useState<SendStep>('amount')
    const [amount, setAmount] = useState('0')
    const [status, setStatus] = useState<'success' | 'error'>('success')
    const [error, setError] = useState<string | null>(null)
    const [encodedToken, setEncodedToken] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const router = useRouter()
    const { balance, activeMintUrl, refreshBalance } = useWalletStore()

    const handleSend = useCallback(async () => {
        if (!activeMintUrl) {
            setError('No active mint selected');
            return;
        }

        const amountSats = parseInt(amount, 10);
        if (isNaN(amountSats) || amountSats <= 0) {
            setError('Invalid amount');
            return;
        }

        if (amountSats > balance) {
            setError('Insufficient balance');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // Send directly (no saga-style prepare/execute)
            const token = await cocoService.send(activeMintUrl, amountSats);

            // Encode the token for sharing
            const tokenString = cocoService.encodeToken(token);
            setEncodedToken(tokenString);

            setStatus('success');
            refreshBalance();
            setStep('result');
        } catch (err: any) {
            console.error('[SendModal] Failed to send:', err);
            setError(err.message || 'Failed to create token');
            setStatus('error');
            setStep('result');
        } finally {
            setIsProcessing(false);
        }
    }, [activeMintUrl, amount, balance, refreshBalance]);

    const handleAuthenticate = async () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)

        try {
            // Authenticate first
            const success = await biometricService.authenticateAsync(`Authorize creating ₿${amount} ecash`)

            if (success) {
                await handleSend();
            } else {
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            }
        } catch (error: any) {
            console.error('[SendModal] Authentication error:', error);
            setError(error.message || 'Authentication failed');
            setStatus('error');
            setStep('result');
        }
    }

    const handleNext = () => {
        if (step === 'amount') {
            handleAuthenticate()
        }
    }

    const handleClose = () => {
        refreshBalance();
        router.back();
    }

    return (
        <YStack flex={1} bg="$background" p="$4">
            {step === 'amount' && (
                <AmountStage
                    amount={amount}
                    setAmount={setAmount}
                    onContinue={handleNext}
                    balance={balance}
                    isLoading={isProcessing}
                    error={error}
                />
            )}

            {step === 'result' && (
                <ResultStage
                    status={status}
                    amount={amount}
                    token={encodedToken}
                    mintUrl={activeMintUrl || ''}
                    error={error}
                    onClose={handleClose}
                />
            )}
        </YStack>
    )
}
