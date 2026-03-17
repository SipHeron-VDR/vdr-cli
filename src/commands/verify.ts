import { Command } from 'commander'
import { SipHeron } from '@sipheron/vdr-core'
import { readFileAsBuffer, isValidHash } from '../utils/file'
import { createSpinner } from '../utils/spinner'
import { handleError } from '../utils/errors'
import { human } from '../output/human'
import { json } from '../output/json'
import { quiet } from '../output/quiet'
import { config } from '../config'
import { Connection } from '@solana/web3.js'

export const verifyCommand = new Command('verify')
  .description('Verify a document\'s authenticity against its blockchain anchor')
  .argument('<file-or-hash>', 'Document file path or SHA-256 hash')
  .option('-f, --format <format>', 'Output format: human, json, quiet', 'human')
  .option('-n, --network <network>', 'Network: devnet, mainnet', 'devnet')
  .action(async (fileOrHash: string, options) => {
    const format = options.format
    const network = options.network as 'devnet' | 'mainnet'

    const spinner = createSpinner('Verifying document...')

    try {
      const client = new SipHeron({
        apiKey: config.getApiKey(),
        network
      })

      let result

      if (isValidHash(fileOrHash)) {
        // Input is a hash directly
        if (format === 'human') spinner.start()
        result = await client.verify({ hash: fileOrHash })
      } else {
        // Input is a file path
        const file = readFileAsBuffer(fileOrHash)
        if (format === 'human') spinner.start()
        result = await client.verify({ file })
      }

      // If we have txSignature but block/timestamp is missing, fetch from rpc
      if (result.authentic && result.anchor?.transactionSignature && (!result.anchor.blockNumber || !result.anchor.timestamp)) {
        try {
          const rpc = network === 'mainnet' 
            ? 'https://api.mainnet-beta.solana.com' 
            : 'https://api.devnet.solana.com'
          const conn = new Connection(rpc, 'confirmed')
          const tx = await conn.getTransaction(result.anchor.transactionSignature, { maxSupportedTransactionVersion: 0 })
          if (tx) {
            result.anchor.blockNumber = tx.slot
            if (tx.blockTime) {
              result.anchor.timestamp = new Date(tx.blockTime * 1000).toISOString()
            }
          }
        } catch {
          // keep api state
        }
      }

      if (format === 'human') spinner.stop()

      if (format === 'json') {
        json.print(result)
        return
      }

      if (result.authentic) {
        if (format === 'quiet') {
          quiet.authentic()
        } else {
          human.authentic({
            id: result.anchor?.id,
            hash: result.hash,
            timestamp: result.anchor?.timestamp || new Date().toISOString(),
            blockNumber: result.anchor?.blockNumber || 0,
            transactionSignature: result.anchor?.transactionSignature || '',
            network
          })
        }
      } else if (result.anchor === null || result.anchor === undefined) {
        if (format === 'quiet') {
          quiet.notFound()
        } else {
          human.notFound()
        }
      } else {
        if (format === 'quiet') {
          quiet.mismatch()
        } else {
          human.mismatch()
        }
      }

    } catch (error) {
      if (format === 'human') spinner.stop()
      handleError(error)
    }
  })
