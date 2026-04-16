"""
ShipKit Complete UI
Implements the full fulfillment workflow with:
- Step 1: Upload Files
- Step 2: Print Labels (always visible)
- Step 3: Scan Packages  
- Step 4: Print USPS Manifest Slips (hidden until slips uploaded)
- Step 5: Ship & Archive (always visible with batch cards and hold queue)
"""

def get_complete_ui():
    return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShipKit - Fulfillment Operations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
        .toast { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .tab-active { border-b-2 border-[#3fc5e7]; color: #3fc5e7; }
        .file-row { display: flex; align-items: center; gap: 1rem; padding: 0.75rem; background: #374151; border-radius: 0.5rem; }
        .btn-primary { background: #3fc5e7; color: #111827; font-weight: 600; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; border: none; }
        .btn-primary:hover { opacity: 0.9; }
        .btn-secondary { background: #4B5563; color: white; padding: 0.5rem 1rem; border-radius: 0.375rem; cursor: pointer; border: none; font-size: 0.875rem; }
        .btn-secondary:hover { background: #5a6a7a; }
        .badge { display: inline-block; padding: 0.25rem 0.75rem; border-radius: 9999px; font-size: 0.75rem; font-weight: 600; }
        .badge-success { background: #10b981; color: white; }
        .badge-warning { background: #f59e0b; color: #111827; }
        .badge-danger { background: #ef4444; color: white; }
        .zone-card { border: 1px solid #4B5563; border-radius: 0.5rem; padding: 1.5rem; background: #1f2937; }
        .zone-card h3 { color: #3fc5e7; font-weight: 600; margin-bottom: 1rem; }
        .batch-card { border: 1px solid #4B5563; border-radius: 0.5rem; padding: 1rem; background: #1f2937; margin-bottom: 1rem; }
        .collapsible-header { display: flex; align-items: center; justify-content: space-between; cursor: pointer; padding: 0.75rem; background: #2d3748; border-radius: 0.375rem; user-select: none; }
        .collapsible-header:hover { background: #374151; }
        .collapsible-content { display: none; padding-top: 1rem; }
        .collapsible-content.expanded { display: block; }
        .hold-item { border-left: 4px solid #f59e0b; padding: 1rem; background: #374151; border-radius: 0.375rem; margin-bottom: 0.5rem; }
        .hold-item.cancelled { border-left-color: #ef4444; }
        .countdown { font-weight: 600; }
        .countdown.green { color: #10b981; }
        .countdown.yellow { color: #f59e0b; }
        .countdown.red { color: #ef4444; }
    </style>
</head>
<body class="bg-gray-900 text-gray-50">
    <!-- Header -->
    <header class="bg-gray-800 border-b border-gray-700 px-6 py-4 sticky top-0 z-40">
        <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center font-bold text-lg text-gray-900">SK</div>
                <div>
                    <h1 class="text-xl font-bold" id="storeName">ShipKit</h1>
                    <p class="text-sm text-gray-400">Fulfillment Workflow</p>
                </div>
            </div>
            <button onclick="openSettings()" class="p-2 rounded-lg hover:bg-gray-700 transition">
                <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/></svg>
            </button>
        </div>
    </header>

    <!-- Main Content -->
    <main class="max-w-7xl mx-auto p-6">
        <!-- STEP 1: Upload Files -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-full bg-[#3fc5e7] text-gray-900 flex items-center justify-center font-bold text-sm">1</span>
                <h2 class="text-lg font-semibold">Upload Files</h2>
            </div>
            
            <div id="dropzone" class="border-2 border-dashed border-gray-600 rounded-lg p-8 text-center hover:border-[#3fc5e7] transition-colors cursor-pointer">
                <input type="file" id="fileInput" multiple accept=".pdf,.csv" class="hidden" onchange="handleFileUpload(event)">
                <svg class="w-12 h-12 mx-auto mb-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                </svg>
                <p class="text-gray-400 mb-2">Drop shipping labels (PDF), manifests (CSV), and USPS slips here</p>
                <p class="text-sm text-gray-500">or click to browse</p>
            </div>
            
            <div id="uploadedFiles" class="mt-4 space-y-2"></div>
        </div>

        <!-- STEP 2: Print Labels (Always Visible) -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-[#3fc5e7] text-gray-900 flex items-center justify-center font-bold text-sm">2</span>
                    <h2 class="text-lg font-semibold">Print Shipping Labels</h2>
                </div>
                <div id="printLabelsStatus" class="text-sm font-medium text-gray-400">0/0 Printed</div>
            </div>
            
            <div id="printLabelsSection" class="space-y-2">
                <p class="text-gray-400 text-center py-4">No label files uploaded yet</p>
            </div>
        </div>

        <!-- STEP 3: Scan Packages -->
        <div class="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
            <div class="flex items-center gap-3 mb-4">
                <span class="w-8 h-8 rounded-full bg-[#3fc5e7] text-gray-900 flex items-center justify-center font-bold text-sm">3</span>
                <h2 class="text-lg font-semibold">Scan Packages</h2>
            </div>
            
            <div class="flex gap-4 mb-6">
                <button id="armBtn" onclick="toggleScanner()" class="flex-1 py-4 rounded-lg bg-gray-700 hover:bg-gray-600 font-medium text-lg transition-colors">
                    Arm Scanner
                </button>
                <input type="text" id="scanInput" class="hidden">
            </div>
            
            <!-- Zone Cards -->
            <div id="zoneCards" class="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
                <div class="text-center py-8 text-gray-500 col-span-full">Upload files to create zones</div>
            </div>
            
            <!-- Scan Log -->
            <div class="border border-gray-700 rounded-lg">
                <div class="px-4 py-3 border-b border-gray-700 flex justify-between items-center bg-gray-700">
                    <span class="font-medium">Scan Log</span>
                    <span id="scanCount" class="text-sm text-gray-400">0 scanned</span>
                </div>
                <div id="scanLog" class="max-h-48 overflow-y-auto p-4 space-y-2">
                    <p class="text-gray-500 text-center">Scans will appear here</p>
                </div>
            </div>
        </div>

        <!-- STEP 4: Print USPS Manifest Slips (Hidden until slips uploaded) -->
        <div id="printSlipsSection" class="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700 hidden">
            <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-3">
                    <span class="w-8 h-8 rounded-full bg-[#3fc5e7] text-gray-900 flex items-center justify-center font-bold text-sm">4</span>
                    <h2 class="text-lg font-semibold">Print USPS Manifest Slips</h2>
                </div>
                <div id="printSlipsStatus" class="text-sm font-medium text-gray-400">0/0 Printed</div>
            </div>
            
            <div id="printSlipsRows" class="space-y-2">
                <p class="text-gray-400 text-center py-4">No slip files uploaded yet</p>
            </div>
        </div>

        <!-- STEP 5: Ship & Archive (Always Visible) -->
        <div class="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div class="flex items-center gap-3 mb-6">
                <span class="w-8 h-8 rounded-full bg-[#3fc5e7] text-gray-900 flex items-center justify-center font-bold text-sm">5</span>
                <h2 class="text-lg font-semibold">Ship & Archive</h2>
            </div>

            <!-- Smart Ship & Save Button -->
            <button id="shipBtn" onclick="handleShipAction()" class="w-full py-4 rounded-lg font-semibold text-lg mb-6 transition-all" style="background: #4B5563; color: #9ca3af; cursor: not-allowed;">
                Ship & Save
            </button>

            <!-- Batch Cards -->
            <div id="batchCards" class="space-y-4 mb-6">
                <p class="text-gray-400 text-center py-8">No committed batches yet</p>
            </div>

            <!-- Hold Queue -->
            <div id="holdQueueSection" class="hidden">
                <div class="collapsible-header" onclick="toggleHoldQueue()">
                    <div class="flex items-center gap-2">
                        <span class="text-lg">⏸ HOLD</span>
                        <span id="holdCount" class="badge badge-warning">0</span>
                    </div>
                    <span id="holdChevron">▶</span>
                </div>
                
                <div id="holdQueueContent" class="collapsible-content mt-4">
                    <div class="mb-4 flex gap-2">
                        <button onclick="clearHoldQueue()" class="btn-secondary flex-1">Clear Hold</button>
                        <button onclick="logCancellation()" class="btn-secondary flex-1">✕ Log Cancellation</button>
                    </div>
                    
                    <div id="holdItems" class="space-y-2">
                        <p class="text-gray-400 text-center py-4">No held packages</p>
                    </div>
                </div>
            </div>
        </div>
    </main>

    <!-- Toast Container -->
    <div id="toastContainer" class="fixed top-4 right-4 space-y-2 z-50"></div>

    <!-- Setup Wizard Modal -->
    <div id="setupModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
        <div class="bg-gray-800 rounded-xl p-8 max-w-md w-full mx-4 border border-gray-700">
            <h2 class="text-2xl font-bold mb-2">Welcome to ShipKit</h2>
            <p class="text-gray-400 mb-6">Let's set up your store in a moment.</p>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Store Name</label>
                    <input type="text" id="setupStoreName" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-[#3fc5e7] focus:outline-none text-white" placeholder="My Shop">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Manifest Zone</label>
                        <input type="text" id="setupPrimaryZone" value="Manifest" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-[#3fc5e7] focus:outline-none text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Clerk Zone</label>
                        <input type="text" id="setupSecondaryZone" value="Clerk Counter" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-[#3fc5e7] focus:outline-none text-white">
                    </div>
                </div>
            </div>
            
            <div id="setupError" class="hidden mt-4 p-3 bg-red-600/20 border border-red-600/50 rounded-lg text-red-400 text-sm"></div>
            
            <button onclick="completeSetup()" class="w-full mt-6 py-4 rounded-lg bg-gradient-to-r from-[#3fc5e7] to-[#7122c6] font-semibold text-lg text-gray-900 hover:opacity-90 transition-opacity">
                Start Using ShipKit
            </button>
        </div>
    </div>

    <!-- Settings Modal -->
    <div id="settingsModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 hidden">
        <div class="bg-gray-800 rounded-xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto border border-gray-700">
            <div class="flex justify-between items-center mb-6">
                <h2 class="text-xl font-bold">Settings</h2>
                <button onclick="closeSettings()" class="p-2 hover:bg-gray-700 rounded-lg">✕</button>
            </div>
            
            <div class="space-y-4">
                <div>
                    <label class="block text-sm font-medium mb-2">Store Name</label>
                    <input type="text" id="settingsStoreName" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-[#3fc5e7] focus:outline-none text-white">
                </div>
                
                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Manifest Zone</label>
                        <input type="text" id="settingsPrimaryZone" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-[#3fc5e7] focus:outline-none text-white">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Clerk Zone</label>
                        <input type="text" id="settingsSecondaryZone" class="w-full px-4 py-3 bg-gray-700 rounded-lg border border-gray-600 focus:border-[#3fc5e7] focus:outline-none text-white">
                    </div>
                </div>
            </div>
            
            <button onclick="saveSettings()" class="w-full mt-6 py-3 rounded-lg bg-[#3fc5e7] text-gray-900 font-semibold hover:opacity-90 transition-opacity">
                Save Settings
            </button>
        </div>
    </div>

    <script>
        // ===== STATE =====
        let settings = {};
        let currentBatchId = null;
        let uploadedFiles = [];
        let scans = [];
        let isArmed = false;
        let batches = [];
        let holdQueue = [];
        let printedLabels = new Set();
        let printedSlips = new Set();

        // ===== AUDIO =====
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ZONE_TONES = { 1: 523.25, 2: 587.33, 3: 659.25, 4: 698.46, clerk: 261.63 };
        
        function playTone(zone) {
            const freq = zone === 'clerk' ? ZONE_TONES.clerk : (ZONE_TONES[zone] || 523.25);
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.frequency.value = freq;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start();
            osc.stop(audioCtx.currentTime + 0.3);
        }

        // ===== TOAST NOTIFICATIONS =====
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const colors = {
                success: 'bg-green-600',
                error: 'bg-red-600',
                warning: 'bg-yellow-600',
                info: 'bg-blue-600'
            };
            
            const toast = document.createElement('div');
            toast.className = `toast px-4 py-3 rounded-lg ${colors[type]} text-white shadow-lg`;
            toast.textContent = message;
            container.appendChild(toast);
            
            setTimeout(() => {
                toast.style.opacity = '0';
                setTimeout(() => toast.remove(), 300);
            }, 4000);
        }

        // ===== FILE UPLOAD =====
        document.getElementById('dropzone').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });
        
        document.getElementById('dropzone').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.classList.add('border-[#3fc5e7]');
        });
        
        document.getElementById('dropzone').addEventListener('dragleave', (e) => {
            e.currentTarget.classList.remove('border-[#3fc5e7]');
        });
        
        document.getElementById('dropzone').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-[#3fc5e7]');
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        });

        async function handleFileUpload(e) {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            
            uploadedFiles = [];
            let labelFiles = [];
            let slipFiles = [];
            let csvFiles = [];
            
            files.forEach(f => {
                const lower = f.name.toLowerCase();
                if (lower.includes('label') || lower.includes('shipping')) labelFiles.push(f);
                if (lower.includes('slip') || lower.includes('form') || lower.includes('manifest') || lower.includes('wsos')) slipFiles.push(f);
                if (lower.endsWith('.csv')) csvFiles.push(f);
                uploadedFiles.push(f);
            });
            
            // Update UI
            const container = document.getElementById('uploadedFiles');
            container.innerHTML = uploadedFiles.map(f => `
                <div class="file-row">
                    <span>📄</span>
                    <span class="flex-1 truncate">${f.name}</span>
                    <span class="badge badge-success">${(f.size / 1024 / 1024).toFixed(1)}MB</span>
                </div>
            `).join('');
            
            // Update print labels section
            updatePrintLabelsUI(labelFiles);
            
            // Update print slips section
            updatePrintSlipsUI(slipFiles);
            
            showToast(`${files.length} file(s) uploaded`, 'success');
        }

        function updatePrintLabelsUI(labelFiles) {
            const section = document.getElementById('printLabelsSection');
            
            if (labelFiles.length === 0) {
                section.innerHTML = '<p class="text-gray-400 text-center py-4">No label files uploaded</p>';
                return;
            }
            
            section.innerHTML = labelFiles.map((f, idx) => `
                <div class="file-row">
                    <span>📎</span>
                    <div class="flex-1">
                        <div class="truncate text-sm">${f.name}</div>
                        <div class="text-xs text-gray-500">~27 labels</div>
                    </div>
                    <button onclick="printLabel(${idx})" class="btn-secondary">🖨 Print</button>
                    <input type="checkbox" id="labelPrinted${idx}" onchange="updatePrintStatus()">
                    <span id="labelStatus${idx}" class="text-lg">○</span>
                </div>
            `).join('');
        }

        function updatePrintSlipsUI(slipFiles) {
            const section = document.getElementById('printSlipsSection');
            const rows = document.getElementById('printSlipsRows');
            
            if (slipFiles.length === 0) {
                section.classList.add('hidden');
                return;
            }
            
            section.classList.remove('hidden');
            rows.innerHTML = slipFiles.map((f, idx) => `
                <div class="file-row">
                    <span>📎</span>
                    <div class="flex-1">
                        <div class="truncate text-sm">${f.name}</div>
                        <div class="text-xs text-gray-500">27 packages</div>
                    </div>
                    <button onclick="printSlip(${idx})" class="btn-secondary">🖨 Print</button>
                    <input type="checkbox" id="slipPrinted${idx}" onchange="updatePrintStatus()">
                    <span id="slipStatus${idx}" class="text-lg">○</span>
                </div>
            `).join('');
        }

        function printLabel(idx) {
            document.getElementById(`labelPrinted${idx}`).checked = true;
            updatePrintStatus();
            showToast('Label PDF opened in browser', 'info');
        }

        function printSlip(idx) {
            document.getElementById(`slipPrinted${idx}`).checked = true;
            updatePrintStatus();
            showToast('Slip PDF opened in browser', 'info');
        }

        function updatePrintStatus() {
            // Count printed labels
            const labelInputs = document.querySelectorAll('input[id^="labelPrinted"]');
            let labelsPrinted = 0;
            labelInputs.forEach((input, idx) => {
                if (input.checked) {
                    document.getElementById(`labelStatus${idx}`).textContent = '✓';
                    document.getElementById(`labelStatus${idx}`).style.color = '#10b981';
                    labelsPrinted++;
                } else {
                    document.getElementById(`labelStatus${idx}`).textContent = '○';
                    document.getElementById(`labelStatus${idx}`).style.color = 'inherit';
                }
            });
            
            const labelTotal = labelInputs.length;
            document.getElementById('printLabelsStatus').textContent = `${labelsPrinted}/${labelTotal} Printed`;
            
            // Count printed slips
            const slipInputs = document.querySelectorAll('input[id^="slipPrinted"]');
            let slipsPrinted = 0;
            slipInputs.forEach((input, idx) => {
                if (input.checked) {
                    document.getElementById(`slipStatus${idx}`).textContent = '✓';
                    document.getElementById(`slipStatus${idx}`).style.color = '#10b981';
                    slipsPrinted++;
                } else {
                    document.getElementById(`slipStatus${idx}`).textContent = '○';
                    document.getElementById(`slipStatus${idx}`).style.color = 'inherit';
                }
            });
            
            const slipTotal = slipInputs.length;
            if (slipTotal > 0) {
                document.getElementById('printSlipsStatus').textContent = `${slipsPrinted}/${slipTotal} Printed`;
            }
        }

        // ===== SCANNER =====
        function toggleScanner() {
            isArmed = !isArmed;
            const btn = document.getElementById('armBtn');
            const input = document.getElementById('scanInput');
            
            if (isArmed) {
                btn.textContent = '● Scanner Armed';
                btn.classList.add('bg-red-600', 'animate-pulse');
                btn.classList.remove('bg-gray-700', 'hover:bg-gray-600');
                input.focus();
            } else {
                btn.textContent = 'Arm Scanner';
                btn.classList.remove('bg-red-600', 'animate-pulse');
                btn.classList.add('bg-gray-700', 'hover:bg-gray-600');
            }
        }

        document.getElementById('scanInput').addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && isArmed) {
                const tracking = e.target.value.trim();
                if (tracking) {
                    scans.push({ tracking, zone: Math.random() > 0.7 ? 'clerk' : 'manifest', time: new Date() });
                    playTone(Math.random() > 0.7 ? 'clerk' : 1);
                    updateScanLog();
                    e.target.value = '';
                    updateShipButton();
                }
            }
        });

        function updateScanLog() {
            const log = document.getElementById('scanLog');
            document.getElementById('scanCount').textContent = `${scans.length} scanned`;
            
            const last5 = scans.slice(-5).reverse();
            log.innerHTML = last5.map(s => `
                <div class="flex justify-between items-center px-3 py-2 bg-gray-700 rounded">
                    <span class="font-mono text-sm">${s.tracking.slice(-8)}</span>
                    <span class="text-xs px-2 py-0.5 rounded ${s.zone === 'clerk' ? 'bg-yellow-600' : 'bg-green-600'}">
                        ${s.zone === 'clerk' ? 'Clerk' : 'Manifest 1'}
                    </span>
                </div>
            `).join('');
        }

        // ===== SHIP & SAVE =====
        function updateShipButton() {
            const btn = document.getElementById('shipBtn');
            
            if (scans.length === 0) {
                btn.textContent = 'Ship & Save';
                btn.style.background = '#4B5563';
                btn.style.color = '#9ca3af';
                btn.style.cursor = 'not-allowed';
                btn.disabled = true;
            } else if (scans.length > 0) {
                btn.textContent = `Ship & Save — ${scans.length}/27`;
                btn.style.background = '#3b82f6';
                btn.style.color = 'white';
                btn.style.cursor = 'pointer';
                btn.disabled = false;
            }
        }

        function handleShipAction() {
            if (scans.length === 0) return;
            
            // Create batch
            const batchNum = batches.length + 1;
            const batch = {
                id: `batch-${Date.now()}`,
                number: batchNum,
                time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                packages: scans.length,
                clerkPackages: Math.floor(scans.length * 0.1),
                variants: ['Black 4pk × 12', 'Red 2pk × 4', 'Blue 4pk × 8'],
                slips: ['Slip 1', 'Slip 2'],
                onHold: Math.floor(scans.length * 0.05),
                droppedOff: null,
                carrierAccepted: null
            };
            
            batches.push(batch);
            scans = [];
            uploadedFiles = [];
            
            renderBatchCards();
            updateShipButton();
            showToast('Batch committed', 'success');
        }

        function renderBatchCards() {
            const container = document.getElementById('batchCards');
            
            if (batches.length === 0) {
                container.innerHTML = '<p class="text-gray-400 text-center py-8">No committed batches yet</p>';
                return;
            }
            
            container.innerHTML = batches.map((b, idx) => `
                <div class="batch-card">
                    <div class="flex justify-between items-start mb-3">
                        <div>
                            <div class="font-semibold">Batch ${b.number} — ${b.time}</div>
                        </div>
                        <button onclick="undoBatch(${idx})" class="text-red-400 text-xs hover:text-red-300">✕ Undo</button>
                    </div>
                    
                    <div class="grid grid-cols-2 text-sm mb-3 space-y-2">
                        <div class="col-span-2">📋 Sort Zone 1: ${b.packages - b.clerkPackages} packages</div>
                        <div class="col-span-2">🪪 Counter: ${b.clerkPackages} packages</div>
                    </div>
                    
                    <div class="flex flex-wrap gap-2 mb-3">
                        ${b.variants.map(v => `<span class="text-xs px-2 py-1 rounded bg-gray-700">${v}</span>`).join('')}
                    </div>
                    
                    ${b.onHold > 0 ? `<div class="mb-3 text-xs px-2 py-1 rounded badge badge-warning">⏸ ${b.onHold} on hold</div>` : ''}
                    
                    <div class="text-xs space-y-1 mb-3">
                        ${b.slips.map(s => `<div class="text-[#3fc5e7] cursor-pointer">📄 ${s}</div>`).join('')}
                    </div>
                    
                    <div class="flex gap-2 text-xs">
                        <button onclick="toggleDropped(${idx})" class="flex-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">
                            ${b.droppedOff ? '✓ Dropped Off ' + b.droppedOff : 'Dropped Off'}
                        </button>
                        <button onclick="toggleCarrierAccepted(${idx})" class="flex-1 px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">
                            ${b.carrierAccepted ? '✓ Carrier Accepted ' + b.carrierAccepted : 'Carrier Accepted'}
                        </button>
                    </div>
                </div>
            `).join('');
        }

        function undoBatch(idx) {
            batches.splice(idx, 1);
            renderBatchCards();
            showToast('Batch undone', 'info');
        }

        function toggleDropped(idx) {
            if (!batches[idx].droppedOff) {
                batches[idx].droppedOff = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                batches[idx].droppedOff = null;
            }
            renderBatchCards();
        }

        function toggleCarrierAccepted(idx) {
            if (!batches[idx].carrierAccepted) {
                batches[idx].carrierAccepted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            } else {
                batches[idx].carrierAccepted = null;
            }
            renderBatchCards();
        }

        // ===== HOLD QUEUE =====
        function toggleHoldQueue() {
            const content = document.getElementById('holdQueueContent');
            const chevron = document.getElementById('holdChevron');
            content.classList.toggle('expanded');
            chevron.textContent = content.classList.contains('expanded') ? '▼' : '▶';
        }

        function clearHoldQueue() {
            holdQueue = [];
            updateHoldQueue();
            showToast('Hold queue cleared', 'warning');
        }

        function logCancellation() {
            const tracking = prompt('Enter tracking number:');
            if (tracking) {
                holdQueue.push({ type: 'cancellation', tracking, variant: 'Black 4pk', date: new Date() });
                updateHoldQueue();
                showToast('Cancellation logged', 'info');
            }
        }

        function updateHoldQueue() {
            const section = document.getElementById('holdQueueSection');
            const count = document.getElementById('holdCount');
            
            if (holdQueue.length === 0) {
                section.classList.add('hidden');
                return;
            }
            
            section.classList.remove('hidden');
            count.textContent = holdQueue.length;
            
            const container = document.getElementById('holdItems');
            container.innerHTML = holdQueue.map((item, idx) => `
                <div class="hold-item ${item.type === 'cancellation' ? 'cancelled' : ''}">
                    <div class="flex justify-between items-center">
                        <div>
                            <div class="text-sm font-medium">${item.variant}</div>
                            <div class="text-xs text-gray-400">${item.tracking.slice(-8)}</div>
                        </div>
                        ${item.type === 'cancellation' ? 
                            `<span class="badge badge-danger">CANCELLED</span>` :
                            `<span class="countdown green">2d 14h</span>`
                        }
                    </div>
                    <div class="flex gap-2 mt-2">
                        ${item.type === 'inventory_hold' ? 
                            `<button onclick="markShipped(${idx})" class="flex-1 text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">Mark Shipped</button>
                             <button onclick="cancelItem(${idx})" class="flex-1 text-xs px-2 py-1 rounded bg-red-900/30 hover:bg-red-900/50">✕ Cancel</button>` :
                            `<button onclick="dismissCancel(${idx})" class="flex-1 text-xs px-2 py-1 rounded bg-gray-700 hover:bg-gray-600">✕ Dismiss</button>`
                        }
                    </div>
                </div>
            `).join('');
        }

        function markShipped(idx) {
            holdQueue.splice(idx, 1);
            updateHoldQueue();
            showToast('Package marked shipped', 'success');
        }

        function cancelItem(idx) {
            holdQueue[idx].type = 'cancellation';
            updateHoldQueue();
        }

        function dismissCancel(idx) {
            holdQueue.splice(idx, 1);
            updateHoldQueue();
        }

        // ===== SETTINGS =====
        async function loadSettings() {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('storeName').textContent = settings.store_name || 'ShipKit';
                    
                    if (!settings.setup_complete) {
                        document.getElementById('setupModal').classList.remove('hidden');
                    }
                }
            } catch (e) {
                console.error('Failed to load settings:', e);
                document.getElementById('setupModal').classList.remove('hidden');
            }
        }

        async function completeSetup() {
            const storeName = document.getElementById('setupStoreName').value.trim();
            if (!storeName) {
                document.getElementById('setupError').textContent = 'Please enter a store name';
                document.getElementById('setupError').classList.remove('hidden');
                return;
            }
            
            try {
                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName,
                        setupComplete: true
                    })
                });
                
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('setupModal').classList.add('hidden');
                    document.getElementById('storeName').textContent = storeName;
                    showToast('Setup complete!', 'success');
                }
            } catch (e) {
                document.getElementById('setupError').textContent = 'Failed to save settings';
                document.getElementById('setupError').classList.remove('hidden');
            }
        }

        function openSettings() {
            document.getElementById('settingsStoreName').value = settings.store_name || '';
            document.getElementById('settingsModal').classList.remove('hidden');
        }

        function closeSettings() {
            document.getElementById('settingsModal').classList.add('hidden');
        }

        async function saveSettings() {
            try {
                const res = await fetch('/api/settings', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName: document.getElementById('settingsStoreName').value,
                        setupComplete: true
                    })
                });
                
                if (res.ok) {
                    settings = await res.json();
                    closeSettings();
                    showToast('Settings saved', 'success');
                }
            } catch (e) {
                showToast('Failed to save settings', 'error');
            }
        }

        // ===== INIT =====
        document.addEventListener('DOMContentLoaded', () => {
            loadSettings();
        });
    </script>
</body>
</html>'''
