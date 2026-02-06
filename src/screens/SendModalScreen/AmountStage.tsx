import React from 'react';
import { YStack, XStack, Text, H1, Button } from "tamagui";
import { ChevronDown, Sprout, AlertCircle } from "@tamagui/lucide-icons";
import { NumericKeypad } from "~/components/UI/NumericKeypad";
import { Spinner } from '~/components/UI/Spinner';

interface AmountStageProps {
    amount: string;
    setAmount: (val: string) => void;
    onContinue: () => void;
    balance: number;
    isLoading?: boolean;
    error?: string | null;
}

export function AmountStage({ amount, setAmount, onContinue, balance, isLoading, error }: AmountStageProps) {
    const parsedAmount = parseInt(amount, 10) || 0;
    const isOverBalance = parsedAmount > balance;
    const isValidAmount = parsedAmount > 0 && parsedAmount <= balance;

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
                    <H1 fontWeight="400" py="$2" color={isOverBalance ? "$red10" : "$color"}>
                        ₿{amount}
                    </H1>
                    {isOverBalance && (
                        <Text color="$red10" fontSize="$3">Exceeds available balance</Text>
                    )}
                </YStack>

                <XStack width="100%" p="$3" borderTopWidth={1} borderTopColor="$color3" justify="space-between" items="center">
                    <Text color="$gray10" fontWeight="400" fontSize="$3">Available Balance</Text>
                    <XStack gap="$2" items="center">
                        <Text color="$gray10" fontWeight="600" fontSize="$3">₿{balance}</Text>
                        <Button
                            size="$2"
                            onPress={() => setAmount(balance.toString())}
                            disabled={balance === 0}
                        >
                            Max
                        </Button>
                    </XStack>
                </XStack>
            </YStack>

            {/* Error Display */}
            {error && (
                <XStack bg="$red3" p="$3" rounded="$3" gap="$2" items="center" mt="$4">
                    <AlertCircle size={18} color="$red10" />
                    <Text color="$red10" fontSize="$3" flex={1}>{error}</Text>
                </XStack>
            )}

            <NumericKeypad
                showAmountDisplay={false}
                value={amount}
                onValueChange={setAmount}
                onConfirm={onContinue}
                confirmLabel={isLoading ? "Processing..." : "Continue"}
                confirmDisabled={!isValidAmount || isLoading}
                confirmIcon={isLoading ? <Spinner size="small" /> : undefined}
            />
        </YStack>
    );
}
