import React from 'react';
import { YStack, XStack, Text, Button, View, Separator, ScrollView } from "tamagui";
import { Check, CheckCircle2, AlertCircle, RefreshCw, XCircle } from "@tamagui/lucide-icons";
import { useWalletStore } from "~/store/walletStore";

interface ResultStageProps {
    status: 'success' | 'error' | 'cancelled';
    amount: string;
    sourceMintUrl: string;
    targetMintUrl: string;
    error: string | null;
    onClose: () => void;
}

const DetailItem = ({ label, value, isError = false }: { label: string, value: string | React.ReactNode, isError?: boolean }) => (
    <XStack justify="space-between" items="center" px="$4" py="$3" bg="$colorTransparent">
        <Text color="$gray10" fontSize="$4" fontWeight="600">{label}</Text>
        {typeof value === 'string' ? (
            <Text color={isError ? "$red10" : "$color"} fontSize="$4" fontWeight="500" numberOfLines={1} style={{ maxWidth: 200 }} ellipsizeMode="middle">
                {value}
            </Text>
        ) : (
            value
        )}
    </XStack>
);

export function ResultStage({ status, amount, sourceMintUrl, targetMintUrl, error, onClose }: ResultStageProps) {
    const { mints } = useWalletStore();

    const getMintName = (url: string) => {
        const mint = mints.find(m => m.mintUrl.replace(/\/$/, '') === url.replace(/\/$/, ''));
        return mint?.nickname || mint?.name || url.replace(/^https?:\/\//, '').replace(/\/$/, '');
    };

    const isSuccess = status === 'success';

    return (
        <YStack flex={1} bg="$background" justify="space-between">
            <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                <YStack items="center" gap="$4" pt="$6" pb="$4">
                    <View
                        p="$4"
                        rounded="$10"
                        bg={isSuccess ? "$green3" : status === 'cancelled' ? "$orange3" : "$red3"}
                    >
                        {isSuccess ? (
                            <CheckCircle2 size={48} color="$green10" />
                        ) : status === 'cancelled' ? (
                            <XCircle size={48} color="$orange10" />
                        ) : (
                            <AlertCircle size={48} color="$red10" />
                        )}
                    </View>
                    <YStack items="center" gap="$2">
                        <Text fontSize="$6" fontWeight="800">
                            {isSuccess ? 'Swap Complete' : status === 'cancelled' ? 'Swap Cancelled' : 'Swap Failed'}
                        </Text>
                        {isSuccess ? (
                            <Text fontSize="$8" fontWeight="800" color="$green10">
                                {amount} SATS
                            </Text>
                        ) : error ? (
                            <Text color="$red10" fontSize="$3" text="center" px="$4">
                                {error}
                            </Text>
                        ) : null}
                    </YStack>
                </YStack>

                <YStack gap="$0" mb="$6" bg="$gray2" rounded="$5" overflow="hidden" separator={<Separator borderColor="$borderColor" opacity={0.5} />}>
                    <DetailItem label="Status" value={
                        <XStack items="center" gap="$2">
                            {isSuccess ? <Check size={14} color="$green10" /> : <AlertCircle size={14} color="$red10" />}
                            <Text color={isSuccess ? "$green10" : "$red10"} fontSize="$2" fontWeight="600" textTransform="uppercase">
                                {status}
                            </Text>
                        </XStack>
                    } />
                    <DetailItem label="Amount" value={`${amount} SATS`} />
                    <DetailItem label="Source" value={getMintName(sourceMintUrl)} />
                    <DetailItem label="Target" value={getMintName(targetMintUrl)} />
                </YStack>
            </ScrollView>

            <YStack pb="$4" pt="$2" bg="$background">
                <Button
                    theme="accent"
                    size="$5"
                    width="100%"
                    rounded="$4"
                    fontWeight="800"
                    onPress={onClose}
                >
                    DONE
                </Button>
            </YStack>
        </YStack>
    );
}
