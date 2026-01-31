import { Check, Info } from '@tamagui/lucide-icons'
import { Toast, useToastController, useToastState } from '@tamagui/toast'
import { Button, H4, View, XStack, YStack, isWeb } from 'tamagui'

export function CurrentToast() {
  const currentToast = useToastState()

  if (!currentToast || currentToast.isHandledNatively) return null

  return (
    <Toast
      key={currentToast.id}
      duration={5000}
      viewportName={currentToast.viewportName}
      enterStyle={{ opacity: 0, scale: 0.5, y: -25 }}
      exitStyle={{ opacity: 0, scale: 1, y: -20 }}
      width={350}
      theme="green"
      rounded="$5"
      transition="quick"
    >
      <XStack gap="$1" items="center" p="$1">

        <View>
          <Check size={20} />
        </View>
        <YStack width={'100%'} p="$1" gap="$1">
          <Toast.Title fontWeight="bold">{currentToast.title}</Toast.Title>
          {!!currentToast.message && (
            <Toast.Description>{currentToast.message}</Toast.Description>
          )}
        </YStack>
      </XStack>
    </Toast>
  )
}

export function ToastControl() {
  const toast = useToastController()

  return (
    <YStack gap="$2" items="center">
      <H4>Toast demo</H4>
      <XStack gap="$2" justify="center">
        <Button
          onPress={() => {
            toast.show('Successfully saved!', {
              message: "Don't worry, we've got your data.",
            })
          }}
        >
          Show
        </Button>
        <Button
          onPress={() => {
            toast.hide()
          }}
        >
          Hide
        </Button>
      </XStack>
    </YStack>
  )
}
