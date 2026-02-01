import { ChevronDown, Sprout } from "@tamagui/lucide-icons";
import { Button, Text, YStack, XStack, ListItem, Paragraph } from "tamagui";
import * as Haptics from 'expo-haptics';
import { useRef } from 'react';
import { useWalletStore } from "../store/walletStore";
import AppBottomSheet, { AppBottomSheetRef } from "./UI/AppBottomSheet";

export default function HomeHeaderMintSelector() {
    const { activeMintUrl, balance } = useWalletStore();
    const sheetRef = useRef<AppBottomSheetRef>(null);

    const displayUrl = activeMintUrl ? activeMintUrl.replace('https://', '') : "Select Mint";

    return (
        <>
            <Button
                size="$2.5"
                theme="orange"
                borderWidth={1}
                onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
                    sheetRef.current?.present();
                }}
                maxW={170}
                pressStyle={{ scale: 0.97, opacity: 0.9 }}
                icon={<Sprout size={16} strokeWidth={2.5} color="$color" />}
                iconAfter={<ChevronDown size={14} strokeWidth={2.5} color="$color" />}
                textProps={{
                    fontSize: "$3",
                    fontWeight: "700",
                    maxW: 110,
                    numberOfLines: 1,
                }}
                ellipse
            >
                {displayUrl}
            </Button>

            <AppBottomSheet ref={sheetRef}>
                <YStack p="$4" gap="$3">
                    <XStack justify="center">
                        <Paragraph fontSize="$6" color="$accent5" fontWeight="bold" mb="$2" px="$2">Mints</Paragraph>
                    </XStack>

                    <ListItem
                        size="$6"
                        hoverTheme
                        pressTheme
                        rounded="$7"
                        borderWidth={2}
                        borderColor="$color3"
                        onPress={() => {
                            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                            sheetRef.current?.dismiss();
                        }}
                        title="Cashu Testnut"
                        subTitle="https://testnut.cashu.space"
                        iconAfter={
                            <XStack items="center" gap="$2">
                                <Text fontWeight="bold" fontSize="$5">{balance}</Text>
                                <Text fontSize="$2" opacity={0.6}>SATS</Text>
                            </XStack>
                        }
                    />
                </YStack>
            </AppBottomSheet>
        </>
    );
}