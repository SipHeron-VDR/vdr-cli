#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const commander_1 = require("commander");
const anchor_1 = require("./commands/anchor");
const verify_1 = require("./commands/verify");
const status_1 = require("./commands/status");
const list_1 = require("./commands/list");
const certificate_1 = require("./commands/certificate");
const login_1 = require("./commands/login");
const logout_1 = require("./commands/logout");
const anchorBatch_1 = require("./commands/anchorBatch");
const whoami_1 = require("./commands/whoami");
const chain_1 = require("./commands/chain");
const program = new commander_1.Command();
program
    .name('sipheron')
    .description('Anchor and verify documents on Solana. Tamper-proof. Forever.')
    .version('0.1.0');
program.addCommand(anchor_1.anchorCommand);
program.addCommand(anchorBatch_1.anchorBatchCommand);
program.addCommand(verify_1.verifyCommand);
program.addCommand(status_1.statusCommand);
program.addCommand(list_1.listCommand);
program.addCommand(certificate_1.certificateCommand);
program.addCommand(login_1.loginCommand);
program.addCommand(logout_1.logoutCommand);
program.addCommand(whoami_1.whoamiCommand);
program.addCommand(chain_1.chainCommand);
program.parse(process.argv);
