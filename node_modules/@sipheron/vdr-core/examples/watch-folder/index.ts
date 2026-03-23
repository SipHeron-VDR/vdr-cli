import { SipHeron, AuthenticationError, QuotaExceededError } from '@sipheron/vdr-core';
import chokidar from 'chokidar';
import fs from 'fs/promises';
import { createReadStream } from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import readline from 'readline';
import dns from 'dns';
import https from 'https';
import http from 'http';

dns.setDefaultResultOrder('ipv4first');
(https.globalAgent as any).family = 4;
(http.globalAgent as any).family = 4;

dotenv.config();

const WATCH_DIR = path.resolve(process.cwd(), 'dropzone');
const DONE_DIR = path.resolve(process.cwd(), 'completed-anchors');
const ERROR_DIR = path.resolve(process.cwd(), 'failed-anchors');

async function ensureDirectories() {
  await fs.mkdir(WATCH_DIR, { recursive: true });
  await fs.mkdir(DONE_DIR, { recursive: true });
  await fs.mkdir(ERROR_DIR, { recursive: true });
}

// Concurrency management mutex queue
const processingFiles = new Set<string>();
let ledgerMutex = Promise.resolve();

async function startSentinel() {
  console.log('\n=========================================');
  console.log('🦅 SipHeron VDR Sentinel (Automated Anchor)');
  console.log('=========================================\n');

  let apiKey = process.env.SIPHERON_API_KEY;
  if (!apiKey) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    apiKey = await new Promise<string>((resolve) => {
      rl.question('🔑 Enter your SipHeron API Key (devnet) OR press Enter to use public playground: ', (ans) => {
        rl.close();
        resolve(ans.trim());
      });
    });
  }

  const vdr = new SipHeron({ apiKey: apiKey || undefined, network: 'devnet' });

  try {
    if (apiKey) {
      await vdr.list({ limit: 1 });
      console.log('✅ Connected to SipHeron Network (devnet) via API Key');
    } else {
      console.log('✅ Connected to SipHeron Network (devnet playground mode - no API key)');
    }
  } catch (error) {
    if (error instanceof AuthenticationError) {
      console.error('❌ Failed to authenticate with SipHeron API. Invalid Key.');
      process.exit(1);
    }
  }

  await ensureDirectories();
  console.log(`\n⏳ Surveillance initiated on: ${WATCH_DIR}`);
  console.log(`   (Drop any document into this folder. We will wait for it to be fully written and closed before anchoring.)\n`);

  const watcher = chokidar.watch(WATCH_DIR, {
    ignored: /(^|[\/\\])\../, // ignore dotfiles
    persistent: true,
    awaitWriteFinish: {
      stabilityThreshold: 500,  // Wait 0.5s
      pollInterval: 100         // Allows the OS file stream to check faster
    }
  });

  const handleFileEvent = async (filePath: string) => {
    // 1. Prevent overlapping actions on the identical file while still streaming
    if (processingFiles.has(filePath)) return;
    processingFiles.add(filePath);

    const fileName = path.basename(filePath);

    try {
      const stats = await fs.stat(filePath);

      // Defensively abort 0-byte layout files. (like dragging "New Document" before writing data inside)
      if (stats.size === 0) {
        console.log(`\n[~] Ignoring 0-byte system layout file: ${fileName} (waiting for actual content...)`);
        return; 
      }

      console.log(`\n[+] Detected & Secured New Asset: ${fileName}`);
      console.log(`    -> Hashing payload in zero-knowledge space...`);
      const fileBuffer = await fs.readFile(filePath);

      const start = Date.now();
      const receipt = await vdr.anchor({
        file: fileBuffer,
        name: fileName,
        metadata: {
          source: 'vdr-sentinel-daemon',
          processedAt: new Date().toISOString(),
          bytes: stats.size.toString()
        }
      });
      const latency = Date.now() - start;

      console.log(`    -> 🔗 Anchored to Solana PoH in ${latency}ms`);
      console.log(`    -> Hash Sequence : ${receipt.hash}`);
      console.log(`    -> Status        : ${receipt.status}`);
      console.log(`    -> Verification  : ${receipt.verificationUrl}`);

      const donePath = path.join(DONE_DIR, fileName);
      await fs.rename(filePath, donePath);
      
      const receiptPath = path.join(DONE_DIR, `${fileName}.receipt.json`);
      await fs.writeFile(receiptPath, JSON.stringify(receipt, null, 2));

      // Safely lock the Master Ledger file IO if multiple files drop in simultaneously
      ledgerMutex = ledgerMutex.then(async () => {
        const ledgerPath = path.join(DONE_DIR, 'anchored_hashes.json');
        let ledger: any[] = [];
        try {
          const data = await fs.readFile(ledgerPath, 'utf-8');
          ledger = JSON.parse(data);
        } catch (err) { } // If ledger doesnt exist yet it falls through seamlessly

        ledger.push({
          fileName,
          hash: receipt.hash,
          status: receipt.status,
          timestamp: new Date().toISOString(),
          verificationUrl: receipt.verificationUrl,
          metadata: receipt.name,
          bytes: stats.size
        });
        
        await fs.writeFile(ledgerPath, JSON.stringify(ledger, null, 2));
      }).catch(err => console.error("   ❌ Ledger Write Interrupted:", err));
      
      await ledgerMutex;
      console.log(`    ✅ Escrowed safely into /completed-anchors ledgers`);

    } catch (error) {
      if ((error as any).code === 'ENOENT') {
         // File was probably deleted by IDE or user quickly - silent ignore
         return;
      }
      console.error(`    ❌ Failed to anchor ${fileName}:`);
      if (error instanceof QuotaExceededError) {
        console.error(`       [CRITICAL] Account quota exhausted.`);
      } else {
        console.error(`       ${error instanceof Error ? error.message : String(error)}`);
      }

      try {
        const errorPath = path.join(ERROR_DIR, fileName);
        await fs.rename(filePath, errorPath);
        console.log(`    ⚠️ Moved volatile asset to /failed-anchors`);
      } catch (e) {}
    } finally {
       // Release the file memory lock from our stack queue
      processingFiles.delete(filePath);
    }
  };

  // Dual listener model ensures if a text editor updates a layout file natively we still intercept it downstream
  watcher.on('add', handleFileEvent);
  watcher.on('change', handleFileEvent);
}

startSentinel().catch(console.error);
