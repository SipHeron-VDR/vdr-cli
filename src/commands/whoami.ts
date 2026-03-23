import { Command } from 'commander'
import { config } from '../config'
import { handleError } from '../utils/errors'
import { human } from '../output/human'
import { json } from '../output/json'
import chalk from 'chalk'
import axios from 'axios'

export const whoamiCommand = new Command('whoami')
  .description('Show current account details')
  .option('-f, --format <format>', 'Output format: human, json', 'human')
  .action(async (options) => {
    if (!config.isAuthenticated()) {
      console.log(chalk.yellow(
        '\nNot logged in. Running in playground mode.\n'
      ))
      console.log(chalk.gray('Run: sipheron login'))
      console.log(chalk.gray('Or get a free key at sipheron.com\n'))
      return
    }

    try {
      const network = config.getNetwork() as 'devnet' | 'mainnet'
      const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com'
      
      const response = await axios.get(`${baseUrl}/auth/verify-key`, {
        headers: { 'x-api-key': config.getApiKey() }
      })

      const usageResponse = await axios.get(`${baseUrl}/api/usage`, {
        headers: { 'x-api-key': config.getApiKey() }
      }).catch(() => null)

      const account = response.data
      const org = account.organization || {}
      const user = account.user || {}
      const usage = usageResponse ? usageResponse.data : null

      if (options.format === 'json') {
        json.print({ ...account, usage })
        return
      }

      console.log()
      human.label('Organization', org.name || 'User')
      human.label('Email', user.email || 'Unknown')
      human.label('Plan', org.plan || 'free')
      
      if (usage && usage.quota) {
        human.label(
          'Anchors used',
          `${(usage.quota.used || 0).toLocaleString()} / ` +
          `${(usage.quota.limit || 100).toLocaleString()} this month`
        )
      } else {
        human.label('Anchors used', 'N/A')
      }
      human.label('Network', `Solana ${config.getNetwork()}`)
      console.log()

    } catch (error) {
      handleError(error)
    }
  })
