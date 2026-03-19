"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.anchorCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const file_1 = require("../utils/file");
const spinner_1 = require("../utils/spinner");
const errors_1 = require("../utils/errors");
const human_1 = require("../output/human");
const json_1 = require("../output/json");
const quiet_1 = require("../output/quiet");
const fs_1 = require("fs");
const paths_1 = require("../config/paths");
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = __importDefault(require("chalk"));
exports.anchorCommand = new commander_1.Command('anchor')
    .description('Anchor a document\'s SHA-256 fingerprint directly to the Solana blockchain')
    .argument('<file>', 'Path to the document to anchor')
    .option('-n, --name <name>', 'Human-readable document name')
    .option('-k, --keypair <path>', 'Path to Solana keypair JSON (default: ~/.config/solana/id.json)')
    .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('-f, --format <format>', 'Output format: human, json, quiet', 'human')
    .option('--program-id <id>', 'Custom Solana program ID (advanced: override default SipHeron contract)')
    .action(async (filePath, options) => {
    const format = options.format;
    const network = options.network;
    const keypairPath = options.keypair || paths_1.SOLANA_KEY_PATH;
    // ── Resolve Solana keypair ────────────────────────────────────────────────
    if (!(0, fs_1.existsSync)(keypairPath)) {
        console.error(chalk_1.default.red(`\n✗ No Solana keypair found at: ${keypairPath}\n`) +
            chalk_1.default.gray('  Generate one with:  solana-keygen new\n') +
            chalk_1.default.gray('  Or specify one with: --keypair <path>\n'));
        process.exit(3);
    }
    const spinner = (0, spinner_1.createSpinner)('Anchoring document to Solana...');
    try {
        const keypair = web3_js_1.Keypair.fromSecretKey(Uint8Array.from(JSON.parse((0, fs_1.readFileSync)(keypairPath, 'utf-8'))));
        if (format === 'human') {
            spinner.start();
        }
        const { statSync } = await Promise.resolve().then(() => __importStar(require('fs')));
        const stats = statSync(filePath);
        const fileSizeMB = stats.size / (1024 * 1024);
        let hash;
        if (fileSizeMB > 50) {
            if (format === 'human') {
                spinner.text = `Hashing large file (${fileSizeMB.toFixed(0)}MB)...`;
            }
            hash = await (0, vdr_core_1.hashFileWithProgress)(filePath, (processed, total) => {
                if (format === 'human') {
                    const pct = Math.round((processed / total) * 100);
                    spinner.text = `Hashing: ${pct}% (${(processed / 1024 / 1024).toFixed(0)}MB / ${(total / 1024 / 1024).toFixed(0)}MB)`;
                }
            });
            if (format === 'human') {
                spinner.text = 'Broadcasting to Solana...';
            }
        }
        else {
            const file = (0, file_1.readFileAsBuffer)(filePath);
            hash = await (0, vdr_core_1.hashDocument)(file);
        }
        // ── Direct on-chain anchor — zero SipHeron API dependency ───────────────
        const onchainResult = await (0, vdr_core_1.anchorToSolana)({
            hash,
            keypair,
            network,
            metadata: options.name || filePath.split('/').pop() || filePath,
            ...(options.programId && { programId: options.programId }),
        });
        if (format === 'human')
            spinner.stop();
        const result = {
            id: onchainResult.pda,
            hash,
            transactionSignature: onchainResult.transactionSignature,
            blockNumber: 0,
            timestamp: new Date().toISOString(),
            status: 'confirmed',
            verificationUrl: onchainResult.explorerUrl,
            network,
            pda: onchainResult.pda,
            cost: onchainResult.cost,
        };
        if (format === 'json') {
            json_1.json.print(result);
            return;
        }
        if (format === 'quiet') {
            quiet_1.quiet.anchored(onchainResult.explorerUrl);
            return;
        }
        // Human-readable output
        console.log();
        console.log(chalk_1.default.green.bold('✓ Anchored to Solana'));
        console.log();
        human_1.human.label('Hash', hash.substring(0, 32) + '...');
        human_1.human.label('PDA', onchainResult.pda);
        human_1.human.label('Transaction', onchainResult.transactionSignature);
        human_1.human.label('Status', chalk_1.default.green('confirmed'));
        human_1.human.label('Network', `Solana ${network}`);
        human_1.human.label('Cost', `${onchainResult.cost} lamports`);
        console.log();
        console.log(chalk_1.default.gray('Solana Explorer:'));
        console.log(chalk_1.default.cyan(onchainResult.explorerUrl));
        console.log();
        console.log(chalk_1.default.gray('Verify this document later with:'));
        console.log(chalk_1.default.cyan(`  sipheron verify <file> --owner ${keypair.publicKey.toBase58()} --network ${network}`));
        console.log();
    }
    catch (error) {
        if (format === 'human')
            spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
