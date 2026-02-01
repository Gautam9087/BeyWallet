import { YStack, XStack, H2, Text, Button, Input } from "tamagui";
import { useRouter } from "expo-router";
import { ArrowLeft } from "@tamagui/lucide-icons";
import { useState } from "react";

export default function MintScreen() {
    const router = useRouter();
    const [amount, setAmount] = useState("");

    return (
        <YStack flex={1} bg="$background" p="$4" gap="$4" pt="$8">
            <XStack items="center" gap="$4">
                <Button icon={<ArrowLeft />} circular onPress={() => router.back()} />
                <H2>Mint</H2>
            </XStack>

            <YStack flex={1} gap="$4" pt="$4">
                <Text fontSize="$5">How much do you want to deposit?</Text>
                <Input
                    placeholder="Amount in SATS"
                    value={amount}
                    onChangeText={setAmount}
                    keyboardType="numeric"
                    size="$6"
                />
                <Button theme="green" size="$6" mt="auto">
                    Next
                </Button>
            </YStack>
        </YStack>
    );
}
