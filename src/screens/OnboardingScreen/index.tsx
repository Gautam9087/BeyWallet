import React, { useState } from 'react'
import { WelcomeStep } from './WelcomeStep'
import { CreatingStep } from './CreatingStep'
import { SeedStep } from './SeedStep'
import { BiometricStep } from './BiometricStep'
import { ImportSeedStep } from './ImportSeedStep'
import { MintPickerStep } from './MintPickerStep'
import { RestoreProgressStep } from './RestoreProgressStep'
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
    const restoreAllMints = useWalletStore(state => state.restoreAllMints)
    const mintRestoreStatuses = useWalletStore(state => state.mintRestoreStatuses)
    const isRestoring = useWalletStore(state => state.isRestoring)

    const [isImporting, setIsImporting] = useState(false)
    const [isFinishing, setIsFinishing] = useState(false)
    const [importStatus, setImportStatus] = useState('')
    // Extra mints from a backup file
    const [extraRestoreMints, setExtraRestoreMints] = useState<string[]>([])

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

    // Called when user picks a mint (or skips) on new wallet
    const handleMintPickerComplete = async (selectedMintUrl: string) => {
        setIsFinishing(true)
        try {
            await mintManager.addMint(selectedMintUrl, { trusted: true })
            useWalletStore.getState().restoreFromSeed(selectedMintUrl)

            await useSettingsStore.getState().setDefaultMintUrl(selectedMintUrl)
            await completeOnboarding()
        } catch (err) {
            console.error('[Onboarding] mint picker complete failed:', err)
        } finally {
            setIsFinishing(false)
        }
    }

    const handleMintPickerSkip = async () => {
        setIsFinishing(true)
        try {
            await completeOnboarding()
        } finally {
            setIsFinishing(false)
        }
    }

    // ── Seed import (restore flow) ──────────────────────────────

    const handleImportSeed = async (mnemonic: string, additionalMints: string[] = []) => {
        setIsImporting(true)
        setImportStatus('Initializing wallet…')
        try {
            console.log('[Onboarding] Importing wallet from seed...')

            await initService.restoreWallet(mnemonic)

            setImportStatus('Welcome back! Starting restore…')
            await completeOnboarding()
            await useSettingsStore.getState().initialize(true)
            await initialize()

            // Store extra mints (from backup file) for the restore step
            setExtraRestoreMints(additionalMints)

            // Navigate to restore progress screen — restoreAllMints fires there
            console.log('[Onboarding] Navigating to restore progress step...')
            setStep('restoring')
        } catch (err) {
            console.error('[Onboarding] Import failed:', err)
            setImportStatus('Import failed. Please try again.')
        } finally {
            setIsImporting(false)
        }
    }

    // Called when RestoreProgressStep mounts — start the actual multi-mint restore
    const handleRestoreStart = () => {
        restoreAllMints(extraRestoreMints)
    }

    // Called when user taps "Go to Wallet" on the progress screen
    const handleRestoreDone = () => {
        // Onboarding is already complete — app navigates home automatically
        // Just ensure we push to home tab
        console.log('[Onboarding] Restore done, going home')
    }

    // ── File import (restore from .bey backup file) ─────────────

    const handleImportFromFile = async () => {
        try {
            const backup = await walletFileService.importWalletFromFile()

            // Collect extra mints from backup (excluding DEFAULT_MINT)
            const extraMints = (backup.mints ?? [])
                .map((m: any) => m.url)
                .filter((url: string) => url && url !== DEFAULT_MINT)

            // Standard seed restore — passes extra mints for the progress screen
            await handleImportSeed(backup.mnemonic, extraMints)

            // Restore settings from backup
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
                    onImport={(mnemonic) => handleImportSeed(mnemonic)}
                    onBack={() => setStep('welcome')}
                />
            )

        case 'restoring': {
            const totalRestoredSats = mintRestoreStatuses
                .filter(e => e.status === 'done')
                .reduce((sum, e) => sum + e.restoredBalance, 0)

            // Fire restore on first render of this step
            return (
                <RestoreProgressStepWrapper
                    entries={mintRestoreStatuses}
                    isRestoring={isRestoring}
                    totalRestoredSats={totalRestoredSats}
                    onStart={handleRestoreStart}
                    onDone={handleRestoreDone}
                />
            )
        }

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

// ── Wrapper that fires restoreAllMints on mount ──────────────────────────────

function RestoreProgressStepWrapper({
    entries,
    isRestoring,
    totalRestoredSats,
    onStart,
    onDone,
}: {
    entries: ReturnType<typeof useWalletStore.getState>['mintRestoreStatuses']
    isRestoring: boolean
    totalRestoredSats: number
    onStart: () => void
    onDone: () => void
}) {
    const [started, setStarted] = React.useState(false)

    React.useEffect(() => {
        if (!started) {
            setStarted(true)
            onStart()
        }
    }, [])

    return (
        <RestoreProgressStep
            entries={entries}
            isRestoring={isRestoring}
            totalRestoredSats={totalRestoredSats}
            onDone={onDone}
        />
    )
}

