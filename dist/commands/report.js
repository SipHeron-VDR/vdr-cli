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
exports.reportCommand = void 0;
const commander_1 = require("commander");
const vdr_core_1 = require("@sipheron/vdr-core");
const spinner_1 = require("../utils/spinner");
const errors_1 = require("../utils/errors");
const config_1 = require("../config");
const chalk_1 = __importDefault(require("chalk"));
const fs = __importStar(require("fs"));
const path_1 = require("path");
exports.reportCommand = new commander_1.Command('report')
    .description('Generate a human-readable integrity report for a set of documents')
    .option('--anchors <ids>', 'Comma-separated list of anchor IDs')
    .option('--from <date>', 'Start date for filtering anchors (YYYY-MM-DD)')
    .option('--to <date>', 'End date for filtering anchors (YYYY-MM-DD)')
    .option('--tag <tags>', 'Filter by tag (e.g. type:contract)')
    .option('--format <format>', 'Output format (currently only pdf supported)', 'pdf')
    .option('--output <filename>', 'Output file name')
    .option('-n, --network <network>', 'Network: devnet, mainnet', 'mainnet')
    .action(async (options) => {
    const spinner = (0, spinner_1.createSpinner)('Generating integrity report...').start();
    try {
        const apiKey = config_1.config.getApiKey();
        const network = options.network;
        const baseUrl = process.env.SIPHERON_API_URL || undefined;
        const sipheron = new vdr_core_1.SipHeron({ apiKey, network, baseUrl });
        if (options.format !== 'pdf') {
            spinner.stop();
            console.error(chalk_1.default.red(`\n✗ Format ${options.format} is not supported. Use --format pdf\n`));
            process.exit(1);
        }
        let anchors = [];
        if (options.anchors) {
            // Fetch specific anchors
            const ids = options.anchors.split(',').map((id) => id.trim());
            for (const id of ids) {
                try {
                    const anchor = await sipheron.getStatus(id);
                    anchors.push(anchor);
                }
                catch (e) {
                    console.warn(chalk_1.default.yellow(`\nWarning: Could not fetch anchor ${id}`));
                }
            }
        }
        else {
            // Fetch multiple based on from, to, tags
            let page = 1;
            let hasMore = true;
            while (hasMore) {
                const res = await sipheron.list({
                    page,
                    limit: 100,
                    from: options.from,
                    to: options.to,
                    tag: options.tag
                });
                anchors.push(...res.records);
                if (page >= res.pages) {
                    hasMore = false;
                }
                else {
                    page++;
                }
            }
        }
        if (anchors.length === 0) {
            spinner.stop();
            console.error(chalk_1.default.yellow('\nNo anchors found matching the criteria.\n'));
            process.exit(0);
        }
        let dateRangeStr = '';
        if (options.from && options.to) {
            dateRangeStr = `${options.from} to ${options.to}`;
        }
        else if (options.from) {
            dateRangeStr = `From ${options.from}`;
        }
        else if (options.to) {
            dateRangeStr = `Up to ${options.to}`;
        }
        const pdfBytes = await (0, vdr_core_1.generatePdfReport)({
            anchors,
            dateRangeStr,
            solanaNetwork: network,
            programId: 'siphTKt8W1Q1x4wQoV3yP1Nn8mFqw4kS3' // Or pull from config
        });
        const outputName = options.output || `integrity-report-${Date.now()}.pdf`;
        const outputPath = (0, path_1.resolve)(process.cwd(), outputName);
        fs.writeFileSync(outputPath, pdfBytes);
        spinner.stop();
        console.log(chalk_1.default.green(`\n✓ Integrity report generated successfully: ${outputName}\n`));
    }
    catch (error) {
        spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
