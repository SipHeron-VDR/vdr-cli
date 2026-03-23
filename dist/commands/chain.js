"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.chainCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const config_1 = require("../config");
const chalk_1 = __importDefault(require("chalk"));
const json_1 = require("../output/json");
exports.chainCommand = new commander_1.Command('chain')
    .description('Get the complete version linkage for a specific given anchor')
    .argument('<anchorId>', 'The ID of the anchor to trace')
    .option('--network <network>', 'Network: devnet, mainnet', 'devnet')
    .option('-f, --format <format>', 'Output format: human, json', 'human')
    .action(async (anchorId, options) => {
    const format = options.format;
    const network = options.network;
    const apiKey = config_1.config.getApiKey();
    if (!apiKey) {
        console.error(chalk_1.default.red('\n✗ API key is required to fetch version chains from the VDR registry. Please login first:\n  sipheron login\n'));
        process.exit(1);
    }
    try {
        const sipheron = new vdr_core_1.SipHeron({ apiKey, network });
        const chain = await sipheron.anchors.getVersionChain(anchorId);
        if (format === 'json') {
            json_1.json.print(chain);
            return;
        }
        if (!chain || chain.length === 0) {
            console.log(chalk_1.default.yellow('\nNo version chain found for this anchor.'));
            process.exit(0);
        }
        const rootMetadata = chain[0].name || chain[0].metadata?.name || 'Unknown Document';
        console.log(chalk_1.default.bold(`\n# Version Chain for: ${rootMetadata}`));
        console.log(chalk_1.default.gray('#'));
        let minDate = new Date(chain[0].timestamp);
        let maxDate = new Date(chain[chain.length - 1].timestamp);
        chain.forEach((version, index) => {
            const versionStr = chalk_1.default.gray(`v${index + 1}`.padEnd(3));
            const idStr = chalk_1.default.cyan(version.id ? (version.id.startsWith('anc_') ? version.id : 'anc_' + version.id.slice(0, 8)) : version.hash.slice(0, 12));
            const dateStr = chalk_1.default.dim(new Date(version.timestamp).toISOString().split('T')[0]);
            const isConfirmed = version.status.toLowerCase() === 'confirmed' || version.status.toLowerCase() === 'active';
            const statusStr = isConfirmed ? chalk_1.default.green('Confirmed ✓') : chalk_1.default.red('Revoked ✗');
            // Find text representation of metadata
            let metaStrText = '';
            if (version.name)
                metaStrText = version.name;
            else if (version.metadata && version.metadata.name)
                metaStrText = version.metadata.name;
            let metaStr = chalk_1.default.white(metaStrText || '');
            if (index === 0 && !metaStrText)
                metaStr = chalk_1.default.gray('(original)');
            const isCurrent = (version.id === anchorId || version.hash === anchorId);
            let line = `# ${versionStr} ${idStr.padEnd(14)} ${dateStr}  ${statusStr.padEnd(13)}  ${metaStr}`;
            console.log(line);
            if (isCurrent) {
                console.log(chalk_1.default.gray('#     ') + chalk_1.default.blue('(current)'));
            }
        });
        console.log(chalk_1.default.gray('#'));
        const diffTime = Math.abs(maxDate.getTime() - minDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const durationStr = diffDays > 0 ? `, spanning ${diffDays} days` : '';
        console.log(chalk_1.default.bold(`# ${chain.length} versions${durationStr}\n`));
    }
    catch (error) {
        console.error(chalk_1.default.red(`\n✗ Failed to fetch chain: ${error.message}\n`));
        process.exit(1);
    }
});
