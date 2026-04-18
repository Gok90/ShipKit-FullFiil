'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, Upload, Printer, ListChecks, Barcode, FileText, Send, Trash2, ChevronRight, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'
import { Toaster } from 'sonner'
import { showToast } from '@/lib/toast'

export function FulfillmentDashboard() {
  const { settings } = useShipKit()
  const [currentBatch, setCurrentBatch] = useState<any>(null)
  const [batches, setBatches] = useState<any[]>([])
  const [expandedStep, setExpandedStep] = useState(0) // Step 0 (File Vault) expanded by default
  const [printedLabels, setPrintedLabels] = useState<Set<string>>(new Set())
  const [printedSlips, setPrintedSlips] = useState<Set<string>>(new Set())
  const [scans, setScans] = useState<any[]>([])
  const [isArmed, setIsArmed] = useState(false)

  // Step 0: File Vault - Show saved batches
  const handleLoadBatch = (batch: any) => {
    setCurrentBatch(batch)
    showToast.success(`Loaded batch ${batch.id.slice(0, 8)}`)
    setExpandedStep(1) // Move to Step 1 after loading
  }

  const handleNewBatch = () => {
    const newBatch = { id: Math.random().toString(36), files: [], createdAt: new Date() }
    setCurrentBatch(newBatch)
    showToast.success('New batch created')
    setExpandedStep(1)
  }

  // Step 1: Upload Files
  const handleFileUpload = (files: File[]) => {
    if (!currentBatch) {
      showToast.error('Please create or load a batch first')
      return
    }

    if (files.length === 0) {
      showToast.warning('No files selected')
      return
    }

    // Mock file upload
    const newFiles = files.map(f => ({
      id: Math.random().toString(36),
      name: f.name,
      type: f.name.endsWith('.csv') ? 'csv' : f.name.endsWith('.pdf') ? 'pdf' : 'slip',
      size: f.size,
      uploaded: new Date()
    }))

    setCurrentBatch({ ...currentBatch, files: [...(currentBatch.files || []), ...newFiles] })
    showToast.success(`${files.length} file(s) uploaded`)
  }

  // Step 2: Print Labels
  const toggleLabelPrinted = (fileId: string) => {
    const newPrinted = new Set(printedLabels)
    if (newPrinted.has(fileId)) {
      newPrinted.delete(fileId)
    } else {
      newPrinted.add(fileId)
    }
    setPrintedLabels(newPrinted)
  }

  // Step 5: Print Slips
  const toggleSlipPrinted = (fileId: string) => {
    const newPrinted = new Set(printedSlips)
    if (newPrinted.has(fileId)) {
      newPrinted.delete(fileId)
    } else {
      newPrinted.add(fileId)
    }
    setPrintedSlips(newPrinted)
  }

  // Step 4: Scan Packages
  const handleScan = (tracking: string) => {
    if (!tracking.trim()) return
    setScans([...scans, { tracking, time: new Date() }])
    showToast.success(`Scanned: ${tracking.slice(-8)}`)
  }

  // Step 6: Ship & Archive
  const handleShipAndArchive = () => {
    if (scans.length === 0) {
      showToast.warning('No packages scanned yet')
      return
    }
    showToast.success(`Batch shipped! ${scans.length} packages`)
    setCurrentBatch(null)
    setScans([])
    setPrintedLabels(new Set())
    setPrintedSlips(new Set())
  }

  const labelFiles = currentBatch?.files?.filter((f: any) => f.type === 'pdf') || []
  const csvFiles = currentBatch?.files?.filter((f: any) => f.type === 'csv') || []
  const slipFiles = currentBatch?.files?.filter((f: any) => f.type === 'slip') || []

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0f1218] to-[#1a1f2e] p-6">
      <Toaster theme="dark" position="top-right" />
      
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">ShipKit Fulfillment</h1>
        <p className="text-gray-400">{settings?.storeName || 'Your Store'}</p>
      </div>

      <div className="max-w-6xl mx-auto space-y-4">
        {/* STEP 0: FILE VAULT */}
        <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
          <button
            onClick={() => setExpandedStep(expandedStep === 0 ? -1 : 0)}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
          >
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                0
              </div>
              <h2 className="text-lg font-semibold text-white">File Vault</h2>
              <span className="text-sm text-gray-400">({batches.length} saved batches)</span>
            </div>
            <ChevronDown
              className={cn('w-5 h-5 text-gray-400 transition-transform', expandedStep === 0 && 'rotate-180')}
            />
          </button>

          {expandedStep === 0 && (
            <div className="px-6 py-4 border-t border-[#3a4256] space-y-3">
              <div className="flex gap-2">
                <Button
                  onClick={handleNewBatch}
                  className="flex-1 bg-gradient-to-r from-[#3fc5e7] to-[#7122c6] text-white hover:opacity-90"
                >
                  New Batch
                </Button>
              </div>
              {batches.length === 0 ? (
                <p className="text-gray-500 text-sm">No saved batches yet</p>
              ) : (
                <div className="space-y-2">
                  {batches.map(batch => (
                    <button
                      key={batch.id}
                      onClick={() => handleLoadBatch(batch)}
                      className="w-full p-3 rounded-lg border border-[#3a4256] hover:border-[#3fc5e7] hover:bg-[#2a3140] transition-all text-left"
                    >
                      <div className="flex justify-between items-center">
                        <span className="text-white font-medium">{batch.createdAt.toLocaleDateString()}</span>
                        <span className="text-xs text-gray-400">{batch.files?.length || 0} files</span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </Card>

        {currentBatch ? (
          <>
            {/* STEP 1: UPLOAD FILES */}
            <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === 1 ? -1 : 1)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                    1
                  </div>
                  <h2 className="text-lg font-semibold text-white">Upload Files</h2>
                  <span className="text-sm text-gray-400">({currentBatch.files?.length || 0} files)</span>
                </div>
                <ChevronDown
                  className={cn('w-5 h-5 text-gray-400 transition-transform', expandedStep === 1 && 'rotate-180')}
                />
              </button>

              {expandedStep === 1 && (
                <div className="px-6 py-4 border-t border-[#3a4256] space-y-3">
                  <div className="border-2 border-dashed border-[#3a4256] rounded-lg p-8 text-center hover:border-[#3fc5e7] transition-colors cursor-pointer"
                    onClick={() => document.getElementById('fileInput')?.click()}>
                    <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-gray-400">Drop files here or click to upload</p>
                    <p className="text-xs text-gray-500 mt-1">Labels (PDF), Manifests (CSV), Slips</p>
                  </div>
                  <input
                    id="fileInput"
                    type="file"
                    multiple
                    hidden
                    onChange={(e) => handleFileUpload(Array.from(e.target.files || []))}
                  />

                  {currentBatch.files?.length > 0 && (
                    <div className="space-y-2">
                      {currentBatch.files.map((f: any) => (
                        <div key={f.id} className="flex items-center justify-between p-3 rounded-lg bg-[#1a1f2e] border border-[#3a4256]">
                          <span className="text-sm text-gray-300">{f.name}</span>
                          <span className="text-xs px-2 py-1 rounded bg-[#3fc5e7]/20 text-[#3fc5e7]">{f.type.toUpperCase()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* STEP 2: PRINT LABELS */}
            {labelFiles.length > 0 && (
              <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === 2 ? -1 : 2)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                      2
                    </div>
                    <h2 className="text-lg font-semibold text-white">Print Shipping Labels</h2>
                    <span className="text-sm text-gray-400">({printedLabels.size}/{labelFiles.length} printed)</span>
                  </div>
                  <ChevronDown
                    className={cn('w-5 h-5 text-gray-400 transition-transform', expandedStep === 2 && 'rotate-180')}
                  />
                </button>

                {expandedStep === 2 && (
                  <div className="px-6 py-4 border-t border-[#3a4256] space-y-3">
                    {labelFiles.map((f: any) => (
                      <button
                        key={f.id}
                        onClick={() => toggleLabelPrinted(f.id)}
                        className="w-full p-3 rounded-lg border border-[#3a4256] hover:border-[#3fc5e7] hover:bg-[#2a3140] transition-all text-left flex items-center justify-between"
                      >
                        <span className="text-gray-300">{f.name}</span>
                        <div className="flex items-center gap-2">
                          {printedLabels.has(f.id) ? (
                            <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                          )}
                        </div>
                      </button>
                    ))}
                    <Button
                      onClick={() => {
                        setPrintedLabels(new Set(labelFiles.map((f: any) => f.id)))
                        showToast.success('All labels marked as printed')
                      }}
                      variant="outline"
                      className="w-full"
                    >
                      Mark All Printed
                    </Button>
                  </div>
                )}
              </Card>
            )}

            {/* STEP 3: PICK LIST */}
            {csvFiles.length > 0 && (
              <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === 3 ? -1 : 3)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                      3
                    </div>
                    <h2 className="text-lg font-semibold text-white">Pick List</h2>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </button>
              </Card>
            )}

            {/* STEP 4: SCAN PACKAGES */}
            <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === 4 ? -1 : 4)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                    4
                  </div>
                  <h2 className="text-lg font-semibold text-white">Scan Packages</h2>
                  <span className="text-sm text-gray-400">({scans.length} scanned)</span>
                </div>
                <ChevronDown
                  className={cn('w-5 h-5 text-gray-400 transition-transform', expandedStep === 4 && 'rotate-180')}
                />
              </button>

              {expandedStep === 4 && (
                <div className="px-6 py-4 border-t border-[#3a4256] space-y-3">
                  <div className="flex gap-2">
                    <Button
                      onClick={() => setIsArmed(!isArmed)}
                      className={cn(
                        'flex-1',
                        isArmed ? 'bg-red-600 hover:bg-red-700' : 'bg-[#3fc5e7] hover:opacity-90'
                      )}
                    >
                      {isArmed ? 'Scanner Armed' : 'Arm Scanner'}
                    </Button>
                  </div>

                  {isArmed && (
                    <div>
                      <input
                        type="text"
                        placeholder="Scan tracking number..."
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleScan((e.target as HTMLInputElement).value)
                            ;(e.target as HTMLInputElement).value = ''
                          }
                        }}
                        className="w-full px-4 py-2 rounded-lg bg-[#1a1f2e] border border-[#3a4256] focus:border-[#3fc5e7] focus:outline-none text-white"
                        autoFocus
                      />
                    </div>
                  )}

                  {scans.length > 0 && (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {[...scans].reverse().slice(0, 5).map((scan, i) => (
                        <div key={i} className="p-2 rounded-lg bg-[#1a1f2e] border border-[#3a4256] text-sm">
                          <span className="font-mono text-[#3fc5e7]">{scan.tracking.slice(-8)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </Card>

            {/* STEP 5: PRINT SLIPS */}
            {slipFiles.length > 0 && (
              <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
                <button
                  onClick={() => setExpandedStep(expandedStep === 5 ? -1 : 5)}
                  className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                      5
                    </div>
                    <h2 className="text-lg font-semibold text-white">Print USPS Slips</h2>
                    <span className="text-sm text-gray-400">({printedSlips.size}/{slipFiles.length} printed)</span>
                  </div>
                  <ChevronDown
                    className={cn('w-5 h-5 text-gray-400 transition-transform', expandedStep === 5 && 'rotate-180')}
                  />
                </button>

                {expandedStep === 5 && (
                  <div className="px-6 py-4 border-t border-[#3a4256] space-y-3">
                    {slipFiles.map((f: any) => (
                      <button
                        key={f.id}
                        onClick={() => toggleSlipPrinted(f.id)}
                        className="w-full p-3 rounded-lg border border-[#3a4256] hover:border-[#3fc5e7] hover:bg-[#2a3140] transition-all text-left flex items-center justify-between"
                      >
                        <span className="text-gray-300">{f.name}</span>
                        {printedSlips.has(f.id) ? (
                          <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center text-white text-xs">✓</div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border-2 border-gray-500" />
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* STEP 6: SHIP & ARCHIVE */}
            <Card className="border-[#3a4256] bg-[#242938] overflow-hidden">
              <button
                onClick={() => setExpandedStep(expandedStep === 6 ? -1 : 6)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-[#2a3140] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#3fc5e7] to-[#7122c6] flex items-center justify-center text-white font-bold">
                    6
                  </div>
                  <h2 className="text-lg font-semibold text-white">Ship & Archive</h2>
                </div>
                <ChevronDown
                  className={cn('w-5 h-5 text-gray-400 transition-transform', expandedStep === 6 && 'rotate-180')}
                />
              </button>

              {expandedStep === 6 && (
                <div className="px-6 py-4 border-t border-[#3a4256] space-y-3">
                  <Button
                    onClick={handleShipAndArchive}
                    disabled={scans.length === 0}
                    className="w-full bg-gradient-to-r from-[#3fc5e7] to-[#7122c6] text-white hover:opacity-90 disabled:opacity-50"
                  >
                    Ship & Save - {scans.length} packages
                  </Button>
                </div>
              )}
            </Card>
          </>
        ) : (
          <Card className="border-[#3a4256] bg-[#242938] p-8 text-center">
            <p className="text-gray-400 mb-4">No batch selected. Create or load one from File Vault.</p>
            <Button
              onClick={handleNewBatch}
              className="bg-gradient-to-r from-[#3fc5e7] to-[#7122c6] text-white hover:opacity-90"
            >
              New Batch
            </Button>
          </Card>
        )}
      </div>
    </div>
  )
}
