import { Stack, useRouter } from 'expo-router'
import { Button, useTheme, XStack, Text } from 'tamagui'
import { X, ChevronLeft } from '@tamagui/lucide-icons'

export default function ModalLayout() {
    const theme = useTheme()
    const router = useRouter()

    return (
        <Stack
            screenOptions={{
                headerShown: true,
                presentation: 'formSheet',
                headerStyle: {
                    backgroundColor: theme.background.val,
                },
                headerTitleStyle: {
                    color: theme.color.val,
                    fontWeight: '700',
                },
                headerTintColor: theme.color.val,
                headerShadowVisible: false,
                headerLeft: () => (
                    <Button
                        circular
                        size="$3"
                        chromeless
                        icon={<X size={24} color="$color" />}
                        onPress={() => router.back()}
                    />
                ),
                contentStyle: {
                    backgroundColor: theme.background.val,
                },
            }}
        >
            <Stack.Screen
                name="send"
                options={{
                    title: 'Send',
                }}
            />
        </Stack>
    )
}
