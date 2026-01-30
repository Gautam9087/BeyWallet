import { ExternalLink } from '@tamagui/lucide-icons'
import { Anchor, H2, Paragraph, XStack, YStack, ScrollView } from 'tamagui'
import { ToastControl } from 'components/CurrentToast'
import { ThemeSelector } from 'components/ThemeSelector'

export default function TabOneScreen() {
  return (
    <ScrollView bg="$background">
      <YStack flex={1} items="center" gap="$8" px="$6" pt="$10" pb="$20">
        <YStack items="center" gap="$2">
          <H2>Bey Wallet</H2>
          <Paragraph color="$gray11">
            Modern, Secure, and Lightning Fast
          </Paragraph>
        </YStack>

        <ThemeSelector />

        <ToastControl />

        <YStack items="center" gap="$4" w="100%" mt="$4">
          <Paragraph fontSize="$4">
            Configure your app in
          </Paragraph>

          <XStack
            items="center"
            gap="$2"
            px="$4"
            py="$2"
            rounded="$4"
            bg="$blue5"
            borderWidth={1}
            borderColor="$blue10"
          >
            <Paragraph fontWeight="600" color="$blue10">
              tamagui.config.ts
            </Paragraph>
          </XStack>

          <XStack
            items="center"
            gap="$2"
            px="$4"
            py="$2"
            rounded="$4"
            bg="$green5"
            hoverStyle={{ bg: '$green6' }}
            pressStyle={{ bg: '$green4' }}
          >
            <Anchor
              href="https://tamagui.dev/docs/core/configuration"
              textDecorationLine="none"
              color="$green10"
              fontSize="$4"
              fontWeight="600"
            >
              Configuration guide
            </Anchor>
            <ExternalLink size={16} color="$green10" />
          </XStack>
        </YStack>
      </YStack>
    </ScrollView>
  )
}
