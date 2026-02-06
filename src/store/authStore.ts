import { create } from 'zustand'

interface AuthState {
    isAuthenticated: boolean
    hasBackgrounded: boolean // Track if app has ever gone to background
    setAuthenticated: (value: boolean) => void
    lock: () => void
    markBackgrounded: () => void
}

export const useAuthStore = create<AuthState>((set, get) => ({
    isAuthenticated: true, // Start authenticated (no lock on cold start)
    hasBackgrounded: false, // Track if we've gone to background
    setAuthenticated: (value) => set({ isAuthenticated: value }),
    lock: () => {
        // Only lock if we've been to the background before
        if (get().hasBackgrounded) {
            set({ isAuthenticated: false })
        }
    },
    markBackgrounded: () => set({ hasBackgrounded: true }),
}))
