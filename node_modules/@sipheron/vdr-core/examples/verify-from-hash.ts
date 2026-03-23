/**
 * Verify From Hash Example
 *
 * Verifies using a pre-computed SHA-256 hash
 * instead of providing the document itself.
 *
 * Use this when you have the hash but not the original file,
 * or when you want to check if a hash is anchored before
 * performing a more expensive operation.
 *
 * Run: npx ts-node examples/verify-from-hash.ts
 */

import { readFileSync, existsSync } from 'fs'
import { SipHeron, hashDocument } from '../src'

async function main() {
  const sipheron = new SipHeron({
    apiKey: process.env.SIPHERON_API_KEY!,
    network: 'devnet',
  })

  // Option 1: Use a known hash directly
  const knownHash = existsSync('/tmp/contract.hash')
    ? readFileSync('/tmp/contract.hash', 'utf-8').trim()
    : 'a3f4b2c1d8e9f0a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5'

  console.log('Verifying hash:', knownHash.slice(0, 16) + '...\n')

  const result = await sipheron.verifyHash(knownHash)

  console.log('Authentic:', result.authentic)
  console.log('Status:   ', result.status)
  console.log('Hash:     ', result.hash)

  if (result.anchor) {
    console.log('\nAnchor Details:')
    console.log('  Document: ', result.anchor.name)
    console.log('  Anchored: ', result.anchor.timestamp)
    console.log('  Block:    ', result.anchor.blockNumber)
    console.log('  Explorer: ', result.anchor.explorerUrl)
  }

  // Option 2: Hash a file yourself and use verifyHash
  console.log('\n--- Computing hash locally then verifying ---')
  if (existsSync('/tmp/contract.txt')) {
    const file = readFileSync('/tmp/contract.txt')
    const localHash = await hashDocument(file)
    console.log('Local hash:', localHash.slice(0, 16) + '...')
    console.log('Hashes match:', localHash === result.hash)
  }
}

main().catch(console.error)
