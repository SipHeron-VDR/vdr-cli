"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anchorBatchCommand = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const path_1 = require("path");
const chalk_1 = __importDefault(require("chalk"));
const vdr_core_1 = require("@sipheron/vdr-core");
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
exports.anchorBatchCommand = new commander_1.Command('anchor:batch')
    .description('Anchor hundreds of documents simultaneously with configurable concurrency')
    .argument('<directory>', 'Path to the directory containing files to anchor')
    .option('-c, --concurrency <number>', 'Number of simultaneous anchors', '5')
    .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('-a, --algorithm <algo>', 'Hashing algorithm: sha256, sha512, blake3, md5', 'sha256')
    .action(async (directory, options) => {
    const network = options.network;
    const algorithm = options.algorithm;
    const concurrency = parseInt(options.concurrency, 10);
    const apiKey = config_1.config.getApiKey();
    if (isNaN(concurrency) || concurrency < 1 || concurrency > 20) {
        console.error(chalk_1.default.red('\n✗ Concurrency must be a number between 1 and 20'));
        process.exit(1);
    }
    if (!apiKey) {
        console.error(chalk_1.default.red('\n✗ API key is required for batch anchoring. Please login first:\n  sipheron login\n'));
        process.exit(1);
    }
    const resolvedDir = (0, path_1.resolve)(directory);
    if (!(0, fs_1.existsSync)(resolvedDir) || !(0, fs_1.statSync)(resolvedDir).isDirectory()) {
        console.error(chalk_1.default.red(`\n✗ Directory not found: ${directory}\n`));
        process.exit(1);
    }
    const entries = (0, fs_1.readdirSync)(resolvedDir)
        .map(name => (0, path_1.join)(resolvedDir, name))
        .filter(p => (0, fs_1.statSync)(p).isFile());
    if (entries.length === 0) {
        console.log(chalk_1.default.gray(`\nNo files found in ${directory}\n`));
        return;
    }
    console.log();
    console.log(chalk_1.default.bold(`Anchoring ${entries.length} documents with concurrency ${concurrency}...`));
    console.log();
    const sipheron = new vdr_core_1.SipHeron({ apiKey, network });
    // Progress state
    let completed = 0;
    let successful = 0;
    let failed = 0;
    let lastProgressLength = 0;
    const startTime = Date.now();
    const printProgress = () => {
        const percentage = Math.round((completed / entries.length) * 100);
        const filled = Math.round((completed / entries.length) * 20) || 0;
        const bar = '█'.repeat(filled) + '░'.repeat(Math.max(0, 20 - filled));
        const remaining = entries.length - completed;
        const elapsedMs = Date.now() - startTime;
        const elapsedMins = Math.floor(elapsedMs / 60000);
        const elapsedSecs = Math.floor((elapsedMs % 60000) / 1000);
        let estMins = 0;
        let estSecs = 0;
        if (completed > 0) {
            const msPerItem = elapsedMs / completed;
            const estMs = msPerItem * remaining;
            estMins = Math.floor(estMs / 60000);
            estSecs = Math.floor((estMs % 60000) / 1000);
        }
        process.stdout.write('\x1b[2K\x1b[0G'); // clear current line
        if (lastProgressLength > 0) {
            process.stdout.write('\x1b[2A'); // go up 2 lines
            process.stdout.write('\x1b[2K\n\x1b[2K\n\x1b[2K\x1b[2A'); // clear 3 lines
        }
        console.log(`Progress: ${chalk_1.default.cyan(bar)}  ${Number.isNaN(percentage) ? 0 : percentage}% (${completed}/${entries.length})`);
        console.log(`Succeeded: ${successful}  Failed: ${failed}  Remaining: ${remaining}`);
        process.stdout.write(`Elapsed: ${elapsedMins}m ${elapsedSecs}s  Estimated: ${completed > 0 ? `${estMins}m ${estSecs}s remaining` : '...'} `);
        lastProgressLength = 3;
    };
    try {
        const documentsToAnchor = entries.map(filePath => ({
            file: (0, fs_1.readFileSync)(filePath),
            name: filePath.split('/').pop() || filePath,
        }));
        printProgress();
        const sipheron = new vdr_core_1.SipHeron({ apiKey, network });
        const result = await sipheron.anchorBatch({
            documents: documentsToAnchor,
            concurrency,
            hashAlgorithm: algorithm,
            onProgress: (c, t, itemResult) => {
                completed = c;
                if (itemResult.success)
                    successful++;
                else
                    failed++;
                printProgress();
            }
        });
        console.log('\n\n');
        console.log(chalk_1.default.green('✓ Batch complete'));
        const pct = Math.round((result.succeeded / result.total) * 100);
        console.log(`Succeeded: ${result.succeeded}/${result.total} (${pct}%)`);
        if (result.failed > 0) {
            const errFile = `batch-errors-${new Date().toISOString().split('T')[0]}.json`;
            const errors = result.results.filter(r => !r.success);
            (0, fs_1.writeFileSync)(errFile, JSON.stringify(errors, null, 2));
            console.log(`Failed: ${result.failed} (see ${errFile})`);
        }
        else {
            console.log(`Failed: 0`);
        }
        const durMins = Math.floor(result.durationMs / 60000);
        const durSecs = Math.floor((result.durationMs % 60000) / 1000);
        console.log(`Duration: ${durMins}m ${durSecs}s\n`);
    }
    catch (e) {
        console.log('\n\n');
        (0, errors_1.handleError)(e);
    }
});
