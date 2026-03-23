"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.whoamiCommand = void 0;
const commander_1 = require("commander");
const config_1 = require("../config");
const errors_1 = require("../utils/errors");
const human_1 = require("../output/human");
const json_1 = require("../output/json");
const chalk_1 = __importDefault(require("chalk"));
const axios_1 = __importDefault(require("axios"));
exports.whoamiCommand = new commander_1.Command('whoami')
    .description('Show current account details')
    .option('-f, --format <format>', 'Output format: human, json', 'human')
    .action(async (options) => {
    if (!config_1.config.isAuthenticated()) {
        console.log(chalk_1.default.yellow('\nNot logged in. Running in playground mode.\n'));
        console.log(chalk_1.default.gray('Run: sipheron login'));
        console.log(chalk_1.default.gray('Or get a free key at sipheron.com\n'));
        return;
    }
    try {
        const network = config_1.config.getNetwork();
        const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com';
        const response = await axios_1.default.get(`${baseUrl}/auth/verify-key`, {
            headers: { 'x-api-key': config_1.config.getApiKey() }
        });
        const usageResponse = await axios_1.default.get(`${baseUrl}/api/usage`, {
            headers: { 'x-api-key': config_1.config.getApiKey() }
        }).catch(() => null);
        const account = response.data;
        const org = account.organization || {};
        const user = account.user || {};
        const usage = usageResponse ? usageResponse.data : null;
        if (options.format === 'json') {
            json_1.json.print({ ...account, usage });
            return;
        }
        console.log();
        human_1.human.label('Organization', org.name || 'User');
        human_1.human.label('Email', user.email || 'Unknown');
        human_1.human.label('Plan', org.plan || 'free');
        if (usage && usage.quota) {
            human_1.human.label('Anchors used', `${(usage.quota.used || 0).toLocaleString()} / ` +
                `${(usage.quota.limit || 100).toLocaleString()} this month`);
        }
        else {
            human_1.human.label('Anchors used', 'N/A');
        }
        human_1.human.label('Network', `Solana ${config_1.config.getNetwork()}`);
        console.log();
    }
    catch (error) {
        (0, errors_1.handleError)(error);
    }
});
