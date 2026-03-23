/**
 * Basic Verify Example
 *
 * Verifies a document against its blockchain anchor.
 * Hashing happens locally — the document never leaves your machine.
 *
 * Run: npx ts-node examples/basic-verify.ts
 */

import { readFileSync } from 'fs'
import { SipHeron } from '../src'

async function main() {
  const sipheron = new SipHeron({
    apiKey: process.env.SIPHERON_API_KEY!,
    network: 'devnet',
  })

  const file = readFileSync('/tmp/contract.txt')

  console.log('Verifying document...')
  console.log('File size:', file.length, 'bytes')
  console.log('The document is hashed locally before any API call.\n')

  const result = await sipheron.verify({ file })

  if (result.authentic) {
    console.log('╔══════════════════════════════════╗')
    console.log('║  ✓  AUTHENTIC                    ║')
    console.log('╚══════════════════════════════════╝')
    console.log('\nThis document is identical to its anchored version.')
    console.log('It has not been modified since anchoring.\n')
    console.log('Anchored at:  ', result.anchor?.timestamp)
    console.log('Block number: ', result.anchor?.blockNumber)
    console.log('Transaction:  ', result.anchor?.transactionSignature)
    console.log('Verified at:  ', result.verifiedAt)
  } else {
    console.log('╔══════════════════════════════════╗')
    console.log('║  ✗  MISMATCH                     ║')
    console.log('╚══════════════════════════════════╝')
    console.log('\nThis document does NOT match its anchored version.')
    console.log('The document may have been modified after anchoring.')
    console.log('\nStatus:', result.status)
  }
}

main().catch(console.error)
