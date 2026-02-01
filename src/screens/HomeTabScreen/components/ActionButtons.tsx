import { Button, XStack, YStack, Text, ListItem } from "tamagui";
import { Landmark, ArrowUpRight, ArrowDownLeft, Flame, ArrowDownRight, ArrowRight } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import { useRef } from "react";
import * as Haptics from 'expo-haptics';
import SwapIcon from "~/components/icons/Swap";
import ArrowDownIcon from "~/components/icons/ArrowDown";
import SendIcon from "~/components/icons/Send";
import AppBottomSheet, { AppBottomSheetRef } from "~/components/UI/AppBottomSheet";

export default function ActionButtons() {
    const router = useRouter();
    const sheetRef = useRef<AppBottomSheetRef>(null);

    const handleOptionPress = (path: string) => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        sheetRef.current?.dismiss();
        router.push(path as any);
    };

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
                        sheetRef.current?.present();
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

            <AppBottomSheet ref={sheetRef}>
                <YStack p="$4" gap="$2">
                    <XStack justify="center">
                        <Text fontSize="$6" color="$accent5" fontWeight="bold" mb="$2" px="$2">Select action</Text>
                    </XStack>
                    <ListItem
                        hoverTheme
                        pressTheme
                        title="Mint"
                        size="$6"

                        subTitle="Add funds via Lightning."
                        iconAfter={<ArrowRight size={24} color="$color" />}
                        icon={<ArrowDownLeft size={24} color="$color" />}
                        onPress={() => handleOptionPress("/mint")}
                        rounded="$7"
                        borderWidth={2}
                        borderColor="$color3"
                    />
                    <ListItem
                        hoverTheme
                        pressTheme
                        title="Melt"
                        size="$6"

                        iconAfter={<ArrowRight size={24} color="$color" />}
                        subTitle="Withdraw via Lightning."
                        icon={<Flame size={24} color="$color" />}
                        onPress={() => handleOptionPress("/melt")}
                        rounded="$7"
                        borderWidth={2}
                        borderColor="$color3"
                    />
                </YStack>
            </AppBottomSheet>
        </>
    )
}