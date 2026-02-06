import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Text, YStack, XStack, Paragraph } from 'tamagui';
import { Edit3, Check, X } from '@tamagui/lucide-icons';
import * as Haptics from 'expo-haptics';
import AppBottomSheet, { AppBottomSheetRef } from './UI/AppBottomSheet';
import { useWalletStore } from '../store/walletStore';
import { useToastController } from '@tamagui/toast';

export interface EditNicknameModalRef {
    present: (mintUrl: string, currentNickname?: string) => void;
    dismiss: () => void;
}

const EditNicknameModal = forwardRef<EditNicknameModalRef>((_, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const [nickname, setNickname] = useState('');
    const [mintUrl, setMintUrl] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const { setMintNickname } = useWalletStore();
    const toast = useToastController();

    useImperativeHandle(ref, () => ({
        present: (url: string, current?: string) => {
            setMintUrl(url);
            setNickname(current || '');
            sheetRef.current?.present();
        },
        dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleSave = async () => {
        if (!mintUrl) return;

        setIsLoading(true);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await setMintNickname(mintUrl, nickname.trim());
            toast.show('Nickname Updated', {
                duration: 2000,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sheetRef.current?.dismiss();
        } catch (err: any) {
            toast.show('Error', {
                message: err.message || 'Failed to update nickname',
                duration: 3000,
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <AppBottomSheet ref={sheetRef}>
            <YStack p="$4" gap="$4">
                <XStack justify="center">
                    <Paragraph fontSize="$6" color="$accent5" fontWeight="bold">Set Nickname</Paragraph>
                </XStack>

                <YStack gap="$2">
                    <Text color="$gray10" fontSize="$2" px="$2">Friendly name for this mint</Text>
                    <Input
                        size="$4"
                        placeholder="e.g. My Favorite Mint"
                        value={nickname}
                        onChangeText={setNickname}
                        autoFocus
                    />
                </YStack>

                <XStack gap="$3">
                    <Button
                        flex={1}
                        size="$4"
                        theme="gray"
                        onPress={() => sheetRef.current?.dismiss()}
                        icon={<X size={18} />}
                    >
                        Cancel
                    </Button>
                    <Button
                        flex={1}
                        size="$4"
                        themeInverse
                        onPress={handleSave}
                        loading={isLoading}
                        icon={<Check size={18} />}
                    >
                        Save
                    </Button>
                </XStack>
            </YStack>
        </AppBottomSheet>
    );
});

EditNicknameModal.displayName = 'EditNicknameModal';

export default EditNicknameModal;
