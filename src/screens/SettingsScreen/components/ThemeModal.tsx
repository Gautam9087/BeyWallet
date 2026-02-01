import React from 'react';
import { Sheet, YStack, XStack, Text, H3, View, Circle } from 'tamagui';
import { Palette } from '@tamagui/lucide-icons';
import { ThemeSelector } from '~/components/ThemeSelector';

interface ThemeModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ThemeModal({ open, onOpenChange }: ThemeModalProps) {
    return (
        <Sheet
            open={open}
            onOpenChange={onOpenChange}
            snapPoints={[40]}
            dismissOnSnapToBottom
            modal
            animation="lazy"
        >
            <Sheet.Frame p="$4" bg="$background">
                <Sheet.Handle />
                <YStack gap="$4" pt="$4">
                    <XStack items="center" gap="$3">
                        <Circle p="$2" bg="$purple5">
                            <Palette size={24} color="$purple10" />
                        </Circle>
                        <H3>Appearance</H3>
                    </XStack>

                    <ThemeSelector />
                </YStack>
            </Sheet.Frame>
        </Sheet>
    );
}
