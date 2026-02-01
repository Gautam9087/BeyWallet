import { Button, XStack } from "tamagui";
import { Landmark } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import * as Haptics from 'expo-haptics';
import SwapIcon from "~/components/icons/Swap";
import ArrowDownIcon from "~/components/icons/ArrowDown";
import SendIcon from "~/components/icons/Send";
import MintModal from "./MintModal";

export default function ActionButtons() {
    const router = useRouter();
    const [mintModalOpen, setMintModalOpen] = useState(false);

    return (
        <>
            <XStack gap="$2" justify="space-between">
                <Button
                    bg="$color3"
                    flex={1}
                    size="$7"
                    rounded="$4"
                    icon={<Landmark size={32} />}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        setMintModalOpen(true);
                    }}
                />
                <Button
                    bg="$color3"
                    flex={1}
                    size="$7"
                    rounded="$4"
                    icon={<SwapIcon size={32} />}
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                />
                <Button
                    bg="$color3"
                    flex={1}
                    size="$7"
                    rounded="$4"
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }}
                    icon={<ArrowDownIcon size={36} />}
                />
                <Button
                    bg="$color3"
                    themeInverse
                    onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                        router.push("/send");
                    }}
                    flex={1}
                    size="$7"
                    rounded="$4"
                    icon={<SendIcon size={32} />}
                />
            </XStack>
            <MintModal open={mintModalOpen} onOpenChange={setMintModalOpen} />
        </>
    )
}