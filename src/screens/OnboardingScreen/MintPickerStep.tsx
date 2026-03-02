import React, { useEffect, useRef, useState } from 'react'
import {
    YStack, XStack, Text, Button, Card, H3, H4,
    View, Separator
} from 'tamagui'
import { Image } from 'react-native'
import {
    Star, MessageSquare, Plus, RefreshCw, Sprout, ShieldCheck
} from '@tamagui/lucide-icons'
import * as Haptics from 'expo-haptics'
import { ScrollView } from 'react-native'
import AppBottomSheet, { AppBottomSheetRef } from '../../components/UI/AppBottomSheet'
import { Spinner } from '../../components/UI/Spinner'
import { mintRecommendationService, MintRecommendation } from '../../services/mintRecommendationService'

// ── Curated production-only seed list (no testnets) ───────────────────────────
const PRODUCTION_MINTS: MintRecommendation[] = [
    {
        url: 'https://mint.minibits.cash/Bitcoin',
        name: 'Minibits',
        description: 'A popular, reliable community Cashu mint with low fees and high uptime.',
        reviewsCount: 120,
        averageRating: 4.9,
    },
    {
        url: 'https://8333.space:3338',
        name: '8333.space',
        description: 'Community mint run by Bitcoin enthusiasts.',
        reviewsCount: 42,
        averageRating: 4.6,
    },
    {
        url: 'https://legend.lnbits.com/cashu/api/v1/4gr93mame836988',
        name: 'LNBits Legend',
        description: 'Hosted Cashu mint powered by LNBits — battle-tested infrastructure.',
        reviewsCount: 38,
        averageRating: 4.5,
    },
    {
        url: 'https://mint.probatio.money:3338',
        name: 'Probatio',
        description: 'A privacy-focused mint for everyday ecash payments.',
        reviewsCount: 18,
        averageRating: 4.4,
    },
]

// ── Testnet mints — always shown at the bottom, badged separately ─────────────
const TESTNET_MINTS: MintRecommendation[] = [
    {
        url: 'https://testnut.cashu.space',
        name: 'Testnut',
        description: 'Official Cashu testnet mint. Use for testing only — tokens have no real value.',
        reviewsCount: 0,
        averageRating: null,
        isTestnet: true,
    },
    {
        url: 'https://nofee.testnut.cashu.space',
        name: 'Testnut (No Fee)',
        description: 'Fee-free variant of the official Cashu testnet mint. Testing only.',
        reviewsCount: 0,
        averageRating: null,
        isTestnet: true,
    },
]

// ── Fetch icon from Cashu NUT-06 /v1/info (falls back to /info) ───────────────
// Uses manual AbortController + setTimeout (AbortSignal.timeout isn't in Hermes)
async function fetchMintIcon(mintUrl: string): Promise<string | null> {
    const base = mintUrl.replace(/\/$/, '')
    const endpoints = [`${base}/v1/info`, `${base}/info`]

    for (const endpoint of endpoints) {
        const controller = new AbortController()
        const timer = setTimeout(() => controller.abort(), 5000)
        try {
            const res = await fetch(endpoint, {
                method: 'GET',
                headers: { Accept: 'application/json' },
                signal: controller.signal,
            })
            clearTimeout(timer)
            if (!res.ok) continue
            const json = await res.json()
            // NUT-06 standard field
            if (typeof json?.icon_url === 'string' && json.icon_url) return json.icon_url
            // Legacy/alternate field names
            if (typeof json?.icon === 'string' && json.icon) return json.icon
        } catch {
            clearTimeout(timer)
            // timeout or network — try next endpoint
        }
    }
    return null
}

