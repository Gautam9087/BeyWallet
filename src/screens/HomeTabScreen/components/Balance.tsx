import { H2, Paragraph, Text, YStack } from "tamagui";
import HomeHeaderMintSelector from "~/components/HomeMintSelector";

export default function Balance() {
    return (
        <YStack py="$4">

            <Paragraph color="$accent8">
                Account Balance
            </Paragraph>
            <Text letterSpacing={-1} fontSize={35} fontWeight="600" maxW={"82%"} numberOfLines={1} ellipsizeMode="tail" fontVariant={['tabular-nums']}>
                ₹4,570.95
            </Text>
            <Paragraph color="$gray11">
                ~4,570 USD
            </Paragraph>

        </YStack>
    )
}