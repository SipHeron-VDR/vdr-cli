"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const file_1 = require("../utils/file");
const spinner_1 = require("../utils/spinner");
const errors_1 = require("../utils/errors");
const human_1 = require("../output/human");
const json_1 = require("../output/json");
const quiet_1 = require("../output/quiet");
const config_1 = require("../config");
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = __importDefault(require("chalk"));
const path_1 = require("path");
exports.verifyCommand = new commander_1.Command('verify')
    .description('Verify a document\'s authenticity against its blockchain anchor')
    .argument('<file-or-hash>', 'Document file path or SHA-256 hash')
    .option('-f, --format <format>', 'Output format: human, json, quiet', 'human')
    .option('-n, --network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('--owner <publicKey>', 'Solana public key of the document owner for direct on-chain verification (no API needed)')
    .option('--program-id <id>', 'Custom Solana program ID (advanced)')
    .option('--no-cache', 'Force fresh verification from network, bypassing local cache')
    .option('-a, --algorithm <algo>', 'Hashing algorithm: sha256, sha512, blake3, md5', 'sha256')
    .action(async (fileOrHash, options) => {
    const format = options.format;
    const network = options.network;
    const algorithm = options.algorithm;
    const ownerArg = options.owner;
    const bypassCache = options.cache === false;
    // Direct mode constraint
    if (ownerArg && algorithm !== 'sha256') {
        console.error(chalk_1.default.red(`\n✗ On-chain verification only supports SHA-256.\n`) +
            chalk_1.default.gray(`  For ${algorithm.toUpperCase()}, use standard verification (via API).\n`));
        process.exit(1);
    }
    const spinner = (0, spinner_1.createSpinner)('Verifying document...');
    if (format === 'human')
        spinner.start();
    try {
        const apiKey = config_1.config.getApiKey();
        // ── Resolve hash ────────────────────────────────────────────────────────
        let hash;
        if ((0, vdr_core_1.isValidHash)(fileOrHash, algorithm)) {
            hash = fileOrHash.toLowerCase();
        }
        else {
            const file = (0, file_1.readFileAsBuffer)(fileOrHash);
            hash = await (0, vdr_core_1.hashDocument)(file, { algorithm });
        }
        // ── Mode A: true on-chain (zero API dependency) ─────────────────────────
        if (ownerArg) {
            let ownerPk;
            try {
                ownerPk = new web3_js_1.PublicKey(ownerArg);
            }
            catch {
                spinner.stop();
                console.error(chalk_1.default.red(`\n✗ Invalid public key: ${ownerArg}\n`));
                process.exit(3);
            }
            const result = await (0, vdr_core_1.verifyOnChain)({
                hash,
                network,
                ownerPublicKey: ownerPk,
                ...(options.programId && { programId: options.programId }),
            });
            if (format === 'human')
                spinner.stop();
            // ... same on-chain logic omitted for brevity, keeping it original ...
            let slot = 0;
            let blockTime;
            if (result.authentic && result.pda) {
                try {
                    const rpc = network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com';
                    const conn = new web3_js_1.Connection(rpc, 'confirmed');
                    if (result.timestamp) {
                        blockTime = new Date(result.timestamp * 1000).toISOString();
                    }
                }
                catch { /* ignore */ }
            }
            if (format === 'json') {
                json_1.json.print({ ...result, blockTime, mode: 'direct-onchain' });
                return;
            }
            if (!result.authentic) {
                if (format === 'quiet') {
                    quiet_1.quiet.notFound();
                    return;
                }
                human_1.human.notFound();
                return;
            }
            if (result.isRevoked) {
                if (format === 'quiet') {
                    quiet_1.quiet.mismatch();
                    return;
                }
                console.log();
                console.log(chalk_1.default.red.bold('✗ REVOKED'));
                console.log();
                console.log(chalk_1.default.gray('This anchor has been explicitly revoked.'));
                console.log();
                return;
            }
            if (format === 'quiet') {
                quiet_1.quiet.authentic();
                return;
            }
            human_1.human.authentic({
                hash,
                id: result.pda,
                timestamp: blockTime || (result.timestamp ? new Date(result.timestamp * 1000).toISOString() : ''),
                blockNumber: 0,
                transactionSignature: result.pda || '',
                network,
            });
            console.log(chalk_1.default.gray('Mode:'), chalk_1.default.cyan('Direct on-chain (no API used)'));
            console.log();
            return;
        }
        // ── Mode B: API lookup with CLI cache support ───────────────────────────
        const sipheron = new vdr_core_1.SipHeron({
            apiKey,
            network,
            cache: {
                ttlMs: 600000, // 10 minutes cache
                persistPath: (0, path_1.join)(process.cwd(), '.sipheron-cache.json') // Simplified for user request
            }
        });
        const result = await sipheron.verify({ hash, noCache: bypassCache });
        if (format === 'human')
            spinner.stop();
        if (format === 'json') {
            json_1.json.print({ ...result, mode: 'api' });
            return;
        }
        if (result.status === 'authentic') {
            if (format === 'quiet') {
                quiet_1.quiet.authentic();
                return;
            }
            let blockNumber = result.anchor?.blockNumber || 0;
            let timestamp = result.anchor?.timestamp || new Date().toISOString();
            const txSig = result.anchor?.transactionSignature || '';
            human_1.human.authentic({ hash, id: result.anchor?.id, timestamp, blockNumber, transactionSignature: txSig, network });
            if (result.fromCache && result.cachedTimestamp) {
                const ago = Math.round((Date.now() - result.cachedTimestamp) / 60000);
                console.log(chalk_1.default.green(`✓ AUTHENTIC (cached — verified ${ago} minutes ago)`));
            }
            else {
                console.log(chalk_1.default.gray('Tip: use --owner <publicKey> for zero-API on-chain verification'));
            }
            console.log();
        }
        else if (result.status === 'revoked') {
            if (format === 'quiet') {
                quiet_1.quiet.mismatch();
                return;
            }
            console.log('\n' + chalk_1.default.red.bold('✗ REVOKED'));
            console.log(chalk_1.default.gray('This anchor has been explicitly revoked.\n'));
        }
        else {
            if (format === 'quiet') {
                quiet_1.quiet.notFound();
                return;
            }
            human_1.human.notFound();
        }
    }
    catch (error) {
        if (format === 'human')
            spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
