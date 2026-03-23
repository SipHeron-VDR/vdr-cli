/**
 * Batch Anchor Example
 *
 * Anchors multiple documents in a single batch operation.
 * Useful for anchoring many documents — each is hashed locally
 * and sent to the API individually with retry logic.
 *
 * Run: npx ts-node examples/batch-anchor.ts
 */

import { SipHeron } from '../src'

async function main() {
  const sipheron = new SipHeron({
    apiKey: process.env.SIPHERON_API_KEY!,
    network: 'devnet',
  })

  // Create test documents in memory
  const documents = [
    {
      file: Buffer.from('Invoice #001 — Amount: $5,000 — Date: 2026-03-16'),
      name: 'Invoice #001',
    },
    {
      file: Buffer.from('Contract v1 — Parties: Alpha Corp, Beta LLC'),
      name: 'Contract v1',
    },
    {
      file: Buffer.from('NDA — Effective: 2026-01-01 — Duration: 2 years'),
      name: 'Non-Disclosure Agreement',
    },
  ]

  console.log(`Anchoring ${documents.length} documents...\n`)

  const batchResult = await sipheron.anchorBatch({
    documents,
    stopOnError: false, // continue even if one fails
  })

  console.log('Batch complete:')
  console.log(`  Total:      ${batchResult.total}`)
  console.log(`  Successful: ${batchResult.successful}`)
  console.log(`  Failed:     ${batchResult.failed}`)
  console.log('')

  batchResult.results.forEach((result, i) => {
    if ('error' in result) {
      console.log(`  [${i + 1}] ✗ FAILED: ${result.error}`)
    } else {
      console.log(`  [${i + 1}] ✓ ${result.name || 'Document'} — ${result.hash.slice(0, 16)}...`)
      console.log(`       ${result.verificationUrl}`)
    }
  })
}

main().catch(console.error)
