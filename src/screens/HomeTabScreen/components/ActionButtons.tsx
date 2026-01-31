import { Button, XStack } from "tamagui";
import { Landmark } from "@tamagui/lucide-icons";
import { useRouter } from "expo-router";
import SwapIcon from "~/components/icons/Swap";
import ArrowDownIcon from "~/components/icons/ArrowDown";
import SendIcon from "~/components/icons/Send";

export default function ActionButtons() {
    const router = useRouter();

    return (
        <XStack gap="$2" justify="space-between">
            <Button
                bg="$color4"
                flex={1}
                size="$7"
                rounded="$4"
                icon={<Landmark size={32} />}
                onPress={() => { }}
            />
            <Button
                bg="$color4"
                flex={1}
                size="$7"
                rounded="$4"
                icon={<SwapIcon size={32} />}
                onPress={() => { }}
            />
            <Button
                bg="$color4"
                flex={1}
                size="$7"
                rounded="$4"
                onPress={() => { }}
                icon={<ArrowDownIcon size={36} />}
            />
            <Button
                bg="$color3"
                themeInverse
                onPress={() => router.push("/send")}
                flex={1}
                size="$7"
                rounded="$4"
                icon={<SendIcon size={32} />}
            />
        </XStack>
    )
}