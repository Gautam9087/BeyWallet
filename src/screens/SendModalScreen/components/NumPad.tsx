import React from 'react'
import { YStack, XStack, Button, Text } from 'tamagui'
import { Delete } from '@tamagui/lucide-icons'
import * as Haptics from 'expo-haptics'

interface NumPadProps {
    onPress: (value: string) => void
    onDelete: () => void
}

export function NumPad({ onPress, onDelete }: NumPadProps) {
    const handlePress = (val: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
        onPress(val)
    }

    const handleDelete = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)
        onDelete()
    }

    const NumButton = ({ value }: { value: string }) => (
        <Button
            flex={1}
            height={70}
            chromeless
            onPress={() => handlePress(value)}
            pressStyle={{ bg: '$backgroundHover', scale: 0.95 }}
        >
            <Text fontSize={28} fontWeight="600" color="$color">
                {value}
            </Text>
        </Button>
    )

    return (
        <YStack width="100%" gap="$2" px="$4" pb="$8">
            <XStack gap="$2">
                <NumButton value="1" />
                <NumButton value="2" />
                <NumButton value="3" />
            </XStack>
            <XStack gap="$2">
                <NumButton value="4" />
                <NumButton value="5" />
                <NumButton value="6" />
            </XStack>
            <XStack gap="$2">
                <NumButton value="7" />
                <NumButton value="8" />
                <NumButton value="9" />
            </XStack>
            <XStack gap="$2">
                <NumButton value="." />
                <NumButton value="0" />
                <Button
                    flex={1}
                    height={70}
                    chromeless
                    onPress={handleDelete}
                    pressStyle={{ bg: '$backgroundHover', scale: 0.95 }}
                    icon={<Delete size={28} color="$color" />}
                />
            </XStack>
        </YStack>
    )
}
