/**
 * Independent Verification Example
 *
 * Demonstrates that SipHeron proofs can be verified completely
 * independently — without this library, without a SipHeron
 * account, and even if SipHeron ceased to exist.
 *
 * All you need:
 *   - A SHA-256 tool (built into every OS)
 *   - Any public Solana block explorer
 *
 * Run: npx ts-node examples/independent-verify.ts
 */

import { createHash } from 'crypto'
import { readFileSync, existsSync } from 'fs'

// The Solana transaction signature from your anchor receipt
const TRANSACTION_SIGNATURE = process.env.TX_SIGNATURE ||
  '3xK9mPqRabcdef1234567890abcdef1234567890abcdef1234567890abcdef12'

async function independentVerify(
  filePath: string,
  txSignature: string
): Promise<void> {
  console.log('=== Independent Verification (No SipHeron Required) ===\n')

  // ── Step 1: Hash the document yourself ──
  console.log('STEP 1: Compute SHA-256 hash of your document')
  console.log('─'.repeat(50))

  if (!existsSync(filePath)) {
    console.log(`Note: File ${filePath} not found. Using demo hash.\n`)
  } else {
    const file = readFileSync(filePath)
    const hash = createHash('sha256').update(file).digest('hex')
    console.log('File:', filePath)
    console.log('Size:', file.length, 'bytes')
    console.log('Hash:', hash)
    console.log('')
    console.log('You can verify this hash using standard OS tools:')
  }

  console.log('')
  console.log('Linux / macOS:')
  console.log(`  sha256sum ${filePath}`)
  console.log('')
  console.log('Windows PowerShell:')
  console.log(`  Get-FileHash ${filePath} -Algorithm SHA256`)
  console.log('')
  console.log('Node.js:')
  console.log(`  const {createHash} = require('crypto')`)
  console.log(`  createHash('sha256').update(require('fs').readFileSync('${filePath}')).digest('hex')`)

  // ── Step 2: Verify the hash on-chain ──
  console.log('')
  console.log('STEP 2: Verify the blockchain record')
  console.log('─'.repeat(50))
  console.log('')
  console.log('Look up the transaction on any public Solana explorer:')
  console.log('')
  console.log('Solana Explorer (official):')
  console.log(`  https://explorer.solana.com/tx/${txSignature}?cluster=devnet`)
  console.log('')
  console.log('Solscan:')
  console.log(`  https://solscan.io/tx/${txSignature}?cluster=devnet`)
  console.log('')
  console.log('SolanaFM:')
  console.log(`  https://solana.fm/tx/${txSignature}?cluster=devnet-solana`)

  // ── Step 3: Compare ──
  console.log('')
  console.log('STEP 3: Compare')
  console.log('─'.repeat(50))
  console.log('')
  console.log('In the transaction data, find the memo field.')
  console.log('The memo contains the SHA-256 hash that was anchored.')
  console.log('')
  console.log('If your computed hash MATCHES the memo:')
  console.log('  → AUTHENTIC — document has not been modified')
  console.log('')
  console.log('If your computed hash DIFFERS from the memo:')
  console.log('  → MISMATCH — document has been modified since anchoring')
  console.log('')
  console.log('Contract address on Solana:')
  console.log('  6ecWPUK87zxwZP2pARJ75wbpCka92mYSGP1szrJxzAwo')
  console.log('')
  console.log('This verification method works:')
  console.log('  ✓ Without the SipHeron library')
  console.log('  ✓ Without a SipHeron account')
  console.log('  ✓ Without internet access to SipHeron')
  console.log('  ✓ Even if SipHeron ceased to exist')
  console.log('  ✓ For as long as Solana exists')
}

independentVerify('/tmp/contract.txt', TRANSACTION_SIGNATURE)
  .catch(console.error)
