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
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = __importDefault(require("chalk"));
exports.verifyCommand = new commander_1.Command('verify')
    .description('Verify a document\'s authenticity against its blockchain anchor')
    .argument('<file-or-hash>', 'Document file path or SHA-256 hash')
    .option('-f, --format <format>', 'Output format: human, json, quiet', 'human')
    .option('-n, --network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('--owner <publicKey>', 'Solana public key of the document owner for direct on-chain verification (no API needed)')
    .option('--program-id <id>', 'Custom Solana program ID (advanced)')
    .action(async (fileOrHash, options) => {
    const format = options.format;
    const network = options.network;
    const ownerArg = options.owner;
    const spinner = (0, spinner_1.createSpinner)('Verifying document...');
    if (format === 'human')
        spinner.start();
    try {
        // ── Resolve hash ────────────────────────────────────────────────────────
        let hash;
        if ((0, file_1.isValidHash)(fileOrHash)) {
            hash = fileOrHash.toLowerCase();
        }
        else {
            const file = (0, file_1.readFileAsBuffer)(fileOrHash);
            hash = await (0, vdr_core_1.hashDocument)(file);
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
            // Enrich with block timestamp via public RPC
            let slot = 0;
            let blockTime;
            if (result.authentic && result.pda) {
                try {
                    const rpc = network === 'mainnet'
                        ? 'https://api.mainnet-beta.solana.com'
                        : 'https://api.devnet.solana.com';
                    const conn = new web3_js_1.Connection(rpc, 'confirmed');
                    // Timestamp comes from on-chain record metadata
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
            console.log(chalk_1.default.gray('PDA: '), chalk_1.default.cyan(result.pda || ''));
            if (result.metadata) {
                console.log(chalk_1.default.gray('Meta:'), chalk_1.default.cyan(result.metadata));
            }
            console.log();
            return;
        }
        // ── Mode B: public API lookup — no API key required ─────────────────────
        const result = await (0, vdr_core_1.verifyHash)(hash);
        if (format === 'human')
            spinner.stop();
        if (format === 'json') {
            json_1.json.print({ ...result, mode: 'public-api' });
            return;
        }
        if (result.status === 'authentic') {
            if (format === 'quiet') {
                quiet_1.quiet.authentic();
                return;
            }
            // Enrich with RPC block data
            let blockNumber = result.anchor?.blockNumber || 0;
            let timestamp = result.anchor?.timestamp || new Date().toISOString();
            const txSig = result.anchor?.transactionSignature || '';
            if (txSig && (!blockNumber || !timestamp)) {
                try {
                    const rpc = network === 'mainnet' ? 'https://api.mainnet-beta.solana.com' : 'https://api.devnet.solana.com';
                    const conn = new web3_js_1.Connection(rpc, 'confirmed');
                    const tx = await conn.getTransaction(txSig, { maxSupportedTransactionVersion: 0 });
                    if (tx) {
                        blockNumber = tx.slot;
                        if (tx.blockTime)
                            timestamp = new Date(tx.blockTime * 1000).toISOString();
                    }
                }
                catch { /* ignore */ }
            }
            human_1.human.authentic({ hash, id: result.anchor?.id, timestamp, blockNumber, transactionSignature: txSig, network });
            console.log(chalk_1.default.gray('Tip: use --owner <publicKey> for zero-API on-chain verification'));
            console.log();
        }
        else if (result.status === 'revoked') {
            if (format === 'quiet') {
                quiet_1.quiet.mismatch();
                return;
            }
            console.log();
            console.log(chalk_1.default.red.bold('✗ REVOKED'));
            console.log(chalk_1.default.gray('This anchor has been explicitly revoked.'));
            console.log();
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
