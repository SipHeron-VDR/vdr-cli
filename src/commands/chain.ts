import { Command } from 'commander'
import { SipHeron } from '@sipheron/vdr-core'
import { config } from '../config'
import chalk from 'chalk'
import { json } from '../output/json'

export const chainCommand = new Command('chain')
  .description('Get the complete version linkage for a specific given anchor')
  .argument('<anchorId>', 'The ID of the anchor to trace')
  .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
  .option('-f, --format <format>', 'Output format: human, json', 'human')
  .action(async (anchorId: string, options) => {
    const format = options.format
    const network = options.network as 'devnet' | 'mainnet'
    const apiKey = config.getApiKey()

    if (!apiKey) {
      console.error(chalk.red('\n✗ API key is required to fetch version chains from the VDR registry. Please login first:\n  sipheron login\n'))
      process.exit(1)
    }

    try {
      const sipheron = new SipHeron({ apiKey, network })
      const chain = await sipheron.anchors.getVersionChain(anchorId)

      if (format === 'json') {
        json.print(chain)
        return
      }

      if (!chain || chain.length === 0) {
        console.log(chalk.yellow('\nNo version chain found for this anchor.'))
        process.exit(0)
      }

      const rootMetadata = chain[0].name || chain[0].metadata?.name || 'Unknown Document'
      console.log(chalk.bold(`\n# Version Chain for: ${rootMetadata}`))
      console.log(chalk.gray('#'))

      let minDate = new Date(chain[0].timestamp)
      let maxDate = new Date(chain[chain.length - 1].timestamp)

      chain.forEach((version, index) => {
        const versionStr = chalk.gray(`v${index + 1}`.padEnd(3))
        const idStr = chalk.cyan(version.id ? (version.id.startsWith('anc_') ? version.id : 'anc_' + version.id.slice(0, 8)) : version.hash.slice(0, 12))
        
        const dateStr = chalk.dim(new Date(version.timestamp).toISOString().split('T')[0])
        const isConfirmed = version.status.toLowerCase() === 'confirmed' || version.status.toLowerCase() === 'active'
        const statusStr = isConfirmed ? chalk.green('Confirmed ✓') : chalk.red('Revoked ✗')
        
        // Find text representation of metadata
        let metaStrText = ''
        if (version.name) metaStrText = version.name
        else if (version.metadata && version.metadata.name) metaStrText = version.metadata.name

        let metaStr = chalk.white(metaStrText || '')
        if (index === 0 && !metaStrText) metaStr = chalk.gray('(original)')
        
        const isCurrent = (version.id === anchorId || version.hash === anchorId)
        
        let line = `# ${versionStr} ${idStr.padEnd(14)} ${dateStr}  ${statusStr.padEnd(13)}  ${metaStr}`
        console.log(line)
        if (isCurrent) {
          console.log(chalk.gray('#     ') + chalk.blue('(current)'))
        }
      })

      console.log(chalk.gray('#'))
      
      const diffTime = Math.abs(maxDate.getTime() - minDate.getTime())
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
      const durationStr = diffDays > 0 ? `, spanning ${diffDays} days` : ''
      console.log(chalk.bold(`# ${chain.length} versions${durationStr}\n`))

    } catch (error: any) {
      console.error(chalk.red(`\n✗ Failed to fetch chain: ${error.message}\n`))
      process.exit(1)
    }
  })
