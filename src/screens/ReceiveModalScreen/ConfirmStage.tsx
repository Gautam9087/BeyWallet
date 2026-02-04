import React from 'react';
import { YStack, XStack, Text, Button, H1, H2, Separator, View } from 'tamagui';
import { ArrowUpDown, DollarSign, Building2, ArrowLeft } from '@tamagui/lucide-icons';
import * as Haptics from 'expo-haptics';

interface ConfirmStageProps {
    token: string;
    onConfirm: () => void;
    onBack: () => void;
}

export function ConfirmStage({ token, onConfirm, onBack }: ConfirmStageProps) {
    // Mock data based on the image
    const amount = "60";
    const mintName = "Testnut mint";
    const fee = "1";
    const fiat = "0.05";
    const mintUrl = "testnut.cashu.space";

    return (
        <YStack flex={1} bg="$background" gap="$6" pt="$4">
            {/* Token Preview Card */}
            <YStack bg="$color3" rounded="$4" p="$4" minHeight={150} gap="$2" position="relative">
                <Text color="$gray10" fontSize="$3" numberOfLines={5} ellipsizeMode="middle">
                    {token || "cashuBo2FteBtodHRwczovL3Rl..."}
                </Text>

                <YStack mt="auto">
                    <Text fontWeight="600" fontSize="$4">{mintName}</Text>
                </YStack>

                <View position="absolute" right={20} bottom={20}>
                    <H1 fontSize={44} fontWeight="900">₿{amount}</H1>
                </View>
            </YStack>

            {/* Details Table */}
            <YStack gap="$4" px="$2">
                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <ArrowUpDown size={20} opacity={0.6} />
                        <Text color="$gray11" fontSize="$5" fontWeight="500">Fee</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$5">₿{fee}</Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <View width={22} height={22} borderWidth={1.5} borderColor="$gray11" rounded="$1" justify="center" items="center">
                            <DollarSign size={16} color="$gray11" />
                        </View>
                        <Text color="$gray11" fontSize="$5" fontWeight="500">Fiat</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$5">${fiat}</Text>
                </XStack>

                <XStack justify="space-between" items="center">
                    <XStack gap="$3" items="center">
                        <Building2 size={20} opacity={0.6} />
                        <Text color="$gray11" fontSize="$5" fontWeight="500">Mint</Text>
                    </XStack>
                    <Text fontWeight="700" fontSize="$5" opacity={0.9}>{mintUrl}</Text>
                </XStack>
            </YStack>

            {/* Action Buttons */}
            <YStack mt="auto" gap="$3" pb="$4">
                <Button
                    chromeless
                    onPress={onBack}
                    pressStyle={{ opacity: 0.7 }}
                >
                    <Text fontWeight="700" fontSize="$4" color="$gray11">RECEIVE LATER</Text>
                </Button>

                <Button
                    variant="outlined"
                    borderColor="$color"
                    borderWidth={1.5}
                    height={60}
                    rounded="$10"
                    onPress={() => { }}
                    pressStyle={{ opacity: 0.8 }}
                >
                    <Text fontWeight="800" fontSize="$4">RECEIVE TO TRUSTED MINT</Text>
                </Button>

                <Button
                    bg="white"
                    color="black"
                    height={65}
                    rounded="$10"
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                        onConfirm();
                    }}
                    pressStyle={{ opacity: 0.9, scale: 0.98 }}
                >
                    <Text fontWeight="900" fontSize="$5">RECEIVE</Text>
                </Button>
            </YStack>
        </YStack>
    );
}
