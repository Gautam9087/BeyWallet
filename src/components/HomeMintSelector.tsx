import { ChevronDown, Sprout } from "@tamagui/lucide-icons";
import { Button, Text } from "tamagui";
import * as Haptics from 'expo-haptics';
import { useState } from 'react';

export default function HomeHeaderMintSelector() {
    const [mintName, setMintName] = useState("CashuTestNut mint");

    const handlePress = () => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Soft);
        // Your mint selection logic here
    };

    return (
        <Button
            size="$2.5"
            theme="blue"
            borderWidth={1}
            onPress={handlePress}
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

            {mintName}

        </Button>
    )
}