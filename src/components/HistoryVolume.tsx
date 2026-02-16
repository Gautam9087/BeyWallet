import React, { useMemo } from 'react';
import { Text, XStack, Theme } from 'tamagui';
import { useQuery } from '@tanstack/react-query';
import { initService, historyService } from '../services/core';
import { Sprout } from '@tamagui/lucide-icons';

export default function HistoryVolume() {
    const { data: volHistory = [] } = useQuery({
        queryKey: ['history-volume'],
        queryFn: async () => {
            if (!initService.isInitialized()) return [];
            // Fetch a larger sample for volume calculation
            return historyService.getHistory(1000, 0);
        },
        enabled: initService.isInitialized(),
        refetchInterval: 5000, // Refresh occasionally
    });

    const volume = useMemo(() => {
        return volHistory.reduce((acc, entry) => {
            // Include all types (mint, melt, send, receive) in the total volume
            return acc + (entry.amount || 0);
        }, 0);
    }, [volHistory]);

    const formatVolume = (val: number) => {
        if (val >= 1000000000) return (val / 1000000000).toFixed(2) + 'B';
        if (val >= 1000000) return (val / 1000000).toFixed(2) + 'M';
        if (val >= 1000) return (val / 1000).toFixed(2) + 'k';
        return val.toString();
    };

    if (volume === 0) return null;

    return (
        <XStack
            items="center"
            gap="$2"
            justify="flex-end"
            pressStyle={{ opacity: 0.8 }}
        >

            <Text fontSize="$3" fontWeight="800" color="$color5">
                Vol
            </Text>
            <Text fontSize="$6" fontWeight="800" color="$color10">
                {formatVolume(volume)}
            </Text>
        </XStack>
    );
}
