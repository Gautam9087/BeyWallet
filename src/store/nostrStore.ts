import { create } from 'zustand';

interface NostrState {
    privkey: string | null;
    pubkey: string | null;
    npub: string | null;
    nsec: string | null;
    relays: string[];
    logs: string[];

    // Actions
    setKeys: (keys: { privkey: string; pubkey: string; npub: string; nsec: string }) => void;
    addRelay: (url: string) => void;
    removeRelay: (url: string) => void;
    addLog: (message: string) => void;
    clearLogs: () => void;
}

export const useNostrStore = create<NostrState>((set) => ({
    privkey: null,
    pubkey: null,
    npub: null,
    nsec: null,
    relays: ['wss://relay.damus.io', 'wss://nos.lol', 'wss://relay.snort.social'],
    logs: [],

    setKeys: (keys) => set(keys),
    addRelay: (url) => set((state) => ({
        relays: state.relays.includes(url) ? state.relays : [...state.relays, url]
    })),
    removeRelay: (url) => set((state) => ({
        relays: state.relays.filter(r => r !== url)
    })),
    addLog: (message) => set((state) => ({
        logs: [message, ...state.logs].slice(0, 50)
    })),
    clearLogs: () => set({ logs: [] }),
}));
