import { useEffect, useCallback } from 'react';
import { cocoService } from '../services/cocoService';
import { useWalletStore } from '../store/walletStore';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Hook to subscribe to coco events and trigger wallet updates.
 * Use this in your app's root component to enable real-time updates.
 */
export function useCocoEvents() {
    const { refreshBalance, refreshMintList } = useWalletStore();
    const queryClient = useQueryClient();

    const handleBalanceUpdate = useCallback(() => {
        console.log('[useCocoEvents] Balance update triggered');
        refreshBalance();
        queryClient.invalidateQueries({ queryKey: ['history'] });
    }, [refreshBalance, queryClient]);

    const handleMintQuoteRedeemed = useCallback((payload: any) => {
        console.log('[useCocoEvents] Mint quote redeemed:', payload);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleReceiveCreated = useCallback((payload: any) => {
        console.log('[useCocoEvents] Receive created:', payload);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleSendFinalized = useCallback((payload: any) => {
        console.log('[useCocoEvents] Send finalized:', payload);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleSendRolledBack = useCallback((payload: any) => {
        console.log('[useCocoEvents] Send rolled back:', payload);
        handleBalanceUpdate();
    }, [handleBalanceUpdate]);

    const handleSendPrepared = useCallback((payload: any) => {
        console.log('[useCocoEvents] Send prepared:', payload);
        // Don't refresh balance here - proofs are just reserved, not spent
    }, []);

    const handleSendPending = useCallback((payload: any) => {
        console.log('[useCocoEvents] Send pending:', payload);
        handleBalanceUpdate();
        queryClient.invalidateQueries({ queryKey: ['history'] });
    }, [handleBalanceUpdate, queryClient]);

    useEffect(() => {
        if (!cocoService.isInitialized()) {
            console.log('[useCocoEvents] Coco not initialized, skipping event subscription');
            return;
        }

        console.log('[useCocoEvents] Subscribing to coco events');

        // Subscribe to events
        cocoService.on('mint-quote:redeemed', handleMintQuoteRedeemed);
        cocoService.on('receive:created', handleReceiveCreated);
        cocoService.on('send:prepared', handleSendPrepared);
        cocoService.on('send:pending', handleSendPending);
        cocoService.on('send:finalized', handleSendFinalized);
        cocoService.on('send:rolled-back', handleSendRolledBack);

        return () => {
            console.log('[useCocoEvents] Unsubscribing from coco events');
            cocoService.off('mint-quote:redeemed', handleMintQuoteRedeemed);
            cocoService.off('receive:created', handleReceiveCreated);
            cocoService.off('send:prepared', handleSendPrepared);
            cocoService.off('send:pending', handleSendPending);
            cocoService.off('send:finalized', handleSendFinalized);
            cocoService.off('send:rolled-back', handleSendRolledBack);
        };
    }, [
        handleMintQuoteRedeemed,
        handleReceiveCreated,
        handleSendPrepared,
        handleSendPending,
        handleSendFinalized,
        handleSendRolledBack,
    ]);
}
