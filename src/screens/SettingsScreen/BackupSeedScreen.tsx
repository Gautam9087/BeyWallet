import React, { useState, useEffect } from 'react';
import { YStack, XStack, Text, Button, View, ScrollView, Circle } from 'tamagui';
import { ShieldCheck, Copy, Eye, EyeOff, ChevronLeft, AlertTriangle } from '@tamagui/lucide-icons';
import * as Haptics from 'expo-haptics';
import * as Clipboard from 'expo-clipboard';
import { useRouter } from 'expo-router';
import { seedService } from '~/services/seedService';

export function BackupSeedScreen() {
    const router = useRouter();
    const [mnemonic, setMnemonic] = useState<string | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const fetchMnemonic = async () => {
            const m = await seedService.getMnemonic();
            setMnemonic(m);
        };
        fetchMnemonic();
    }, []);

    const handleCopy = async () => {
        if (mnemonic) {
            await Clipboard.setStringAsync(mnemonic);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
    };


    const words = mnemonic?.split(' ') || [];

    return (
        <YStack flex={1} bg="$background">
            <ScrollView showsVerticalScrollIndicator={false}>
                <YStack p="$4" gap="$6">


                    <View bg="$yellow2" p="$4" rounded="$4" borderWidth={1} borderColor="$yellow8">
                        <XStack gap="$3">
                            <AlertTriangle color="$yellow10" size={20} />
                            <YStack flex={1}>
                                <Text color="$yellow10" fontWeight="700">Security Warning</Text>
                                <Text color="$yellow10" fontSize="$2" mt="$1">
                                    NEVER share your recovery phrase. Anyone with these 12 words can take your funds. Store them in a safe, physical location.
                                </Text>
                            </YStack>
                        </XStack>
                    </View>

                    <YStack gap="$4">
                        <View
                            bg="$gray3"
                            p="$4"
                            rounded="$5"
                            borderWidth={1}
                            borderColor="$borderColor"
                        >
                            <XStack flexWrap="wrap" gap="$3" justify="center">
                                {words.map((word, index) => (
                                    <XStack
                                        key={index}
                                        bg="$background"
                                        px="$3"
                                        py="$2"
                                        rounded="$3"
                                        borderWidth={1}
                                        borderColor="$borderColor"
                                        minW="45%"
                                        items="center"
                                    >
                                        <Text fontSize="$2" color="$gray10" mr="$2" width={20}>{index + 1}</Text>
                                        <Text
                                            fontSize="$4"
                                            fontWeight="600"
                                            filter={isVisible ? undefined : 'blur(5px)'}
                                        >
                                            {word}
                                        </Text>
                                    </XStack>
                                ))}
                            </XStack>
                        </View>

                        <XStack gap="$3">
                            <Button
                                flex={1}
                                size="$5"
                                icon={isVisible ? EyeOff : Eye}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    setIsVisible(!isVisible);
                                }}
                                rounded="$4"
                                bg="$gray5"
                            >
                                {isVisible ? 'Hide' : 'Show'}
                            </Button>
                            <Button
                                flex={1}
                                size="$5"
                                icon={Copy}
                                onPress={() => {
                                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                                    handleCopy();
                                }}
                                rounded="$4"
                                bg="$gray5"
                            >
                                Copy
                            </Button>
                        </XStack>
                    </YStack>

                    <Button
                        theme="blue"
                        size="$5"
                        fontWeight="700"
                        onPress={() => router.back()}
                        mt="$4"
                        rounded="$4"
                    >
                        I've Backed It Up
                    </Button>
                </YStack>
            </ScrollView>
        </YStack>
    );
}
