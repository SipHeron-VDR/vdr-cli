const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { Keypair, Connection } = require('@solana/web3.js');
const { 
  hashDocument, 
  deriveAnchorAddress, 
  verifyOnChain,
  anchorToSolana
} = require('@sipheron/vdr-core');

const app = express();
app.use(cors());
app.use(express.static('public'));

const upload = multer({ storage: multer.memoryStorage() });

// Endpoint to hash a document and derive its predicted PDA
app.post('/api/analyze', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Document missing' });
    
    // Convert arraybuffer from multer back to native Node Buffer
    const buffer = Buffer.from(req.file.buffer);
    const hash = await hashDocument(buffer);
    
    // In a real app, this would be the user's connected wallet address. 
    // For demo purposes, we will derive it against the CLI wallet pubkey
    let dummyOwner;
    try {
      const fs = require('fs');
      const os = require('os');
      const keypairPath = `${os.homedir()}/.config/solana/id.json`;
      const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      dummyOwner = Keypair.fromSecretKey(Uint8Array.from(secret));
    } catch(e) { dummyOwner = Keypair.generate(); }
    
    const pda = deriveAnchorAddress(hash, dummyOwner.publicKey, 'devnet');
    
    res.json({
      hash,
      pda: pda.toBase58(),
      size: req.file.size
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to verify a document on-chain directly
app.post('/api/verify', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Document missing' });
    
    // Use CLI Wallet as owner for demo consistency, since that is what we anchored with
    let ownerKeypair;
    try {
      const fs = require('fs');
      const os = require('os');
      const keypairPath = `${os.homedir()}/.config/solana/id.json`;
      const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      ownerKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    } catch(e) { ownerKeypair = Keypair.generate(); }

    const ownerPublicKey = ownerKeypair.publicKey.toBase58();

    console.log(`Verifying document of size ${req.file.size} against owner ${ownerPublicKey}`);

    const hash = await hashDocument(Buffer.from(req.file.buffer));

    const result = await verifyOnChain({
      hash: hash,
      ownerPublicKey: ownerPublicKey,
      network: 'devnet'
    });

    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to simulate an anchor transaction
app.post('/api/anchor', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Document missing' });

    // Load actual local CLI wallet so it has SOL to broadcast
    let anchorKeypair;
    try {
      const fs = require('fs');
      const os = require('os');
      const keypairPath = `${os.homedir()}/.config/solana/id.json`;
      const secret = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
      anchorKeypair = Keypair.fromSecretKey(Uint8Array.from(secret));
    } catch (e) {
      console.warn("Could not load ~/.config/solana/id.json. Using empty dummy wallet.");
      anchorKeypair = Keypair.generate();
    }

    try {
        const result = await anchorToSolana({
          buffer: Buffer.from(req.file.buffer),
          keypair: anchorKeypair,
          network: 'devnet',
          metadata: 'Demo App Anchor'
        });
        
        res.json({ success: true, tx: result.transactionSignature, url: result.explorerUrl });
    } catch(err) {
        res.json({ 
            success: false, 
            message: 'Transaction serialized but dropped by Solana node',
            details: err.message,
            pubkey: anchorKeypair.publicKey.toBase58()
        });
    }

  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3050;
app.listen(PORT, () => {
  console.log(`✅ SipHeron Demo API running on http://localhost:${PORT}`);
});
