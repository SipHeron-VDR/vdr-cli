import chalk from 'chalk'

export const human = {
  success: (message: string) => {
    console.log(chalk.green(`✓ ${message}`))
  },
  error: (message: string) => {
    console.log(chalk.red(`✗ ${message}`))
  },
  warning: (message: string) => {
    console.log(chalk.yellow(`⚠ ${message}`))
  },
  info: (message: string) => {
    console.log(chalk.cyan(message))
  },
  label: (key: string, value: string) => {
    const paddedKey = key.padEnd(16)
    console.log(`${chalk.gray(paddedKey)} ${value}`)
  },
  divider: () => {
    console.log(chalk.gray('─'.repeat(50)))
  },
  blank: () => console.log(),
  authentic: (anchor: {
    id?: string
    hash: string
    timestamp: string
    blockNumber: number
    transactionSignature: string
    network: string
  }) => {
    console.log()
    console.log(chalk.green.bold('✓ AUTHENTIC'))
    console.log()
    console.log(chalk.gray('This document is identical to its anchored version.'))
    console.log()
    if (anchor.id) human.label('Anchor ID', anchor.id)
    human.label('Hash', anchor.hash)
    human.label('Anchored', anchor.timestamp)
    human.label('Block', anchor.blockNumber.toLocaleString())
    human.label('Transaction', anchor.transactionSignature)
    human.label(
      'Explorer',
      `https://explorer.solana.com/tx/${anchor.transactionSignature}` +
      (anchor.network === 'devnet' ? '?cluster=devnet' : '')
    )
    console.log()
  },
  mismatch: () => {
    console.log()
    console.log(chalk.red.bold('✗ MISMATCH'))
    console.log()
    console.log(chalk.gray('This document differs from its anchored version.'))
    console.log(chalk.gray('It may have been modified after anchoring.'))
    console.log()
  },
  notFound: () => {
    console.log()
    console.log(chalk.yellow.bold('⚠ NOT FOUND'))
    console.log()
    console.log(chalk.gray('No anchor record found for this document.'))
    console.log(chalk.gray('The document may not have been anchored yet.'))
    console.log()
  },
  anchorResult: (result: {
    id: string
    hash: string
    transactionSignature: string
    blockNumber: number
    timestamp: string
    status: string
    verificationUrl: string
    network: string
  }) => {
    console.log()
    console.log(chalk.green.bold('✓ Anchored successfully'))
    console.log()
    human.label('Anchor ID', result.id)
    human.label('Hash', result.hash.substring(0, 32) + '...')
    human.label('Transaction', result.transactionSignature)
    human.label('Block', result.blockNumber.toLocaleString())
    human.label('Timestamp', result.timestamp)
    human.label('Status', chalk.green(result.status))
    human.label('Network', `Solana ${result.network}`)
    console.log()
    console.log(chalk.gray('Verification URL:'))
    console.log(chalk.cyan(result.verificationUrl))
    console.log()
    console.log(chalk.gray('Share this URL to let anyone verify this document.'))
    console.log()
  }
}
