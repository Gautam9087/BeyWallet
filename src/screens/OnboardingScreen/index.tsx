import React from 'react'
import { WelcomeStep } from './WelcomeStep'
import { CreatingStep } from './CreatingStep'
import { SeedStep } from './SeedStep'
import { BiometricStep } from './BiometricStep'
import { useOnboardingStore } from '../../store/onboardingStore'
import { seedService } from '../../services/seedService'
import { cocoService } from '../../services/cocoService'
import { useWalletStore } from '../../store/walletStore'

export function OnboardingScreen() {
    const { currentStep, setStep, setGeneratedMnemonic, generatedMnemonic, completeOnboarding } = useOnboardingStore()
    const initialize = useWalletStore(state => state.initialize)

    const handleCreateWallet = () => {
        setStep('creating')
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
            await cocoService.createWallet(generatedMnemonic)

            // Mark onboarding as complete
            await completeOnboarding()

            // Initialize the wallet store
            await initialize()
        } catch (err) {
            console.error('[Onboarding] Failed to complete:', err)
        }
    }

    switch (currentStep) {
        case 'welcome':
            return <WelcomeStep onCreateWallet={handleCreateWallet} />

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

        default:
            return <WelcomeStep onCreateWallet={handleCreateWallet} />
    }
}
