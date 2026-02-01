import { ChevronDown, Sprout } from "@tamagui/lucide-icons";
import { Button, Text, Popover, YStack, XStack, Input, ListItem } from "tamagui";
import * as Haptics from 'expo-haptics';
import { useState } from 'react';
import { useWalletStore } from "../store/walletStore";

export default function HomeHeaderMintSelector() {
    const { activeMintUrl, addMint } = useWalletStore();
    const [open, setOpen] = useState(false);
    const [newMintUrl, setNewMintUrl] = useState("");

    const handleAddMint = async () => {
        if (!newMintUrl) return;
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        await addMint(newMintUrl);
        setNewMintUrl("");
        setOpen(false);
    };

    const displayUrl = activeMintUrl ? activeMintUrl.replace('https://', '') : "Select Mint";

    return (
        <Popover open={open} onOpenChange={setOpen} placement="bottom">
            <Popover.Trigger asChild>
                <Button
                    size="$2.5"
                    theme="orange"
                    borderWidth={1}
                    onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft)}
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
            </Popover.Trigger>

            <Popover.Content
                borderWidth={1}
                borderColor="$borderColor"
                enterStyle={{ y: -10, opacity: 0 }}
                exitStyle={{ y: -10, opacity: 0 }}
                elevate
                p="$4"
                width={300}
            >
                <YStack gap="$4">
                    <Text fontWeight="700">Add New Mint</Text>
                    <XStack gap="$2">
                        <Input
                            flex={1}
                            size="$3"
                            placeholder="https://mint.example.com"
                            value={newMintUrl}
                            onChangeText={setNewMintUrl}
                        />
                        <Button size="$3" onPress={handleAddMint}>Add</Button>
                    </XStack>

                    {activeMintUrl && (
                        <YStack>
                            <Text fontWeight="600" mb="$2">Current Mint</Text>
                            <ListItem title={activeMintUrl} />
                        </YStack>
                    )}
                </YStack>
            </Popover.Content>
        </Popover>
    );
}