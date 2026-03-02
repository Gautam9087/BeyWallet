# Bey Wallet ⚡️

> Modular, Local-First Cashu & Nostr Wallet.

Bey Wallet is a high-performance, privacy-centric ecash wallet built on the **Cashu** protocol with deep **Nostr** identity integration. It focuses on speed, security, and a premium user experience.

---

## ✨ Features

### 💰 Cashu (Ecash)
- [x] **V3 & V4 Support**: Full support for the latest Cashu token standards.
- [x] **Multi-Mint Management**: Add, trust, and manage multiple mints simultaneously.
- [x] **Deterministic Restoration**: NIP-06 compatible backup and recovery. Restore all proofs across all mints using just your 12-word seed.
- [x] **Parallel Recovery**: Optimized startup and restoration that checks historical keysets in parallel for maximum speed.
- [x] **Transaction History**: Comprehensive audit trail with real-time status tracking and double-confirmation for claimed tokens.

### 🆔 Nostr Identity
- [x] **Native Keys**: Automatic generation of `npub`/`nsec` from your wallet seed.
- [x] **Profile Screen**: Display your Nostr identity with custom-styled QR codes (`npubQR`).
- [x] **P2PK Support**: Send ecash locked to a receiver's Nostr public key for enhanced security.
- [x] **Nostr Plug-in (NPC)**: Integrated background synchronization via `NPX` protocol.

### 🛡️ Security & Privacy
- [x] **Local-First Architecture**: All data (mints, proofs, history, keys) is stored locally using a high-performance SQLite engine.
- [x] **Biometric Protection**: Secure your funds with Face ID, Touch ID, or device passcode.
- [x] **Secure Storage**: Seed phrases and private keys never leave the device's secure enclave.

### 🚀 UX & Performance
- [x] **Smart Scanner**: Intelligent QR/UR scanner that detects Cashu tokens, P2PK keys, and animated UR-encoded sequences.
- [x] **Integrated Paste**: One-tap token entry directly from the scanner UI.
- [x] **Optimized Onboarding**: Professional first-run experience with "Finalizing Setup" indicators and negligible startup delays.
- [x] **Modern UI**: Built with Tamagui for a fluid, themeable, and responsive interface.

---

## 🛠️ Tech Stack
- **Framework**: Expo / React Native
- **UI Engine**: Tamagui (Inter Font, Lucide Icons)
- **State Management**: Zustand
- **Database**: Expo SQLite (Local-first)
- **Cashu Core**: `coco-cashu-core`, `coco-cashu-react`
- **Nostr**: `nostr-tools`, `coco-cashu-plugin-npc`

---
```markdown
## 🚧 Roadmap (In Development)

- [ ] **Deterministic Restoration**: Seed-based recovery and historical keyset scanning.
- [ ] **Lightning Integration**: Direct Lightning address and LNURL-Pay/Withdraw support.
- [ ] **Mint Swaps**: One-tap swapping of ecash between different mints or units.
- [ ] **Advanced Contacts**: NIP-02/NIP-05 integrated address book.
- [ ] **Nostr Wallet Connect (NWC)**: Use Bey Wallet to pay from other Nostr clients.
- [ ] **Offline Payments**: Native NFC support for in-person ecash transfers.

---
```

## 🏗️ Development

### Prerequisites
- [Yarn](https://yarnpkg.com/)
- [Expo CLI](https://docs.expo.dev/get-started/installation/)

### Installation
1. Clone the repository
2. Install dependencies:
   ```yarn
   yarn add
   ```
3. Start the development server:
   ```yarn
   yarn start
   ```

---

## ⚖️ License
MIT © Bey Wallet
