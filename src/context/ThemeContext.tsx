import React, { createContext, useContext, useEffect, useState } from 'react'
import { useColorScheme as useNativeColorScheme } from 'react-native'

type ThemeMode = 'light' | 'dark' | 'system'

interface ThemeContextType {
    themeMode: ThemeMode
    setThemeMode: (mode: ThemeMode) => void
    resolvedTheme: 'light' | 'dark'
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

export function ThemeProvider({ children }: { children: React.ReactNode }) {
    const [themeMode, setThemeMode] = useState<ThemeMode>('system')
    const systemColorScheme = useNativeColorScheme()

    const resolvedTheme = themeMode === 'system'
        ? (systemColorScheme === 'dark' ? 'dark' : 'light')
        : themeMode

    return (
        <ThemeContext.Provider value={{ themeMode, setThemeMode, resolvedTheme }}>
            {children}
        </ThemeContext.Provider>
    )
}

export function useAppTheme() {
    const context = useContext(ThemeContext)
    if (context === undefined) {
        throw new Error('useAppTheme must be used within a ThemeProvider')
    }
    return context
}
