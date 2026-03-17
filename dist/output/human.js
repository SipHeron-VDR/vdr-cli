"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.human = void 0;
const chalk_1 = __importDefault(require("chalk"));
exports.human = {
    success: (message) => {
        console.log(chalk_1.default.green(`✓ ${message}`));
    },
    error: (message) => {
        console.log(chalk_1.default.red(`✗ ${message}`));
    },
    warning: (message) => {
        console.log(chalk_1.default.yellow(`⚠ ${message}`));
    },
    info: (message) => {
        console.log(chalk_1.default.cyan(message));
    },
    label: (key, value) => {
        const paddedKey = key.padEnd(16);
        console.log(`${chalk_1.default.gray(paddedKey)} ${value}`);
    },
    divider: () => {
        console.log(chalk_1.default.gray('─'.repeat(50)));
    },
    blank: () => console.log(),
    authentic: (anchor) => {
        console.log();
        console.log(chalk_1.default.green.bold('✓ AUTHENTIC'));
        console.log();
        console.log(chalk_1.default.gray('This document is identical to its anchored version.'));
        console.log();
        if (anchor.id)
            exports.human.label('Anchor ID', anchor.id);
        exports.human.label('Hash', anchor.hash);
        exports.human.label('Anchored', anchor.timestamp);
        exports.human.label('Block', anchor.blockNumber.toLocaleString());
        exports.human.label('Transaction', anchor.transactionSignature);
        exports.human.label('Explorer', `https://explorer.solana.com/tx/${anchor.transactionSignature}` +
            (anchor.network === 'devnet' ? '?cluster=devnet' : ''));
        console.log();
    },
    mismatch: () => {
        console.log();
        console.log(chalk_1.default.red.bold('✗ MISMATCH'));
        console.log();
        console.log(chalk_1.default.gray('This document differs from its anchored version.'));
        console.log(chalk_1.default.gray('It may have been modified after anchoring.'));
        console.log();
    },
    notFound: () => {
        console.log();
        console.log(chalk_1.default.yellow.bold('⚠ NOT FOUND'));
        console.log();
        console.log(chalk_1.default.gray('No anchor record found for this document.'));
        console.log(chalk_1.default.gray('The document may not have been anchored yet.'));
        console.log();
    },
    anchorResult: (result) => {
        console.log();
        console.log(chalk_1.default.green.bold('✓ Anchored successfully'));
        console.log();
        exports.human.label('Anchor ID', result.id);
        exports.human.label('Hash', result.hash.substring(0, 32) + '...');
        exports.human.label('Transaction', result.transactionSignature);
        exports.human.label('Block', result.blockNumber.toLocaleString());
        exports.human.label('Timestamp', result.timestamp);
        exports.human.label('Status', chalk_1.default.green(result.status));
        exports.human.label('Network', `Solana ${result.network}`);
        console.log();
        console.log(chalk_1.default.gray('Verification URL:'));
        console.log(chalk_1.default.cyan(result.verificationUrl));
        console.log();
        console.log(chalk_1.default.gray('Share this URL to let anyone verify this document.'));
        console.log();
    }
};
