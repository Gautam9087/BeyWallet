import { YStack } from "tamagui";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AmountStage } from "./AmountStage";
import { ConfirmStage } from "./ConfirmStage";
import { PaymentStage } from "./PaymentStage";
import { ResultStage } from "./ResultStage";

type MintStep = 'amount' | 'confirm' | 'payment' | 'result';
type MintResultStatus = 'success' | 'error' | 'cancelled';

export default function MintScreen() {
    const router = useRouter();
    const [step, setStep] = useState<MintStep>('amount');
    const [amount, setAmount] = useState("0");
    const [status, setStatus] = useState<MintResultStatus>('success');

    const handleNext = () => {
        if (step === 'amount') setStep('confirm');
        else if (step === 'confirm') setStep('payment');
        else if (step === 'payment') {
            setStatus('success');
            setStep('result');
        }
    };

    const handleBack = () => {
        if (step === 'confirm') setStep('amount');
        else router.back();
    };

    const handleCancel = () => {
        setStatus('cancelled');
        setStep('result');
    };

    const handlePaid = () => {
        setStatus('success');
        setStep('result');
    };

    return (
        <YStack flex={1} bg="$background" p="$4">
            {step === 'amount' && (
                <AmountStage
                    amount={amount}
                    setAmount={setAmount}
                    onContinue={handleNext}
                />
            )}

            {step === 'confirm' && (
                <ConfirmStage
                    amount={amount}
                    onConfirm={handleNext}
                    onBack={handleBack}
                />
            )}

            {step === 'payment' && (
                <PaymentStage
                    amount={amount}
                    onPaid={handlePaid}
                    onCancel={handleCancel}
                />
            )}

            {step === 'result' && (
                <ResultStage
                    status={status}
                    amount={amount}
                    onClose={() => router.back()}
                />
            )}
        </YStack>
    );
}
