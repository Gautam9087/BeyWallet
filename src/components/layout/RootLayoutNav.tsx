import { useEffect, useState } from 'react'
import { AppState, AppStateStatus } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { DarkTheme, DefaultTheme, ThemeProvider as NavThemeProvider } from '@react-navigation/native'
import { Stack } from 'expo-router'
import { useTheme } from 'tamagui'
import { useAppTheme } from '../../context/ThemeContext'
import { LockScreen } from '../LockScreen'

import { useAuthStore } from '../../store/authStore'

export function RootLayoutNav() {
    const { resolvedTheme } = useAppTheme()
    const theme = useTheme()
    const { isAuthenticated, setAuthenticated, lock } = useAuthStore()

    useEffect(() => {
        const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
            // If the user moves away from the app (background/inactive), lock it immediately
            if (nextAppState === 'background' || nextAppState === 'inactive') {
                lock()
            }
        })

        return () => {
            subscription.remove()
        }
    }, [])

    const navigationTheme = {
        ...(resolvedTheme === 'dark' ? DarkTheme : DefaultTheme),
        colors: {
            ...(resolvedTheme === 'dark' ? DarkTheme.colors : DefaultTheme.colors),
            background: theme.background.val,
        },
    }

    if (!isAuthenticated) {
        return (
            <NavThemeProvider value={navigationTheme}>
                <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
                <LockScreen onUnlock={() => setAuthenticated(true)} />
            </NavThemeProvider>
        )
    }

    return (
        <NavThemeProvider value={navigationTheme}>
            <StatusBar style={resolvedTheme === 'dark' ? 'light' : 'dark'} />
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
                        presentation: 'modal',
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
        </NavThemeProvider>
    )
}
