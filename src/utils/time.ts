import * as Localization from 'expo-localization';

/**
 * Formats a timestamp into a human-readable local time string.
 * @param timestamp - Unix timestamp in seconds
 * @returns Formatted date/time string
 */
export function formatLocalTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const now = new Date();

    // Check if it's today
    const isToday = date.getDate() === now.getDate() &&
        date.getMonth() === now.getMonth() &&
        date.getFullYear() === now.getFullYear();

    // Check if it's yesterday
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.getDate() === yesterday.getDate() &&
        date.getMonth() === yesterday.getMonth() &&
        date.getFullYear() === yesterday.getFullYear();

    const timeOptions: Intl.DateTimeFormatOptions = {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
    };

    const dateOptions: Intl.DateTimeFormatOptions = {
        month: 'short',
        day: 'numeric',
    };

    const timeStr = date.toLocaleTimeString(Localization.getLocales()[0].languageTag, timeOptions);

    if (isToday) {
        return `Today, ${timeStr}`;
    }

    if (isYesterday) {
        return `Yesterday, ${timeStr}`;
    }

    const dateStr = date.toLocaleDateString(Localization.getLocales()[0].languageTag, dateOptions);

    // If it's a different year, add the year
    if (date.getFullYear() !== now.getFullYear()) {
        return `${dateStr} ${date.getFullYear()}, ${timeStr}`;
    }

    return `${dateStr}, ${timeStr}`;
}

/**
 * Returns a full detailed local time string for the details page.
 */
export function formatFullLocalTime(timestamp: number): string {
    const date = new Date(timestamp * 1000);
    const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
    };
    return date.toLocaleDateString(Localization.getLocales()[0].languageTag, options);
}
