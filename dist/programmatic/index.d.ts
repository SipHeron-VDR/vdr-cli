import { AnchorResult, VerificationResult } from '@sipheron/vdr-core';
export interface AnchorFileOptions {
    name?: string;
    tags?: Record<string, string>;
    network?: 'devnet' | 'mainnet';
    apiKey?: string;
    algorithm?: 'sha256' | 'sha512' | 'blake3' | 'md5';
    previousAnchorId?: string;
}
export interface VerifyOptions {
    network?: 'devnet' | 'mainnet';
    apiKey?: string;
}
export declare function anchorFile(filePath: string, options?: AnchorFileOptions): Promise<AnchorResult>;
export declare function verifyFile(filePath: string, options?: VerifyOptions): Promise<VerificationResult>;
export declare function verifyHash(hash: string, options?: VerifyOptions): Promise<VerificationResult>;
export declare function getStatus(idOrHash: string, options?: VerifyOptions): Promise<AnchorResult>;
export declare function getChain(anchorId: string, options?: VerifyOptions): Promise<AnchorResult[]>;
