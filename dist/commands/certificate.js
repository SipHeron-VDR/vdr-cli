"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.certificateCommand = void 0;
const commander_1 = require("commander");
const fs_1 = require("fs");
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const spinner_1 = require("../utils/spinner");
const chalk_1 = __importDefault(require("chalk"));
const axios_1 = __importDefault(require("axios"));
exports.certificateCommand = new commander_1.Command('certificate')
    .description('Download the PDF notarization certificate for an anchor')
    .argument('<id>', 'Anchor ID')
    .option('-o, --output <path>', 'Output file path')
    .action(async (id, options) => {
    if (!config_1.config.isAuthenticated()) {
        console.log(chalk_1.default.yellow('\nLogin required for certificates.\n'));
        console.log(chalk_1.default.gray('Run: sipheron login'));
        return;
    }
    const spinner = (0, spinner_1.createSpinner)('Generating certificate...');
    try {
        spinner.start();
        const network = config_1.config.getNetwork();
        const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com';
        const response = await axios_1.default.get(`${baseUrl}/api/hashes/${id}/certificate`, {
            headers: { 'x-api-key': config_1.config.getApiKey() },
            responseType: 'arraybuffer'
        });
        const pdf = response.data;
        spinner.stop();
        const outputPath = options.output ||
            `./sipheron-certificate-${id}.pdf`;
        (0, fs_1.writeFileSync)(outputPath, pdf);
        console.log(chalk_1.default.green(`\n✓ Certificate downloaded\n`));
        console.log(chalk_1.default.gray(`Saved to: ${outputPath}\n`));
    }
    catch (error) {
        spinner.stop();
        (0, errors_1.handleError)(error);
    }
});
