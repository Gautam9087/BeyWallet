import React, { useState, useCallback } from 'react'
import { YStack } from 'tamagui'
import { useRouter, Stack } from 'expo-router'
import { InputStage } from './InputStage'
import { ConfirmStage } from './ConfirmStage'
import { ResultStage } from '../SendModalScreen/ResultStage'
import { cocoService } from '../../services/cocoService'
import { useWalletStore } from '../../store/walletStore'

type ReceiveStep = 'input' | 'confirm' | 'result';

interface TokenInfo {
    mint: string;
    amount: number;
    proofCount: number;
}

export function ReceiveModalScreen() {
    const [step, setStep] = useState<ReceiveStep>('input')
    const [token, setToken] = useState('')
    const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null)
    const [isDecoding, setIsDecoding] = useState(false)
    const [isReceiving, setIsReceiving] = useState(false)
    const [status, setStatus] = useState<'success' | 'error'>('success')
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()
    const { refreshBalance } = useWalletStore()

    const handleDecodeToken = useCallback(() => {
        if (!token.trim()) return;

        setIsDecoding(true);
        setError(null);

        try {
            const decoded = cocoService.decodeToken(token.trim());

            // Calculate total amount from proofs
            const amount = decoded.proofs?.reduce((sum: number, p: any) => sum + (p.amount || 0), 0) || 0;

            setTokenInfo({
                mint: decoded.mint || 'Unknown mint',
                amount: amount,
                proofCount: decoded.proofs?.length || 0,
            });
            setStep('confirm');
        } catch (err: any) {
            console.error('[ReceiveModal] Failed to decode token:', err);
            setError(err.message || 'Invalid token format');
        } finally {
            setIsDecoding(false);
        }
    }, [token]);

    const handleReceive = useCallback(async () => {
        setIsReceiving(true);
        setError(null);

        try {
            await cocoService.receive(token.trim());
            setStatus('success');
            refreshBalance();
            setStep('result');
        } catch (err: any) {
            console.error('[ReceiveModal] Failed to receive token:', err);
            setError(err.message || 'Failed to receive token');
            setStatus('error');
            setStep('result');
        } finally {
            setIsReceiving(false);
        }
    }, [token, refreshBalance]);

    const handleNext = () => {
        if (step === 'input') handleDecodeToken();
        else if (step === 'confirm') handleReceive();
    }

    const handleBack = () => {
        if (step === 'confirm') {
            setStep('input');
            setTokenInfo(null);
            setError(null);
        }
        else router.back();
    }

    const handleClose = () => {
        refreshBalance();
        router.back();
    }

    return (
        <YStack flex={1} bg="$background" px="$4">
            <Stack.Screen
                options={{
                    title: step === 'result' ? (status === 'success' ? 'Success' : 'Error') : 'Receive Ecash',
                }}
            />

            {step === 'input' && (
                <InputStage
                    token={token}
                    setToken={setToken}
                    isLoading={isDecoding}
                    error={error}
                    onContinue={handleNext}
                />
            )}

            {step === 'confirm' && tokenInfo && (
                <ConfirmStage
                    token={token}
                    tokenInfo={tokenInfo}
                    isLoading={isReceiving}
                    onConfirm={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 'result' && (
                <ResultStage
                    status={status}
                    amount={tokenInfo?.amount?.toString() || "0"}
                    error={error}
                    onClose={handleClose}
                    title={status === 'success' ? 'Ecash Received' : 'Receive Failed'}
                />
            )}
        </YStack>
    )
}
