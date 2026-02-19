import React, { useEffect, useRef } from 'react';
import { YStack, Stack } from 'tamagui';
import AddMintModal, { AddMintModalRef } from '~/components/AddMintModal';
import { useRouter } from 'expo-router';

export default function AddMintScreen() {
    const ref = useRef<AddMintModalRef>(null);
    const router = useRouter();

    useEffect(() => {
        // Present the modal immediately
        const timer = setTimeout(() => {
            ref.current?.present();
        }, 100);
        return () => clearTimeout(timer);
    }, []);

    // Also handle when the bottom sheet is dismissed to go back
    // However, AddMintModal doesn't have an onDismiss prop in its API yet.
    // So for now, we'll just show the screen.

    return (
        <YStack flex={1} bg="$background">
            <Stack.Screen options={{ headerTitle: 'Add Mint' }} />
            <AddMintModal ref={ref} />
        </YStack>
    );
}
