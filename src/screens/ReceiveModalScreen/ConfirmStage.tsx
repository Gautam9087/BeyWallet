import React from 'react';
import { YStack, XStack, Text, Button, H1, View } from 'tamagui';
import { ArrowUpDown, DollarSign, Building2, AlertTriangle, Shield } from '@tamagui/lucide-icons';
import { Spinner } from '../../components/UI/Spinner';
import * as Haptics from 'expo-haptics';
import { useWalletStore } from '../../store/walletStore';

interface TokenInfo {
    mint: string;
    amount: number;
    proofCount: number;
}

interface ConfirmStageProps {
    token: string;
    tokenInfo: TokenInfo;
    isLoading?: boolean;
    onConfirm: () => void;
    onBack: () => void;
}

export function ConfirmStage({ token, tokenInfo, isLoading, onConfirm, onBack }: ConfirmStageProps) {
    const { mints } = useWalletStore();

    // Check if mint is trusted
    const normalizeUrl = (url: string) => url.replace(/\/$/, '').toLowerCase();
    const isMintTrusted = mints.some(m =>
        normalizeUrl(m.mintUrl) === normalizeUrl(tokenInfo.mint) && m.trusted
    );

    // Get mint display name
    const getMintDisplayName = (url: string) => {
        try {
            return new URL(url).hostname;
        } catch {
            return url;
        }
    };

    return (
        <YStack flex={1} bg="$background" gap="$6" pt="$4">
            {/* Token Preview Card */}
            <YStack bg="$color3" rounded="$4" p="$4" minHeight={150} gap="$2" position="relative">
                <Text color="$gray10" fontSize="$3" numberOfLines={3} ellipsizeMode="middle">
                    {token.substring(0, 80)}...
                </Text>

                <YStack mt="auto">
                    <XStack items="center" gap="$2">
                        {isMintTrusted ? (
                            <Shield size={14} color="$green10" />
                        ) : (
                            <AlertTriangle size={14} color="$orange10" />
                        )}
                        <Text fontWeight="600" fontSize="$4" color={isMintTrusted ? "$color" : "$orange10"}>
                            {getMintDisplayName(tokenInfo.mint)}
                        </Text>
                    </XStack>
                </YStack>

                <View position="absolute" right={20} bottom={20}>
                    <H1 fontSize={44} fontWeight="900">₿{tokenInfo.amount}</H1>
                </View>
            </YStack>

            {/* Warning for untrusted mint */}
            {!isMintTrusted && (
                <XStack bg="$orange3" p="$3" rounded="$3" gap="$2" items="center">
                    <AlertTriangle size={18} color="$orange10" />
                    <Text color="$orange10" fontSize="$3" flex={1}>
                        This token is from an untrusted mint. It will be added automatically.
                    </Text>
                </XStack>
            )}

            {/* Details Table */}
            <YStack gap="$4" px="$2">
                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <ArrowUpDown size={20} opacity={0.6} />
                        <Text color="$gray11" fontSize="$5" fontWeight="500">Amount</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$5">₿{tokenInfo.amount}</Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <View width={22} height={22} borderWidth={1.5} borderColor="$gray11" rounded="$1" justify="center" items="center">
                            <DollarSign size={16} color="$gray11" />
                        </View>
                        <Text color="$gray11" fontSize="$5" fontWeight="500">Proofs</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$5">{tokenInfo.proofCount}</Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <Building2 size={20} opacity={0.6} />
                        <Text color="$gray11" fontSize="$5" fontWeight="500">Mint</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$5" opacity={0.9} numberOfLines={1} maxWidth={180}>
                        {getMintDisplayName(tokenInfo.mint)}
                    </Text>
                </XStack>
            </YStack>

            {/* Action Buttons */}
            <YStack mt="auto" gap="$3" pb="$4">
                <Button
                    chromeless
                    onPress={onBack}
                    disabled={isLoading}
                    pressStyle={{ opacity: 0.7 }}
                >
                    <Text fontWeight="700" fontSize="$4" color="$gray11">GO BACK</Text>
                </Button>

                <Button
                    bg="white"
                    color="black"
                    height={65}
                    rounded="$10"
                    disabled={isLoading}
                    icon={isLoading ? <Spinner size="small" /> : undefined}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        onConfirm();
                    }}
                    pressStyle={{ opacity: 0.9, scale: 0.98 }}
                >
                    <Text fontWeight="900" fontSize="$5">
                        {isLoading ? 'RECEIVING...' : 'RECEIVE'}
                    </Text>
                </Button>
            </YStack>
        </YStack>
    );
}
