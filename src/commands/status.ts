import { Command } from 'commander'
import { verifyOnChain, deriveAnchorAddress, SipHeron } from '@sipheron/vdr-core'
import { config } from '../config'
import { isValidHash } from '../utils/file'
import { createSpinner } from '../utils/spinner'
import { handleError } from '../utils/errors'
import { human } from '../output/human'
import { json } from '../output/json'
import { PublicKey, Connection } from '@solana/web3.js'
import chalk from 'chalk'

export const statusCommand = new Command('status')
  .description('Check the on-chain or API status of an anchored document')
  .argument('<identifier>', 'SHA-256 hash or Anchor ID')
  .option('--owner <publicKey>', 'Solana public key (forces direct zero-API on-chain lookup)')
  .option('-f, --format <format>', 'Output format: human, json', 'human')
  .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
  .option('--program-id <id>', 'Custom Solana program ID (advanced)')
  .action(async (identifier: string, options) => {
    const network = options.network as 'devnet' | 'mainnet'

    const isId = identifier.startsWith('anc_') || identifier.includes('-')
    const validHash = isValidHash(identifier)

    if (!validHash && !isId) {
      console.error(chalk.red('\n✗ Invalid input. Must be a 64-character hex SHA-256 string or an Anchor ID.\n'))
      process.exit(3)
    }

    if (!options.owner) {
      if (!config.isAuthenticated()) {
        console.log(chalk.yellow('\n⚠  API key required for status check, OR --owner <publicKey> for direct on-chain lookup.\n'))
        console.log(chalk.gray('  Login:'))
        console.log(chalk.cyan(`    sipheron login\n`))
        console.log(chalk.gray('  Or on-chain zero-API lookup:'))
        console.log(chalk.cyan(`    sipheron status ${identifier.slice(0, 16)}... --owner <YourWalletPublicKey>\n`))
        process.exit(1)
      }

      const spinner = createSpinner('Fetching status from API...')
      if (options.format === 'human') spinner.start()

      try {
        const sipheron = new SipHeron({ apiKey: config.getApiKey(), network, baseUrl: process.env.SIPHERON_API_URL })
        const result = await sipheron.getStatus(identifier)

        if (options.format === 'human') spinner.stop()

        if (options.format === 'json') {
          json.print({ ...result, mode: 'api' })
          return
        }

        console.log()
        human.label('Identifier', identifier)
        human.label('Hash', result.hash)
        human.label('Status', chalk.yellow(result.status))
        human.label('Network', `Solana ${result.network}`)
        
        if (result.verificationUrl) {
          console.log()
          console.log(chalk.gray('Verify it online:'))
          console.log(chalk.cyan(result.verificationUrl))
        }
        console.log()
        return

      } catch (error) {
        if (options.format === 'human') spinner.stop()
        handleError(error)
      }
    }

    // ── Direct on-chain fallback (requires --owner and strict hash) ─────────
    if (isId) {
      console.error(chalk.red('\n✗ Direct on-chain lookup requires a raw SHA-256 Hash, not an Anchor ID.\n'))
      process.exit(1)
    }

    let ownerPk: PublicKey
    try {
      ownerPk = new PublicKey(options.owner)
    } catch {
      console.error(chalk.red(`\n✗ Invalid public key: ${options.owner}\n`))
      process.exit(3)
    }

    const spinner = createSpinner('Reading from Solana...')
    if (options.format === 'human') spinner.start()

    try {
      // ── Direct on-chain read — zero SipHeron API dependency ─────────────────
      const result = await verifyOnChain({
        hash: identifier.toLowerCase(),
        network,
        ownerPublicKey: ownerPk,
        ...(options.programId && { programId: options.programId }),
      })

      // Derive PDA for display
      const pda = deriveAnchorAddress(identifier.toLowerCase(), ownerPk, (options.programId ? new PublicKey(options.programId) : network) as any)

      // Enrich with block timestamp via public RPC
      let blockTime: string | undefined
      if (result.timestamp) {
        blockTime = new Date(result.timestamp * 1000).toISOString()
      }

      spinner.stop()

      if (options.format === 'json') {
        json.print({
          hash: identifier,
          pda: pda.toBase58(),
          authentic: result.authentic,
          isRevoked: result.isRevoked || false,
          owner: result.owner,
          timestamp: blockTime,
          metadata: result.metadata,
          network,
          mode: 'direct-onchain',
        })
        return
      }

      console.log()
      human.label('Hash',      identifier)
      human.label('PDA',       pda.toBase58())
      human.label('Owner',     result.owner || options.owner)
      human.label('Network',   `Solana ${network}`)

      if (!result.authentic) {
        human.label('Status', chalk.yellow('NOT FOUND'))
        console.log()
        console.log(chalk.gray('No anchor record exists at this PDA on-chain.'))
        console.log()
        return
      }

      if (result.isRevoked) {
        human.label('Status', chalk.red('REVOKED ✗'))
      } else {
        human.label('Status', chalk.green('CONFIRMED ✓'))
      }

      human.label('Anchored',  blockTime || 'unknown')
      if (result.metadata) {
        human.label('Metadata', result.metadata)
      }
      console.log()
      console.log(chalk.gray('Mode: direct on-chain read — no API used'))
      console.log()

    } catch (error) {
      spinner.stop()
      handleError(error)
    }
  })
