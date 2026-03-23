/**
 * Basic Anchor Example
 *
 * Anchors a document to the Solana blockchain.
 * The file is hashed locally — it never leaves your machine.
 *
 * Run: npx ts-node examples/basic-anchor.ts
 */

import { readFileSync, writeFileSync } from 'fs'
import { SipHeron } from '../src'

async function main() {
  const sipheron = new SipHeron({
    apiKey: process.env.SIPHERON_API_KEY!,
    network: 'devnet',
  })

  // Load any file — PDF, DOCX, image, etc.
  // For this example we create a simple text file
  const content = `Service Agreement

This agreement is made on ${new Date().toISOString()}.

Party A: Acme Corporation
Party B: Beta LLC

Terms: [Agreement terms here]
`
  writeFileSync('/tmp/contract.txt', content)
  const file = readFileSync('/tmp/contract.txt')

  console.log('Anchoring document to Solana...')
  console.log('File size:', file.length, 'bytes')
  console.log('Note: The file is hashed locally. Only the hash is sent to the API.\n')

  const anchor = await sipheron.anchor({
    file,
    name: 'Service Agreement — Acme Corp / Beta LLC',
  })

  console.log('✓ Document anchored successfully!\n')
  console.log('Anchor ID:       ', anchor.id)
  console.log('SHA-256 Hash:    ', anchor.hash)
  console.log('Transaction:     ', anchor.transactionSignature)
  console.log('Block Number:    ', anchor.blockNumber)
  console.log('Timestamp:       ', anchor.timestamp)
  console.log('Status:          ', anchor.status)
  console.log('Network:         ', anchor.network)
  console.log('')
  console.log('Verification URL:')
  console.log(anchor.verificationUrl)
  console.log('')
  console.log('Solana Explorer:')
  console.log(anchor.explorerUrl)

  // Save the hash for later verification
  writeFileSync('/tmp/contract.hash', anchor.hash)
  console.log('\nHash saved to /tmp/contract.hash for verification example.')
}

main().catch(console.error)
