def get_complete_ui():
    """Return complete ShipKit UI with all steps"""
    html = '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShipKit - Fulfillment Operations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            background: #0f1218; 
            color: #e5e7eb; 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }
        .card { 
            background: #1a1f2e; 
            border: 1px solid #3a4256; 
            border-radius: 8px; 
            padding: 1.25rem;
            margin-bottom: 1rem;
        }
        .step-badge {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            width: 28px;
            height: 28px;
            background: linear-gradient(135deg, #3fc5e7, #7122c6);
            border-radius: 50%;
            color: white;
            font-weight: bold;
            font-size: 12px;
        }
        .btn { 
            padding: 0.5rem 1rem; 
            border-radius: 6px; 
            border: none;
            cursor: pointer;
            font-weight: 500;
            transition: all 0.15s;
        }
        .btn-primary { background: #3fc5e7; color: #0f1218; }
        .btn-primary:hover { background: #5dd3f0; }
        .btn-secondary { background: transparent; border: 1px solid #3a4256; color: #9ca3af; }
        .btn-secondary:hover { border-color: #3fc5e7; color: #3fc5e7; }
        .file-pill {
            display: inline-flex;
            align-items: center;
            gap: 0.5rem;
            padding: 0.5rem 1rem;
            background: #242938;
            border: 1px solid #3a4256;
            border-radius: 6px;
            font-size: 0.875rem;
            margin: 0.25rem;
        }
        .collapsible {
            border: 1px solid #3a4256;
            border-radius: 8px;
            margin-bottom: 1rem;
            overflow: hidden;
        }
        .collapsible-header {
            display: flex;
            align-items: center;
            gap: 0.75rem;
            padding: 1rem 1.25rem;
            background: #1a1f2e;
            cursor: pointer;
            user-select: none;
        }
        .collapsible-header:hover {
            background: #242938;
        }
        .collapsible-content {
            display: none;
            padding: 1.25rem;
            background: #151922;
            border-top: 1px solid #3a4256;
        }
        .collapsible-content.expanded {
            display: block;
        }
        .chevron {
            transition: transform 0.2s;
            width: 16px;
            height: 16px;
        }
        .chevron.rotated {
            transform: rotate(90deg);
        }
        .header {
            background: #1a1f2e;
            border-bottom: 1px solid #3a4256;
            padding: 1rem 2rem;
        }
        .main-content {
            max-width: 1400px;
            margin: 0 auto;
            padding: 2rem;
        }
        .hidden { display: none !important; }
    </style>
</head>
<body>
    <!-- Header -->
    <div class="header">
        <div style="display: flex; align-items: center; justify-content: space-between;">
            <div style="display: flex; align-items: center; gap: 1rem;">
                <div style="width: 40px; height: 40px; border-radius: 8px; background: linear-gradient(135deg, #3fc5e7, #7122c6); display: flex; align-items: center; justify-content: center; color: white; font-weight: bold;">SK</div>
                <div>
                    <div style="font-size: 1.25rem; font-weight: bold;" id="storeName">ShipKit</div>
                    <div style="font-size: 0.875rem; color: #9ca3af;">Fulfillment Operations</div>
                </div>
            </div>
            <button onclick="openSettings()" class="btn btn-secondary">Settings</button>
        </div>
    </div>

    <!-- Main Content -->
    <div class="main-content">
        
        <!-- STEP 0: File Vault -->
        <div class="collapsible">
            <div class="collapsible-header" onclick="toggleCollapsible(this)">
                <svg class="chevron" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/></svg>
                <span class="step-badge">0</span>
                <span style="font-weight: 500;">File Vault</span>
                <span style="font-size: 0.875rem; color: #9ca3af; margin-left: auto;" id="vaultCount">0 batches</span>
            </div>
            <div class="collapsible-content">
                <p style="font-size: 0.875rem; color: #9ca3af; margin-bottom: 1rem;">Drag files from saved batches into the upload area below.</p>
                <div id="fileVault" style="display: grid; gap: 0.5rem;">
                    <p style="font-size: 0.875rem; color: #9ca3af; text-align: center; padding: 2rem;">No saved batches yet</p>
                </div>
            </div>
        </div>

        <!-- STEP 1: Upload Files -->
        <div class="card">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="step-badge">1</span>
                <span style="font-weight: 500; font-size: 1rem;">Upload Files</span>
                <span style="font-size: 0.875rem; color: #9ca3af; margin-left: auto;" id="uploadCount">0 files</span>
            </div>
            <div id="dropzone" style="border: 2px dashed #3a4256; border-radius: 6px; padding: 1rem; text-align: center; cursor: pointer; transition: all 0.15s;">
                <input type="file" id="fileInput" multiple accept=".pdf,.csv" style="display: none;" onchange="handleFileUpload(event)">
                <p style="font-size: 0.875rem; color: #9ca3af;"><span style="color: #3fc5e7; font-weight: 500;">Click to upload</span> or drag & drop</p>
                <p style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">Label PDFs, Manifest CSVs, USPS Slips</p>
            </div>
            <div id="uploadedFiles" style="display: flex; flex-wrap: wrap; gap: 0.5rem; margin-top: 0.75rem;"></div>
        </div>

        <!-- STEP 2: Print Labels -->
        <div class="card">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="step-badge">2</span>
                <span style="font-weight: 500; font-size: 1rem;">Print Shipping Labels</span>
                <span style="font-size: 0.875rem; color: #9ca3af; margin-left: auto;" id="labelPrintCount">0/0 Printed</span>
            </div>
            <div id="labelPrintSection" style="display: grid; gap: 0.5rem;">
                <p style="font-size: 0.875rem; color: #9ca3af; text-align: center; padding: 1.5rem;">Upload label PDFs to track printing</p>
            </div>
        </div>

        <!-- STEP 3: Pick List (Hidden until CSV) -->
        <div id="pickListCard" class="card hidden">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="step-badge">3</span>
                <span style="font-weight: 500; font-size: 1rem;">Pick List</span>
                <span style="font-size: 0.875rem; color: #9ca3af; margin-left: auto;" id="pickProgress">Picked 0/0</span>
            </div>
            <div id="pickListContent" style="display: grid; gap: 0.75rem;">
                <p style="font-size: 0.875rem; color: #9ca3af; text-align: center;">No manifest CSV loaded yet</p>
            </div>
        </div>

        <!-- STEP 4: Scan Packages -->
        <div class="card">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="step-badge">4</span>
                <span style="font-weight: 500; font-size: 1rem;">Scan Packages</span>
                <span style="font-size: 0.875rem; color: #9ca3af; margin-left: auto;" id="scanCount">0 scanned</span>
            </div>
            <div style="display: grid; gap: 1rem;">
                <button id="armBtn" onclick="toggleScanner()" class="btn btn-secondary" style="width: 100%; padding: 1rem;">Arm Scanner</button>
                <input type="text" id="scanInput" style="display: none;" onkeydown="handleScan(event)" placeholder="Scan tracking...">
                <div id="scanLog" style="border: 1px solid #3a4256; border-radius: 6px; padding: 1rem; max-height: 200px; overflow-y: auto;">
                    <p style="font-size: 0.875rem; color: #9ca3af; text-align: center;">Scans will appear here</p>
                </div>
            </div>
        </div>

        <!-- STEP 5: Print USPS Slips -->
        <div class="card">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="step-badge">5</span>
                <span style="font-weight: 500; font-size: 1rem;">Print USPS Manifest Slips</span>
                <span style="font-size: 0.875rem; color: #9ca3af; margin-left: auto;" id="slipPrintCount">0/0 Printed</span>
            </div>
            <div id="slipPrintSection" style="display: grid; gap: 0.5rem;">
                <p style="font-size: 0.875rem; color: #9ca3af; text-align: center; padding: 1.5rem;">Upload USPS slips to track printing</p>
            </div>
        </div>

        <!-- STEP 6: Ship & Archive -->
        <div class="card">
            <div style="display: flex; align-items: center; gap: 0.75rem; margin-bottom: 1rem;">
                <span class="step-badge">6</span>
                <span style="font-weight: 500; font-size: 1rem;">Ship & Archive</span>
            </div>
            <button id="shipBtn" onclick="handleShip()" class="btn btn-primary" style="width: 100%; padding: 1rem;" disabled>Ship & Save</button>
        </div>

    </div>

    <!-- Toast Container -->
    <div id="toastContainer" style="position: fixed; top: 1rem; right: 1rem; display: flex; flex-direction: column; gap: 0.5rem; z-index: 999;"></div>

    <script>
        let uploadedFiles = [];
        let scans = [];
        let isArmed = false;

        function showToast(msg, type = 'info') {
            const container = document.getElementById('toastContainer');
            const toast = document.createElement('div');
            const bg = { success: '#10b981', error: '#dc2626', info: '#3b82f6', warning: '#f59e0b' }[type] || '#3b82f6';
            toast.style.cssText = `
                background: ${bg}; color: white; padding: 0.75rem 1rem; 
                border-radius: 6px; font-size: 0.875rem; animation: slideIn 0.3s ease;
            `;
            toast.textContent = msg;
            container.appendChild(toast);
            setTimeout(() => toast.remove(), 4000);
        }

        function toggleCollapsible(el) {
            const content = el.nextElementSibling;
            const chevron = el.querySelector('.chevron');
            content.classList.toggle('expanded');
            chevron.classList.toggle('rotated');
        }

        document.getElementById('dropzone').addEventListener('click', () => {
            document.getElementById('fileInput').click();
        });

        document.getElementById('dropzone').addEventListener('dragover', (e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#3fc5e7';
            e.currentTarget.style.background = '#242938';
        });

        document.getElementById('dropzone').addEventListener('dragleave', (e) => {
            e.currentTarget.style.borderColor = '#3a4256';
            e.currentTarget.style.background = 'transparent';
        });

        document.getElementById('dropzone').addEventListener('drop', (e) => {
            e.preventDefault();
            e.currentTarget.style.borderColor = '#3a4256';
            e.currentTarget.style.background = 'transparent';
            handleFileUpload({ target: { files: e.dataTransfer.files } });
        });

        function handleFileUpload(e) {
            const files = Array.from(e.target.files);
            if (!files.length) return;

            files.forEach(f => {
                uploadedFiles.push({ name: f.name, type: f.type, size: f.size });
            });

            document.getElementById('uploadCount').textContent = uploadedFiles.length + ' files';
            renderUploadedFiles();
            showToast(files.length + ' file(s) uploaded', 'success');

            // Show print sections
            if (uploadedFiles.some(f => f.name.toLowerCase().includes('label'))) {
                document.getElementById('labelPrintSection').innerHTML = uploadedFiles
                    .filter(f => f.name.toLowerCase().includes('label'))
                    .map((f, i) => '<div class="file-pill">O ' + f.name + '</div>')
                    .join('');
            }

            if (uploadedFiles.some(f => f.name.toLowerCase().includes('slip'))) {
                document.getElementById('slipPrintSection').innerHTML = uploadedFiles
                    .filter(f => f.name.toLowerCase().includes('slip'))
                    .map((f, i) => '<div class="file-pill">O ' + f.name + '</div>')
                    .join('');
            }

            // Show pick list if manifest
            if (uploadedFiles.some(f => f.name.toLowerCase().includes('manifest'))) {
                document.getElementById('pickListCard').classList.remove('hidden');
                document.getElementById('pickListContent').innerHTML = '<div style="background: #242938; border: 1px solid #3a4256; border-radius: 6px; padding: 1rem;"><p style="font-weight: 500; margin-bottom: 0.5rem;">Manifest Loaded</p><p style="font-size: 0.875rem; color: #9ca3af;">Ready to pick items</p></div>';
            }
        }

        function renderUploadedFiles() {
            const container = document.getElementById('uploadedFiles');
            container.innerHTML = uploadedFiles.map(f => '<div class="file-pill">' + f.name + '</div>').join('');
        }

        function toggleScanner() {
            isArmed = !isArmed;
            const btn = document.getElementById('armBtn');
            const input = document.getElementById('scanInput');
            
            if (isArmed) {
                btn.textContent = 'Scanner Armed';
                btn.style.background = '#dc2626';
                input.style.display = 'block';
                input.focus();
            } else {
                btn.textContent = 'Arm Scanner';
                btn.style.background = 'transparent';
                btn.style.border = '1px solid #3a4256';
                input.style.display = 'none';
            }
        }

        function handleScan(e) {
            if (e.key !== 'Enter' || !isArmed) return;
            const tracking = e.target.value.trim();
            if (!tracking) return;

            scans.push(tracking);
            document.getElementById('scanCount').textContent = scans.length + ' scanned';
            document.getElementById('scanLog').innerHTML = scans.slice(-5).reverse().map(s => 
                '<div style="padding: 0.5rem; border-bottom: 1px solid #3a4256; font-family: monospace; font-size: 0.875rem;">' + s + '</div>'
            ).join('');

            e.target.value = '';
            showToast('Tracked: ' + tracking, 'success');
        }

        function handleShip() {
            if (scans.length === 0) {
                showToast('No packages scanned yet', 'warning');
                return;
            }
            showToast('Batch saved! ' + scans.length + ' packages shipped.', 'success');
            
            // Reset
            uploadedFiles = [];
            scans = [];
            document.getElementById('uploadCount').textContent = '0 files';
            document.getElementById('scanCount').textContent = '0 scanned';
            document.getElementById('uploadedFiles').innerHTML = '';
            document.getElementById('pickListCard').classList.add('hidden');
        }

        function openSettings() {
            showToast('Settings coming soon', 'info');
        }

        document.addEventListener('DOMContentLoaded', () => {
            showToast('ShipKit ready', 'success');
        });
    </script>
</body>
</html>'''
    return html
