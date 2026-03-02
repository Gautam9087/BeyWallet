import React, { useState } from 'react'
import { WelcomeStep } from './WelcomeStep'
import { CreatingStep } from './CreatingStep'
import { SeedStep } from './SeedStep'
import { BiometricStep } from './BiometricStep'
import { ImportSeedStep } from './ImportSeedStep'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useSettingsStore } from '../../store/settingsStore'
import { seedService } from '../../services/seedService'
import { initService, walletService, mintManager } from '../../services/core'
import { useWalletStore } from '../../store/walletStore'
import { ActivityIndicator } from 'react-native'
import { YStack, Text } from 'tamagui'

const DEFAULT_MINT = "https://nofee.testnut.cashu.space";

export function OnboardingScreen() {
    const { currentStep, setStep, setGeneratedMnemonic, generatedMnemonic, completeOnboarding } = useOnboardingStore()
    const initialize = useWalletStore(state => state.initialize)
    const [isImporting, setIsImporting] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [importStatus, setImportStatus] = useState('')

    const handleCreateWallet = () => {
        setStep('creating')
    }

    const handleImportWallet = () => {
        setStep('import')
    }

    const handleCreatingComplete = (mnemonic: string) => {
        setGeneratedMnemonic(mnemonic)
        setStep('seed')
    }

    const handleSeedContinue = () => {
        setStep('biometric')
    }

    const handleBiometricComplete = async () => {
        if (!generatedMnemonic) {
            console.error('[Onboarding] No mnemonic found')
            return
        }

        setIsFinishing(true)
        try {
            // Create the wallet with the mnemonic
            await initService.createWallet(generatedMnemonic)

            // Mark onboarding as complete
            await completeOnboarding()

            // Initialize settings to load Nostr keys
            await useSettingsStore.getState().initialize(true);

            // Initialize the wallet store
            await initialize()
        } catch (err) {
            console.error('[Onboarding] Failed to complete:', err)
            setIsFinishing(false)
        }
    }

    const handleImportSeed = async (mnemonic: string) => {
        setIsImporting(true)
        setImportStatus('Initializing wallet...')
        try {
            console.log('[Onboarding] Importing wallet from seed...')

            // 1. Initialize wallet (this starts the NPC plugin auto-sync in background)
            await initService.restoreWallet(mnemonic)

            // 2. Mark onboarding as complete and enter the app
            setImportStatus('Welcome back! Finishing setup...')
            await completeOnboarding()
            await useSettingsStore.getState().initialize(true)
            await initialize()

            // 3. Queue the deterministic tokens recovery for the default mint.
            // Further mints will be added and synced automatically by the NPC plugin.
            useWalletStore.getState().restoreFromSeed(DEFAULT_MINT);

            console.log('[Onboarding] ✅ Import successful, background recovery started.')
        } catch (err) {
            console.error('[Onboarding] Import failed:', err)
            setImportStatus('Import failed. Please try again.')
        } finally {
            setIsImporting(false)
        }
    }

    const setupDefaultMint = async () => {
        setImportStatus('Adding default mint...')
        try {
            await mintManager.addMint(DEFAULT_MINT, { trusted: true });
            await mintManager.repairMintKeysets(DEFAULT_MINT, 'sat');
            useWalletStore.getState().restoreFromSeed(DEFAULT_MINT);
        } catch (e) {
            console.warn('[Onboarding] Default mint setup failed:', e);
        }
    };

    // Show loading while importing or finishing
    if (isImporting || isFinishing) {
        return (
            <YStack flex={1} bg="$background" items="center" justify="center" gap="$4">
                <ActivityIndicator size="large" color="#666" />
                <Text fontSize="$6" fontWeight="700" color="$color">
                    {isImporting ? 'Importing wallet...' : 'Finishing setup...'}
                </Text>
                <Text color="$gray10" fontSize="$3" text="center" px="$6">
                    {isImporting ? importStatus : 'Preparing your secure wallet. This may take a few moments.'}
                </Text>
            </YStack>
        )
    }

    switch (currentStep) {
        case 'welcome':
            return (
                <WelcomeStep
                    onCreateWallet={handleCreateWallet}
                    onImportWallet={handleImportWallet}
                />
            )

        case 'creating':
            return (
                <CreatingStep
                    onComplete={handleCreatingComplete}
                    generateMnemonic={seedService.generateMnemonic}
                />
            )

        case 'seed':
            if (!generatedMnemonic) {
                setStep('welcome')
                return null
            }
            return (
                <SeedStep
                    mnemonic={generatedMnemonic}
                    onContinue={handleSeedContinue}
                />
            )

        case 'biometric':
            return <BiometricStep onComplete={handleBiometricComplete} />

        case 'import':
            return (
                <ImportSeedStep
                    onImport={handleImportSeed}
                    onBack={() => setStep('welcome')}
                />
            )

        default:
            return (
                <WelcomeStep
                    onCreateWallet={handleCreateWallet}
                    onImportWallet={handleImportWallet}
                />
            )
    }
}
