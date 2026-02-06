import React from 'react';
import { YStack, XStack, Text, Button, View, TextArea } from 'tamagui';
import { Scan, Nfc, AlertCircle } from '@tamagui/lucide-icons';
import { Spinner } from '../../components/UI/Spinner';
import * as Haptics from 'expo-haptics';
import * as ClipboardAPI from 'expo-clipboard';

interface InputStageProps {
    token: string;
    setToken: (val: string) => void;
    isLoading?: boolean;
    error?: string | null;
    onContinue: () => void;
}

export function InputStage({ token, setToken, isLoading, error, onContinue }: InputStageProps) {
    const handlePaste = async () => {
        const text = await ClipboardAPI.getStringAsync();
        if (text) {
            setToken(text);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }
    };

    const isValidToken = token.trim().length > 20 && (
        token.trim().startsWith('cashu') ||
        token.trim().startsWith('creqA')
    );

    return (
        <YStack flex={1} bg="$background" gap="$6" pt="$4">
            {/* Token Input Card */}
            <YStack bg="$color3" rounded="$4" p="$4" minHeight={180}>
                <XStack justify="space-between" items="center" mb="$2">
                    <Text color="$gray11" fontSize="$4">Cashu token</Text>
                    <Button
                        size="$3"
                        chromeless
                        onPress={handlePaste}
                        p="$2"
                    >
                        <Text color="$color" fontWeight="700">Paste</Text>
                    </Button>
                </XStack>
                <TextArea
                    value={token}
                    onChangeText={setToken}
                    placeholder="Paste cashu token here..."
                    bg="transparent"
                    borderWidth={0}
                    fontSize="$5"
                    p={0}
                    flex={1}
                    textAlignVertical="top"
                    placeholderTextColor="$gray9"
                />
            </YStack>

            {/* Error Display */}
            {error && (
                <XStack bg="$red3" p="$3" rounded="$3" gap="$2" items="center">
                    <AlertCircle size={18} color="$red10" />
                    <Text color="$red10" fontSize="$3" flex={1}>{error}</Text>
                </XStack>
            )}

            {/* Scanning Options */}
            <YStack gap="$3">
                <Button
                    height={80}
                    bg="$color3"
                    rounded="$4"
                    onPress={() => { }}
                    pressStyle={{ bg: '$color4' }}
                    p="$4"
                >
                    <XStack flex={1} items="center" gap="$4">
                        <View bg="$color5" p="$3" rounded="$3">
                            <Scan size={28} color="$color" />
                        </View>
                        <YStack>
                            <Text fontSize="$5" fontWeight="700">Scan QR Code</Text>
                            <Text color="$gray10" fontSize="$3">Tap to scan a cashu token</Text>
                        </YStack>
                    </XStack>
                </Button>

                <Button
                    height={60}
                    chromeless
                    onPress={() => { }}
                    pressStyle={{ opacity: 0.7 }}
                >
                    <XStack items="center" gap="$2" justify="center">
                        <Nfc size={24} color="$color" />
                        <Text fontSize="$5" fontWeight="700">NFC</Text>
                    </XStack>
                </Button>
            </YStack>

            {/* Continue Button */}
            {isValidToken && (
                <Button
                    mt="auto"
                    theme="accent"
                    size="$5"
                    fontWeight="800"
                    disabled={isLoading}
                    icon={isLoading ? <Spinner size="small" color="white" /> : undefined}
                    onPress={onContinue}
                >
                    {isLoading ? 'Decoding...' : 'Preview Token'}
                </Button>
            )}
        </YStack>
    );
}
