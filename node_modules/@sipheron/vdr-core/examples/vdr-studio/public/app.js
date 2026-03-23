const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');
const fileInfo = document.getElementById('fileInfo');
const fileName = document.getElementById('fileName');
const fileSize = document.getElementById('fileSize');
const clearFileBtn = document.getElementById('clearFile');

// Buttons
const btnAnalyze = document.getElementById('btnAnalyze');
const btnVerify = document.getElementById('btnVerify');
const btnAnchor = document.getElementById('btnAnchor');

// Views
const resultsView = document.getElementById('resultsView');
const resHash = document.getElementById('resHash');
const resPda = document.getElementById('resPda');
const verifyOutcome = document.getElementById('verifyOutcome');
const loader = document.getElementById('engineLoader');

let currentFile = null;

// Drag and drop UI logic
dropzone.addEventListener('click', () => fileInput.click());
dropzone.addEventListener('dragover', (e) => { e.preventDefault(); dropzone.style.borderColor = 'var(--primary)'; });
dropzone.addEventListener('dragleave', (e) => { e.preventDefault(); dropzone.style.borderColor = ''; });
dropzone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropzone.style.borderColor = '';
  if (e.dataTransfer.files.length) handleFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', (e) => {
  if (e.target.files.length) handleFile(e.target.files[0]);
});

clearFileBtn.addEventListener('click', () => {
  currentFile = null;
  fileInput.value = '';
  dropzone.classList.remove('hidden');
  fileInfo.classList.add('hidden');
  resetResults();
  updateButtons();
});

function handleFile(file) {
  currentFile = file;
  fileName.textContent = file.name;
  fileSize.textContent = formatBytes(file.size);
  dropzone.classList.add('hidden');
  fileInfo.classList.remove('hidden');
  resetResults();
  updateButtons();
}

function formatBytes(bytes, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

function updateButtons() {
  const hasFile = !!currentFile;
  btnAnalyze.disabled = !hasFile;
  btnVerify.disabled = !hasFile;
  btnAnchor.disabled = !hasFile;
}

function resetResults() {
  resultsView.classList.add('hidden');
  verifyOutcome.classList.add('hidden');
  verifyOutcome.className = 'outcome-box hidden';
  verifyOutcome.innerHTML = '';
}

function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }

// Actions
btnAnalyze.addEventListener('click', async () => {
  if (!currentFile) return;
  showLoader();
  const formData = new FormData();
  formData.append('document', currentFile);

  try {
    const res = await fetch('/api/analyze', { method: 'POST', body: formData });
    const data = await res.json();
    if (res.ok) {
        resHash.textContent = data.hash;
        resPda.textContent = data.pda;
        resultsView.classList.remove('hidden');
        verifyOutcome.classList.add('hidden');
    } else throw new Error(data.error);
  } catch(err) {
    alert("API Error: " + err.message);
  } finally { hideLoader(); }
});

btnVerify.addEventListener('click', async () => {
    if (!currentFile) return;
    showLoader();
    const formData = new FormData();
    formData.append('document', currentFile);
    // Supplying a deterministic dev wallet public key to check for
    // formData.append('ownerPublicKey', 'BCyJrZtirhAKvYQom3aTfedoAZNJ3q4yD4puqGoUvg4D'); 
  
    try {
      const res = await fetch('/api/verify', { method: 'POST', body: formData });
      const data = await res.json();
      
      resultsView.classList.remove('hidden');
      
      if (res.ok) {
          verifyOutcome.classList.remove('hidden');
          // Update Hash/Pda boxes to ensure they flow chronologically
          if (data.hash) resHash.textContent = data.hash;
          if (data.pda) resPda.textContent = data.pda;
  
          if (data.authentic) {
              verifyOutcome.className = 'outcome-box outcome-success';
              verifyOutcome.innerHTML = `<span><strong>Authentic!</strong> Found valid signature directly parsing RPC PDA root blocks matching timestamp ${new Date(data.timestamp * 1000).toLocaleString()}.</span>`;
          } else {
              verifyOutcome.className = 'outcome-box outcome-warning';
              verifyOutcome.innerHTML = `<span><strong>Not Found On Chain.</strong> No deterministic record exists or owner signature mismatch.</span>`;
          }
      } else throw new Error(data.error);
    } catch(err) {
        verifyOutcome.classList.remove('hidden');
        verifyOutcome.className = 'outcome-box outcome-error';
        verifyOutcome.innerHTML = `<span>⚙️ <strong>RPC Polling Failed:</strong> ${err.message}</span>`;
    } finally { hideLoader(); }
});
  
btnAnchor.addEventListener('click', async () => {
    if (!currentFile) return;
    showLoader();
    const formData = new FormData();
    formData.append('document', currentFile);
  
    try {
      const res = await fetch('/api/anchor', { method: 'POST', body: formData });
      const data = await res.json();
      
      resultsView.classList.remove('hidden');
      verifyOutcome.classList.remove('hidden');
      
      if (data.success) {
          verifyOutcome.className = 'outcome-box outcome-success';
          verifyOutcome.innerHTML = `<span><strong style="color:var(--primary)">Transaction Anchored Successfully!</strong><br/><br/>Hash written to the Solana Devnet via CLI Local Wallet!<br/><br/><a href="${data.url}" target="_blank" style="color:white; text-decoration:underline;">View on Explorer -></a></span>`;
      } else {
          verifyOutcome.className = 'outcome-box outcome-error';
          verifyOutcome.innerHTML = `<span><strong>Broadcast Failed:</strong> Wallet <code>${data.pubkey.slice(0,8)}...</code> rejected the payload.<br/><br/><small class="highlight">${data.details}</small></span>`;
      }
    } catch(err) {
        verifyOutcome.classList.remove('hidden');
        verifyOutcome.className = 'outcome-box outcome-error';
        verifyOutcome.innerHTML = `<span><strong>Failed to serialize directly:</strong> ${err.message}</span>`;
    } finally { hideLoader(); }
});
