import { Command } from 'commander'
import { createInterface } from 'readline'
import { config } from '../config'
import chalk from 'chalk'
import axios from 'axios'

export const loginCommand = new Command('login')
  .description('Authenticate with your SipHeron API key')
  .action(async () => {
    console.log()
    console.log(
      chalk.gray('Get a free API key at sipheron.com')
    )
    console.log(
      chalk.gray('100 free anchors/month. No credit card required.')
    )
    console.log()

    const rl = createInterface({
      input: process.stdin,
      output: process.stdout
    })

    rl.question('Enter your API key: ', async (apiKey) => {
      rl.close()

      if (!apiKey || apiKey.trim().length === 0) {
        console.log(chalk.red('No API key provided.'))
        process.exit(1)
      }

      try {
        const network = config.getNetwork() as 'devnet' | 'mainnet'
        const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com'
        
        // Validate the key by making a test request directly
        const response = await axios.get(`${baseUrl}/auth/verify-key`, {
          headers: { 'x-api-key': apiKey.trim() }
        })

        const account = response.data
        const orgName = (account.organization && account.organization.name) || (account.user && account.user.email) || 'User'
        config.setApiKey(apiKey.trim())

        console.log()
        console.log(
          chalk.green(
            `✓ Authenticated as ${orgName}`
          )
        )
        console.log(chalk.gray('API key stored securely.'))
        console.log()

      } catch {
        console.log(chalk.red('\n✗ Invalid API key. Please try again.\n'))
        process.exit(1)
      }
    })
  })
