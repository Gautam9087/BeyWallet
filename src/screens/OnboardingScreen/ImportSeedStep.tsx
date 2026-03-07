import React, { useState, useRef } from 'react'
import { YStack, XStack, Text, Button, H2, Input, ScrollView, View } from 'tamagui'
import { KeyRound, ClipboardPaste, ArrowLeft, CheckCircle2, AlertCircle } from '@tamagui/lucide-icons'
import * as Haptics from 'expo-haptics'
import * as Clipboard from 'expo-clipboard'
import * as bip39 from 'bip39'
import { TextInput, KeyboardAvoidingView, Platform } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

interface ImportSeedStepProps {
    onImport: (mnemonic: string) => void
    onBack: () => void
}

export function ImportSeedStep({ onImport, onBack }: ImportSeedStepProps) {
    const [words, setWords] = useState<string[]>(Array(12).fill(''))
    const [error, setError] = useState<string | null>(null)
    const [isValid, setIsValid] = useState(false)
    const insets = useSafeAreaInsets()
    const inputRefs = useRef<(TextInput | null)[]>([])

    const validateMnemonic = (wordArray: string[]) => {
        const mnemonic = wordArray.map(w => w.trim().toLowerCase()).join(' ')
        const allFilled = wordArray.every(w => w.trim().length > 0)

        if (!allFilled) {
            setIsValid(false)
            setError(null)
            return
        }

        if (bip39.validateMnemonic(mnemonic)) {
            setIsValid(true)
            setError(null)
        } else {
            setIsValid(false)
            setError('Invalid recovery phrase. Check your words and try again.')
        }
    }

    const handleWordChange = (index: number, value: string) => {
        // Handle pasting a full phrase into any field
        const trimmed = value.trim()
        if (trimmed.includes(' ')) {
            const pastedWords = trimmed.split(/\s+/).filter(w => w.length > 0)
            if (pastedWords.length >= 12) {
                const newWords = pastedWords.slice(0, 12)
                setWords(newWords)
                validateMnemonic(newWords)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
                return
            }
        }

        const newWords = [...words]
        newWords[index] = value.toLowerCase().replace(/[^a-z]/g, '')
        setWords(newWords)
        validateMnemonic(newWords)

        // Auto-advance to next field on space or if word looks complete
        if (value.endsWith(' ') && index < 11) {
            newWords[index] = value.trim().toLowerCase().replace(/[^a-z]/g, '')
            setWords(newWords)
            inputRefs.current[index + 1]?.focus()
        }
    }

    const handlePaste = async () => {
        try {
            const text = await Clipboard.getStringAsync()
            if (!text) return

            const pastedWords = text.trim().split(/\s+/).filter(w => w.length > 0)
            if (pastedWords.length >= 12) {
                const newWords = pastedWords.slice(0, 12).map(w => w.toLowerCase())
                setWords(newWords)
                validateMnemonic(newWords)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
            } else {
                setError(`Found ${pastedWords.length} words, need 12.`)
                Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
            }
        } catch (e) {
            console.error('[ImportSeedStep] Paste error:', e)
        }
    }

    const handleImport = () => {
        const mnemonic = words.map(w => w.trim().toLowerCase()).join(' ')
        if (bip39.validateMnemonic(mnemonic)) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)
            onImport(mnemonic)
        }
    }

    return (
        <KeyboardAvoidingView
            style={{ flex: 1 }}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <YStack
                flex={1}
                bg="$background"
                px="$4"
                pt={insets.top + 24}
                pb={insets.bottom + 24}
            >
                <ScrollView flex={1} showsVerticalScrollIndicator={false}>
                    {/* Header */}
                    <XStack items="center" gap="$3" mb="$4">
                        <Button
                            size="$3"
                            circular
                            chromeless
                            icon={<ArrowLeft size={20} />}
                            onPress={() => {
                                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
                                onBack()
                            }}
                        />
                        <YStack flex={1}>
                            <H2 fontSize="$7" fontWeight="700">Import Wallet</H2>
                            <Text color="$gray10" fontSize="$3">
                                Enter your 12-word recovery phrase
                            </Text>
                        </YStack>
                    </XStack>

                    {/* Paste Button */}
                    <Button
                        size="$4"
                        theme="gray"
                        icon={<ClipboardPaste size={18} />}
                        onPress={handlePaste}
                        mb="$4"
                        rounded="$4"
                        fontWeight="600"
                    >
                        Paste from Clipboard
                    </Button>

                    {/* Word Grid */}
                    <View
                        bg="$gray3"
                        p="$3"
                        rounded="$5"
                        borderWidth={1}
                        borderColor={error ? '$red8' : isValid ? '$green8' : '$borderColor'}
                    >
                        <XStack flexWrap="wrap" gap="$2" justify="center">
                            {words.map((word, index) => (
                                <XStack
                                    key={index}
                                    bg="$background"
                                    rounded="$3"
                                    borderWidth={1}
                                    borderColor={
                                        word.trim().length > 0
                                            ? isValid ? '$green8' : '$borderColor'
                                            : '$borderColor'
                                    }
                                    items="center"
                                    width="47%"
                                    px="$2"
                                    py="$1.5"
                                >
                                    <Text
                                        fontSize="$2"
                                        color="$gray10"
                                        width={22}
                                        text="right"
                                        mr="$2"
                                        fontWeight="600"
                                    >
                                        {index + 1}
                                    </Text>
                                    <Input
                                        ref={(ref: any) => { inputRefs.current[index] = ref }}
                                        flex={1}
                                        value={word}
                                        onChangeText={(v: string) => handleWordChange(index, v)}
                                        placeholder="word"
                                        placeholderTextColor="$gray8"
                                        fontSize="$4"
                                        fontWeight="600"
                                        borderWidth={0}
                                        bg="transparent"
                                        px="$0"
                                        py="$0"
                                        autoCapitalize="none"
                                        autoCorrect={false}
                                        returnKeyType={index < 11 ? 'next' : 'done'}
                                        onSubmitEditing={() => {
                                            if (index < 11) {
                                                inputRefs.current[index + 1]?.focus()
                                            }
                                        }}
                                    />
                                </XStack>
                            ))}
                        </XStack>
                    </View>

                    {/* Status Messages */}
                    {error && (
                        <XStack items="center" gap="$2" mt="$3" px="$2">
                            <AlertCircle size={16} color="$red10" />
                            <Text color="$red10" fontSize="$3">{error}</Text>
                        </XStack>
                    )}
                    {isValid && (
                        <XStack items="center" gap="$2" mt="$3" px="$2">
                            <CheckCircle2 size={16} color="$green10" />
                            <Text color="$green10" fontSize="$3" fontWeight="600">
                                Valid recovery phrase ✓
                            </Text>
                        </XStack>
                    )}
                </ScrollView>

                {/* Import Button */}
                <Button
                    size="$5"
                    theme={isValid ? 'accent' : 'gray'}
                    width="100%"
                    onPress={handleImport}
                    disabled={!isValid}
                    icon={<KeyRound size={24} />}
                    fontSize="$5"
                    fontWeight="700"
                    rounded="$4"
                    pressStyle={{ scale: 0.98, opacity: 0.9 }}
                    opacity={isValid ? 1 : 0.5}
                    mt="$4"
                >
                    Import Wallet
                </Button>
            </YStack>
        </KeyboardAvoidingView>
    )
}
