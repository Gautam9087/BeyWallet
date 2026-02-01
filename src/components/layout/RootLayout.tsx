import { useEffect } from 'react'
import { useFonts } from 'expo-font'
import { SplashScreen } from 'expo-router'
import { Provider } from '../Provider'
import { RootLayoutNav } from './RootLayoutNav'
import { cocoService } from '../../services/cocoService'
import { useWalletStore } from '../../store/walletStore'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync()

export function RootLayout() {
    const initialize = useWalletStore(state => state.initialize)
    const isInitializing = useWalletStore(state => state.isInitializing)

    const [loaded, error] = useFonts({
        BaselGroteskBook: require('../../assets/fonts/Basel-Grotesk-Book.otf'),
        BaselGroteskMedium: require('../../assets/fonts/Basel-Grotesk-Medium.otf'),
    })

    useEffect(() => {
        initialize()
    }, [initialize])

    useEffect(() => {
        if ((loaded || error) && !isInitializing) {
            // Hide the splash screen after the fonts have loaded (or an error was returned) and the UI is ready.
            SplashScreen.hideAsync()
        }
    }, [loaded, error, isInitializing])

    if (!loaded && !error) {
        return null
    }

    // Get the manager after initialization
    const manager = !isInitializing ? (() => {
        try {
            return cocoService.getManager();
        } catch (e) {
            return null;
        }
    })() : null;

    return (
        <Providers cocoManager={manager}>
            <RootLayoutNav />
        </Providers>
    )
}

const Providers = ({ children, cocoManager }: { children: React.ReactNode; cocoManager: any }) => {
    return (
        <QueryClientProvider client={queryClient}>
            <Provider cocoManager={cocoManager}>
                {children}
            </Provider>
        </QueryClientProvider>
    )
}
