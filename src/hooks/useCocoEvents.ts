import { useEffect, useCallback } from 'react';
import { initService, eventService } from '../services/core';
import { useWalletStore } from '../store/walletStore';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to coco CoreEvents and trigger wallet updates.
 * Use this in your app's root component to enable real-time updates.
 *
 * Subscribed events:
 * - mint-quote:redeemed  → balance gained from paid Lightning invoice
 * - receive:created      → ecash token received
 * - send:created         → ecash token sent
 * - proofs:saved         → new proofs stored (covers mint redemption)
 * - proofs:state-changed → proof state transitions (spent, etc.)
 * - melt-quote:paid      → Lightning invoice paid from ecash
 * - history:updated      → any history entry changed
 */
export function useCocoEvents() {
    const { refreshBalance } = useWalletStore();
    const queryClient = useQueryClient();

    const handleBalanceUpdate = useCallback(() => {
        console.log('[useCocoEvents] Balance update triggered');
        refreshBalance();
        queryClient.invalidateQueries({ queryKey: ['history'] });
    }, [refreshBalance, queryClient]);

    const handleMintQuoteRedeemed = useCallback((payload: any) => {
        console.log('[useCocoEvents] Mint quote redeemed:', payload.quoteId);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleReceiveCreated = useCallback((payload: any) => {
        console.log('[useCocoEvents] Receive created:', payload.mintUrl);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleSendCreated = useCallback((payload: any) => {
        console.log('[useCocoEvents] Send created:', payload.mintUrl);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleProofsSaved = useCallback((payload: any) => {
        console.log('[useCocoEvents] Proofs saved:', payload.mintUrl, payload.keysetId);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleProofsStateChanged = useCallback((payload: any) => {
        console.log('[useCocoEvents] Proofs state changed:', payload.state);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleMeltQuotePaid = useCallback((payload: any) => {
        console.log('[useCocoEvents] Melt quote paid:', payload.quoteId);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleHistoryUpdated = useCallback((payload: any) => {
        console.log('[useCocoEvents] History updated');
        queryClient.invalidateQueries({ queryKey: ['history'] });
    }, [queryClient]);

    useEffect(() => {
        if (!initService.isInitialized()) {
            console.log('[useCocoEvents] Not initialized, skipping event subscription');
            return;
        }

        console.log('[useCocoEvents] Subscribing to CoreEvents');

        // Subscribe using typed eventService
        const unsubs = [
            eventService.on('mint-quote:redeemed', handleMintQuoteRedeemed),
            eventService.on('receive:created', handleReceiveCreated),
            eventService.on('send:created', handleSendCreated),
            eventService.on('proofs:saved', handleProofsSaved),
            eventService.on('proofs:state-changed', handleProofsStateChanged),
            eventService.on('melt-quote:paid', handleMeltQuotePaid),
            eventService.on('history:updated', handleHistoryUpdated),
        ];

        return () => {
            console.log('[useCocoEvents] Unsubscribing from CoreEvents');
            unsubs.forEach(unsub => unsub());
        };
    }, [
        handleMintQuoteRedeemed,
        handleReceiveCreated,
        handleSendCreated,
        handleProofsSaved,
        handleProofsStateChanged,
        handleMeltQuotePaid,
        handleHistoryUpdated,
    ]);
}
