import { Text, View } from 'tamagui'
import { ThemeSelector } from '~/components/ThemeSelector'

export function SettingsScreen() {
    return (
        <View flex={1} items="center" justify="center" bg="$background">
            <Text fontSize={20} color="$blue10">
                Settings
            </Text>
            <ThemeSelector />
        </View>
    )
}
