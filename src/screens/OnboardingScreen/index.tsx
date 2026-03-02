import React, { useState } from 'react'
import { WelcomeStep } from './WelcomeStep'
import { CreatingStep } from './CreatingStep'
import { SeedStep } from './SeedStep'
import { BiometricStep } from './BiometricStep'
import { ImportSeedStep } from './ImportSeedStep'
import { MintPickerStep } from './MintPickerStep'
import { useOnboardingStore } from '../../store/onboardingStore'
import { useSettingsStore } from '../../store/settingsStore'
import { seedService } from '../../services/seedService'
import { initService, mintManager } from '../../services/core'
import { useWalletStore } from '../../store/walletStore'
import { walletFileService } from '../../services/walletFileService'
import { ActivityIndicator, Alert } from 'react-native'
import { YStack, Text } from 'tamagui'
import { DEFAULT_MINT } from '../../store/constants'

export function OnboardingScreen() {
    const { currentStep, setStep, setGeneratedMnemonic, generatedMnemonic, completeOnboarding } = useOnboardingStore()
    const initialize = useWalletStore(state => state.initialize)
    const [isImporting, setIsImporting] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [importStatus, setImportStatus] = useState('')

    // ── Navigation ──────────────────────────────────────────────

    const handleCreateWallet = () => setStep('creating')
    const handleImportWallet = () => setStep('import')

    const handleCreatingComplete = (mnemonic: string) => {
        setGeneratedMnemonic(mnemonic)
        setStep('seed')
    }

    const handleSeedContinue = () => setStep('biometric')

    // After biometric → go to mint picker (new wallet flow only)
    const handleBiometricComplete = async () => {
        if (!generatedMnemonic) {
            console.error('[Onboarding] No mnemonic found')
            return
        }

        setIsFinishing(true)
        try {
            await initService.createWallet(generatedMnemonic)
            await useSettingsStore.getState().initialize(true)
            await initialize()
        } catch (err) {
            console.error('[Onboarding] Failed to init wallet:', err)
            setIsFinishing(false)
            return
        }
        setIsFinishing(false)

        // Move to mint picker — wallet is ready but onboarding not yet marked complete
        setStep('mintpicker')
    }

    // Called when user picks a mint (or skips)
    const handleMintPickerComplete = async (selectedMintUrl: string) => {
        setIsFinishing(true)
        try {
            // Trust the chosen mint and kick off an initial restore sweep
            await mintManager.addMint(selectedMintUrl, { trusted: true })
            useWalletStore.getState().restoreFromSeed(selectedMintUrl)

            // Save it as the default mint in settings
            await useSettingsStore.getState().setDefaultMintUrl(selectedMintUrl)

            // Mark onboarding complete → app navigates to home
            await completeOnboarding()
        } catch (err) {
            console.error('[Onboarding] mint picker complete failed:', err)
        } finally {
            setIsFinishing(false)
        }
    }

    // Skip: complete without trusting any mint
    const handleMintPickerSkip = async () => {
        setIsFinishing(true)
        try {
            await completeOnboarding()
        } finally {
            setIsFinishing(false)
        }
    }

    // ── Seed import (restore flow) ──────────────────────────────

    const handleImportSeed = async (mnemonic: string) => {
        setIsImporting(true)
        setImportStatus('Initializing wallet...')
        try {
            console.log('[Onboarding] Importing wallet from seed...')

            await initService.restoreWallet(mnemonic)

            setImportStatus('Welcome back! Finishing setup...')
            await completeOnboarding()
            await useSettingsStore.getState().initialize(true)
            await initialize()

            // Kick off deterministic recovery against the default mint
            useWalletStore.getState().restoreFromSeed(DEFAULT_MINT)

            console.log('[Onboarding] ✅ Import successful, background recovery started.')
        } catch (err) {
            console.error('[Onboarding] Import failed:', err)
            setImportStatus('Import failed. Please try again.')
        } finally {
            setIsImporting(false)
        }
    }

    // ── File import (restore from .bey backup file) ─────────────

    const handleImportFromFile = async () => {
        try {
            const backup = await walletFileService.importWalletFromFile()

            // Standard seed restore
            await handleImportSeed(backup.mnemonic)

            // Restore additional mints from the backup
            if (backup.mints && backup.mints.length > 0) {
                for (const mint of backup.mints) {
                    try {
                        if (mint.url && mint.url !== DEFAULT_MINT) {
                            await mintManager.addMint(mint.url, { trusted: true })
                            useWalletStore.getState().restoreFromSeed(mint.url)
                        }
                    } catch (e) {
                        console.warn('[Onboarding] Failed to restore mint:', mint.url, e)
                    }
                }
            }

            // Restore settings
            const settingsStore = useSettingsStore.getState()
            if (backup.secondaryCurrency) await settingsStore.setSecondaryCurrency(backup.secondaryCurrency)
            if (backup.theme) await settingsStore.setTheme(backup.theme)
            if (backup.defaultMintUrl) await settingsStore.setDefaultMintUrl(backup.defaultMintUrl)
        } catch (err: any) {
            const message = err?.message ?? 'Failed to import wallet from file.'
            if (message !== 'File selection was cancelled.') {
                Alert.alert('Import Failed', message)
            }
        }
    }

    // ── Loading overlay ─────────────────────────────────────────

    if (isImporting || isFinishing) {
        return (
            <YStack flex={1} bg="$background" items="center" justify="center" gap="$4">
                <ActivityIndicator size="large" color="#666" />
                <Text fontSize="$6" fontWeight="700" color="$color">
                    {isImporting ? 'Importing wallet...' : 'Setting up wallet...'}
                </Text>
                <Text color="$gray10" fontSize="$3" text="center" px="$6">
                    {isImporting
                        ? importStatus
                        : 'Preparing your secure wallet. This may take a few moments.'}
                </Text>
            </YStack>
        )
    }

    // ── Step router ─────────────────────────────────────────────

    switch (currentStep) {
        case 'welcome':
            return (
                <WelcomeStep
                    onCreateWallet={handleCreateWallet}
                    onImportWallet={handleImportWallet}
                    onImportFromFile={handleImportFromFile}
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
            if (!generatedMnemonic) { setStep('welcome'); return null }
            return (
                <SeedStep
                    mnemonic={generatedMnemonic}
                    onContinue={handleSeedContinue}
                />
            )

        case 'biometric':
            return <BiometricStep onComplete={handleBiometricComplete} />

        case 'mintpicker':
            return (
                <MintPickerStep
                    onComplete={handleMintPickerComplete}
                    onSkip={handleMintPickerSkip}
                />
            )

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
                    onImportFromFile={handleImportFromFile}
                />
            )
    }
}