// ── Types ─────────────────────────────────────────────────────────────────────
interface MintPickerStepProps {
    onComplete: (selectedMintUrl: string) => void
    onSkip: () => void
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MintPickerStep({ onComplete, onSkip }: MintPickerStepProps) {
    const [mints, setMints] = useState<MintRecommendation[]>(PRODUCTION_MINTS)
    const [loadingMessage, setLoadingMessage] = useState('Searching the Nostr network...')
    const [isLoading, setIsLoading] = useState(true)
    const [selectedMint, setSelectedMint] = useState<MintRecommendation | null>(null)
    const [isTrusting, setIsTrusting] = useState(false)
    const sheetRef = useRef<AppBottomSheetRef>(null)

    useEffect(() => { loadMints() }, [])

    const patchIcon = (url: string, icon: string) => {
        setMints(prev => prev.map(m => m.url === url ? { ...m, icon } : m))
    }

    const loadMints = async () => {
        setIsLoading(true)
        setLoadingMessage('Searching the Nostr network...')
        try {
            // Request up to 100 mints from Nostr
            const discovered = await mintRecommendationService.discoverMints(100)

            // Filter out testnet/localhost from Nostr results (we add them manually below)
            const production = discovered.filter(m =>
                !m.url.includes('testnut') &&
                !m.url.includes('localhost') &&
                !m.url.includes('127.0.0.1')
            )

            // Curated production mints first, extras from Nostr after, testnets at the bottom
            const merged = [...PRODUCTION_MINTS]
            production.forEach(m => {
                if (!merged.find(x => x.url === m.url)) merged.push(m)
            })
            // Always append testnet mints at the bottom
            TESTNET_MINTS.forEach(m => {
                if (!merged.find(x => x.url === m.url)) merged.push(m)
            })

            setMints(merged)
            setLoadingMessage('Fetching mint icons...')

            // Fetch each mint's icon from /v1/info in parallel — patch in as they arrive
            merged.forEach(mint => {
                if (mint.icon) return
                fetchMintIcon(mint.url).then(icon => {
                    if (icon) patchIcon(mint.url, icon)
                })
            })
        } catch {
            // Fall back to curated + testnet list
            const fallback = [...PRODUCTION_MINTS, ...TESTNET_MINTS]
            setMints(fallback)
            fallback.forEach(mint => {
                fetchMintIcon(mint.url).then(icon => {
                    if (icon) patchIcon(mint.url, icon)
                })
            })
        } finally {
            setIsLoading(false)
        }
    }

    const handleConnect = (mint: MintRecommendation) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        setSelectedMint(mint)
        sheetRef.current?.present()
    }

    const handleTrust = async () => {
        if (!selectedMint) return
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        setIsTrusting(true)
        try {
            await new Promise(resolve => setTimeout(resolve, 300))
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            sheetRef.current?.dismiss()
            onComplete(selectedMint.url)
        } catch {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        } finally {
            setIsTrusting(false)
        }
    }

    return (
        <YStack flex={1} bg="$background">

            {/* ── Header ── */}
            <XStack items="center" justify="space-between" px="$4" pt="$6" pb="$2">
                <H3 fontSize="$7" fontWeight="bold">Choose a Mint</H3>
                <Button
                    size="$2" circular chromeless
                    icon={isLoading ? <Spinner size="small" /> : <RefreshCw size={14} />}
                    onPress={loadMints}
                    disabled={isLoading}
                />
            </XStack>
            <Text color="$gray10" fontSize="$3" px="$4" pb="$3" lineHeight="$4">
                A mint issues your ecash. Pick one to get started — add more later.
            </Text>

            {/* ── Loading bar ── */}
            {isLoading && (
                <XStack px="$4" pb="$2" gap="$2" items="center">
                    <Spinner size="small" color="$gray9" />
                    <Text color="$gray9" fontSize="$2">{loadingMessage}</Text>
                </XStack>
            )}

            {/* ── Mint list ── */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16 }}
                showsVerticalScrollIndicator={false}
            >
                {mints.map((mint, index) => {
                    const isMostRecommended = index < 2
                    const displayName = mint.name ?? (() => {
                        try { return new URL(mint.url).hostname } catch { return mint.url }
                    })()

                    return (
                        <Card
                            key={mint.url}
                            size="$4"
                            p="$3"
                            bg={mint.isTestnet ? '$gray2' : '$gray3'}
                            minH={150}
                            mb="$3"
                            pressStyle={{ scale: 0.98 }}
                            animation="quick"
                            borderWidth={mint.isTestnet ? 1 : 0}
                            borderColor={mint.isTestnet ? '$orange6' : 'transparent'}
                            borderStyle={mint.isTestnet ? 'dashed' : 'solid'}
                        >
                            <YStack justify="space-between" flex={1}>

                                {/* Top: icon + name + description */}
                                <XStack gap="$3">
                                    <View
                                        width={48} height={48}
                                        rounded="$4" bg="$gray4"
                                        items="center" justify="center"
                                        overflow="hidden"
                                    >
                                        {mint.icon ? (
                                            <Image
                                                source={{ uri: mint.icon }}
                                                style={{ width: 48, height: 48, borderRadius: 8 }}
                                                resizeMode="cover"
                                            />
                                        ) : (
                                            <Sprout size={28} color="$gray10" />
                                        )}
                                    </View>

                                    <YStack flex={1} gap="$1">
                                        <H4 fontSize="$5" fontWeight="700" numberOfLines={1}>
                                            {displayName}
                                        </H4>
                                        <Text color="$gray10" fontSize="$3" numberOfLines={2}>
                                            {mint.description || mint.url}
                                        </Text>
                                    </YStack>
                                </XStack>

                                {/* Bottom: stats + connect button */}
                                <XStack mt="$3" items="center" justify="space-between">
                                    <XStack gap="$3" items="center">
                                        <XStack items="center" gap="$1">
                                            <MessageSquare size={14} color="$gray9" />
                                            <Text fontSize="$2" color="$gray9">{mint.reviewsCount}</Text>
                                        </XStack>
                                        <XStack items="center" gap="$1">
                                            <Star size={14} color="#FFD700" fill="#FFD700" />
                                            <Text fontSize="$3" fontWeight="bold">
                                                {mint.averageRating ? mint.averageRating.toFixed(1) : 'N/A'}
                                            </Text>
                                        </XStack>
                                    </XStack>

                                    <Button
                                        size="$3"
                                        fontWeight="bold"
                                        theme="accent"
                                        icon={<Plus size={14} />}
                                        onPress={() => handleConnect(mint)}
                                    >
                                        Connect
                                    </Button>
                                </XStack>
                            </YStack>

                            {/* TOP BEST badge (production) or TESTNET badge */}
                            {mint.isTestnet ? (
                                <XStack
                                    position="absolute" t={-10} r={12}
                                    bg="$orange3" px="$2" py="$1" rounded="$2"
                                    borderWidth={1} borderColor="$orange7"
                                    items="center" gap="$1" z={10} elevation={3}
                                >
                                    <Text fontSize="$1" fontWeight="800" color="$orange10" letterSpacing={0.5}>
                                        TESTNET
                                    </Text>
                                </XStack>
                            ) : isMostRecommended ? (
                                <XStack
                                    position="absolute" t={-10} r={12}
                                    bg="gold" px="$2" py="$1" rounded="$2"
                                    borderWidth={1} borderColor="$yellow10"
                                    items="center" gap="$1" z={10} elevation={3}
                                >
                                    <Star size={10} color="black" fill="black" />
                                    <Text fontSize="$1" fontWeight="800" color="black" letterSpacing={0.5}>
                                        TOP BEST
                                    </Text>
                                </XStack>
                            ) : null}
                        </Card>
                    )
                })}
            </ScrollView>

