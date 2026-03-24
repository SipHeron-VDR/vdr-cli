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
Object.defineProperty(exports, "__esModule", { value: true });
exports.anchorFile = anchorFile;
exports.verifyFile = verifyFile;
exports.verifyHash = verifyHash;
exports.getStatus = getStatus;
exports.getChain = getChain;
const vdr_core_1 = require("@sipheron/vdr-core");
const config_1 = require("../config");
const fs_1 = require("fs");
const file_1 = require("../utils/file");
function getSipheronInstance(options) {
    const apiKey = options.apiKey || process.env.SIPHERON_API_KEY || config_1.config.getApiKey();
    if (!apiKey) {
        throw new Error('API key is required. Pass in options, set SIPHERON_API_KEY, or run `sipheron login`.');
    }
    const network = options.network || config_1.config.getNetwork() || 'devnet';
    const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com';
    return new vdr_core_1.SipHeron({ apiKey, network, baseUrl });
}
async function anchorFile(filePath, options = {}) {
    const sipheron = getSipheronInstance(options);
    if (!(0, fs_1.existsSync)(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const { statSync } = await Promise.resolve().then(() => __importStar(require('fs')));
    const stats = statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    const algorithm = options.algorithm || 'sha256';
    let hash;
    if (fileSizeMB > 50) {
        hash = await (0, vdr_core_1.hashFileWithProgress)(filePath, () => { });
    }
    else {
        const file = (0, file_1.readFileAsBuffer)(filePath);
        hash = await (0, vdr_core_1.hashDocument)(file, { algorithm });
    }
    const name = options.name || filePath.split('/').pop() || filePath;
    return sipheron.anchor({
        hash,
        hashAlgorithm: algorithm,
        name,
        previousAnchorId: options.previousAnchorId
        // Tags might be supported via API if passed through. We assume `tags` is ignored or handled.
    });
}
async function verifyFile(filePath, options = {}) {
    const sipheron = getSipheronInstance(options);
    if (!(0, fs_1.existsSync)(filePath)) {
        throw new Error(`File not found: ${filePath}`);
    }
    const { statSync } = await Promise.resolve().then(() => __importStar(require('fs')));
    const stats = statSync(filePath);
    const fileSizeMB = stats.size / (1024 * 1024);
    let hash;
    if (fileSizeMB > 50) {
        hash = await (0, vdr_core_1.hashFileWithProgress)(filePath, () => { });
    }
    else {
        const file = (0, file_1.readFileAsBuffer)(filePath);
        hash = await (0, vdr_core_1.hashDocument)(file, { algorithm: 'sha256' });
    }
    return sipheron.verify({ hash });
}
async function verifyHash(hash, options = {}) {
    const sipheron = getSipheronInstance(options);
    return sipheron.verify({ hash });
}
async function getStatus(idOrHash, options = {}) {
    const sipheron = getSipheronInstance(options);
    return sipheron.getStatus(idOrHash);
}
async function getChain(anchorId, options = {}) {
    const sipheron = getSipheronInstance(options);
    return sipheron.anchors.getVersionChain(anchorId);
}
