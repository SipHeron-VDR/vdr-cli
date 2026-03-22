import { Command } from 'commander'
import { anchorToSolana, hashDocument, hashFileWithProgress } from '@sipheron/vdr-core'
import { readFileAsBuffer } from '../utils/file'
import { createSpinner } from '../utils/spinner'
import { handleError } from '../utils/errors'
import { human } from '../output/human'
import { json } from '../output/json'
import { quiet } from '../output/quiet'
import { readFileSync, existsSync } from 'fs'
import { SOLANA_KEY_PATH } from '../config/paths'
import { Keypair } from '@solana/web3.js'
import chalk from 'chalk'

export const anchorCommand = new Command('anchor')
  .description('Anchor a document\'s SHA-256 fingerprint directly to the Solana blockchain')
  .argument('<file>', 'Path to the document to anchor')
  .option('-n, --name <name>', 'Human-readable document name')
  .option('-k, --keypair <path>', 'Path to Solana keypair JSON (default: ~/.config/solana/id.json)')
  .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
  .option('-f, --format <format>', 'Output format: human, json, quiet', 'human')
  .option('--program-id <id>', 'Custom Solana program ID (advanced: override default SipHeron contract)')
  .option('-a, --algorithm <algo>', 'Hashing algorithm: sha256, sha512, blake3, md5', 'sha256')
  .action(async (filePath: string, options) => {
    const format = options.format
    const network = options.network as 'devnet' | 'mainnet'
    const algorithm = options.algorithm as any
    const keypairPath: string = options.keypair || SOLANA_KEY_PATH

    // Direct on-chain mode check
    if (algorithm !== 'sha256') {
      console.error(
        chalk.red(`\n✗ On-chain contract only supports SHA-256 for fingerprints.\n`) +
        chalk.gray(`  For ${algorithm.toUpperCase()}, use the SipHeron platform via API.\n`)
      )
      process.exit(1)
    }

    // ── Resolve Solana keypair ────────────────────────────────────────────────
    if (!existsSync(keypairPath)) {
      console.error(
        chalk.red(`\n✗ No Solana keypair found at: ${keypairPath}\n`) +
        chalk.gray('  Generate one with:  solana-keygen new\n') +
        chalk.gray('  Or specify one with: --keypair <path>\n')
      )
      process.exit(3)
    }

    const spinner = createSpinner('Anchoring document to Solana...')

    try {
      const keypair = Keypair.fromSecretKey(
        Uint8Array.from(JSON.parse(readFileSync(keypairPath, 'utf-8')))
      )

      if (format === 'human') {
        spinner.start()
      }

      const { statSync } = await import('fs')
      const stats = statSync(filePath)
      const fileSizeMB = stats.size / (1024 * 1024)

      let hash: string

      if (fileSizeMB > 50) {
        if (format === 'human') {
          spinner.text = `Hashing large file (${fileSizeMB.toFixed(0)}MB)...`
        }
        hash = await hashFileWithProgress(filePath, (processed: number, total: number) => {
          if (format === 'human') {
            const pct = Math.round((processed / total) * 100)
            spinner.text = `Hashing: ${pct}% (${(processed/1024/1024).toFixed(0)}MB / ${(total/1024/1024).toFixed(0)}MB)`
          }
        })
        if (format === 'human') {
          spinner.text = 'Broadcasting to Solana...'
        }
      } else {
        const file = readFileAsBuffer(filePath)
        hash = await hashDocument(file)
      }

      // ── Direct on-chain anchor — zero SipHeron API dependency ───────────────
      const onchainResult = await anchorToSolana({
        hash,
        keypair,
        network,
        metadata: options.name || filePath.split('/').pop() || filePath,
        ...(options.programId && { programId: options.programId }),
      })

      if (format === 'human') spinner.stop()

      const result = {
        id:                   onchainResult.pda,
        hash,
        transactionSignature: onchainResult.transactionSignature,
        blockNumber:          0,
        timestamp:            new Date().toISOString(),
        status:               'confirmed',
        verificationUrl:      onchainResult.explorerUrl,
        network,
        pda:                  onchainResult.pda,
        cost:                 onchainResult.cost,
      }

      if (format === 'json') {
        json.print(result)
        return
      }

      if (format === 'quiet') {
        quiet.anchored(onchainResult.explorerUrl)
        return
      }

      // Human-readable output
      console.log()
      console.log(chalk.green.bold('✓ Anchored to Solana'))
      console.log()
      human.label('Hash',        hash.substring(0, 32) + '...')
      human.label('PDA',         onchainResult.pda)
      human.label('Transaction', onchainResult.transactionSignature)
      human.label('Status',      chalk.green('confirmed'))
      human.label('Network',     `Solana ${network}`)
      human.label('Cost',        `${onchainResult.cost} lamports`)
      console.log()
      console.log(chalk.gray('Solana Explorer:'))
      console.log(chalk.cyan(onchainResult.explorerUrl))
      console.log()
      console.log(chalk.gray('Verify this document later with:'))
      console.log(chalk.cyan(
        `  sipheron verify <file> --owner ${keypair.publicKey.toBase58()} --network ${network}`
      ))
      console.log()

    } catch (error) {
      if (format === 'human') spinner.stop()
      handleError(error)
    }
  })
