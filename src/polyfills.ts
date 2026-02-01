import * as Crypto from 'expo-crypto';
import 'text-encoding';
import { Buffer } from 'buffer';

console.log('[Polyfills] Starting polyfill installation using expo-crypto');

// 1. Patch Buffer
if (typeof global.Buffer === 'undefined') {
    global.Buffer = Buffer;
    console.log('[Polyfills] Patched global.Buffer');
}

// 2. Patch Crypto
// We purposefully obscure the check to avoid confusion. We just overwrite it or extend it.
const existingCrypto = global.crypto || {};

// Create a robust crypto object backed by expo-crypto
const cryptoShim = {
    ...existingCrypto,
    getRandomValues: (array: TypedArray) => {
        // console.log('[Polyfills] crypto.getRandomValues called with length:', array.length);
        return Crypto.getRandomValues(array);
    },
    randomUUID: () => Crypto.randomUUID(),
};

// @ts-ignore
global.crypto = cryptoShim;

// Patch other namespaces
// @ts-ignore
if (typeof window !== 'undefined') window.crypto = cryptoShim;
// @ts-ignore
if (typeof self !== 'undefined') self.crypto = cryptoShim;

console.log('[Polyfills] Patched global.crypto with expo-crypto');
console.log('[Polyfills] Test getRandomValues:', global.crypto.getRandomValues(new Uint8Array(2)));

type TypedArray =
    | Int8Array
    | Uint8Array
    | Int16Array
    | Uint16Array
    | Int32Array
    | Uint32Array
    | Uint8ClampedArray
    | Float32Array
    | Float64Array;
