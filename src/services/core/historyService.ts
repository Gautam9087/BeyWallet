/**
 * History service — paginated transaction history.
 *
 * Uses Manager.history (HistoryApi).
 */

import { initService } from './initService';
import type { HistoryEntry } from 'coco-cashu-core';

export const historyService = {
    /**
     * Get paginated transaction history entries.
     *
     * @param limit - Number of entries to return (default: 25)
     * @param offset - Pagination offset (default: 0)
     * @returns Array of HistoryEntry (MintHistoryEntry | MeltHistoryEntry | SendHistoryEntry | ReceiveHistoryEntry)
     */
    getHistory: async (limit = 25, offset = 0): Promise<HistoryEntry[]> => {
        return initService.getManager().history.getPaginatedHistory(offset, limit);
    },
};
