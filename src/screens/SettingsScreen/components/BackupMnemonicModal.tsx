import React, { useState } from 'react';
import { Button, Sheet, YStack, XStack, Text, H3, Paragraph, Theme, View, Circle } from 'tamagui';
import { ShieldCheck, Copy, Eye, EyeOff } from '@tamagui/lucide-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { biometricService } from '~/services/biometricService';
import { seedService } from '~/services/seedService';

interface BackupMnemonicModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function BackupMnemonicModal({ open, onOpenChange }: BackupMnemonicModalProps) {
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [isAuthenticating, setIsAuthenticating] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const handleAuthenticate = async () => {
        setIsAuthenticating(true);
        const success = await biometricService.authenticateAsync('Authorize to view your secret backup phrase');

        if (success) {
            const m = await seedService.getMnemonic();
            setMnemonic(m);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } else {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
        setIsAuthenticating(false);
    };

    const handleCopy = async () => {
        if (mnemonic) {
            await Clipboard.setStringAsync(mnemonic);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        setMnemonic(null);
        setIsVisible(false);
    };

    const words = mnemonic?.split(' ') || [];

    return (
        <Sheet
            open={open}
            onOpenChange={(val) => {
                if (!val) handleClose();
                else onOpenChange(val);
            }}
            snapPoints={[85]}
            dismissOnSnapToBottom
            modal
            animation="lazy"
        >
            <Sheet.Frame p="$4" bg="$background">
                <Sheet.Handle />
                <YStack gap="$4" pt="$4">
                    <XStack items="center" gap="$3">
                        <Circle p="$2" bg="$blue5">
                            <ShieldCheck size={24} color="$blue10" />
                        </Circle>
                        <H3>Backup Seed Phrase</H3>
                    </XStack>

                    <Paragraph color="$gray11">
                        Your recovery phrase is the only way to restore your wallet if you lose your phone. Keep it offline and never share it.
                    </Paragraph>

                    {!mnemonic ? (
                        <YStack gap="$4" py="$8" items="center">
                            <Button
                                theme="blue"
                                size="$5"
                                icon={isAuthenticating ? undefined : ShieldCheck}
                                disabled={isAuthenticating}
                                onPress={handleAuthenticate}
                                width="100%"
                                rounded="$4"
                            >
                                {isAuthenticating ? 'Authenticating...' : 'Reveal Secret Phrase'}
                            </Button>
                        </YStack>
                    ) : (
                        <YStack gap="$4">
                            <View
                                bg="$backgroundPress"
                                p="$4"
                                rounded="$4"
                                borderWidth={1}
                                borderColor="$borderColor"
                            >
                                <XStack flexWrap="wrap" gap="$2" justify="center">
                                    {words.map((word, index) => (
                                        <XStack
                                            key={index}
                                            bg="$background"
                                            px="$3"
                                            py="$1.5"
                                            rounded="$2"
                                            borderWidth={0.5}
                                            borderColor="$borderColor"
                                            minWidth="30%"
                                        >
                                            <Text fontSize="$2" opacity={0.5} mr="$2" width={15}>{index + 1}</Text>
                                            <Text
                                                fontSize="$3"
                                                fontWeight="600"
                                                filter={isVisible ? undefined : 'blur(4px)'}
                                            >
                                                {word}
                                            </Text>
                                        </XStack>
                                    ))}
                                </XStack>
                            </View>

                            <XStack gap="$2">
                                <Button
                                    flex={1}
                                    icon={isVisible ? EyeOff : Eye}
                                    onPress={() => setIsVisible(!isVisible)}
                                    variant="outline"
                                    rounded="$4"
                                >
                                    {isVisible ? 'Hide Words' : 'Show Words'}
                                </Button>
                                <Button
                                    flex={1}
                                    icon={Copy}
                                    onPress={handleCopy}
                                    variant="outline"
                                    rounded="$4"
                                >
                                    Copy Phrase
                                </Button>
                            </XStack>

                            <Button
                                theme="blue"
                                size="$5"
                                onPress={handleClose}
                                mt="$4"
                                rounded="$4"
                            >
                                Done
                            </Button>
                        </YStack>
                    )}

                    <Theme name="alt2">
                        <View bg="$yellow2" p="$3" rounded="$3" borderWidth={1} borderColor="$yellow8">
                            <Text color="$yellow10" fontSize="$2" fontWeight="600">
                                Warning: NEVER share your recovery phrase. Anyone with these 12 words can take your funds.
                            </Text>
                        </View>
                    </Theme>
                </YStack>
            </Sheet.Frame>
        </Sheet>
    );
}
