# Security Policy

SipHeron VDR provides uncompromising compliance infrastructure relying on advanced Zero-Knowledge cryptographic systems. The security of this CLI architecture and our dependent underlying systems is our absolute highest priority.

## Zero Knowledge Commitment

By design, the SipHeron CLI strictly enforces **Zero-Knowledge** architectures:
- Any file passed via `sipheron anchor <file>` or `sipheron verify <file>` is purely hashed inside your CPU's local memory.
- The raw byte contents of your PDF/ZIP/Code files **are never transmitted** over the network, rendering your sensitive corporate documents impossible to exfiltrate via our API.
- All webhook event delivery mechanisms utilize HMAC signatures (SHA-256) ensuring they are securely authenticated against spoofing.

## Supported Versions

We only apply critical security patches to the current major version of the CLI. We highly recommend mapping automated pipelines to fetch the latest builds automatically.

| Version | Supported          |
| ------- | ------------------ |
| v0.1.x  | :white_check_mark: |
| < 0.1   | :x:                |

## Reporting a Vulnerability

If you discover any security vulnerabilities, cryptographic logic errors, or hash collision weaknesses within `@sipheron/vdr-core` or `@sipheron/vdr-cli`, please do **not** disclose it publicly on GitHub issues or forums.

Instead, please email us directly: **[security@sipheron.com](mailto:security@sipheron.com)**

We take all disclosures seriously and aim to:
1. Acknowledge your report within 24 hours.
2. Continually update you throughout the internal resolution process.
3. Credit your responsible disclosure in our release notes (unless you request anonymity).

## Secure Dependencies Policy

The `@sipheron/vdr-cli` dependency tree is aggressively stripped to mitigate supply chain tracking. We ensure:
- Only heavily vetted, large open source dependencies (`commander`, `@solana/web3.js`, `chalk`) are relied upon.
- Node.js native `crypto` API wrappers are utilized over fragmented third-party sub-packages where absolutely possible.
- `npm audit` pipelines automatically reject deployments introducing HIGH or CRITICAL severity vulnerabilities into the `main` ecosystem.
