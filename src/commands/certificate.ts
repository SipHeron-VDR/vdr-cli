import { Command } from 'commander'
import { writeFileSync } from 'fs'
import { config } from '../config'
import { handleError } from '../utils/errors'
import { createSpinner } from '../utils/spinner'
import chalk from 'chalk'
import axios from 'axios'

export const certificateCommand = new Command('certificate')
  .description('Download the PDF notarization certificate for an anchor')
  .argument('<id>', 'Anchor ID')
  .option('-o, --output <path>', 'Output file path')
  .action(async (id: string, options) => {
    if (!config.isAuthenticated()) {
      console.log(chalk.yellow(
        '\nLogin required for certificates.\n'
      ))
      console.log(chalk.gray('Run: sipheron login'))
      return
    }

    const spinner = createSpinner('Generating certificate...')

    try {
      spinner.start()
      
      const network = config.getNetwork() as 'devnet' | 'mainnet'
      const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com'
      
      const response = await axios.get(`${baseUrl}/api/hashes/${id}/certificate`, {
        headers: { 'x-api-key': config.getApiKey() },
        responseType: 'arraybuffer'
      })
      
      const pdf = response.data

      spinner.stop()

      const outputPath = options.output ||
        `./sipheron-certificate-${id}.pdf`

      writeFileSync(outputPath, pdf)

      console.log(chalk.green(`\n✓ Certificate downloaded\n`))
      console.log(chalk.gray(`Saved to: ${outputPath}\n`))

    } catch (error) {
      spinner.stop()
      handleError(error)
    }
  })
