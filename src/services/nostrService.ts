import { SimplePool } from 'nostr-tools';
import { getPublicKey, finalizeEvent } from 'nostr-tools/pure';
import * as nip19 from 'nostr-tools/nip19';
import { useNostrStore } from '../store/nostrStore';
import { seedService } from './seedService';
import { Buffer } from 'buffer';

const MINT_DATA_KIND = 30078;
const MINT_DATA_D_TAG = 'bey-wallet-metadata';

export const nostrService = {
    pool: new SimplePool(),

    /**
     * Initialize keys from mnemonic
     */
    init: async (mnemonic: string) => {
        const { privkey, pubkey, npub, nsec } = await seedService.getNostrKeys(mnemonic);
        useNostrStore.getState().setKeys({ privkey, pubkey, npub, nsec });
        nostrService.log(`Keys initialized: ${npub.substring(0, 10)}...`);
    },

    /**
     * Publish trusted mints and current total balance to Nostr
     */
    syncToNostr: async (mints: string[], totalBalance: number) => {
        const { privkey, relays, pubkey } = useNostrStore.getState();
        if (!privkey || !pubkey) return;

        nostrService.log(`Syncing ${mints.length} mints to Nostr...`);

        try {
            const data = {
                mints,
                totalBalance,
                updatedAt: Math.floor(Date.now() / 1000)
            };

            const eventTemplate = {
                kind: MINT_DATA_KIND,
                created_at: Math.floor(Date.now() / 1000),
                tags: [['d', MINT_DATA_D_TAG]],
                content: JSON.stringify(data),
            };

            const event = finalizeEvent(eventTemplate, Buffer.from(privkey, 'hex'));

            const promises = nostrService.pool.publish(relays, event);

            await Promise.all(
                promises.map((p, i) =>
                    p.then(() => nostrService.log(`Published to ${relays[i]}`))
                        .catch(e => nostrService.log(`Failed to publish to ${relays[i]}: ${e.message}`))
                )
            );

            nostrService.log('Sync complete');
        } catch (err: any) {
            nostrService.log(`Sync failed: ${err.message}`);
            console.error('[NostrService] Sync failed:', err);
        }
    },

    /**
     * Fetch metadata from Nostr
     */
    fetchFromNostr: async (): Promise<{ mints: string[], totalBalance: number } | null> => {
        const { pubkey, relays } = useNostrStore.getState();
        if (!pubkey) return null;

        nostrService.log('Fetching metadata from Nostr...');

        try {
            const events = await nostrService.pool.querySync(relays, {
                kinds: [MINT_DATA_KIND],
                authors: [pubkey],
                '#d': [MINT_DATA_D_TAG],
                limit: 1
            });

            if (events.length > 0) {
                const latest = events[0];
                const data = JSON.parse(latest.content);
                nostrService.log(`Metadata fetched: ${data.mints.length} mints found`);
                return data;
            }

            nostrService.log('No metadata found on relays');
            return null;
        } catch (err: any) {
            nostrService.log(`Fetch failed: ${err.message}`);
            console.error('[NostrService] Fetch failed:', err);
            return null;
        }
    },

    log: (msg: string) => {
        console.log(`[Nostr] ${msg}`);
        useNostrStore.getState().addLog(`${new Date().toLocaleTimeString()} - ${msg}`);
    }
};
