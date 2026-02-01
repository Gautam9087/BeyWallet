import { YStack, XStack, H2, Text, Button, Paragraph } from "tamagui";
import { useRouter } from "expo-router";
import { ArrowLeft } from "@tamagui/lucide-icons";

export default function MeltScreen() {
    const router = useRouter();

    return (
        <YStack flex={1} bg="$background" p="$4" gap="$4" >


            <YStack flex={1} items="center" justify="center" gap="$4">
                <Text fontSize="$6" fontWeight="bold">Pay Lightning Invoice</Text>
                <Paragraph color="$gray10" text="center" px="$8">
                    This feature allows you to spend your ecash by paying any Bitcoin Lightning invoice.
                </Paragraph>
                <Button theme="orange" size="$5" mt="$4" disabled>
                    Coming Soon
                </Button>
            </YStack>
        </YStack>
    );
}
