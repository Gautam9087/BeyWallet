import { useEffect, useRef } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useTheme, YStack } from 'tamagui'
import { useAppTheme } from '../../context/ThemeContext'
import { LockOverlay } from '../LockOverlay'

import { useAuthStore } from '../../store/authStore'

export function RootLayoutNav() {
    const { resolvedTheme } = useAppTheme()
    const theme = useTheme()
    const { isAuthenticated, setAuthenticated, lock, markBackgrounded } = useAuthStore()
    const appState = useRef(AppState.currentState)

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // When moving from active to background/inactive
            if (appState.current === 'active' && (nextAppState === 'background' || nextAppState === 'inactive')) {
                markBackgrounded() // Mark that we've gone to background at least once
                lock() // Lock the app
            }

            appState.current = nextAppState
        })

        return () => {
            subscription.remove()
        }
    }, [lock, markBackgrounded])

    const navigationTheme = {
        ...resolvedTheme === 'dark' ? DarkTheme : DefaultTheme,
        colors: {
            ...(resolvedTheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
            background: theme.background.val,
        },
    }

    return (
        <NavThemeProvider value={navigationTheme}>
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
            <YStack flex={1}>
                <Stack
                    screenOptions={{
                        contentStyle: {
                            backgroundColor: theme.background.val,
                        },
                    }}
                >
                    <Stack.Screen
                        name="(tabs)"
                        options={{
                            headerShown: false,
                        }}
                    />

                    <Stack.Screen
                        name="(modals)"
                        options={{
                            headerShown: false,

                            presentation: "modal",
                            animation: "ios_from_right",
                            gestureEnabled: true,
                            gestureDirection: 'horizontal',
                        }}
                    />

                    <Stack.Screen
                        name="modal"
                        options={{
                            title: 'Tamagui + Expo',
                            presentation: 'formSheet',
                            animation: 'slide_from_right',
                            gestureEnabled: true,
                            gestureDirection: 'horizontal',
                        }}
                    />
                </Stack>

                {/* Lock overlay - renders on top of everything when locked */}
                {!isAuthenticated && (
                    <LockOverlay onUnlock={() => setAuthenticated(true)} />
                )}
            </YStack>
        </NavThemeProvider>
    )
}
