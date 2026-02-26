import React, { useState, useMemo, useRef } from 'react';
import { YStack, XStack, Text, Input, Button, View } from 'tamagui';
import { ClipboardPaste, ScanLine, AlertCircle, Zap } from '@tamagui/lucide-icons';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Spinner } from '~/components/UI/Spinner';

interface InvoiceStageProps {
    invoice: string;
    setInvoice: (val: string) => void;
    onContinue: () => void;
    isLoading?: boolean;
    error?: string | null;
}

export function InvoiceStage({ invoice, setInvoice, onContinue, isLoading, error }: InvoiceStageProps) {
    const [isPasting, setIsPasting] = useState(false);

    const isValidInvoice = useMemo(() => {
        if (!invoice.trim()) return false;
        const lower = invoice.trim().toLowerCase();
        return lower.startsWith('lnbc') || lower.startsWith('lntb') || lower.startsWith('lnurl') || lower.includes('@');
    }, [invoice]);

    const handlePaste = async () => {
        setIsPasting(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        try {
            const text = await Clipboard.getStringAsync();
            if (text) {
                // Strip lightning: prefix if present
                let cleaned = text.trim();
                if (cleaned.toLowerCase().startsWith('lightning:')) {
                    cleaned = cleaned.slice(10);
                }
                setInvoice(cleaned);
            }
        } catch (e) {
            console.warn('[MeltScreen] Clipboard read failed:', e);
        } finally {
            setIsPasting(false);
        }
    };

    const handleClear = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setInvoice('');
    };

    return (
        <YStack flex={1} justify="space-between" gap="$4">
            {/* Header */}
            <YStack gap="$2" items="center" pt="$4">
                <View bg="$orange4" p="$3" rounded="$10">
                    <Zap size={28} color="$orange10" />
                </View>
                <Text fontSize="$6" fontWeight="800" mt="$2">Pay Lightning Invoice</Text>
                <Text color="$gray10" fontSize="$3" textAlign="center" px="$4">
                    Paste a Lightning invoice to pay it with your ecash balance
                </Text>
            </YStack>

            {/* Invoice Input */}
            <YStack flex={1} gap="$3">
                <YStack
                    borderWidth={1}
                    borderColor={invoice ? (isValidInvoice ? "$green8" : "$orange8") : "$color4"}
                    rounded="$4"
                    overflow="hidden"
                    bg="$color2"
                >
                    <Input
                        value={invoice}
                        onChangeText={setInvoice}
                        placeholder="lnbc... or lightning address"
                        placeholderTextColor="$gray8"
                        size="$5"
                        borderWidth={0}
                        bg="transparent"
                        autoCapitalize="none"
                        autoCorrect={false}
                        multiline
                        numberOfLines={4}
                        style={{ textAlignVertical: 'top', minHeight: 120 }}
                    />

                    {invoice.length > 0 && (
                        <XStack justify="flex-end" p="$2" pt="$0">
                            <Button
                                size="$2"
                                chromeless
                                color="$gray10"
                                onPress={handleClear}
                            >
                                Clear
                            </Button>
                        </XStack>
                    )}
                </YStack>

                {/* Paste Button */}
                <Button
                    size="$5"
                    theme="gray"
                    icon={isPasting ? <Spinner size="small" /> : <ClipboardPaste size={20} />}
                    onPress={handlePaste}
                    disabled={isPasting}
                >
                    Paste from Clipboard
                </Button>

                {/* Error Display */}
                {error && (
                    <XStack bg="$red3" p="$3" rounded="$3" gap="$2" items="center">
                        <AlertCircle size={18} color="$red10" />
                        <Text color="$red10" fontSize="$3" flex={1}>{error}</Text>
                    </XStack>
                )}
            </YStack>

            {/* Continue Button */}
            <Button
                theme="accent"
                size="$5"
                fontWeight="800"
                onPress={onContinue}
                disabled={!isValidInvoice || isLoading}
                icon={isLoading ? <Spinner size="small" /> : undefined}
            >
                {isLoading ? 'Getting Quote...' : 'Continue'}
            </Button>
        </YStack>
    );
}
