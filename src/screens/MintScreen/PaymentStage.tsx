import React from 'react';
import { YStack, XStack, Text, Button, View, Paragraph } from "tamagui";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from 'expo-haptics';

interface PaymentStageProps {
    amount: string;
    onPaid: () => void;
    onCancel: () => void;
}

export function PaymentStage({ amount, onPaid, onCancel }: PaymentStageProps) {
    const sats = Number(amount) * 3000;
    // Mock lightning invoice
    const invoice = "lnbc" + Math.random().toString(36).substring(7) + "fakeinvoice";

    return (
        <YStack flex={1} items="center" gap="$4" p="$0">
            <YStack items="center" gap="$1">
                <Text color="$gray10" fontSize="$6" fontWeight="700">Pay Invoice</Text>
                <Text fontSize="$8">{sats} SATS</Text>
            </YStack>

            <View p="$4" bg="white" rounded="$5">
                <QRCode value={invoice} size={300} />
            </View>

            <Paragraph text="center" color="$gray10" fontSize="$3" px="$4">
                Scan this QR code with a Lightning wallet to complete your deposit.
            </Paragraph>

            <YStack width="100%" mt="auto" gap="$3">
                <Button
                    theme="red"
                    size="$5"
                    chromeless
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        onCancel();
                    }}
                >
                    Cancel Transaction
                </Button>
                <Button
                    theme="accent"
                    size="$5"
                    onPress={() => {
                        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                        onPaid();
                    }}
                >
                    I have paid
                </Button>
            </YStack>
        </YStack>
    );
}