            {/* ── Skip ── */}
            <YStack px="$4" pb="$8" pt="$2" borderTopWidth={1} borderColor="$borderColor">
                <Button
                    size="$4" theme="gray" chromeless
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                        onSkip()
                    }}
                >
                    <Text color="$gray10" fontSize="$3">Skip for now — I'll add a mint later</Text>
                </Button>
            </YStack>

            {/* ── Mint detail bottom sheet ── */}
            <AppBottomSheet ref={sheetRef} snapPoints={['52%']}>
                {selectedMint && (
                    <YStack p="$5" gap="$4">
                        <XStack gap="$3" items="center">
                            <View
                                width={56} height={56} rounded="$5"
                                bg="$gray4" items="center" justify="center"
                                overflow="hidden"
                            >
                                {selectedMint.icon ? (
                                    <Image
                                        source={{ uri: selectedMint.icon }}
                                        style={{ width: 56, height: 56, borderRadius: 10 }}
                                        resizeMode="cover"
                                    />
                                ) : (
                                    <Sprout size={30} color="$gray10" />
                                )}
                            </View>
                            <YStack flex={1}>
                                <Text fontWeight="700" fontSize="$6" numberOfLines={1}>
                                    {selectedMint.name ?? (() => { try { return new URL(selectedMint.url).hostname } catch { return selectedMint.url } })()}
                                </Text>
                                <Text color="$gray10" fontSize="$2" numberOfLines={1}>
                                    {selectedMint.url.replace('https://', '')}
                                </Text>
                            </YStack>
                        </XStack>

                        <Separator borderColor="$borderColor" />

                        {selectedMint.description && (
                            <Text color="$gray11" fontSize="$3" lineHeight="$4">
                                {selectedMint.description}
                            </Text>
                        )}

                        <XStack gap="$4">
                            {(selectedMint.reviewsCount ?? 0) > 0 && (
                                <XStack items="center" gap="$1.5">
                                    <MessageSquare size={14} color="$gray9" />
                                    <Text fontSize="$3" color="$gray9">
                                        {selectedMint.reviewsCount} reviews
                                    </Text>
                                </XStack>
                            )}
                            {selectedMint.averageRating && (
                                <XStack items="center" gap="$1.5">
                                    <Star size={14} color="#FFD700" fill="#FFD700" />
                                    <Text fontSize="$3" fontWeight="bold">
                                        {selectedMint.averageRating.toFixed(1)}
                                    </Text>
                                </XStack>
                            )}
                        </XStack>

                        <Button
                            size="$5" theme="accent" width="100%"
                            rounded="$4" fontWeight="700" fontSize="$5"
                            disabled={isTrusting}
                            onPress={handleTrust}
                            pressStyle={{ scale: 0.98 }}
                            icon={isTrusting
                                ? <Spinner size="small" />
                                : <ShieldCheck size={22} />
                            }
                        >
                            {isTrusting ? 'Connecting...' : 'Trust & Use This Mint'}
                        </Button>
                    </YStack>
                )}
            </AppBottomSheet>
        </YStack>
    )
}
