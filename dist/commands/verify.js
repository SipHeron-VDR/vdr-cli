"use strict";
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
exports.verifyCommand = new commander_1.Command('verify')
    .description('Verify a document\'s authenticity against its blockchain anchor')
    .argument('<file-or-hash>', 'Document file path or SHA-256 hash')
    .option('-f, --format <format>', 'Output format: human, json, quiet', 'human')
    .option('-n, --network <network>', 'Network: devnet, mainnet', 'devnet')
    .action(async (fileOrHash, options) => {
    const format = options.format;
    const network = options.network;
    const spinner = (0, spinner_1.createSpinner)('Verifying document...');
    try {
        const client = new vdr_core_1.SipHeron({
            apiKey: config_1.config.getApiKey(),
            network
        });
        let result;
        if ((0, file_1.isValidHash)(fileOrHash)) {
            // Input is a hash directly
            if (format === 'human')
                spinner.start();
            result = await client.verify({ hash: fileOrHash });
        }
        else {
            // Input is a file path
            const file = (0, file_1.readFileAsBuffer)(fileOrHash);
            if (format === 'human')
                spinner.start();
            result = await client.verify({ file });
        }
        // If we have txSignature but block/timestamp is missing, fetch from rpc
        if (result.authentic && result.anchor?.transactionSignature && (!result.anchor.blockNumber || !result.anchor.timestamp)) {
            try {
                const rpc = network === 'mainnet'
                    ? 'https://api.mainnet-beta.solana.com'
                    : 'https://api.devnet.solana.com';
                const conn = new web3_js_1.Connection(rpc, 'confirmed');
                const tx = await conn.getTransaction(result.anchor.transactionSignature, { maxSupportedTransactionVersion: 0 });
                if (tx) {
                    result.anchor.blockNumber = tx.slot;
                    if (tx.blockTime) {
                        result.anchor.timestamp = new Date(tx.blockTime * 1000).toISOString();
                    }
                }
            }
            catch {
                // keep api state
            }
        }
        if (format === 'human')
            spinner.stop();
        if (format === 'json') {
            json_1.json.print(result);
            return;
        }
        if (result.authentic) {
            if (format === 'quiet') {
                quiet_1.quiet.authentic();
            }
            else {
                human_1.human.authentic({
                    id: result.anchor?.id,
                    hash: result.hash,
                    timestamp: result.anchor?.timestamp || new Date().toISOString(),
                    blockNumber: result.anchor?.blockNumber || 0,
                    transactionSignature: result.anchor?.transactionSignature || '',
                    network
                });
            }
        }
        else if (result.anchor === null || result.anchor === undefined) {
            if (format === 'quiet') {
                quiet_1.quiet.notFound();
            }
            else {
                human_1.human.notFound();
            }
        }
        else {
            if (format === 'quiet') {
                quiet_1.quiet.mismatch();
            }
            else {
                human_1.human.mismatch();
            }
        }
    }
    catch (error) {
        if (format === 'human')
            spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
