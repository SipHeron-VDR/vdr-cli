# SipHeron VDR Automated Sentinel (Watch Folder)

This is a standalone TypeScript example showing how to build an automated background daemon using `@sipheron/vdr-core`.

The daemon continuously monitors a local `watch-folder`. The moment you drag and drop a document (PDF, JPG, etc.) into the folder, the script instantly intercepts it, hashes it locally using zero-knowledge, and anchors the document to the Solana blockchain.

## Getting Started

**1. Install Dependencies**
```bash
npm install
```

**2. Start the Daemon**
```bash
npm start
```

## How It Works

1. You start the script. You will be prompted for your SipHeron API Key. If you just want to test it locally on the Devnet for free, just **press Enter** to use the Public Playground.
2. Three folders are dynamically created: `watch-folder`, `completed-anchors`, and `failed-anchors`.
3. Drag any file into `watch-folder`.
4. The daemon catches it, computes the cryptographic SHA-256 fingerprint, and sends it to the VDR layer.
5. Once permanently anchored to Solana, the file is automatically moved to `completed-anchors/`.
6. A receipt `.json` file containing the block explorer and verification URLs is cleanly outputted next to your file.
7. A master `anchored_hashes.json` ledger is automatically generated and updated with all historical metadata.
