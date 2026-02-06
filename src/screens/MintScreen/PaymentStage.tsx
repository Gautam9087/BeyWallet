import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, View, Paragraph } from "tamagui";
import { Copy, Check, Clock } from "@tamagui/lucide-icons";
import QRCode from "react-native-qrcode-svg";
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useToastController } from '@tamagui/toast';

interface PaymentStageProps {
    amount: string;
    invoice: string;
    quoteId: string;
    expiry?: number;
    onPaid: () => void;
    onCancel: () => void;
}

export function PaymentStage({ amount, invoice, quoteId, expiry, onPaid, onCancel }: PaymentStageProps) {
    const sats = parseInt(amount, 10);
    const toast = useToastController();
    const [copied, setCopied] = useState(false);
    const [timeLeft, setTimeLeft] = useState<number | null>(null);

    // Calculate time remaining until expiry
    useEffect(() => {
        if (!expiry) return;

        const calculateTimeLeft = () => {
            const now = Math.floor(Date.now() / 1000);
            const remaining = expiry - now;
            return remaining > 0 ? remaining : 0;
        };

        setTimeLeft(calculateTimeLeft());

        const timer = setInterval(() => {
            const remaining = calculateTimeLeft();
            setTimeLeft(remaining);
            if (remaining <= 0) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [expiry]);

    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    const handleCopy = async () => {
        await Clipboard.setStringAsync(invoice);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setCopied(true);
        toast.show('Copied!', { message: 'Invoice copied to clipboard' });
        setTimeout(() => setCopied(false), 2000);
    };

    const isExpired = timeLeft !== null && timeLeft <= 0;

    return (
        <YStack flex={1} items="center" gap="$4" p="$0">
            <YStack items="center" gap="$1">
                <Text color="$gray10" fontSize="$6" fontWeight="700">Pay Invoice</Text>
                <Text fontSize="$8" fontWeight="bold">{sats} SATS</Text>
                {timeLeft !== null && (
                    <XStack items="center" gap="$2" mt="$1">
                        <Clock size={14} color={isExpired ? "$red10" : "$gray10"} />
                        <Text
                            fontSize="$3"
                            color={isExpired ? "$red10" : "$gray10"}
                            fontWeight={isExpired ? "bold" : "normal"}
                        >
                            {isExpired ? 'Invoice Expired' : `Expires in ${formatTime(timeLeft)}`}
                        </Text>
                    </XStack>
                )}
            </YStack>

            <View p="$4" bg="white" rounded="$5" opacity={isExpired ? 0.5 : 1}>
                <QRCode value={invoice} size={280} />
            </View>

            <Button
                size="$4"
                theme="gray"
                icon={copied ? <Check size={16} /> : <Copy size={16} />}
                onPress={handleCopy}
                disabled={isExpired}
            >
                {copied ? 'Copied!' : 'Copy Invoice'}
            </Button>

            <Paragraph text="center" color="$gray10" fontSize="$3" px="$4">
                Scan this QR code with a Lightning wallet or copy the invoice to complete your deposit.
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
                    disabled={isExpired}
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
