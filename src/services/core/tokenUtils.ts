/**
 * Token utilities — pure functions, no Manager dependency.
 * Handles token cleaning, encoding, decoding, and peanut format.
 */

import { getDecodedToken, getEncodedToken } from 'coco-cashu-core';
import { getEncodedTokenV4 } from '@cashu/cashu-ts';
import type { DecodedTokenPreview } from './types';

// ─── Token Cleaning ───────────────────────────────────────────

/**
 * Extract hidden Cashu tokens from "Peanut" format (Variation Selectors).
 */
export function extractPeanut(text: string): string | null {
    try {
        const decoded: string[] = [];
        const chars = Array.from(text);
        if (!chars.length) return null;

        for (const char of chars) {
            const codePoint = char.codePointAt(0);
            if (!codePoint) {
                if (decoded.length > 0) break;
                continue;
            }

            let byteValue: string | null = null;

            // Variation Selectors (VS1-VS16): U+FE00 to U+FE0F
            if (codePoint >= 0xfe00 && codePoint <= 0xfe0f) {
                byteValue = String.fromCharCode(codePoint - 0xfe00);
            }
            // Variation Selectors Supplement (VS17-VS256): U+E0100 to U+E01EF
            else if (codePoint >= 0xe0100 && codePoint <= 0xe01ef) {
                byteValue = String.fromCharCode(codePoint - 0xe0100 + 16);
            }

            if (byteValue === null && decoded.length > 0) {
                break;
            } else if (byteValue === null) {
                continue;
            }
            decoded.push(byteValue);
        }

        const result = decoded.join('');
        return result.length > 0 ? result : null;
    } catch {
        return null;
    }
}

/**
 * Clean a token string: remove prefixes, whitespace, extract peanut data,
 * and match standard cashu/creq patterns.
 */
export function cleanToken(tokenString: any): string {
    if (!tokenString) return '';

    let clean = '';

    // Handle potential array of numbers or Buffer
    if (Array.isArray(tokenString)) {
        clean = String.fromCharCode(...tokenString).trim();
    } else if (typeof tokenString !== 'string') {
        try {
            clean = tokenString.toString().trim();
            if (clean.startsWith('[object')) return '';
        } catch {
            return '';
        }
    } else {
        clean = tokenString.trim();
    }

    // 1. Try to extract Peanut data (variation selectors)
    const peanut = extractPeanut(clean);
    if (peanut) {
        clean = peanut;
    }

    // 2. Remove common prefixes
    const lowerClean = clean.toLowerCase();
    if (lowerClean.startsWith('cashu:')) {
        clean = clean.substring(6);
    } else if (lowerClean.startsWith('lightning:')) {
        clean = clean.substring(10);
    } else if (lowerClean.startsWith('creq:')) {
        clean = clean.substring(5);
    }

    // 3. Match standard cashu/creq token patterns
    const cashuMatch = clean.match(/(cashu|creq)[A-Za-z0-9+/=_-]+/);
    if (cashuMatch) {
        return cashuMatch[0];
    }

    return clean;
}

// ─── Token Encoding ───────────────────────────────────────────

/**
 * Encode a token object as V4 (CBOR), falling back to V3.
 */
export function encodeTokenV4(token: any): string {
    try {
        return getEncodedTokenV4(token);
    } catch {
        return getEncodedToken(token);
    }
}

/**
 * Encode a token object as V3 (JSON).
 */
export function encodeTokenV3(token: any): string {
    return getEncodedToken(token);
}

/**
 * Encode a token (defaults to V4).
 */
export function encodeToken(token: any): string {
    return encodeTokenV4(token);
}

/**
 * Encode a token string into "Peanut" format (Variation Selectors).
 */
export function encodePeanut(tokenStr: string): string {
    return (
        '🥜' +
        Array.from(tokenStr)
            .map((char) => {
                const byteValue = char.charCodeAt(0);
                if (byteValue >= 0 && byteValue <= 15) {
                    return String.fromCodePoint(0xfe00 + byteValue);
                }
                if (byteValue >= 16 && byteValue <= 255) {
                    return String.fromCodePoint(0xe0100 + (byteValue - 16));
                }
                return '';
            })
            .join('')
    );
}

// ─── Token Decoding ───────────────────────────────────────────

/**
 * Decode a token string to preview its contents.
 * Handles V3, V4, and provides helpful error messages for non-cashu formats.
 */
export function decodeToken(tokenString: string): DecodedTokenPreview {
    const cleaned = cleanToken(tokenString);

    try {
        const decoded = getDecodedToken(cleaned);
        const totalAmount = decoded.proofs.reduce((acc: number, p: any) => acc + p.amount, 0);

        return {
            mint: decoded.mint,
            amount: totalAmount,
            unit: decoded.unit || 'sat',
            proofs: decoded.proofs,
            memo: decoded.memo,
            raw: decoded,
        };
    } catch (err: any) {
        // Manual fallback for V3 tokens
        try {
            let base64Part = '';
            if (cleaned.startsWith('cashuA') || cleaned.startsWith('cashuB')) {
                base64Part = cleaned.substring(6);
            } else if (cleaned.startsWith('creqA') || cleaned.startsWith('creqB')) {
                base64Part = cleaned.substring(5);
            }

            if (base64Part) {
                const normalizedB64 = base64Part.replace(/-/g, '+').replace(/_/g, '/');
                const decodedStr = Buffer.from(normalizedB64, 'base64').toString('utf8');
                const json = JSON.parse(decodedStr);

                if (json.token && Array.isArray(json.token)) {
                    const first = json.token[0];
                    const proofs = first.proofs || [];
                    return {
                        mint: first.mint,
                        amount: proofs.reduce((acc: number, p: any) => acc + p.amount, 0),
                        unit: first.unit || 'sat',
                        proofs,
                        raw: json,
                    };
                }
            }
        } catch {
            // fallback also failed
        }

        // Provide helpful error messages for non-cashu formats
        if (cleaned.startsWith('creq')) {
            throw new Error('This is a Cashu Request (creq). Receiving creq tokens is not yet supported.');
        }

        const lower = cleaned.toLowerCase();
        if (lower.startsWith('lnbc') || lower.startsWith('lightning:lnbc')) {
            throw new Error('This looks like a Lightning Invoice. Please use the "Send" tab to pay invoices.');
        }
        if (lower.startsWith('lnurl')) {
            throw new Error('This looks like an LNURL. LNURL deposits are not yet supported.');
        }
        if (err.message?.includes('version')) {
            throw new Error('The scanned token version is not supported by this wallet.');
        }

        throw new Error('Invalid or unsupported cashu token format.');
    }
}
