import { Stack, useRouter } from 'expo-router'
import { Button, useTheme, XStack, Text } from 'tamagui'
import { X, ChevronLeft } from '@tamagui/lucide-icons'

export default function ModalLayout() {
    const theme = useTheme()
    const router = useRouter()

    const DefaultHeaderTitle = ({ children }: { children: string }) => (
        <Text fontWeight="700" fontSize={20} color="$color">
            {children.charAt(0).toUpperCase() + children.slice(1)}
        </Text>
    )

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
                    fontWeight: '500',

                },
                headerTitleAlign: 'center',
                headerTintColor: theme.color.val,
                headerShadowVisible: false,
                headerTitle: ({ children }) => <DefaultHeaderTitle>{children}</DefaultHeaderTitle>,
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
