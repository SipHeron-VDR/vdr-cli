<div align="center">
  <img src="./sipheron_vdap_logo.png" alt="SipHeron Logo" width="300" />
  <h1>SipHeron VDR CLI</h1>
  <p><strong>The official zero-knowledge command-line interface for the SipHeron Virtual Data Room.</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@sipheron/vdr-cli"><img src="https://img.shields.io/npm/v/@sipheron/vdr-cli.svg?color=blue" alt="NPM Version" /></a>
    <a href="https://github.com/leaderofARS/vdr-cli/blob/main/LICENSE"><img src="https://img.shields.io/badge/License-Apache_2.0-blue.svg" alt="License" /></a>
    <a href="https://docs.sipheron.com"><img src="https://img.shields.io/badge/docs-sipheron.com-blueviolet" alt="Documentation" /></a>
  </p>
</div>

SipHeron VDR CLI is a developer-first toolchain for permanently anchoring document fingerprints to the Solana blockchain. It allows engineering teams and compliance officers to locally hash, digitally fingerprint, and establish tamper-proof verifiable histories directly from their trusted terminal.

Crucially, **your files never leave your machine**. The CLI securely hashes documents locally and only interacts with the blockchain or SipHeron APIs using cryptographic signatures (SHA-256, SHA-512, etc.).

## 🚀 Key Features

- **Zero-Knowledge Hashing:** All file digests (e.g., PDFs, ZIPs, Source Code) are computed entirely locally.
- **Direct On-Chain Anchoring:** Optionally bypass all SaaS APIs and commit hashes directly to the Solana blockchain using your own wallet.
- **Massive Concurrency:** Anchor up to 500 documents per batch concurrently using the optimized background processor.
- **Version Chains:** Graphically traverse the linked lineage of document amendments over time directly in the terminal.
- **Algorithmic Flexibility:** Out-of-the-box support for `SHA-256`, `SHA-512`, `MD5`, and `BLAKE3`.

## 📦 Installation

Install the CLI globally to access the `sipheron` command from anywhere:

```bash
npm install -g @sipheron/vdr-cli
# or
yarn global add @sipheron/vdr-cli
# or
pnpm add -g @sipheron/vdr-cli
```

## ⚡ Quick Start

### 1. Authentication
To use the sponsored transaction layers, authenticate the CLI with your SipHeron Organization:
```bash
sipheron login
```
*Alternatively, you can export your API key: `export SIPHERON_API_KEY="your_api_key"`*

### 2. Anchor a Document
Anchor a single document to the blockchain:
```bash
sipheron anchor ./contracts/q4-agreement.pdf --name "Q4 Deal"
```

### 3. Verify a Document
Validate an existing document locally against its immutable history:
```bash
sipheron verify ./contracts/q4-agreement.pdf
```

## 📚 Advanced Usage

### Batch Anchoring
Need to register hundreds of files at once? Use the batch command to process an entire directory simultaneously:
```bash
sipheron anchor:batch ./legal-archives --concurrency 10
```

### Tracing a Version Chain
Track the evolutionary history of a document through its amendments:
```bash
sipheron chain anc_9xN4kLpM
```
*Expected Output:*
```text
# Version Chain for: Service Agreement
#
# v1  anc_3xK9mPqR  2026-01-14  Confirmed ✓  (original)
# v2  anc_7yL3nRsT  2026-02-01  Confirmed ✓  Updated payment terms
# v3  anc_9xN4kLpM  2026-03-10  Confirmed ✓  Renewal clause added
#     (current)
```

### Changing Environments
Toggle between development and production environments effortlessly:
```bash
# Verify against Devnet
sipheron verify ./file.txt --network devnet

# Anchor to Mainnet
sipheron anchor ./file.txt --network mainnet
```

### Direct Blockchain Interactions
You can utilize your own local Solana keypair to fund network fees and avoid the SipHeron API routing entirely.
```bash
sipheron anchor ./file.txt --keypair ~/.config/solana/id.json --network mainnet
```

## ⚙️ CI/CD Integration

The SipHeron CLI is strongly suited for automated build and compliance pipelines (GitHub Actions, GitLab CI, etc.). For headless environments, ensure you provide the `--format json` or `--format quiet` flags to ease programmatic log passing, and authenticate securely using `env` variables.

## 🤝 Contributing & Security

We greatly welcome community engagement. Please read our carefully laid out guidelines before submitting pull requests:
- [Contributing Guidelines](./CONTRIBUTING.md)
- [Security Policy](./SECURITY.md)
- [Code of Conduct](./CODE_OF_CONDUCT.md)

## 📄 License
This project is licensed under the Apache License 2.0 - see the [LICENSE](LICENSE) file for details.
