import React from 'react';
import { YStack, XStack, Text, H1 } from "tamagui";
import { ChevronDown, Sprout } from "@tamagui/lucide-icons";
import { NumericKeypad } from "~/components/UI/NumericKeypad";

interface AmountStageProps {
    amount: string;
    setAmount: (val: string) => void;
    onContinue: () => void;
}

export function AmountStage({ amount, setAmount, onContinue }: AmountStageProps) {
    return (
        <YStack flex={1} justify="space-between">
            <YStack width="100%" height={300} rounded="$4" justify="space-between" bg="$color2" items="center">
                <XStack width="100%" p="$3" items="center" borderBottomWidth={1} borderBottomColor="$color3" justify="space-between">
                    <XStack gap="$2" items="center">
                        <Sprout size={18} color="$color" />
                        <Text fontWeight="400">Cashu Testnut</Text>
                    </XStack>
                    <ChevronDown size={18} color="$color" />
                </XStack>

                <YStack items="center" gap="$3">
                    <Text color="$gray10" fontSize="$3">How much to deposit?</Text>
                    <H1 fontWeight="400" fontSize={60}>${amount}</H1>
                    <Text color="$gray10" fontSize="$3" mt="$-2">≈ {Number(amount) * 3000} SATS</Text>
                </YStack>

                <XStack width="100%" p="$3" borderTopWidth={1} borderTopColor="$color3">
                    <Text color="$gray10" fontWeight="400" fontSize="$3">Bitcoin - Lightning Network</Text>
                </XStack>
            </YStack>

            <NumericKeypad
                showAmountDisplay={false}
                value={amount}
                onValueChange={setAmount}
                onConfirm={onContinue}
                confirmLabel="Continue"
            />
        </YStack>
    );
}
