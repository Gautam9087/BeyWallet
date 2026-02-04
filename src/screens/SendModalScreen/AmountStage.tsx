import React from 'react';
import { YStack, XStack, Text, H1, Button } from "tamagui";
import { ChevronDown, Send, Sprout, User } from "@tamagui/lucide-icons";
import { NumericKeypad } from "~/components/UI/NumericKeypad";
import Blockies from '~/components/UI/Blockies';

interface AmountStageProps {
    amount: string;
    setAmount: (val: string) => void;
    onContinue: () => void;
    balance: number;
}

export function AmountStage({ amount, setAmount, onContinue, balance }: AmountStageProps) {
    return (
        <YStack flex={1} justify="space-between">
            <YStack width="100%" height={300} rounded="$4" justify="space-between" bg="$color2" items="center">
                <XStack width="100%" p="$3" items="center" borderBottomWidth={1} borderBottomColor="$color3" justify="space-between">
                    <XStack gap="$2" items="center">
                        <Sprout size={24} strokeWidth={2} color="$color" />
                        <Text fontWeight="400">Selected Mint</Text>
                    </XStack>
                    <ChevronDown size={18} color="$color" />
                </XStack>

                <YStack items="center" gap="$1">
                    <Text color="$gray10" fontSize="$3">How much to send?</Text>
                    <H1 fontWeight="400" py="$2">₿{amount}</H1>
                    <Text color="$gray10" fontSize="$3" mt="$-1">≈ ₹{Number(amount) * 0.3} </Text>
                </YStack>

                <XStack width="100%" p="$3" borderTopWidth={1} borderTopColor="$color3" justify="space-between" items="center">
                    <Text color="$gray10" fontWeight="400" fontSize="$3">Available Balance</Text>
                    <XStack gap="$2" items="center">

                        <Text color="$gray10" fontWeight="600" fontSize="$3">₿{balance}</Text>
                        <Button size="$2" onPress={() => setAmount(balance.toString())}>Max</Button>
                    </XStack>
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
