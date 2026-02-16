import React, { useState, useMemo, useEffect } from 'react'
import { YStack, XStack, Text, Button, H2, View, ScrollView, Separator } from 'tamagui'
import {
    ArrowUpDown, ArrowLeft, CheckCircle2,
    AlertCircle, RefreshCw
} from '@tamagui/lucide-icons'
import * as Haptics from 'expo-haptics'
import { useRouter } from 'expo-router'
import { useWalletStore } from '~/store/walletStore'
import { walletService } from '~/services/core'
import { ActivityIndicator } from 'react-native'
import { NumericKeypad } from '~/components/UI/NumericKeypad'

type SwapStep = 'setup' | 'confirm' | 'processing' | 'result'

/**
 * Swap screen — swaps proofs within a single mint.
 *
 * In Cashu, a "swap" sends your current proofs to the mint and receives
 * fresh proofs back. This:
 * - Consolidates fragmented proofs
 * - Generates new blinded secrets (privacy)
 * - Resets proof linkability
 *
 * Cross-mint transfers require Lightning (melt on A → mint on B).
 */
export default function SwapScreen() {
    const router = useRouter()
    const { mints, activeMintUrl, balances, refreshBalance } = useWalletStore()
    const [step, setStep] = useState<SwapStep>('setup')
    const [mintUrl, setMintUrl] = useState<string>(activeMintUrl || '')
    const [amount, setAmount] = useState('')
    const [error, setError] = useState<string | null>(null)
    const [isSuccess, setIsSuccess] = useState(false)

    // Available mints for selection
    const mintList = useMemo(() => {
        return mints.filter(m => m.trusted)
    }, [mints])

    // Refresh balances on mount
    useEffect(() => {
        refreshBalance()
    }, [])

    const mintBalance = mintUrl ? (balances[mintUrl] || 0) : 0
    const amountNum = parseInt(amount) || 0

    const canSwap = mintUrl &&
        amountNum > 0 && amountNum <= mintBalance

    const handleSwap = async () => {
        if (!canSwap) return
        setStep('processing')
        setError(null)

        try {
            console.log(`[Swap] Swapping ${amountNum} sats on ${mintUrl}`)

            // Step 1: Send proofs to mint (get a token back)
            const token = await walletService.send(mintUrl, amountNum)

            // Step 2: Receive the token back (fresh proofs from the mint)
            await walletService.receive(token)

            // Step 3: Refresh balances
            await refreshBalance()

            setIsSuccess(true)
            setStep('result')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
        } catch (err: any) {
            console.error('[Swap] Failed:', err)
            setError(err.message || 'Swap failed')
            setIsSuccess(false)
            setStep('result')
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        }
    }

    const getMintLabel = (url: string) => {
        const mint = mints.find(m => m.mintUrl === url)
        return mint?.nickname || mint?.name || (() => { try { return new URL(url).hostname } catch { return url } })()
    }

    // ─── Setup Step ──────────────────────────────────────────────

    if (step === 'setup') {
        return (
            <YStack flex={1} bg="$background" px="$4" py="$4">
                <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <XStack items="center" gap="$3" mb="$5">
                        <Button
                            size="$3"
                            circular
                            chromeless
                            icon={<ArrowLeft size={20} />}
                            onPress={() => router.back()}
                        />
                        <YStack>
                            <H2 fontSize="$7" fontWeight="700">Swap</H2>
                            <Text color="$gray10" fontSize="$2">Refresh proofs for privacy</Text>
                        </YStack>
                    </XStack>

                    {/* Info Banner */}
                    <View bg="$blue2" p="$3" rounded="$4" borderWidth={1} borderColor="$blue8" mb="$4">
                        <Text color="$blue10" fontSize="$2">
                            💡 Swapping sends your proofs to the mint and receives fresh ones back.
                            This improves privacy and consolidates fragmented proofs.
                        </Text>
                    </View>

                    {/* Mint Selection */}
                    <YStack gap="$2" mb="$4">
                        <Text fontSize="$3" color="$gray10" fontWeight="600" px="$1">Select Mint</Text>
                        <YStack gap="$2">
                            {mintList.map(mint => (
                                <Button
                                    key={mint.mintUrl}
                                    size="$5"
                                    bg={mintUrl === mint.mintUrl ? '$accent3' : '$gray4'}
                                    borderWidth={mintUrl === mint.mintUrl ? 2 : 1}
                                    borderColor={mintUrl === mint.mintUrl ? '$accent8' : '$borderColor'}
                                    rounded="$4"
                                    onPress={() => {
                                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                        setMintUrl(mint.mintUrl)
                                        setAmount('')
                                    }}
                                    px="$4"
                                >
                                    <XStack flex={1} justify="space-between" items="center">
                                        <Text fontWeight="600" fontSize="$4">
                                            {mint.nickname || mint.name || (() => { try { return new URL(mint.mintUrl).hostname } catch { return mint.mintUrl } })()}
                                        </Text>
                                        <Text color="$gray10" fontSize="$3">
                                            {(balances[mint.mintUrl] || 0).toLocaleString()} sats
                                        </Text>
                                    </XStack>
                                </Button>
                            ))}
                        </YStack>
                    </YStack>

                    {/* Amount */}
                    {mintUrl && (
                        <YStack gap="$3" items="center" mt="$2">
                            <Text fontSize="$3" color="$gray10" fontWeight="600">Amount to swap (sats)</Text>
                            <Text fontSize={48} fontWeight="800" color="$color">
                                {amount || '0'}
                            </Text>
                            <XStack gap="$3" items="center">
                                <Text color="$gray10" fontSize="$3">
                                    Available: {mintBalance.toLocaleString()} sats
                                </Text>
                                <Button
                                    size="$2"
                                    chromeless
                                    onPress={() => setAmount(mintBalance.toString())}
                                    fontWeight="600"
                                    color="$accent10"
                                >
                                    MAX
                                </Button>
                            </XStack>
                        </YStack>
                    )}
                </ScrollView>

                {/* Keypad & Confirm */}
                {mintUrl && (
                    <YStack gap="$3" mt="$2">
                        <NumericKeypad
                            value={amount || '0'}
                            onValueChange={(val) => {
                                const num = parseInt(val) || 0
                                if (num <= mintBalance) setAmount(val === '0' ? '' : val)
                            }}
                            onConfirm={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
                                setStep('confirm')
                            }}
                            confirmLabel="Review Swap"
                            maxAmount={mintBalance}
                            showAmountDisplay={false}
                            showConfirmButton={true}
                            confirmDisabled={!canSwap}
                        />
                    </YStack>
                )}
            </YStack>
        )
    }

    // ─── Confirm Step ────────────────────────────────────────────

    if (step === 'confirm') {
        return (
            <YStack flex={1} bg="$background" px="$4" py="$4" justify="space-between">
                <YStack>
                    <XStack items="center" gap="$3" mb="$6">
                        <Button
                            size="$3"
                            circular
                            chromeless
                            icon={<ArrowLeft size={20} />}
                            onPress={() => setStep('setup')}
                        />
                        <H2 fontSize="$7" fontWeight="700">Confirm Swap</H2>
                    </XStack>

                    <YStack
                        bg="$gray3"
                        rounded="$5"
                        p="$5"
                        borderWidth={1}
                        borderColor="$borderColor"
                        gap="$4"
                    >
                        <YStack gap="$2">
                            <Text color="$gray10" fontSize="$3">Amount</Text>
                            <Text fontSize="$8" fontWeight="800">
                                {amountNum.toLocaleString()} sats
                            </Text>
                        </YStack>

                        <Separator />

                        <YStack gap="$2">
                            <Text color="$gray10" fontSize="$3">Mint</Text>
                            <Text fontSize="$5" fontWeight="600">
                                {getMintLabel(mintUrl)}
                            </Text>
                            <Text color="$gray10" fontSize="$2" numberOfLines={1}>
                                {mintUrl}
                            </Text>
                        </YStack>

                        <XStack justify="center">
                            <View bg="$gray5" rounded="$10" p="$2">
                                <RefreshCw size={20} color="$color" />
                            </View>
                        </XStack>

                        <YStack gap="$2">
                            <Text color="$gray10" fontSize="$3">Result</Text>
                            <Text fontSize="$4" fontWeight="600">
                                Fresh proofs from the same mint
                            </Text>
                        </YStack>
                    </YStack>

                    <View bg="$yellow2" p="$3" rounded="$4" borderWidth={1} borderColor="$yellow8" mt="$4">
                        <Text color="$yellow10" fontSize="$2">
                            ⚠️ The mint may charge a small fee for swapping proofs. Your balance may decrease by the fee amount.
                        </Text>
                    </View>
                </YStack>

                <Button
                    size="$5"
                    theme="accent"
                    width="100%"
                    onPress={handleSwap}
                    rounded="$4"
                    fontWeight="700"
                    fontSize="$5"
                    pressStyle={{ scale: 0.98, opacity: 0.9 }}
                >
                    Confirm Swap
                </Button>
            </YStack>
        )
    }

    // ─── Processing Step ─────────────────────────────────────────

    if (step === 'processing') {
        return (
            <YStack flex={1} bg="$background" items="center" justify="center" gap="$5">
                <ActivityIndicator size="large" color="#666" />
                <Text fontSize="$6" fontWeight="700">Swapping...</Text>
                <Text color="$gray10" fontSize="$3" text="center" px="$6">
                    Refreshing {amountNum.toLocaleString()} sats on {getMintLabel(mintUrl)}
                </Text>
            </YStack>
        )
    }

    // ─── Result Step ─────────────────────────────────────────────

    return (
        <YStack flex={1} bg="$background" px="$4" py="$4" justify="space-between">
            <YStack flex={1} items="center" justify="center" gap="$4">
                {isSuccess ? (
                    <>
                        <View bg="$green3" rounded="$10" p="$4">
                            <CheckCircle2 size={48} color="$green10" />
                        </View>
                        <Text fontSize="$7" fontWeight="800">Swap Complete!</Text>
                        <Text fontSize="$6" fontWeight="600" color="$green10">
                            {amountNum.toLocaleString()} sats
                        </Text>
                        <Text color="$gray10" fontSize="$4" text="center" px="$4">
                            Proofs refreshed on {getMintLabel(mintUrl)}
                        </Text>
                    </>
                ) : (
                    <>
                        <View bg="$red3" rounded="$10" p="$4">
                            <AlertCircle size={48} color="$red10" />
                        </View>
                        <Text fontSize="$7" fontWeight="800">Swap Failed</Text>
                        <Text color="$red10" fontSize="$3" text="center" px="$4">
                            {error}
                        </Text>
                    </>
                )}
            </YStack>

            <Button
                size="$5"
                theme="gray"
                width="100%"
                onPress={() => router.back()}
                rounded="$4"
                fontWeight="700"
                fontSize="$5"
            >
                Done
            </Button>
        </YStack>
    )
}
