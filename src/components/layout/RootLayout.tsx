import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { SplashScreen } from 'expo-router'
import { Provider } from '../Provider'
import { RootLayoutNav } from './RootLayoutNav'

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export function RootLayout() {
    const [loaded, error] = useFonts({
        BaselGroteskBook: require('../../assets/fonts/Basel-Grotesk-Book.otf'),
        BaselGroteskMedium: require('../../assets/fonts/Basel-Grotesk-Medium.otf'),
    })

    useEffect(() => {
        if (loaded || error) {
            // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
            SplashScreen.hideAsync()
        }
    }, [loaded, error])

    if (!loaded && !error) {
        return null
    }

    return (
        <Providers>
            <RootLayoutNav />
        </Providers>
    )
}

const Providers = ({ children }: { children: React.ReactNode }) => {
    return <Provider>{children}</Provider>
}
