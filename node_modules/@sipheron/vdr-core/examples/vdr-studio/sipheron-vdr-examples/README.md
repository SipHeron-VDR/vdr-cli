# 🦅 SipHeron VDR — Quickstart Examples

Welcome! These examples were automatically extracted into your project workspace when you ran `npm install @sipheron/vdr-core`. 

This folder contains heavily-typed, ready-to-use TypeScript examples that demonstrate how to easily anchor documents to the Solana blockchain, verify their authenticity, and build automated tools using the SipHeron VDR SDK.

## 🚀 Getting Started

If you want to run these examples locally right out of the box, make sure you have `ts-node` installed:

```bash
# Install local execution dependencies temporarily
npm install ts-node typescript @types/node dotenv chokidar --no-save
```

You can run any of the standalone scripts using `ts-node`.

```bash
# Example: Run the basic anchoring script
npx ts-node basic-anchor.ts
```

> **🔑 Note on API Keys:** The `devnet` network (Playground mode) allows you to anchor and verify files completely for **free without an API key**. For production use on `mainnet`, you can obtain your free API key at [app.sipheron.com](https://app.sipheron.com).

---

## 📂 Included Examples

| Example File | Description |
| ---- | ----------- |
| `basic-anchor.ts` | The foundational implementation of zero-knowledge anchoring. Demonstrates hashing a real file and anchoring it on-chain. |
| `basic-verify.ts` | Verifies a local file against the Solana blockchain, proving mathematically it has not been tampered with. |
| `verify-from-hash.ts` | Memory-efficient verification that operates on a pre-computed SHA-256 hash instead of reading a physical file. |
| `batch-anchor.ts` | High-throughput concurrent anchoring tool for establishing proof-of-existence for large datasets at once. |
| `webhook-listener.ts` | A scalable Express.js server that listens for asynchronous SipHeron webhook events and processes transaction receipts. |
| `independent-verify.ts` | A pure cryptographic demonstration proving you can verify SipHeron anchors without relying on our API at all, by directly querying the Solana blockchain. |
| **`watch-folder/`** | **🌟 (Recommended)** A complete, automated application. Drag and drop PDFs into a `watch-folder` to instantly auto-anchor them to Solana and generate timestamped receipt ledgers! |

---

## 📚 Need More Help?

Check out our official developer documentation at [docs.sipheron.com](https://docs.sipheron.com) for deep dives into zero-knowledge hashing, rate limits, and our custom Solana smart contracts.
