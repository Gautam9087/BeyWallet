

# CASHU FIXES INSTRUCTIONS – Units + Deterministic Backup/Restore  
**For React Native Expo + Tamagui + Coco Cashu wallet**  
**Goal**: Fix "unit problems" on `testnut.cashu.space` and make deterministic (12-word mnemonic) backup + restore 100% working using NUT-13.

**Important Rules for the AI**:
- Never hardcode the seed/mnemonic anywhere except SecureStore.
- Always use `unit: 'sat'` on every mint operation (this is why testnut fails and nofee works).
- Use Expo SQLite adapter for persistence (counters for NUT-13).
- Keep existing Tamagui UI untouched except for new/updated backup & restore screens.
- All changes must work on testnet only (`https://testnut.cashu.space` and `https://nofee.testnut.cashu.space`).
- After changes, add console.log for debugging.

### Step 1: Install missing dependencies (run once)
```bash
yarn add bip39
# or npm install bip39
```

### Step 2: Create / update central Coco init file
Create or replace the file where you initialize Coco (probably `src/cashu/coco.ts` or `src/lib/coco.ts` or similar). Replace entire content with this:

```ts
import { initializeCoco } from 'coco-cashu-core';
import { ExpoSqliteRepositories } from 'coco-cashu-expo-sqlite';
import * as SecureStore from 'expo-secure-store';
import * as bip39 from 'bip39';

export let coco: any = null; // global instance for the app

// Seed getter (never stores seed itself – only mnemonic in SecureStore)
export const getSeedGetter = async (providedMnemonic?: string) => {
  return async (): Promise<Uint8Array> => {
    let mnemonic = providedMnemonic;
    if (!mnemonic) {
      mnemonic = await SecureStore.getItemAsync('wallet_mnemonic');
    }
    if (!mnemonic || !bip39.validateMnemonic(mnemonic)) {
      throw new Error('Invalid or missing 12-word mnemonic');
    }
    return new Uint8Array(bip39.mnemonicToSeedSync(mnemonic));
  };
};

// Main init – call this ONCE on app start
export const initCoco = async (isRestore = false) => {
  const dbName = isRestore ? 'cashu_wallet_restore' : 'cashu_wallet_v1';
  
  const repo = new ExpoSqliteRepositories({ dbName });

  coco = await initializeCoco({
    repo,
    seedGetter: await getSeedGetter(), // loads from SecureStore
  });

  // Trust the test mints (do this once)
  await coco.mint.addMint('https://testnut.cashu.space', { trusted: true });
  await coco.mint.addMint('https://nofee.testnut.cashu.space', { trusted: true });

  console.log('✅ Coco initialized with unit-safe setup');
  return coco;
};
```

### Step 3: Fix ALL unit problems (search & replace)
Search the entire codebase for these patterns and **add `unit: 'sat'`** to every quote/mint operation:

Examples (add exactly like this):

```ts
// Before (wrong)
const quote = await coco.wallet.createMintQuote({ amount: 1000, mintUrl: '...' });

// After (correct)
const quote = await coco.wallet.createMintQuote({
  amount: 1000,
  unit: 'sat',           // ← REQUIRED for testnut.cashu.space
  mintUrl: '...',
});
```

Do the same for:
- `createMeltQuote`
- `createSwapQuote`
- any `mint`, `melt`, `swap`, `receive` calls that accept options

If you see `new Wallet(...)` from old cashu-ts, remove it – use only Coco.

### Step 4: Backup screen (new or update existing)
Create a clean backup screen (you’re good at Tamagui, so just make sure it shows the mnemonic once).

Key logic (add to your backup component):

```ts
const showBackup = async () => {
  let mnemonic = await SecureStore.getItemAsync('wallet_mnemonic');
  
  if (!mnemonic) {
    mnemonic = bip39.generateMnemonic(128); // 12 words
    await SecureStore.setItemAsync('wallet_mnemonic', mnemonic);
    await initCoco(); // re-init with new seed
  }
  
  // Display mnemonic in Tamagui (big text, copy button, "I backed it up" checkbox)
  // On confirm → mark as backed up in SecureStore
};
```

### Step 5: Restore flow (new screen or modal)
Create restore screen:

```ts
const handleRestore = async (entered12Words: string) => {
  if (!bip39.validateMnemonic(entered12Words)) {
    alert('Invalid mnemonic');
    return;
  }

  await SecureStore.setItemAsync('wallet_mnemonic', entered12Words);

  // Fresh DB for restore
  await initCoco(true); // isRestore = true

  // Trigger recovery (Coco auto-handles NUT-13 counters)
  // If coco has recover method, call it:
  // await coco.wallet.recover?.();

  // Or just add mints again and let getBalances / receive do the sweep
  console.log('✅ Wallet restored deterministically');
  
  // Navigate to main wallet screen
};
```

### Step 6: App startup logic
In your root `_layout.tsx` or `App.tsx` (Expo Router), call:

```ts
useEffect(() => {
  const start = async () => {
    const hasMnemonic = await SecureStore.getItemAsync('wallet_mnemonic');
    if (hasMnemonic) {
      await initCoco();
    } else {
      // Show onboarding → backup screen
    }
  };
  start();
}, []);
```

### Step 7: Final test flow (do this after AI finishes)
1. Delete app → reinstall (clears old DB)
2. First launch → should generate mnemonic + show backup screen
3. Back up the 12 words
4. Close app → uninstall → reinstall
5. Go to restore → type the 12 words → balance should restore automatically (sweep happens via NUT-13)
6. Test send/receive on **both** testnut mints → no unit error

If any error appears, copy the exact error and the file/line the AI changed.

