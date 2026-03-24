import { Command } from 'commander'
import { SipHeron, generatePdfReport } from '@sipheron/vdr-core'
import { createSpinner } from '../utils/spinner'
import { handleError } from '../utils/errors'
import { config } from '../config'
import chalk from 'chalk'
import * as fs from 'fs'
import { join, resolve } from 'path'

export const reportCommand = new Command('report')
  .description('Generate a human-readable integrity report for a set of documents')
  .option('--anchors <ids>', 'Comma-separated list of anchor IDs')
  .option('--from <date>', 'Start date for filtering anchors (YYYY-MM-DD)')
  .option('--to <date>', 'End date for filtering anchors (YYYY-MM-DD)')
  .option('--tag <tags>', 'Filter by tag (e.g. type:contract)')
  .option('--format <format>', 'Output format (currently only pdf supported)', 'pdf')
  .option('--output <filename>', 'Output file name')
  .option('-n, --network <network>', 'Network: devnet, mainnet', 'mainnet')
  .action(async (options) => {
    const spinner = createSpinner('Generating integrity report...').start()
    
    try {
      const apiKey = config.getApiKey()
      const network = options.network as 'devnet' | 'mainnet'
      const baseUrl = process.env.SIPHERON_API_URL || undefined
      
      const sipheron = new SipHeron({ apiKey, network, baseUrl })
      
      if (options.format !== 'pdf') {
        spinner.stop()
        console.error(chalk.red(`\n✗ Format ${options.format} is not supported. Use --format pdf\n`))
        process.exit(1)
      }

      let anchors: any[] = []

      if (options.anchors) {
        // Fetch specific anchors
        const ids = options.anchors.split(',').map((id: string) => id.trim())
        for (const id of ids) {
          try {
            const anchor = await sipheron.getStatus(id)
            anchors.push(anchor)
          } catch (e) {
            console.warn(chalk.yellow(`\nWarning: Could not fetch anchor ${id}`))
          }
        }
      } else {
        // Fetch multiple based on from, to, tags
        let page = 1
        let hasMore = true
        while (hasMore) {
          const res = await sipheron.list({
            page,
            limit: 100,
            from: options.from,
            to: options.to,
            tag: options.tag
          })
          anchors.push(...res.records)
          if (page >= res.pages) {
            hasMore = false
          } else {
            page++
          }
        }
      }

      if (anchors.length === 0) {
        spinner.stop()
        console.error(chalk.yellow('\nNo anchors found matching the criteria.\n'))
        process.exit(0)
      }

      let dateRangeStr = ''
      if (options.from && options.to) {
        dateRangeStr = `${options.from} to ${options.to}`
      } else if (options.from) {
        dateRangeStr = `From ${options.from}`
      } else if (options.to) {
        dateRangeStr = `Up to ${options.to}`
      }

      const pdfBytes = await generatePdfReport({
        anchors,
        dateRangeStr,
        solanaNetwork: network,
        programId: 'siphTKt8W1Q1x4wQoV3yP1Nn8mFqw4kS3' // Or pull from config
      })

      const outputName = options.output || `integrity-report-${Date.now()}.pdf`
      const outputPath = resolve(process.cwd(), outputName)
      
      fs.writeFileSync(outputPath, pdfBytes)

      spinner.stop()
      console.log(chalk.green(`\n✓ Integrity report generated successfully: ${outputName}\n`))
      
    } catch (error) {
      spinner.stop()
      handleError(error)
    }
  })
