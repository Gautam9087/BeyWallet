import React, { useState } from 'react';
import { YStack, XStack, Text, Button, H3, View, Label } from 'tamagui';
import { AlertTriangle, ShieldCheck, X } from '@tamagui/lucide-icons';
import Checkbox from 'expo-checkbox';
import AppBottomSheet, { AppBottomSheetRef } from '../../../components/UI/AppBottomSheet';

interface TrustingMintProps {
    bottomSheetRef: React.RefObject<AppBottomSheetRef>;
    mintUrl: string;
    onConfirm: (url: string) => Promise<void>;
}

export function TrustingMint({ bottomSheetRef, mintUrl, onConfirm }: TrustingMintProps) {
    const [isTrusted, setIsTrusted] = useState(false);
    const [isAdding, setIsAdding] = useState(false);

    const handleConfirm = async () => {
        if (!isTrusted) return;
        setIsAdding(true);
        try {
            await onConfirm(mintUrl);
            bottomSheetRef.current?.dismiss();
        } finally {
            setIsAdding(false);
            setIsTrusted(false);
        }
    };

    const handleCancel = () => {
        bottomSheetRef.current?.dismiss();
        setIsTrusted(false);
    };

    return (
        <AppBottomSheet ref={bottomSheetRef}>
            <YStack p="$4" gap="$5">
                <YStack items="center" justify="center" gap="$3">
                    <View bg="$yellow2" p="$2" rounded="$3">
                        <AlertTriangle color="$yellow10" size={24} />
                    </View>
                    <H3>Trust this Mint?</H3>
                </YStack>

                <YStack gap="$3" bg="$gray2" p="$4" rounded="$4" borderWidth={1} borderColor="$gray4">
                    <Text fontSize="$3" color="$gray10" text="justify">
                        By adding this mint, you acknowledge that Cashu mints are custodial in nature.
                    </Text>
                    <Text fontSize="$3" fontWeight="bold" color="$gray12" text="justify">
                        Bey Wallet is not responsible for any loss of funds due to mint failure, exit scams, or technical issues.
                    </Text>
                    <Text fontSize="$2" color="$gray10" fontStyle="italic">
                        Target Mint: {mintUrl}
                    </Text>
                </YStack>

                <XStack justify="center" items="center" gap="$0" px="$1">
                    <Checkbox
                        value={isTrusted}
                        onValueChange={setIsTrusted}
                        color={isTrusted ? '$color' : undefined}
                    />
                    <Label
                        onPress={() => setIsTrusted(!isTrusted)}
                        fontSize="$3"
                        text="center"
                        color="$gray10"
                        flex={1}
                    >
                        I understand the risks and I trust this mint.
                    </Label>
                </XStack>

                <XStack gap="$3">
                    <Button
                        flex={1}
                        theme="red"
                        onPress={handleCancel}
                        icon={<X size={16} />}
                    >
                        Cancel
                    </Button>
                    <Button
                        flex={1}
                        theme="accent"
                        disabled={!isTrusted || isAdding}
                        onPress={handleConfirm}
                        icon={isAdding ? undefined : <ShieldCheck size={16} />}
                    >
                        {isAdding ? 'Connecting...' : 'I Trust, Add Mint'}
                    </Button>
                </XStack>
            </YStack>
        </AppBottomSheet>
    );
}
