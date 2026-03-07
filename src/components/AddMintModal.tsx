import React, { useState, useRef, useImperativeHandle, forwardRef } from 'react';
import { Button, Input, Text, YStack, XStack, Spinner, Paragraph, View, useTheme } from 'tamagui';
import { Plus, Check, AlertCircle, Sprout, X } from '@tamagui/lucide-icons';
import * as Haptics from 'expo-haptics';
import AppBottomSheet, { AppBottomSheetRef } from './UI/AppBottomSheet';
import { useWalletStore } from '../store/walletStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useToastController } from '@tamagui/toast';

type Stage = 'input' | 'preview' | 'loading';

import { BottomSheetTextInput, BottomSheetScrollView } from "@gorhom/bottom-sheet";

// Basic URL validation
const validateUrl = (url: string) => {
    try {
        new URL(url.startsWith('http') ? url : `https://${url}`);
        return true;
    } catch {
        return false;
    }
};

interface MintPreviewInfo {
    name?: string;
    description?: string;
    mintUrl: string;
}

export interface AddMintModalRef {
    present: () => void;
    dismiss: () => void;
}

const AddMintModal = forwardRef<AddMintModalRef>((_, ref) => {
    const sheetRef = useRef<AppBottomSheetRef>(null);
    const theme = useTheme();
    const [stage, setStage] = useState<Stage>('input');
    const [mintUrl, setMintUrl] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [previewInfo, setPreviewInfo] = useState<MintPreviewInfo | null>(null);

    const { fetchMintInfo, addMint, refreshMintList, mints, trustMint } = useWalletStore();
    const insets = useSafeAreaInsets();
    const toast = useToastController();
    const [isExistingUntrusted, setIsExistingUntrusted] = useState(false);

    useImperativeHandle(ref, () => ({
        present: (url?: string) => {
            resetState();
            if (url) {
                setMintUrl(url);
                // Trigger fetch immediately if URL is provided
                setTimeout(() => {
                    handleFetchWithUrl(url);
                }, 100);
            }
            sheetRef.current?.present();
        },
        dismiss: () => sheetRef.current?.dismiss(),
    }));

    const handleFetchWithUrl = async (url: string) => {
        setStage('loading');
        setError(null);
        setIsExistingUntrusted(false);
        try {
            const existing = mints.find(m => m.mintUrl.replace(/\/$/, '') === url.replace(/\/$/, ''));
            if (existing && !existing.trusted) {
                setIsExistingUntrusted(true);
            }

            const info = await fetchMintInfo(url);
            setPreviewInfo({
                name: info?.name || 'Unknown Mint',
                description: info?.description || 'No description available',
                mintUrl: url,
            });
            setStage('preview');
        } catch (err: any) {
            setError(err.message || 'Failed to fetch mint info');
            setStage('input');
        }
    };

    const resetState = () => {
        setStage('input');
        setMintUrl('');
        setError(null);
        setPreviewInfo(null);
        setIsExistingUntrusted(false);
    };

    const handleFetchMintInfo = async () => {
        if (!mintUrl.trim()) {
            setError('Please enter a mint URL');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        // Basic URL validation
        let url = mintUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        setStage('loading');
        setError(null);
        setIsExistingUntrusted(false);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            const existing = mints.find(m => m.mintUrl.replace(/\/$/, '') === url.replace(/\/$/, ''));
            if (existing && !existing.trusted) {
                setIsExistingUntrusted(true);
            }

            const info = await fetchMintInfo(url);
            setPreviewInfo({
                name: info?.name || 'Unknown Mint',
                description: info?.description || 'No description available',
                mintUrl: url,
            });
            setMintUrl(url);
            setStage('preview');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        } catch (err: any) {
            console.error('[AddMintModal] Fetch error:', err);
            setError(err.message || 'Failed to fetch mint info');
            setStage('input');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
    };

    const handleTrustImmediately = async () => {
        if (!mintUrl.trim()) {
            setError('Please enter a mint URL');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            return;
        }

        let url = mintUrl.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        setStage('loading');
        setError(null);
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

        try {
            await addMint(url, { trusted: true });
            await refreshMintList();
            toast.show('Mint Added', {
                message: `Mint added successfully`,
                duration: 2000
            });
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sheetRef.current?.dismiss();
            resetState();
        } catch (err: any) {
            console.error('[AddMintModal] Trust Immediately error:', err);
            setError(err.message || 'Failed to add mint');
            setStage('input');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.show('Error', {
                message: err.message || 'Failed to add mint',
                duration: 3000,
            });
        }
    };

    const handleTrustMint = async () => {
        if (!previewInfo) return;

        setStage('loading');
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        try {
            await addMint(previewInfo.mintUrl, { trusted: true });
            await refreshMintList();

            toast.show('Mint Added', {
                message: `${previewInfo.name} is now trusted`,
                duration: 3000,
            });

            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            sheetRef.current?.dismiss();
            resetState();
        } catch (err: any) {
            console.error('[AddMintModal] Trust error:', err);
            setError(err.message || 'Failed to trust mint');
            setStage('preview');
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
            toast.show('Error', {
                message: err.message || 'Failed to add mint',
                duration: 3000,
            });
        }
    };

    const renderInputStage = () => (
        <YStack gap="$4">
            <XStack justify="center" mb="$2">
                <Paragraph fontSize="$6" color="$accent5" fontWeight="bold">Add Mint</Paragraph>
            </XStack>

            <YStack gap="$2">
                <BottomSheetTextInput
                    placeholder="https://mint.example.com"
                    value={mintUrl}
                    onChangeText={setMintUrl}
                    autoCapitalize="none"
                    autoCorrect={false}
                    keyboardType="url"
                    style={{
                        backgroundColor: theme.color2.val,
                        color: theme.color.val,
                        borderRadius: 12,
                        padding: 16,
                        borderWidth: 1,
                        borderColor: error ? theme.red10.val : theme.borderColor.val,
                        fontSize: 16,
                        height: 56
                    }}
                    placeholderTextColor={theme.gray10.val}
                />
                {error && (
                    <XStack gap="$2" items="center" mt="$1">
                        <AlertCircle size={14} color="$red10" />
                        <Text color="$red10" fontSize="$2">{error}</Text>
                    </XStack>
                )}
            </YStack>

            <XStack gap="$3">
                <Button
                    flex={1}
                    size="$4"
                    theme="gray"
                    onPress={handleTrustImmediately}
                >
                    Trust Immediately
                </Button>
                <Button
                    flex={1}
                    size="$4"
                    themeInverse
                    onPress={handleFetchMintInfo}
                    icon={<Sprout size={18} />}
                >
                    Preview
                </Button>
            </XStack>
        </YStack>
    );

    const renderPreviewStage = () => (
        <YStack gap="$4">
            <XStack justify="center">
                <Paragraph fontSize="$6" color="$accent5" fontWeight="bold">Mint Preview</Paragraph>
            </XStack>

            <YStack gap="$3" bg="$color2" p="$4" rounded="$4">
                <XStack gap="$3" items="center">
                    <View bg="$green4" p="$2" rounded="$10">
                        <Sprout size={24} color="$green10" />
                    </View>
                    <YStack flex={1}>
                        <Text fontWeight="700" fontSize="$5">{previewInfo?.name}</Text>
                        <Text fontSize="$2" color="$gray10" numberOfLines={1}>
                            {previewInfo?.mintUrl.replace('https://', '')}
                        </Text>
                    </YStack>
                </XStack>

                {previewInfo?.description && (
                    <Text color="$gray11" fontSize="$3">
                        {previewInfo.description}
                    </Text>
                )}

                {isExistingUntrusted && (
                    <XStack p="$2" bg="$orange2" rounded="$2" gap="$2" items="center">
                        <AlertCircle size={14} color="$orange10" />
                        <Text fontSize="$2" color="$orange10" fontWeight="600">This mint is currently untrusted.</Text>
                    </XStack>
                )}
            </YStack>

            {error && (
                <XStack gap="$2" items="center">
                    <AlertCircle size={14} color="$red10" />
                    <Text color="$red10" fontSize="$2">{error}</Text>
                </XStack>
            )}

            <XStack gap="$3">
                <Button
                    flex={1}
                    size="$4"
                    theme="gray"
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setStage('input');
                    }}
                    icon={<X size={18} />}
                >
                    Cancel
                </Button>
                <Button
                    flex={1}
                    size="$4"
                    themeInverse
                    onPress={handleTrustMint}
                    icon={<Check size={18} />}
                >
                    {isExistingUntrusted ? 'Trust this Mint' : 'Trust Mint'}
                </Button>
            </XStack>
        </YStack>
    );

    const renderLoadingStage = () => (
        <YStack gap="$4" items="center" py="$6">
            <Spinner size="large" color="$accent9" />
            <Text color="$gray10">Loading mint info...</Text>
        </YStack>
    );

    return (
        <AppBottomSheet ref={sheetRef}>
            <BottomSheetScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 20 }}>
                {stage === 'input' && renderInputStage()}
                {stage === 'preview' && renderPreviewStage()}
                {stage === 'loading' && renderLoadingStage()}
            </BottomSheetScrollView>
        </AppBottomSheet>
    );
});

AddMintModal.displayName = 'AddMintModal';

export default AddMintModal;
