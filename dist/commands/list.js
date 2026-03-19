"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.listCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const json_1 = require("../output/json");
const spinner_1 = require("../utils/spinner");
const web3_js_1 = require("@solana/web3.js");
const vdr_core_2 = require("@sipheron/vdr-core");
exports.listCommand = new commander_1.Command('list')
    .description('Batch-verify a local folder of files against the Solana blockchain')
    .argument('<directory>', 'Path to the directory containing files to check')
    .option('--owner <publicKey>', 'Solana public key of the document owner (required)')
    .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('-f, --format <format>', 'Output format: human, json', 'human')
    .option('--program-id <id>', 'Custom Solana program ID (advanced)')
    .action(async (directory, options) => {
    const network = options.network;
    const resolvedDir = (0, path_1.resolve)(directory);
    if (!(0, fs_1.existsSync)(resolvedDir) || !(0, fs_1.statSync)(resolvedDir).isDirectory()) {
        console.error(chalk_1.default.red(`\n✗ Directory not found: ${directory}\n`));
        process.exit(3);
    }
    if (!options.owner) {
        console.log(chalk_1.default.yellow('\n⚠  --owner <publicKey> is required to look up on-chain records.\n'));
        console.log(chalk_1.default.gray('This is the Solana public key that was used when anchoring.'));
        console.log(chalk_1.default.gray('Example:'));
        console.log(chalk_1.default.cyan(`  sipheron list ./my-documents --owner <YourWalletPublicKey>\n`));
        process.exit(1);
    }
    let ownerPk;
    try {
        ownerPk = new web3_js_1.PublicKey(options.owner);
    }
    catch {
        console.error(chalk_1.default.red(`\n✗ Invalid public key: ${options.owner}\n`));
        process.exit(3);
    }
    // Collect files (non-recursive, top-level only)
    const entries = (0, fs_1.readdirSync)(resolvedDir)
        .map(name => (0, path_1.join)(resolvedDir, name))
        .filter(p => (0, fs_1.statSync)(p).isFile());
    if (entries.length === 0) {
        console.log(chalk_1.default.gray(`\nNo files found in ${directory}\n`));
        return;
    }
    console.log();
    console.log(chalk_1.default.bold(`Checking ${entries.length} file(s) against Solana ${network}...`));
    console.log(chalk_1.default.gray(`Owner: ${options.owner}`));
    console.log();
    const spinner = (0, spinner_1.createSpinner)('Reading chain...');
    if (options.format === 'human')
        spinner.start();
    const results = [];
    for (const filePath of entries) {
        const fileName = filePath.split('/').pop() || filePath;
        try {
            const hash = await (0, vdr_core_1.hashFile)(filePath);
            const programArg = options.programId
                ? new web3_js_1.PublicKey(options.programId)
                : network;
            const pda = (0, vdr_core_2.deriveAnchorAddress)(hash, ownerPk, programArg);
            const record = await (0, vdr_core_2.verifyOnChain)({
                hash,
                network,
                ownerPublicKey: ownerPk,
                ...(options.programId && { programId: options.programId }),
            });
            let blockTime;
            if (record.timestamp) {
                blockTime = new Date(record.timestamp * 1000).toISOString();
            }
            results.push({
                file: fileName,
                hash,
                pda: pda.toBase58(),
                status: record.isRevoked ? 'revoked' : record.authentic ? 'confirmed' : 'not_found',
                metadata: record.metadata,
                timestamp: blockTime,
            });
        }
        catch (err) {
            results.push({
                file: fileName,
                hash: '',
                pda: '',
                status: 'error',
            });
        }
    }
    if (options.format === 'human')
        spinner.stop();
    if (options.format === 'json') {
        json_1.json.print(results);
        return;
    }
    // Human table output
    const maxFile = Math.max(...results.map(r => r.file.length), 4);
    results.forEach(r => {
        const statusLabel = r.status === 'confirmed' ? chalk_1.default.green('✓ confirmed') :
            r.status === 'revoked' ? chalk_1.default.red('✗ revoked') :
                r.status === 'error' ? chalk_1.default.red('✗ error') :
                    chalk_1.default.yellow('⚠ not found');
        const fileLabel = r.file.padEnd(maxFile);
        const hashLabel = r.hash ? r.hash.slice(0, 12) + '...' : '—';
        const timeLabel = r.timestamp ? r.timestamp.slice(0, 10) : '';
        console.log(`${chalk_1.default.gray(fileLabel)}  ${statusLabel.padEnd(20)}  ${chalk_1.default.gray(hashLabel)}  ${chalk_1.default.gray(timeLabel)}`);
    });
    const confirmed = results.filter(r => r.status === 'confirmed').length;
    const notFound = results.filter(r => r.status === 'not_found').length;
    const revoked = results.filter(r => r.status === 'revoked').length;
    const errors = results.filter(r => r.status === 'error').length;
    console.log();
    console.log(chalk_1.default.gray(`${confirmed} confirmed  |  ${notFound} not found  |  ${revoked} revoked  |  ${errors} errors`));
    console.log(chalk_1.default.gray('Mode: direct on-chain read — no API used'));
    console.log();
});
