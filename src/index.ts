#!/usr/bin/env node

import { Command } from 'commander'
import { anchorCommand } from './commands/anchor'
import { verifyCommand } from './commands/verify'
import { statusCommand } from './commands/status'
import { listCommand } from './commands/list'
import { certificateCommand } from './commands/certificate'
import { loginCommand } from './commands/login'
import { logoutCommand } from './commands/logout'
import { anchorBatchCommand } from './commands/anchorBatch'
import { whoamiCommand } from './commands/whoami'
import { chainCommand } from './commands/chain'

const program = new Command()

program
  .name('sipheron')
  .description('Anchor and verify documents on Solana. Tamper-proof. Forever.')
  .version('0.1.0')

program.addCommand(anchorCommand)
program.addCommand(anchorBatchCommand)
program.addCommand(verifyCommand)
program.addCommand(statusCommand)
program.addCommand(listCommand)
program.addCommand(certificateCommand)
program.addCommand(loginCommand)
program.addCommand(logoutCommand)
program.addCommand(whoamiCommand)
program.addCommand(chainCommand)

program.parse(process.argv)
