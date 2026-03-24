import { 
  SipHeron, 
  AnchorResult, 
  VerificationResult,
  hashFileWithProgress,
  hashDocument
} from '@sipheron/vdr-core'
import { config } from '../config'
import { existsSync, readFileSync, statSync } from 'fs'
import { readFileAsBuffer } from '../utils/file'

export interface AnchorFileOptions {
  name?: string
  tags?: Record<string, string>
  network?: 'devnet' | 'mainnet'
  apiKey?: string
  algorithm?: 'sha256' | 'sha512' | 'blake3' | 'md5'
  previousAnchorId?: string
}

export interface VerifyOptions {
  network?: 'devnet' | 'mainnet'
  apiKey?: string
}

function getSipheronInstance(options: { network?: 'devnet' | 'mainnet'; apiKey?: string }) {
  const apiKey = options.apiKey || process.env.SIPHERON_API_KEY || config.getApiKey()
  if (!apiKey) {
    throw new Error('API key is required. Pass in options, set SIPHERON_API_KEY, or run `sipheron login`.')
  }
  const network = options.network || (config.getNetwork() as 'devnet' | 'mainnet') || 'devnet'
  const baseUrl = process.env.SIPHERON_API_URL || 'https://api.sipheron.com'
  return new SipHeron({ apiKey, network, baseUrl })
}

export async function anchorFile(filePath: string, options: AnchorFileOptions = {}): Promise<AnchorResult> {
  const sipheron = getSipheronInstance(options)
  
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const { statSync } = await import('fs')
  const stats = statSync(filePath)
  const fileSizeMB = stats.size / (1024 * 1024)
  const algorithm = options.algorithm || 'sha256'

  let hash: string
  if (fileSizeMB > 50) {
    hash = await hashFileWithProgress(filePath, () => {})
  } else {
    const file = readFileAsBuffer(filePath)
    hash = await hashDocument(file, { algorithm })
  }

  const name = options.name || filePath.split('/').pop() || filePath

  return sipheron.anchor({
    hash,
    hashAlgorithm: algorithm,
    name,
    previousAnchorId: options.previousAnchorId
    // Tags might be supported via API if passed through. We assume `tags` is ignored or handled.
  })
}

export async function verifyFile(filePath: string, options: VerifyOptions = {}): Promise<VerificationResult> {
  const sipheron = getSipheronInstance(options)
  
  if (!existsSync(filePath)) {
    throw new Error(`File not found: ${filePath}`)
  }

  const { statSync } = await import('fs')
  const stats = statSync(filePath)
  const fileSizeMB = stats.size / (1024 * 1024)

  let hash: string
  if (fileSizeMB > 50) {
    hash = await hashFileWithProgress(filePath, () => {})
  } else {
    const file = readFileAsBuffer(filePath)
    hash = await hashDocument(file, { algorithm: 'sha256' })
  }

  return sipheron.verify({ hash })
}

export async function verifyHash(hash: string, options: VerifyOptions = {}): Promise<VerificationResult> {
  const sipheron = getSipheronInstance(options)
  return sipheron.verify({ hash })
}

export async function getStatus(idOrHash: string, options: VerifyOptions = {}) {
  const sipheron = getSipheronInstance(options)
  return sipheron.getStatus(idOrHash)
}

export async function getChain(anchorId: string, options: VerifyOptions = {}) {
  const sipheron = getSipheronInstance(options)
  return sipheron.anchors.getVersionChain(anchorId)
}
