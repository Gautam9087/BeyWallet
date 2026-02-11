import React, { useState, useCallback } from 'react'
import { useRouter } from 'expo-router'
import { useWalletStore } from '~/store/walletStore'
import { AmountStage } from './AmountStage'
import { ResultStage } from './ResultStage'
import { biometricService } from '~/services/biometricService'
import { cocoService } from '~/services/cocoService'
import * as Haptics from 'expo-haptics'
import AppBottomSheet, { AppBottomSheetRef } from '~/components/UI/AppBottomSheet'
import { Text, YStack, XStack, Button, Separator, View } from 'tamagui'
import { useSettingsStore } from '~/store/settingsStore'
import { useQuery } from '@tanstack/react-query'
import { bitcoinService } from '~/services/bitcoinService'
import { currencyService, CurrencyCode, SUPPORTED_CURRENCIES } from '~/services/currencyService'
import { Building2, Info, ArrowUpCircle, ShieldCheck, Zap, ArrowDownCircle } from '@tamagui/lucide-icons'
import { Image } from 'tamagui'

type SendStep = 'amount' | 'result';

export function SendModalScreen() {
    const [step, setStep] = useState<SendStep>('amount')
    const [amount, setAmount] = useState('0')
    const [status, setStatus] = useState<'success' | 'error'>('success')
    const [error, setError] = useState<string | null>(null)
    const [encodedToken, setEncodedToken] = useState<string | null>(null)
    const [isProcessing, setIsProcessing] = useState(false)
    const router = useRouter()
    const { balance, activeMintUrl, refreshBalance, mints } = useWalletStore()
    const { secondaryCurrency } = useSettingsStore()
    const confirmSheetRef = React.useRef<AppBottomSheetRef>(null)

    const { data: btcData } = useQuery({
        queryKey: ['bitcoinPrice', secondaryCurrency],
        queryFn: () => bitcoinService.fetchPrice(secondaryCurrency),
        staleTime: 30000,
    });

    const activeMint = React.useMemo(() => {
        if (!activeMintUrl) return null;
        return mints.find(m => m.mintUrl.replace(/\/$/, '') === activeMintUrl.replace(/\/$/, ''));
    }, [mints, activeMintUrl]);

    const mintName = activeMint?.nickname || activeMint?.name || activeMintUrl?.replace(/^https?:\/\//, '').replace(/\/$/, '') || "Unknown Mint";

    const fiatValue = React.useMemo(() => {
        if (!btcData?.price) return '...';
        const sats = parseInt(amount, 10) || 0;
        const cur = SUPPORTED_CURRENCIES.find(c => c.code === secondaryCurrency);
        const symbol = cur?.symbol || '$';
        const val = currencyService.convertSatsToCurrency(sats, btcData.price);
        return `${symbol}${val.toFixed(2)}`;
    }, [amount, btcData?.price, secondaryCurrency]);

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
        confirmSheetRef.current?.dismiss();

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
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            confirmSheetRef.current?.present();
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

            <AppBottomSheet ref={confirmSheetRef}>
                <YStack p="$4" pt="$2" gap="$5">
                    <YStack items="center" gap="$2" pt="$2">

                        <Text fontSize="$6" fontWeight="800">Review Transaction</Text>
                        {/* <Text color="$gray10" text="center">You are about to create an ecash token from your balance.</Text> */}
                    </YStack>

                    <YStack borderWidth={1} borderColor="$color4" rounded="$4" overflow="hidden">
                        <XStack justify="space-between" items="center" p="$4">
                            <Text color="$gray10">Amount</Text>
                            <YStack items="flex-end">
                                <Text fontWeight="800" fontSize="$6">₿{amount} sats</Text>
                                <Text color="$gray10" fontSize="$3">{fiatValue}</Text>
                            </YStack>
                        </XStack>

                        <Separator borderColor="$color4" />

                        <XStack justify="space-between" items="center" p="$4">
                            <XStack gap="$2" items="center">
                                <ShieldCheck size={16} color="$gray10" />
                                <Text color="$gray10">Fee</Text>
                            </XStack>
                            <Text fontWeight="600" color="$green10">0 sats</Text>
                        </XStack>

                        <Separator borderColor="$color4" />

                        <XStack justify="space-between" items="center" p="$4">
                            <XStack gap="$2" items="center">
                                <Building2 size={16} color="$gray10" />
                                <Text color="$gray10">Mint</Text>
                            </XStack>
                            <XStack gap="$2" items="center">
                                {activeMint?.icon && (
                                    <View rounded="$10" overflow="hidden" width={20} height={20}>
                                        <Image source={{ uri: activeMint.icon }} width={20} height={20} />
                                    </View>
                                )}
                                <Text fontWeight="600" numberOfLines={1} style={{ maxWidth: 180 }}>{mintName}</Text>
                            </XStack>
                        </XStack>

                        <Separator borderColor="$color4" />

                        <XStack justify="space-between" items="center" p="$4">
                            <XStack gap="$2" items="center">
                                <Zap size={16} color="$gray10" />
                                <Text color="$gray10">Version</Text>
                            </XStack>
                            <XStack bg="$accent3" px="$2" py="$0.5" rounded="$2">
                                <Text color="$accent11" fontSize="$2" fontWeight="800">V4 (Default)</Text>
                            </XStack>
                        </XStack>
                    </YStack>


                    <YStack gap="$3" pt="$2">
                        <Button
                            theme="accent"
                            size="$5"
                            fontWeight="800"
                            onPress={handleAuthenticate}
                        >
                            Confirm & Send
                        </Button>
                        <Button
                            chromeless
                            size="$4"
                            onPress={() => confirmSheetRef.current?.dismiss()}
                        >
                            Cancel
                        </Button>
                    </YStack>
                </YStack>
            </AppBottomSheet>
        </YStack>
    )
}
