<p align="center">
  <img src="https://raw.githubusercontent.com/SipHeron-VDR/vdr-core/master/sipheron_vdap_logo.png" alt="SipHeron VDR Logo" width="350" />
</p>

# SipHeron VDR Core

[![NPM Version](https://img.shields.io/npm/v/@sipheron/vdr-core?color=blue&style=flat-square)](https://www.npmjs.com/package/@sipheron/vdr-core)
[![License](https://img.shields.io/npm/l/@sipheron/vdr-core?style=flat-square)](https://github.com/SipHeron-VDR/vdr-core/blob/master/LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-Ready-blue?style=flat-square)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-%3E%3D18.0.0-green?style=flat-square)](https://nodejs.org/)

**The Cryptographic Engine of SipHeron VDR.**

SipHeron VDR is a completely decentralized protocol for permanently notarizing documents to the Solana blockchain. `@sipheron/vdr-core` is the independent, foundational SDK that allows developers to interact with the SipHeron smart contract on Solana — either fully independently (no API key required) or via the managed SipHeron SaaS platform.

***

## What is SipHeron VDR Core?

SipHeron is built on the philosophy of **true, autonomous cryptographic independence**. Any sophisticated buyer or external auditor can view the open-source implementation in `vdr-core` and verify our zero-knowledge architecture.

- **Privacy First (Local Hashing)**: Documents are hashed client-side (in-browser or Node.js). The raw file bytes *never* leave your machine.
- **Dual Architecture**: Choose between `DIRECT` (talk directly to Solana RPC nodes using your own wallet) or `HOSTED` (use the SipHeron API for convenience, dashboards, and advanced features).
- **Streaming Hashes**: Built-in support for hashing massive files in chunks without blowing up your RAM.
- **Soft Revocation Registry**: Mark documents as officially superseded or revoked without deleting the immutable blockchain record.
- **Webhook Verification**: Cryptographically verify HMAC signatures for backend infrastructure hooks.

---

## Installation

Install `@sipheron/vdr-core` via npm:

```bash
npm install @sipheron/vdr-core
```

If you plan on utilizing the **Direct On-Chain** functions and talking to the blockchain directly, you will also need to install `@solana/web3.js` as a peer dependency:

```bash
npm install @solana/web3.js
```

---

## Quick Tour

The library is designed to be extremely intuitive whether you're using our hosted APIs or opting for the direct integration.

### Method 1: Hosted Platform (SipHeron Client)
For developers integrating the SaaS workflow (generating PDF Certificates, maintaining managed analytics dashboards, fetching compliance logs). *Requires a SipHeron API Key (except on devnet placeholder routes).*

```typescript
import { SipHeron } from '@sipheron/vdr-core'
import { readFileSync } from 'fs'

// 1. Initialize client
const sipheron = new SipHeron({
  apiKey: process.env.SIPHERON_API_KEY,  // Required for mainnet
  network: 'mainnet'                     // or 'devnet'
})

const documentBuffer = readFileSync('./legal-contract.pdf')

// 2. Anchor a document 
// The SDK hashes the file LOCALLY, then transmits only the 64-char hash.
const record = await sipheron.anchor({
  file: documentBuffer, 
  name: 'Employment Verification' 
})
console.log('Document anchored at:', record.timestamp)
console.log('Certificate URL:', record.verificationUrl)

// 3. Verify a document's authenticity
const verification = await sipheron.verify({ file: documentBuffer })

if (verification.authentic) {
  console.log('Valid! Anchored at:', verification.verifiedAt)
} else if (verification.status === 'revoked') {
  console.warn('Document is perfectly intact, but has been SUPERSEDED!')
  console.warn('Reason:', verification.revocation?.reason)
} else {
  console.error('TAMPERED OR UNKNOWN DOCUMENT')
}

// 4. Record Soft Revocation (Compliance)
// Mark an anchor as superseded without destroying the cryptographic truth.
await sipheron.anchors.revoke(record.id, {
  reason: 'superseded',
  note: 'Replaced by NextGen Amendment V2',
  supersededByAnchorId: 'anc_NEW_ID_HERE'
})
```

### Method 2: Direct, On-Chain Usage (Open Source)
No API keys, no monthly fees (beyond Solana gas), no dashboard. You authorize transactions with your own wallet directly against the smart contract.

**A. Generate local fingerprints:**
```typescript
import { hashDocument } from '@sipheron/vdr-core'

// Everything is hashed locally.
const documentHash = await hashDocument(fileBuffer, { algorithm: 'sha256' })
```

**B. Write directly to Solana:**
```typescript
import { anchorToSolana } from '@sipheron/vdr-core'
import { Keypair } from '@solana/web3.js'

const issuerKeypair = Keypair.fromSecretKey(...) // Load your local wallet

const result = await anchorToSolana({
  hash: documentHash,
  keypair: issuerKeypair,
  network: 'mainnet',
  metadata: 'My Private Contract v1.2' 
})

console.log('Record PDA Address:', result.pda)
console.log('Solana Transaction:', result.explorerUrl)
```

**C. Direct On-Chain Verification:**
Look up your anchor explicitly parsing the Program Data Accounts from an RPC node.
```typescript
import { verifyOnChain } from '@sipheron/vdr-core'

const check = await verifyOnChain({
  hash: documentHash,
  network: 'mainnet',
  ownerPublicKey: issuerKeypair.publicKey
})

console.log('Authentic:', check.authentic) // true if hash matches and not revoked
```

---

## Handling Large Files (Streaming)

Sometimes documents are too large (like 5GB uncompressed datasets) to buffer into RAM safely. VDR Core exposes streaming APIs:

```typescript
import { hashFileStream } from '@sipheron/vdr-core'
import { createReadStream } from 'fs'

const stream = createReadStream('/path/to/massive-video-file.mp4')

const hash = await hashFileStream(stream, {
  onProgress: (bytesRead) => {
    console.log(`Hashed ${bytesRead} bytes...`)
  }
})

console.log('Final fingerprint:', hash)
```

---

## Error Handling

VDR Core exports structured, programmatic error classes so you can handle failures predictably in production workflows:

```typescript
import { 
  ValidationError, 
  AuthenticationError, 
} from '@sipheron/vdr-core'

try {
  await sipheron.anchorBatch(...)
} catch (err) {
  if (err instanceof AuthenticationError) {
    console.error('Invalid or missing API key')
  } else if (err instanceof ValidationError) {
    console.error('Invalid input provided to the SDK')
  }
}
```

---

## Real-time Webhooks

If your backend is capturing Webhooks emitted from SipHeron's managed platform, always cryptographically guarantee they originated from SipHeron:

```typescript
import { parseWebhookEvent } from '@sipheron/vdr-core'

const event = parseWebhookEvent({
  body: rawRequestBody,
  signature: req.headers['x-sipheron-signature'],
  secret: process.env.SIPHERON_WEBHOOK_SECRET
})

console.log(event.type) // 'anchor.confirmed'
```

---

## Resources & Community

- 📚 **Documentation:** Check out our [Full API Reference](https://docs.sipheron.com).
- 🐛 **Issue Tracker:** Found a bug? Open an issue on our [GitHub Repo](https://github.com/SipHeron-VDR/vdr-core/issues).
- 💬 **Discord:** Join the [community discussion](https://discord.gg/sipheron).

### Security

Open Source SDK licensed under **Apache-2.0**. To report a security vulnerability or timing attack related bug within Hashing/Webhook signatures, please coordinate via `security@sipheron.com` before posting publicly.
