"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.statusCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const config_1 = require("../config");
const file_1 = require("../utils/file");
const spinner_1 = require("../utils/spinner");
const errors_1 = require("../utils/errors");
const human_1 = require("../output/human");
const json_1 = require("../output/json");
const web3_js_1 = require("@solana/web3.js");
const chalk_1 = __importDefault(require("chalk"));
exports.statusCommand = new commander_1.Command('status')
    .description('Check the on-chain or API status of an anchored document')
    .argument('<identifier>', 'SHA-256 hash or Anchor ID')
    .option('--owner <publicKey>', 'Solana public key (forces direct zero-API on-chain lookup)')
    .option('-f, --format <format>', 'Output format: human, json', 'human')
    .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('--program-id <id>', 'Custom Solana program ID (advanced)')
    .action(async (identifier, options) => {
    const network = options.network;
    const isId = identifier.startsWith('anc_') || identifier.includes('-');
    const validHash = (0, file_1.isValidHash)(identifier);
    if (!validHash && !isId) {
        console.error(chalk_1.default.red('\n✗ Invalid input. Must be a 64-character hex SHA-256 string or an Anchor ID.\n'));
        process.exit(3);
    }
    if (!options.owner) {
        if (!config_1.config.isAuthenticated()) {
            console.log(chalk_1.default.yellow('\n⚠  API key required for status check, OR --owner <publicKey> for direct on-chain lookup.\n'));
            console.log(chalk_1.default.gray('  Login:'));
            console.log(chalk_1.default.cyan(`    sipheron login\n`));
            console.log(chalk_1.default.gray('  Or on-chain zero-API lookup:'));
            console.log(chalk_1.default.cyan(`    sipheron status ${identifier.slice(0, 16)}... --owner <YourWalletPublicKey>\n`));
            process.exit(1);
        }
        const spinner = (0, spinner_1.createSpinner)('Fetching status from API...');
        if (options.format === 'human')
            spinner.start();
        try {
            const sipheron = new vdr_core_1.SipHeron({ apiKey: config_1.config.getApiKey(), network, baseUrl: process.env.SIPHERON_API_URL });
            const result = await sipheron.getStatus(identifier);
            if (options.format === 'human')
                spinner.stop();
            if (options.format === 'json') {
                json_1.json.print({ ...result, mode: 'api' });
                return;
            }
            console.log();
            human_1.human.label('Identifier', identifier);
            human_1.human.label('Hash', result.hash);
            human_1.human.label('Status', chalk_1.default.yellow(result.status));
            human_1.human.label('Network', `Solana ${result.network}`);
            if (result.verificationUrl) {
                console.log();
                console.log(chalk_1.default.gray('Verify it online:'));
                console.log(chalk_1.default.cyan(result.verificationUrl));
            }
            console.log();
            return;
        }
        catch (error) {
            if (options.format === 'human')
                spinner.stop();
            (0, errors_1.handleError)(error);
        }
    }
    // ── Direct on-chain fallback (requires --owner and strict hash) ─────────
    if (isId) {
        console.error(chalk_1.default.red('\n✗ Direct on-chain lookup requires a raw SHA-256 Hash, not an Anchor ID.\n'));
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
    const spinner = (0, spinner_1.createSpinner)('Reading from Solana...');
    if (options.format === 'human')
        spinner.start();
    try {
        // ── Direct on-chain read — zero SipHeron API dependency ─────────────────
        const result = await (0, vdr_core_1.verifyOnChain)({
            hash: identifier.toLowerCase(),
            network,
            ownerPublicKey: ownerPk,
            ...(options.programId && { programId: options.programId }),
        });
        // Derive PDA for display
        const pda = (0, vdr_core_1.deriveAnchorAddress)(identifier.toLowerCase(), ownerPk, (options.programId ? new web3_js_1.PublicKey(options.programId) : network));
        // Enrich with block timestamp via public RPC
        let blockTime;
        if (result.timestamp) {
            blockTime = new Date(result.timestamp * 1000).toISOString();
        }
        spinner.stop();
        if (options.format === 'json') {
            json_1.json.print({
                hash: identifier,
                pda: pda.toBase58(),
                authentic: result.authentic,
                isRevoked: result.isRevoked || false,
                owner: result.owner,
                timestamp: blockTime,
                metadata: result.metadata,
                network,
                mode: 'direct-onchain',
            });
            return;
        }
        console.log();
        human_1.human.label('Hash', identifier);
        human_1.human.label('PDA', pda.toBase58());
        human_1.human.label('Owner', result.owner || options.owner);
        human_1.human.label('Network', `Solana ${network}`);
        if (!result.authentic) {
            human_1.human.label('Status', chalk_1.default.yellow('NOT FOUND'));
            console.log();
            console.log(chalk_1.default.gray('No anchor record exists at this PDA on-chain.'));
            console.log();
            return;
        }
        if (result.isRevoked) {
            human_1.human.label('Status', chalk_1.default.red('REVOKED ✗'));
        }
        else {
            human_1.human.label('Status', chalk_1.default.green('CONFIRMED ✓'));
        }
        human_1.human.label('Anchored', blockTime || 'unknown');
        if (result.metadata) {
            human_1.human.label('Metadata', result.metadata);
        }
        console.log();
        console.log(chalk_1.default.gray('Mode: direct on-chain read — no API used'));
        console.log();
    }
    catch (error) {
        spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
