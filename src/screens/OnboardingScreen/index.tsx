import React, { useState } from 'react'
import { WelcomeStep } from './WelcomeStep'
import { CreatingStep } from './CreatingStep'
import { SeedStep } from './SeedStep'
import { BiometricStep } from './BiometricStep'
import { ImportSeedStep } from './ImportSeedStep'
import { useOnboardingStore } from '../../store/onboardingStore'
import { seedService } from '../../services/seedService'
import { initService, walletService, mintManager } from '../../services/core'
import { nostrService } from '../../services/nostrService'
import { useWalletStore } from '../../store/walletStore'
import { ActivityIndicator } from 'react-native'
import { YStack, Text } from 'tamagui'

const DEFAULT_MINT = "https://testnut.cashu.space";

export function OnboardingScreen() {
    const { currentStep, setStep, setGeneratedMnemonic, generatedMnemonic, completeOnboarding } = useOnboardingStore()
    const initialize = useWalletStore(state => state.initialize)
    const [isImporting, setIsImporting] = useState(false)
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

        try {
            // Create the wallet with the mnemonic
            await initService.createWallet(generatedMnemonic)

            // Mark onboarding as complete
            await completeOnboarding()

            // Initialize the wallet store
            await initialize()
        } catch (err) {
            console.error('[Onboarding] Failed to complete:', err)
        }
    }

    const handleImportSeed = async (mnemonic: string) => {
        setIsImporting(true)
        setImportStatus('Creating wallet...')
        try {
            console.log('[Onboarding] Importing wallet from seed...')

            // 1. Create the wallet with the imported mnemonic
            await initService.createWallet(mnemonic)

            // 2. Try to restore from Nostr (mints + balance metadata)
            setImportStatus('Searching Nostr for your wallet backup...')
            try {
                const nostrData = await nostrService.fetchFromNostr();
                if (nostrData && nostrData.mints && nostrData.mints.length > 0) {
                    setImportStatus(`Found backup with ${nostrData.mints.length} mints!`);

                    // Add all mints and trigger restoration
                    for (const url of nostrData.mints) {
                        try {
                            setImportStatus(`Restoring ${url.substring(0, 30)}...`);
                            await mintManager.addMint(url, { trusted: true });
                            // Queue for background deterministic recovery
                            useWalletStore.getState().restoreFromSeed(url);
                        } catch (e) {
                            console.warn(`[Onboarding] Restore failed for ${url}:`, e);
                        }
                    }
                } else {
                    // Fallback to default mint if nothing on Nostr
                    setImportStatus('No backup found on Nostr. Using defaults.');
                    await setupDefaultMint();
                }
            } catch (e) {
                console.warn('[Onboarding] Nostr recovery failed, using default:', e);
                await setupDefaultMint();
            }

            // 5. Mark onboarding as complete and enter the app
            setImportStatus('Welcome back! Finshing setup...')
            await completeOnboarding()
            await initialize()

            console.log('[Onboarding] Import successful, restoration continuing in background.')
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

    // Show loading while importing
    if (isImporting) {
        return (
            <YStack flex={1} bg="$background" items="center" justify="center" gap="$4">
                <ActivityIndicator size="large" color="#666" />
                <Text fontSize="$5" fontWeight="600">Importing wallet...</Text>
                <Text color="$gray10" fontSize="$3">{importStatus}</Text>
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
