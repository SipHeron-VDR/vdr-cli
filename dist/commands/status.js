"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const spinner_1 = require("../utils/spinner");
const errors_1 = require("../utils/errors");
const human_1 = require("../output/human");
const json_1 = require("../output/json");
const config_1 = require("../config");
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = __importDefault(require("chalk"));
exports.statusCommand = new commander_1.Command('status')
    .description('Check the blockchain confirmation status of an anchor')
    .argument('<hash-or-id>', 'Document hash or anchor ID')
    .option('-f, --format <format>', 'Output format: human, json', 'human')
    .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
    .action(async (hashOrId, options) => {
    const spinner = (0, spinner_1.createSpinner)('Checking status...');
    try {
        const client = new vdr_core_1.SipHeron({
            apiKey: config_1.config.getApiKey(),
            network: options.network
        });
        if (options.format === 'human')
            spinner.start();
        const status = await client.getStatus(hashOrId);
        // Fallback: If api returns txSignature but block 0 or no timestamp
        if (status.status === 'confirmed' && status.transactionSignature && (!status.blockNumber || !status.timestamp)) {
            try {
                const rpc = options.network === 'mainnet'
                    ? 'https://api.mainnet-beta.solana.com'
                    : 'https://api.devnet.solana.com';
                const conn = new web3_js_1.Connection(rpc, 'confirmed');
                const tx = await conn.getTransaction(status.transactionSignature, { maxSupportedTransactionVersion: 0 });
                if (tx) {
                    status.blockNumber = tx.slot;
                    if (tx.blockTime) {
                        status.timestamp = new Date(tx.blockTime * 1000).toISOString();
                    }
                }
            }
            catch {
                // ignore RPC errors, keep the API state
            }
        }
        spinner.stop();
        if (options.format === 'json') {
            json_1.json.print(status);
            return;
        }
        console.log();
        human_1.human.label('Hash', hashOrId);
        human_1.human.label('Status', status.status === 'confirmed'
            ? chalk_1.default.green('Confirmed ✓')
            : chalk_1.default.yellow('Pending...'));
        human_1.human.label('Block', status.blockNumber.toLocaleString());
        human_1.human.label('Timestamp', status.timestamp);
        console.log();
    }
    catch (error) {
        spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
