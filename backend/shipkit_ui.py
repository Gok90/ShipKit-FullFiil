"""
ShipKit Complete UI v2
Implements the full fulfillment workflow with:
- Step 0: File Vault (saved files visualizer)
- Step 1: Upload Files (compact)
- Step 2: Pick List (appears after CSV upload)
- Step 3: Print Labels
- Step 4: Scan Packages  
- Step 5: Print USPS Manifest Slips
- Step 6: Ship & Archive

Design: Outlined cards, cyan primary (#3fc5e7), purple accent (#7122c6)
"""

def get_complete_ui():
    return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>ShipKit - Fulfillment Operations</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        primary: '#3fc5e7',
                        secondary: '#7122c6',
                        surface: '#1a1f2e',
                        card: '#242938',
                        border: '#3a4256'
                    }
                }
            }
        }
    </script>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #0f1218; }
        
        /* Toast animations */
        .toast { animation: slideIn 0.3s ease-out; }
        @keyframes slideIn { from { transform: translateX(400px); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        
        /* Card styling */
        .card { background: #1a1f2e; border: 1px solid #3a4256; border-radius: 0.75rem; }
        .card-header { padding: 1rem 1.25rem; border-bottom: 1px solid #3a4256; }
        .card-body { padding: 1.25rem; }
        
        /* Step indicator */
        .step-badge { 
            width: 1.75rem; height: 1.75rem; 
            display: flex; align-items: center; justify-content: center;
            border-radius: 50%; font-size: 0.75rem; font-weight: 700;
            background: linear-gradient(135deg, #3fc5e7, #7122c6);
            color: white;
        }
        
        /* Buttons */
        .btn { padding: 0.5rem 1rem; border-radius: 0.5rem; font-weight: 500; cursor: pointer; border: none; transition: all 0.15s; }
        .btn-primary { background: #3fc5e7; color: #0f1218; }
        .btn-primary:hover { background: #5dd3f0; }
        .btn-secondary { background: transparent; border: 1px solid #3a4256; color: #9ca3af; }
        .btn-secondary:hover { border-color: #3fc5e7; color: #3fc5e7; }
        .btn-danger { background: #dc2626; color: white; }
        .btn-danger:hover { background: #ef4444; }
        .btn-success { background: #10b981; color: white; }
        .btn-success:hover { background: #34d399; }
        
        /* File pills */
        .file-pill { 
            display: flex; align-items: center; gap: 0.75rem; 
            padding: 0.625rem 1rem; 
            background: #242938; border: 1px solid #3a4256; border-radius: 0.5rem;
            font-size: 0.875rem;
        }
        .file-pill:hover { border-color: #3fc5e7; }
        
        /* Collapsible sections */
        .collapsible { border: 1px solid #3a4256; border-radius: 0.75rem; overflow: hidden; }
        .collapsible-header { 
            display: flex; align-items: center; gap: 0.75rem;
            padding: 1rem 1.25rem; background: #1a1f2e; cursor: pointer;
            user-select: none; transition: background 0.15s;
        }
        .collapsible-header:hover { background: #242938; }
        .collapsible-content { display: none; padding: 1.25rem; border-top: 1px solid #3a4256; background: #151922; }
        .collapsible-content.expanded { display: block; }
        .chevron { transition: transform 0.2s; }
        .chevron.rotated { transform: rotate(90deg); }
        
        /* Pick list rows */
        .pick-row { 
            display: flex; align-items: center; gap: 1rem; 
            padding: 0.75rem 1rem; border-radius: 0.5rem;
            cursor: pointer; transition: background 0.1s;
        }
        .pick-row:hover { background: #242938; }
        .pick-row.checked { opacity: 0.5; }
        .pick-checkbox { width: 1.25rem; height: 1.25rem; accent-color: #3fc5e7; }
        
        /* Zone cards */
        .zone-card { 
            border: 1px solid #3a4256; border-radius: 0.75rem; 
            padding: 1.25rem; background: #1a1f2e; 
            transition: border-color 0.2s;
        }
        .zone-card:hover { border-color: #3fc5e7; }
        .zone-card.active { border-color: #3fc5e7; box-shadow: 0 0 0 1px #3fc5e7; }
        
        /* Batch cards */
        .batch-card { 
            border: 1px solid #3a4256; border-radius: 0.75rem; 
            padding: 1rem 1.25rem; background: #1a1f2e; margin-bottom: 0.75rem;
        }
        
        /* Hold queue items */
        .hold-item { 
            border-left: 3px solid #f59e0b; 
            padding: 1rem; background: #242938; border-radius: 0 0.5rem 0.5rem 0;
        }
        .hold-item.cancelled { border-left-color: #dc2626; }
        
        /* File vault folder */
        .vault-folder { 
            border: 1px solid #3a4256; border-radius: 0.5rem; 
            background: #1a1f2e; overflow: hidden;
        }
        .vault-folder-header { 
            padding: 0.75rem 1rem; background: #242938; 
            display: flex; align-items: center; gap: 0.75rem;
            cursor: pointer; font-size: 0.875rem;
        }
        .vault-folder-header:hover { background: #2d3548; }
        .vault-folder-content { padding: 0.75rem; display: none; }
        .vault-folder-content.expanded { display: block; }
        .vault-file { 
            display: flex; align-items: center; gap: 0.5rem; 
            padding: 0.5rem 0.75rem; border-radius: 0.375rem;
            font-size: 0.8rem; color: #9ca3af; cursor: grab;
        }
        .vault-file:hover { background: #242938; color: white; }
        .vault-file.dragging { opacity: 0.5; }
        
        /* Badges */
        .badge { 
            display: inline-flex; align-items: center; 
            padding: 0.25rem 0.625rem; border-radius: 9999px; 
            font-size: 0.7rem; font-weight: 600; text-transform: uppercase;
        }
        .badge-out { background: #dc2626; color: white; }
        .badge-short { background: #f59e0b; color: #0f1218; }
        .badge-ok { background: #10b981; color: white; }
        
        /* Tabs */
        .tab { padding: 0.75rem 0; border-bottom: 2px solid transparent; color: #9ca3af; cursor: pointer; }
        .tab:hover { color: white; }
        .tab.active { color: #3fc5e7; border-color: #3fc5e7; }
        
        /* Scrollbar */
        ::-webkit-scrollbar { width: 8px; height: 8px; }
        ::-webkit-scrollbar-track { background: #1a1f2e; }
        ::-webkit-scrollbar-thumb { background: #3a4256; border-radius: 4px; }
        ::-webkit-scrollbar-thumb:hover { background: #4a5266; }
        
        /* Fullscreen picking mode */
        .fullscreen-pick { 
            position: fixed; inset: 0; z-index: 100; 
            background: #0f1218; overflow-y: auto; padding: 2rem;
        }
        .fullscreen-pick .pick-row { padding: 1rem 1.5rem; }
        .fullscreen-pick .color-name { font-size: 1.25rem; }
        .fullscreen-pick .qty { font-size: 1.5rem; font-weight: 700; color: #10b981; }
        .fullscreen-pick .stock { font-size: 0.875rem; color: #6b7280; }
        
        /* Print row */
        .print-row { display: flex; align-items: center; justify-content: space-between; padding: 0.75rem 1rem; border: 1px solid #3a4256; border-radius: 0.5rem; margin-bottom: 0.5rem; }
        .print-status { width: 1.5rem; height: 1.5rem; border: 2px solid #3a4256; border-radius: 50%; display: flex; align-items: center; justify-content: center; }
        .print-status.printed { background: #10b981; border-color: #10b981; }
    </style>
</head>
<body class="min-h-screen">
    <div id="app">
        <!-- Header -->
        <header class="bg-[#1a1f2e] border-b border-[#3a4256] px-6 py-4 sticky top-0 z-50">
            <div class="max-w-6xl mx-auto flex items-center justify-between">
                <div class="flex items-center gap-3">
                    <div class="w-10 h-10 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-bold text-lg text-white">
                        SK
                    </div>
                    <div>
                        <h1 class="text-lg font-semibold" id="storeName">ShipKit</h1>
                        <p class="text-xs text-gray-500">Local Fulfillment</p>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <span class="text-xs text-gray-500" id="sessionTime"></span>
                    <button onclick="openSettings()" class="btn btn-secondary text-sm">
                        <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        </svg>
                        Settings
                    </button>
                </div>
            </div>
        </header>
        
        <!-- Tabs -->
        <nav class="bg-[#1a1f2e] border-b border-[#3a4256] px-6">
            <div class="max-w-6xl mx-auto flex gap-8">
                <button onclick="switchTab('scan')" class="tab active" data-tab="scan">Scan</button>
                <button onclick="switchTab('inventory')" class="tab" data-tab="inventory">Inventory</button>
                <button onclick="switchTab('history')" class="tab" data-tab="history">History</button>
            </div>
        </nav>
        
        <!-- Main Content -->
        <main class="max-w-6xl mx-auto px-6 py-6">
            
            <!-- ========== SCAN TAB ========== -->
            <div id="tab-scan" class="tab-content space-y-4">
                
                <!-- STEP 0: File Vault -->
                <section class="collapsible">
                    <div class="collapsible-header" onclick="toggleSection(this)">
                        <svg class="w-4 h-4 chevron text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <span class="step-badge text-xs">0</span>
                        <span class="font-medium">File Vault</span>
                        <span class="text-xs text-gray-500 ml-auto" id="vaultCount">0 batches saved</span>
                    </div>
                    <div class="collapsible-content">
                        <p class="text-sm text-gray-400 mb-4">Drag files from here into the upload area, or browse your saved batches.</p>
                        <div id="fileVault" class="space-y-2">
                            <p class="text-sm text-gray-500 text-center py-4">No saved batches yet</p>
                        </div>
                    </div>
                </section>
                
                <!-- STEP 1: Upload Files (Compact) -->
                <section class="card">
                    <div class="card-header flex items-center gap-3">
                        <span class="step-badge">1</span>
                        <span class="font-medium">Upload Files</span>
                        <span class="text-xs text-gray-500 ml-auto" id="uploadCount">0 files</span>
                    </div>
                    <div class="card-body">
                        <div id="dropzone" class="border border-dashed border-[#3a4256] rounded-lg p-4 text-center hover:border-primary transition-colors cursor-pointer">
                            <input type="file" id="fileInput" multiple accept=".pdf,.csv" class="hidden" onchange="handleFileUpload(event)">
                            <p class="text-sm text-gray-400">
                                <span class="text-primary font-medium">Click to upload</span> or drag & drop
                            </p>
                            <p class="text-xs text-gray-500 mt-1">Label PDFs, Manifest CSVs, USPS Slips</p>
                        </div>
                        <div id="uploadedFiles" class="flex flex-wrap gap-2 mt-3"></div>
                    </div>
                </section>
                
                <!-- STEP 2: Pick List (Hidden until CSV loads) -->
                <section id="pickListSection" class="collapsible hidden">
                    <div class="collapsible-header" onclick="toggleSection(this)">
                        <svg class="w-4 h-4 chevron rotated text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <span class="step-badge">2</span>
                        <span class="font-medium">Pick List</span>
                        <span class="text-xs text-gray-500 ml-2" id="pickProgress">Picked 0/0</span>
                        <div class="ml-auto flex items-center gap-2">
                            <button onclick="enterPickingMode()" class="btn btn-secondary text-xs">Fullscreen</button>
                        </div>
                    </div>
                    <div class="collapsible-content expanded">
                        <!-- Stock Warning Banner -->
                        <div id="stockWarning" class="hidden mb-4 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm">
                            <strong>Stock Warning:</strong> <span id="stockWarningText"></span>
                        </div>
                        
                        <!-- Summary Bar -->
                        <div class="flex items-center gap-4 mb-4 p-3 rounded-lg bg-[#242938] text-sm">
                            <span>Total to pull: <strong id="totalPull">0</strong> units</span>
                            <span class="text-gray-500">·</span>
                            <span><strong id="variantCount">0</strong> variants</span>
                            <span id="shortCount" class="hidden cursor-pointer hover:underline text-yellow-400"></span>
                            <span id="outCount" class="hidden cursor-pointer hover:underline text-red-400"></span>
                        </div>
                        
                        <!-- Multi-Qty Check Button -->
                        <div id="multiQtySection" class="hidden mb-4">
                            <button onclick="openMultiQtyCheck()" class="btn btn-secondary w-full text-sm">
                                <svg class="w-4 h-4 inline mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                                </svg>
                                Check Multi-Qty Orders (<span id="multiQtyCount">0</span>)
                            </button>
                        </div>
                        
                        <!-- Attention Section (OUT/SHORT items) -->
                        <div id="attentionSection" class="hidden mb-4">
                            <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">Attention Required</h4>
                            <div id="attentionItems" class="space-y-1"></div>
                        </div>
                        
                        <!-- Pick List by Pack Type -->
                        <div id="pickListGroups" class="space-y-4">
                            <p class="text-sm text-gray-500 text-center py-4">Upload a CSV to see your pick list</p>
                        </div>
                    </div>
                </section>
                
                <!-- STEP 3: Print Shipping Labels -->
                <section id="printLabelsSection" class="collapsible hidden">
                    <div class="collapsible-header" onclick="toggleSection(this)">
                        <svg class="w-4 h-4 chevron rotated text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <span class="step-badge">3</span>
                        <span class="font-medium">Print Shipping Labels</span>
                        <span class="text-xs text-gray-500 ml-2" id="labelPrintProgress">0/0 Printed</span>
                    </div>
                    <div class="collapsible-content expanded">
                        <div id="labelFilesList" class="space-y-2"></div>
                        <button onclick="markAllLabelsPrinted()" class="btn btn-primary mt-3 text-sm">Mark All Printed</button>
                    </div>
                </section>
                
                <!-- STEP 4: Scan Packages -->
                <section class="card">
                    <div class="card-header flex items-center gap-3">
                        <span class="step-badge">4</span>
                        <span class="font-medium">Scan Packages</span>
                        <span class="text-xs text-gray-500 ml-auto" id="scanProgress">0 scanned</span>
                    </div>
                    <div class="card-body">
                        <button id="armBtn" onclick="toggleScanner()" class="w-full py-3 rounded-lg bg-[#242938] border border-[#3a4256] hover:border-primary font-medium transition-colors mb-4">
                            Arm Scanner
                        </button>
                        <input type="text" id="scanInput" class="absolute -left-[9999px]" onkeydown="handleScan(event)">
                        
                        <!-- Zone Cards -->
                        <div id="zoneCards" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                            <div class="text-center py-6 text-gray-500 text-sm col-span-full">
                                Upload a manifest CSV to create zones
                            </div>
                        </div>
                        
                        <!-- Scan Log -->
                        <div class="border border-[#3a4256] rounded-lg overflow-hidden">
                            <div class="px-4 py-2 bg-[#242938] flex justify-between items-center text-sm">
                                <span class="text-gray-400">Recent Scans</span>
                                <button onclick="clearScanLog()" class="text-xs text-gray-500 hover:text-white">Clear</button>
                            </div>
                            <div id="scanLog" class="max-h-40 overflow-y-auto p-3 space-y-1">
                                <p class="text-xs text-gray-500 text-center py-2">Scans will appear here</p>
                            </div>
                        </div>
                    </div>
                </section>
                
                <!-- STEP 5: Print USPS Manifest Slips (Hidden until slips uploaded) -->
                <section id="printSlipsSection" class="collapsible hidden">
                    <div class="collapsible-header" onclick="toggleSection(this)">
                        <svg class="w-4 h-4 chevron rotated text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <span class="step-badge">5</span>
                        <span class="font-medium">Print USPS Manifest Slips</span>
                        <span class="text-xs text-gray-500 ml-2" id="slipPrintProgress">0/0 Printed</span>
                    </div>
                    <div class="collapsible-content expanded">
                        <div id="slipFilesList" class="space-y-2"></div>
                        <button onclick="markAllSlipsPrinted()" class="btn btn-primary mt-3 text-sm">Mark All Printed</button>
                    </div>
                </section>
                
                <!-- STEP 6: Ship & Archive -->
                <section class="card">
                    <div class="card-header flex items-center gap-3">
                        <span class="step-badge">6</span>
                        <span class="font-medium">Ship & Archive</span>
                    </div>
                    <div class="card-body">
                        <!-- Ship Button -->
                        <button id="shipBtn" onclick="handleShip()" disabled class="w-full py-4 rounded-lg bg-[#242938] border border-[#3a4256] text-gray-500 font-medium cursor-not-allowed mb-4">
                            Upload files to begin
                        </button>
                        
                        <!-- Today's Batches -->
                        <div id="batchesSection" class="hidden">
                            <h4 class="text-sm font-medium text-gray-400 mb-3">Today's Batches</h4>
                            <div id="batchCards"></div>
                        </div>
                        
                        <!-- Hold Queue -->
                        <div id="holdQueueSection" class="hidden mt-4">
                            <h4 class="text-sm font-medium text-yellow-400 mb-3">Hold Queue</h4>
                            <div id="holdQueue"></div>
                        </div>
                    </div>
                </section>
            </div>
            
            <!-- ========== INVENTORY TAB ========== -->
            <div id="tab-inventory" class="tab-content hidden">
                <div class="card">
                    <div class="card-header flex items-center justify-between">
                        <span class="font-medium">Inventory</span>
                        <span class="text-sm text-gray-500"><span id="totalStock">0</span> units total</span>
                    </div>
                    <div class="card-body">
                        <div id="inventoryGrid" class="space-y-4">
                            <p class="text-sm text-gray-500 text-center py-6">Loading inventory...</p>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- ========== HISTORY TAB ========== -->
            <div id="tab-history" class="tab-content hidden">
                <div class="card">
                    <div class="card-header">
                        <span class="font-medium">Shipping History</span>
                    </div>
                    <div class="card-body">
                        <div id="historyList">
                            <p class="text-sm text-gray-500 text-center py-6">No shipping history yet</p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
        
        <!-- Toast Container -->
        <div id="toastContainer" class="fixed top-20 right-4 space-y-2 z-[60]"></div>
        
        <!-- Setup Wizard Modal -->
        <div id="setupModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] hidden">
            <div class="card max-w-md w-full mx-4 p-8">
                <div class="w-16 h-16 mx-auto rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-2xl font-bold text-white mb-6">
                    SK
                </div>
                <h2 class="text-xl font-semibold text-center mb-2">Welcome to ShipKit</h2>
                <p class="text-sm text-gray-400 text-center mb-6">Quick setup to get started</p>
                
                <div class="space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Store Name</label>
                        <input type="text" id="setupStoreName" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm" placeholder="My TikTok Shop">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium mb-2">Primary Zone</label>
                            <input type="text" id="setupPrimaryZone" value="Manifest" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Secondary Zone</label>
                            <input type="text" id="setupSecondaryZone" value="Clerk Counter" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm">
                        </div>
                    </div>
                </div>
                
                <div id="setupError" class="hidden mt-4 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm"></div>
                
                <button onclick="completeSetup()" class="w-full mt-6 py-3 rounded-lg bg-gradient-to-r from-primary to-secondary font-semibold hover:opacity-90 transition-opacity text-white">
                    Get Started
                </button>
            </div>
        </div>
        
        <!-- Settings Modal -->
        <div id="settingsModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] hidden">
            <div class="card max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div class="card-header flex items-center justify-between">
                    <span class="font-medium">Settings</span>
                    <button onclick="closeSettings()" class="p-1 hover:bg-[#242938] rounded">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="card-body space-y-4">
                    <div>
                        <label class="block text-sm font-medium mb-2">Store Name</label>
                        <input type="text" id="settingsStoreName" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm">
                    </div>
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="block text-sm font-medium mb-2">Primary Zone</label>
                            <input type="text" id="settingsPrimaryZone" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm">
                        </div>
                        <div>
                            <label class="block text-sm font-medium mb-2">Secondary Zone</label>
                            <input type="text" id="settingsSecondaryZone" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm">
                        </div>
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Low Stock Alert</label>
                        <input type="number" id="settingsLowStock" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm" value="5">
                    </div>
                    <div>
                        <label class="block text-sm font-medium mb-2">Audio Mode</label>
                        <select id="settingsAudioMode" class="w-full px-4 py-2.5 bg-[#242938] rounded-lg border border-[#3a4256] focus:border-primary focus:outline-none text-sm">
                            <option value="tones">Tones</option>
                            <option value="voice">Voice</option>
                        </select>
                    </div>
                    <button onclick="saveSettings()" class="w-full py-2.5 rounded-lg btn btn-primary">
                        Save Settings
                    </button>
                </div>
            </div>
        </div>
        
        <!-- Fullscreen Picking Mode -->
        <div id="fullscreenPick" class="fullscreen-pick hidden">
            <div class="flex items-center justify-between mb-6">
                <h2 class="text-2xl font-bold">Pick List</h2>
                <button onclick="exitPickingMode()" class="btn btn-secondary">Exit Fullscreen</button>
            </div>
            <div id="fullscreenPickList"></div>
        </div>
        
        <!-- Multi-Qty Check Modal -->
        <div id="multiQtyModal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-[70] hidden">
            <div class="card max-w-lg w-full mx-4">
                <div class="card-header flex items-center justify-between">
                    <span class="font-medium">Verify Multi-Qty Orders</span>
                    <button onclick="closeMultiQtyModal()" class="p-1 hover:bg-[#242938] rounded">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                    </button>
                </div>
                <div class="card-body">
                    <p class="text-sm text-gray-400 mb-4">Scan each package barcode to verify correct item count:</p>
                    <div id="multiQtyList" class="space-y-2 max-h-60 overflow-y-auto"></div>
                    <div class="flex gap-3 mt-4">
                        <button onclick="closeMultiQtyModal()" class="btn btn-secondary flex-1">Skip All</button>
                        <button onclick="closeMultiQtyModal()" class="btn btn-primary flex-1">Done</button>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <script>
        // ========== STATE ==========
        let settings = {};
        let batchId = null;
        let uploadedFiles = [];
        let scans = [];
        let isArmed = false;
        let inventory = [];
        let pickedItems = new Set();
        let printedLabels = new Set();
        let printedSlips = new Set();
        let csvData = [];
        let pickList = [];
        
        // Audio
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const ZONE_TONES = { 1: 523.25, 2: 587.33, 3: 659.25, 4: 698.46, clerk: 261.63 };
        
        // ========== UTILITIES ==========
        function playTone(zone) {
            const freq = zone === 'clerk' ? ZONE_TONES.clerk : (ZONE_TONES[zone] || 523.25);
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination);
            osc.frequency.value = freq; osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
            osc.start(); osc.stop(audioCtx.currentTime + 0.3);
        }
        
        function showToast(message, type = 'info') {
            const container = document.getElementById('toastContainer');
            const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-primary text-black', warning: 'bg-yellow-500 text-black' };
            const toast = document.createElement('div');
            toast.className = `toast px-4 py-3 rounded-lg ${colors[type]} shadow-lg text-sm font-medium`;
            toast.textContent = message;
            container.appendChild(toast);
            setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 300); }, 4000);
        }
        
        function toggleSection(header) {
            const content = header.nextElementSibling;
            const chevron = header.querySelector('.chevron');
            content.classList.toggle('expanded');
            chevron.classList.toggle('rotated');
        }
        
        // ========== TABS ==========
        function switchTab(tab) {
            document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
            document.getElementById('tab-' + tab).classList.remove('hidden');
            document.querySelectorAll('.tab').forEach(btn => btn.classList.remove('active'));
            document.querySelector(`[data-tab="${tab}"]`).classList.add('active');
            if (tab === 'inventory') loadInventory();
        }
        
        // ========== SETTINGS ==========
        async function loadSettings() {
            try {
                const res = await fetch('/api/settings');
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('storeName').textContent = settings.store_name || 'ShipKit';
                    if (!settings.setup_complete) document.getElementById('setupModal').classList.remove('hidden');
                }
            } catch (e) {
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
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName, setupComplete: true,
                        primaryZoneName: document.getElementById('setupPrimaryZone').value || 'Manifest',
                        secondaryZoneName: document.getElementById('setupSecondaryZone').value || 'Clerk Counter'
                    })
                });
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('setupModal').classList.add('hidden');
                    document.getElementById('storeName').textContent = storeName;
                    showToast('Welcome to ShipKit!', 'success');
                } else {
                    document.getElementById('setupError').textContent = 'Failed to save settings';
                    document.getElementById('setupError').classList.remove('hidden');
                }
            } catch (e) {
                document.getElementById('setupError').textContent = 'Network error';
                document.getElementById('setupError').classList.remove('hidden');
            }
        }
        
        function openSettings() {
            document.getElementById('settingsStoreName').value = settings.store_name || '';
            document.getElementById('settingsPrimaryZone').value = settings.primary_zone_name || 'Manifest';
            document.getElementById('settingsSecondaryZone').value = settings.secondary_zone_name || 'Clerk Counter';
            document.getElementById('settingsLowStock').value = settings.low_stock_threshold || 5;
            document.getElementById('settingsModal').classList.remove('hidden');
        }
        
        function closeSettings() { document.getElementById('settingsModal').classList.add('hidden'); }
        
        async function saveSettings() {
            try {
                const res = await fetch('/api/settings', {
                    method: 'PUT', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        storeName: document.getElementById('settingsStoreName').value,
                        primaryZoneName: document.getElementById('settingsPrimaryZone').value,
                        secondaryZoneName: document.getElementById('settingsSecondaryZone').value,
                        lowStockThreshold: parseInt(document.getElementById('settingsLowStock').value),
                        audioMode: document.getElementById('settingsAudioMode').value,
                        setupComplete: true
                    })
                });
                if (res.ok) {
                    settings = await res.json();
                    document.getElementById('storeName').textContent = settings.store_name;
                    closeSettings();
                    showToast('Settings saved', 'success');
                }
            } catch (e) { showToast('Failed to save', 'error'); }
        }
        
        // ========== FILE VAULT ==========
        async function loadFileVault() {
            try {
                const res = await fetch('/api/vault');
                if (res.ok) {
                    const data = await res.json();
                    renderFileVault(data.folders || []);
                }
            } catch (e) { console.log('No vault data'); }
        }
        
        function renderFileVault(folders) {
            const vault = document.getElementById('fileVault');
            document.getElementById('vaultCount').textContent = `${folders.length} batches saved`;
            if (!folders.length) {
                vault.innerHTML = '<p class="text-sm text-gray-500 text-center py-4">No saved batches yet</p>';
                return;
            }
            vault.innerHTML = folders.map(f => `
                <div class="vault-folder">
                    <div class="vault-folder-header" onclick="this.nextElementSibling.classList.toggle('expanded'); this.querySelector('.chevron').classList.toggle('rotated')">
                        <svg class="w-3 h-3 chevron text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                        </svg>
                        <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z"/>
                        </svg>
                        <span>${f.date}</span>
                        <span class="text-gray-500 ml-auto">${f.files.length} files</span>
                    </div>
                    <div class="vault-folder-content">
                        ${f.files.map(file => `
                            <div class="vault-file" draggable="true" ondragstart="handleVaultDrag(event, '${file.path}')">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                    <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                                </svg>
                                ${file.name}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        function handleVaultDrag(e, path) {
            e.dataTransfer.setData('text/plain', path);
        }
        
        // ========== FILE UPLOAD ==========
        document.getElementById('dropzone').addEventListener('click', () => document.getElementById('fileInput').click());
        document.getElementById('dropzone').addEventListener('dragover', e => { e.preventDefault(); e.currentTarget.classList.add('border-primary'); });
        document.getElementById('dropzone').addEventListener('dragleave', e => e.currentTarget.classList.remove('border-primary'));
        document.getElementById('dropzone').addEventListener('drop', e => {
            e.preventDefault();
            e.currentTarget.classList.remove('border-primary');
            if (e.dataTransfer.files.length) handleFileUpload({ target: { files: e.dataTransfer.files } });
        });
        
        async function handleFileUpload(e) {
            const files = Array.from(e.target.files);
            if (!files.length) return;
            
            if (!batchId) {
                try {
                    const res = await fetch('/api/batch/create', { method: 'POST' });
                    const data = await res.json();
                    batchId = data.batchId;
                } catch (e) { showToast('Failed to create batch', 'error'); return; }
            }
            
            const formData = new FormData();
            files.forEach(f => formData.append('files', f));
            
            try {
                const res = await fetch(`/api/batch/files/upload?batchId=${batchId}`, { method: 'POST', body: formData });
                if (res.ok) {
                    const data = await res.json();
                    uploadedFiles = [...uploadedFiles, ...data.uploaded];
                    showToast(`${data.count} file(s) uploaded`, 'success');
                    renderUploadedFiles();
                    processUploadedFiles(data.uploaded);
                } else { showToast('Upload failed', 'error'); }
            } catch (e) { showToast('Upload error: ' + e.message, 'error'); }
        }
        
        function renderUploadedFiles() {
            const container = document.getElementById('uploadedFiles');
            document.getElementById('uploadCount').textContent = `${uploadedFiles.length} files`;
            container.innerHTML = uploadedFiles.map(f => `
                <div class="file-pill">
                    <svg class="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z"/>
                    </svg>
                    <span class="truncate max-w-[120px]">${f.filename}</span>
                    <span class="badge ${f.fileType === 'label' ? 'bg-blue-600' : f.fileType === 'manifest' ? 'bg-green-600' : 'bg-purple-600'} text-white text-[10px]">
                        ${f.fileType}
                    </span>
                </div>
            `).join('');
            updateShipButton();
        }
        
        function processUploadedFiles(files) {
            const labels = files.filter(f => f.fileType === 'label');
            const manifests = files.filter(f => f.fileType === 'manifest');
            const slips = files.filter(f => f.fileType === 'slip');
            
            // Show print labels section
            if (labels.length) {
                document.getElementById('printLabelsSection').classList.remove('hidden');
                renderLabelFiles(labels);
            }
            
            // Show print slips section
            if (slips.length) {
                document.getElementById('printSlipsSection').classList.remove('hidden');
                renderSlipFiles(slips);
            }
            
            // Show pick list if CSV
            if (manifests.length) {
                document.getElementById('pickListSection').classList.remove('hidden');
                // In real implementation, parse CSV and build pick list
                renderPickListPlaceholder();
            }
        }
        
        function renderLabelFiles(labels) {
            const list = document.getElementById('labelFilesList');
            document.getElementById('labelPrintProgress').textContent = `${printedLabels.size}/${labels.length} Printed`;
            list.innerHTML = labels.map(f => `
                <div class="print-row" onclick="toggleLabelPrinted('${f.id}')">
                    <div class="flex items-center gap-3">
                        <div class="print-status ${printedLabels.has(f.id) ? 'printed' : ''}">
                            ${printedLabels.has(f.id) ? '<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                        </div>
                        <span class="text-sm">${f.filename}</span>
                    </div>
                    <button onclick="event.stopPropagation(); printFile('${f.id}')" class="btn btn-secondary text-xs">Print</button>
                </div>
            `).join('');
        }
        
        function renderSlipFiles(slips) {
            const list = document.getElementById('slipFilesList');
            document.getElementById('slipPrintProgress').textContent = `${printedSlips.size}/${slips.length} Printed`;
            list.innerHTML = slips.map(f => `
                <div class="print-row" onclick="toggleSlipPrinted('${f.id}')">
                    <div class="flex items-center gap-3">
                        <div class="print-status ${printedSlips.has(f.id) ? 'printed' : ''}">
                            ${printedSlips.has(f.id) ? '<svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>' : ''}
                        </div>
                        <span class="text-sm">${f.filename}</span>
                    </div>
                    <button onclick="event.stopPropagation(); printFile('${f.id}')" class="btn btn-secondary text-xs">Print</button>
                </div>
            `).join('');
        }
        
        function toggleLabelPrinted(id) {
            if (printedLabels.has(id)) printedLabels.delete(id);
            else printedLabels.add(id);
            const labels = uploadedFiles.filter(f => f.fileType === 'label');
            renderLabelFiles(labels);
        }
        
        function toggleSlipPrinted(id) {
            if (printedSlips.has(id)) printedSlips.delete(id);
            else printedSlips.add(id);
            const slips = uploadedFiles.filter(f => f.fileType === 'slip');
            renderSlipFiles(slips);
        }
        
        function markAllLabelsPrinted() {
            uploadedFiles.filter(f => f.fileType === 'label').forEach(f => printedLabels.add(f.id));
            renderLabelFiles(uploadedFiles.filter(f => f.fileType === 'label'));
            showToast('All labels marked as printed', 'success');
        }
        
        function markAllSlipsPrinted() {
            uploadedFiles.filter(f => f.fileType === 'slip').forEach(f => printedSlips.add(f.id));
            renderSlipFiles(uploadedFiles.filter(f => f.fileType === 'slip'));
            showToast('All slips marked as printed', 'success');
        }
        
        function printFile(id) {
            showToast('Opening print dialog...', 'info');
            // In real implementation, open print dialog
        }
        
        // ========== PICK LIST ==========
        function renderPickListPlaceholder() {
            // Simulated pick list data
            pickList = [
                { color: 'Black', packType: '4pk', qty: 12, stock: 50 },
                { color: 'Red', packType: '4pk', qty: 4, stock: 2 },
                { color: 'Teal', packType: '4pk', qty: 8, stock: 25 },
                { color: 'Black', packType: '2pk', qty: 6, stock: 30 },
                { color: 'Pink', packType: '2pk', qty: 3, stock: 0 },
            ];
            
            const totalQty = pickList.reduce((sum, i) => sum + i.qty, 0);
            const shortItems = pickList.filter(i => i.stock < i.qty && i.stock > 0);
            const outItems = pickList.filter(i => i.stock === 0);
            
            document.getElementById('totalPull').textContent = totalQty;
            document.getElementById('variantCount').textContent = pickList.length;
            document.getElementById('pickProgress').textContent = `Picked ${pickedItems.size}/${pickList.length}`;
            
            // Show warnings
            if (shortItems.length || outItems.length) {
                document.getElementById('stockWarning').classList.remove('hidden');
                document.getElementById('stockWarningText').textContent = 
                    `${outItems.length} OUT, ${shortItems.length} SHORT - check before packing`;
            }
            
            if (shortItems.length) {
                document.getElementById('shortCount').textContent = `${shortItems.length} SHORT`;
                document.getElementById('shortCount').classList.remove('hidden');
            }
            if (outItems.length) {
                document.getElementById('outCount').textContent = `${outItems.length} OUT`;
                document.getElementById('outCount').classList.remove('hidden');
            }
            
            // Render attention section
            if (outItems.length || shortItems.length) {
                document.getElementById('attentionSection').classList.remove('hidden');
                document.getElementById('attentionItems').innerHTML = [...outItems, ...shortItems].map(i => `
                    <div class="pick-row ${i.stock === 0 ? 'bg-red-500/10' : 'bg-yellow-500/10'}">
                        <span class="badge ${i.stock === 0 ? 'badge-out' : 'badge-short'}">${i.stock === 0 ? 'OUT' : 'SHORT'}</span>
                        <span class="w-3 h-3 rounded-full" style="background: ${getColorHex(i.color)}"></span>
                        <span>${i.color} ${i.packType}</span>
                        <span class="font-bold text-primary">x${i.qty}</span>
                        <span class="text-gray-500 text-sm ml-auto">stock: ${i.stock}</span>
                    </div>
                `).join('');
            }
            
            // Group by pack type
            const grouped = {};
            pickList.forEach(i => {
                if (!grouped[i.packType]) grouped[i.packType] = [];
                grouped[i.packType].push(i);
            });
            
            document.getElementById('pickListGroups').innerHTML = Object.entries(grouped).map(([pack, items]) => `
                <div>
                    <h4 class="text-xs font-semibold text-gray-500 uppercase mb-2">${pack}</h4>
                    <div class="space-y-1">
                        ${items.map((i, idx) => `
                            <div class="pick-row ${pickedItems.has(pack+i.color) ? 'checked' : ''}" onclick="togglePicked('${pack+i.color}')">
                                <input type="checkbox" class="pick-checkbox" ${pickedItems.has(pack+i.color) ? 'checked' : ''}>
                                <span class="w-3 h-3 rounded-full" style="background: ${getColorHex(i.color)}"></span>
                                <span class="color-name">${i.color}</span>
                                <span class="qty font-bold text-primary">x${i.qty}</span>
                                <span class="stock text-gray-500 text-sm ml-auto">stock: ${i.stock}</span>
                                ${i.stock === 0 ? '<span class="badge badge-out">OUT</span>' : i.stock < i.qty ? '<span class="badge badge-short">SHORT</span>' : ''}
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        function togglePicked(key) {
            if (pickedItems.has(key)) pickedItems.delete(key);
            else pickedItems.add(key);
            document.getElementById('pickProgress').textContent = `Picked ${pickedItems.size}/${pickList.length}`;
            renderPickListPlaceholder();
        }
        
        function getColorHex(name) {
            const colors = { Black: '#1f2937', Red: '#dc2626', Teal: '#14b8a6', Pink: '#ec4899', Blue: '#3b82f6', Green: '#22c55e', Yellow: '#eab308', Purple: '#a855f7', Orange: '#f97316', White: '#f3f4f6' };
            return colors[name] || '#6b7280';
        }
        
        function enterPickingMode() {
            document.getElementById('fullscreenPick').classList.remove('hidden');
            document.getElementById('fullscreenPickList').innerHTML = document.getElementById('pickListGroups').innerHTML;
        }
        
        function exitPickingMode() {
            document.getElementById('fullscreenPick').classList.add('hidden');
        }
        
        function openMultiQtyCheck() {
            document.getElementById('multiQtyModal').classList.remove('hidden');
        }
        
        function closeMultiQtyModal() {
            document.getElementById('multiQtyModal').classList.add('hidden');
        }
        
        // ========== SCANNER ==========
        function toggleScanner() {
            isArmed = !isArmed;
            const btn = document.getElementById('armBtn');
            const input = document.getElementById('scanInput');
            if (isArmed) {
                btn.textContent = 'Scanner Armed';
                btn.classList.add('bg-red-600', 'border-red-600', 'text-white');
                btn.classList.remove('bg-[#242938]', 'text-gray-400');
                input.focus();
            } else {
                btn.textContent = 'Arm Scanner';
                btn.classList.remove('bg-red-600', 'border-red-600', 'text-white');
                btn.classList.add('bg-[#242938]');
            }
        }
        
        async function handleScan(e) {
            if (e.key !== 'Enter' || !isArmed) return;
            const tracking = e.target.value.trim();
            e.target.value = '';
            if (!tracking) return;
            
            try {
                const res = await fetch('/api/batch/scan', {
                    method: 'POST', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ batchId, trackingNumber: tracking })
                });
                if (res.ok) {
                    const data = await res.json();
                    scans.push({ tracking, zone: data.zoneType, zoneIndex: data.zoneIndex });
                    playTone(data.zoneType === 'clerk' ? 'clerk' : (data.zoneIndex || 1));
                    updateScanUI();
                    showToast(`Zone ${data.zoneType === 'clerk' ? 'Clerk' : data.zoneIndex}`, 'success');
                }
            } catch (e) { showToast('Scan failed', 'error'); }
        }
        
        function updateScanUI() {
            document.getElementById('scanProgress').textContent = `${scans.length} scanned`;
            const log = document.getElementById('scanLog');
            const last5 = scans.slice(-5).reverse();
            log.innerHTML = last5.map(s => `
                <div class="flex justify-between items-center text-sm px-3 py-2 bg-[#242938] rounded">
                    <span class="font-mono text-xs">${s.tracking.slice(-12)}</span>
                    <span class="badge ${s.zone === 'clerk' ? 'bg-yellow-500 text-black' : 'bg-primary text-black'}">
                        ${s.zone === 'clerk' ? 'Clerk' : 'M' + (s.zoneIndex || 1)}
                    </span>
                </div>
            `).join('');
            updateShipButton();
        }
        
        function clearScanLog() { scans = []; updateScanUI(); }
        
        // ========== SHIP BUTTON ==========
        function updateShipButton() {
            const btn = document.getElementById('shipBtn');
            const hasFiles = uploadedFiles.length > 0;
            const hasScans = scans.length > 0;
            
            if (!hasFiles) {
                btn.textContent = 'Upload files to begin';
                btn.disabled = true;
                btn.className = 'w-full py-4 rounded-lg bg-[#242938] border border-[#3a4256] text-gray-500 font-medium cursor-not-allowed mb-4';
            } else if (!hasScans) {
                btn.textContent = 'Start scanning packages';
                btn.disabled = true;
                btn.className = 'w-full py-4 rounded-lg bg-[#242938] border border-[#3a4256] text-gray-500 font-medium cursor-not-allowed mb-4';
            } else {
                btn.textContent = `Ship & Save - ${scans.length} packages`;
                btn.disabled = false;
                btn.className = 'w-full py-4 rounded-lg btn btn-success font-medium mb-4';
            }
        }
        
        async function handleShip() {
            if (!scans.length) return;
            showToast('Batch saved! ' + scans.length + ' packages shipped.', 'success');
            
            // Reset state
            scans = [];
            batchId = null;
            uploadedFiles = [];
            pickedItems.clear();
            printedLabels.clear();
            printedSlips.clear();
            
            document.getElementById('uploadedFiles').innerHTML = '';
            document.getElementById('uploadCount').textContent = '0 files';
            document.getElementById('pickListSection').classList.add('hidden');
            document.getElementById('printLabelsSection').classList.add('hidden');
            document.getElementById('printSlipsSection').classList.add('hidden');
            updateScanUI();
            updateShipButton();
            loadFileVault();
        }
        
        // ========== INVENTORY ==========
        async function loadInventory() {
            try {
                const res = await fetch('/api/inventory');
                if (res.ok) {
                    inventory = await res.json();
                    renderInventory();
                }
            } catch (e) { showToast('Failed to load inventory', 'error'); }
        }
        
        function renderInventory() {
            const grid = document.getElementById('inventoryGrid');
            const total = inventory.reduce((sum, i) => sum + (i.stock_count || 0), 0);
            document.getElementById('totalStock').textContent = total;
            
            if (!inventory.length) {
                grid.innerHTML = '<p class="text-sm text-gray-500 text-center py-6">No inventory items</p>';
                return;
            }
            
            const grouped = {};
            inventory.forEach(i => {
                const c = i.color || 'Unknown';
                if (!grouped[c]) grouped[c] = [];
                grouped[c].push(i);
            });
            
            grid.innerHTML = Object.entries(grouped).map(([color, items]) => `
                <div class="border border-[#3a4256] rounded-lg p-4">
                    <div class="flex items-center gap-2 mb-3">
                        <span class="w-3 h-3 rounded-full" style="background: ${getColorHex(color)}"></span>
                        <h3 class="font-medium">${color}</h3>
                    </div>
                    <div class="space-y-2">
                        ${items.map(i => `
                            <div class="flex justify-between items-center text-sm">
                                <span class="text-gray-400">${i.packType || i.pack_type || '—'}</span>
                                <div class="flex items-center gap-2">
                                    <button onclick="adjustStock('${i.id}', -1)" class="w-7 h-7 rounded bg-[#242938] border border-[#3a4256] hover:border-primary text-sm">-</button>
                                    <span class="w-10 text-center font-mono ${(i.stock_count || 0) <= 5 ? 'text-red-400' : ''}">${i.stock_count || 0}</span>
                                    <button onclick="adjustStock('${i.id}', 1)" class="w-7 h-7 rounded bg-[#242938] border border-[#3a4256] hover:border-primary text-sm">+</button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `).join('');
        }
        
        async function adjustStock(id, delta) {
            const item = inventory.find(i => i.id === id);
            if (!item) return;
            const newCount = Math.max(0, (item.stock_count || 0) + delta);
            try {
                const res = await fetch(`/api/inventory/${id}?stock_count=${newCount}`, { method: 'PUT' });
                if (res.ok) { item.stock_count = newCount; renderInventory(); }
            } catch (e) { showToast('Failed to update', 'error'); }
        }
        
        // ========== INIT ==========
        document.addEventListener('DOMContentLoaded', () => {
            loadSettings();
            loadFileVault();
            setInterval(() => {
                const now = new Date();
                document.getElementById('sessionTime').textContent = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            }, 1000);
        });
    </script>
</body>
</html>
'''
