'use client'

import { FulfillmentDashboard } from './fulfillment-dashboard'

export function ScanTab() {
  return <FulfillmentDashboard />
}

      const batchRes = await fetch('/api/batch/active', { method: 'POST' })
      const newBatch = await batchRes.json()
      await refreshBatch()
      
      // Now upload files
      const formData = new FormData()
      formData.append('batchId', newBatch.id)
      files.forEach(file => formData.append('files', file))
      
      await fetch('/api/batch/files', {
        method: 'POST',
        body: formData
      })
    } else {
      // Upload to existing batch
      const formData = new FormData()
      formData.append('batchId', activeBatch.id)
      files.forEach(file => formData.append('files', file))
      
      await fetch('/api/batch/files', {
        method: 'POST',
        body: formData
      })
    }
    
    // Refresh all data
    mutateFiles()
    mutateOrders()
    
    // Update pending count
    setTodayPending(prev => prev + files.length)
  }, [activeBatch?.id, refreshBatch, mutateFiles, mutateOrders])
  
  // Handle scan via API
  const handleScan = useCallback(async (trackingNumber: string) => {
    if (!activeBatch?.id) return null
    
    try {
      const res = await fetch('/api/batch/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batchId: activeBatch.id,
          trackingNumber
        })
      })
      
      if (!res.ok) {
        const error = await res.json()
        console.error('Scan error:', error)
        return null
      }
      
      const result = await res.json()
      
      // Refresh scans and zones
      mutateScans()
      mutateFiles() // Zone counts are updated
      
      return result
    } catch (error) {
      console.error('Scan error:', error)
      return null
    }
  }, [activeBatch?.id, mutateScans, mutateFiles])
  
  // Handle print toggle
  const handlePrintToggle = useCallback(async (fileId: string, printed: boolean) => {
    await fetch('/api/batch/files', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileId, printed })
    })
    mutateFiles()
  }, [mutateFiles])
  
  // Handle commit
  const handleCommit = useCallback(async (heldTrackings: string[]) => {
    if (!activeBatch?.id) return
    
    const res = await fetch('/api/batch/commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: activeBatch.id,
        heldTrackings
      })
    })
    
    const result = await res.json()
    
    // Build batch summary for UI
    const variantBreakdown: Record<string, number> = {}
    scans.forEach(s => {
      if (s.variantName) {
        variantBreakdown[s.variantName] = (variantBreakdown[s.variantName] || 0) + 1
      }
    })
    
    const manifestScans = scans.filter(s => s.zoneType === 'manifest').length
    
    const batch: BatchSummary = {
      id: result.batchId || crypto.randomUUID(),
      committedAt: new Date(),
      primaryZoneCount: manifestScans,
      secondaryZoneCount: clerkCount,
      variants: variantBreakdown,
      slipFiles: uploadedFiles
        .filter(f => f.fileType === 'usps_slip')
        .map(f => ({ filename: f.filename, data: f.fileData })),
      droppedOffAt: null,
      carrierAcceptedAt: null
    }
    
    setCommittedBatches(prev => [...prev, batch])
    setTodayShipped(prev => prev + scans.length - heldTrackings.length)
    setTodayPending(prev => Math.max(0, prev - scans.length))
    
    // Refresh data
    mutateScans()
    mutate('/api/hold-queue')
  }, [activeBatch?.id, scans, clerkCount, uploadedFiles, mutateScans])
  
  // Handle archive
  const handleArchive = useCallback(async () => {
    if (!activeBatch?.id) return
    
    const totalPackages = committedBatches.reduce((acc, b) => 
      acc + b.primaryZoneCount + b.secondaryZoneCount, 0
    )
    
    const primaryTotal = committedBatches.reduce((acc, b) => acc + b.primaryZoneCount, 0)
    const secondaryTotal = committedBatches.reduce((acc, b) => acc + b.secondaryZoneCount, 0)
    
    const variantBreakdown: Record<string, number> = {}
    committedBatches.forEach(b => {
      Object.entries(b.variants).forEach(([variant, count]) => {
        variantBreakdown[variant] = (variantBreakdown[variant] || 0) + count
      })
    })
    
    await fetch('/api/batch/archive', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        batchId: activeBatch.id,
        batchCount: committedBatches.length,
        totalPackages,
        primaryZoneTotal: primaryTotal,
        secondaryZoneTotal: secondaryTotal,
        variantBreakdown,
        slipFiles: committedBatches.flatMap(b => b.slipFiles)
      })
    })
    
    mutate('/api/history')
    
    // Reset state
    setCommittedBatches([])
    setTodayPending(0)
    
    // Refresh batch to get a clean state
    await refreshBatch()
    mutateFiles()
    mutateOrders()
    mutateScans()
  }, [activeBatch?.id, committedBatches, refreshBatch, mutateFiles, mutateOrders, mutateScans])
  
  // Handle undo batch
  const handleUndoBatch = useCallback((batchId: string) => {
    const batch = committedBatches.find(b => b.id === batchId)
    if (batch) {
      setTodayShipped(prev => prev - batch.primaryZoneCount - batch.secondaryZoneCount)
    }
    setCommittedBatches(prev => prev.filter(b => b.id !== batchId))
  }, [committedBatches])
  
  // Computed values
  const labelFiles = uploadedFiles.filter(f => f.fileType === 'label_pdf')
  const slipFiles = uploadedFiles.filter(f => f.fileType === 'usps_slip')
  const csvFiles = uploadedFiles.filter(f => f.fileType === 'manifest_csv')
  const hasFiles = uploadedFiles.length > 0
  const hasCsv = csvFiles.length > 0
  
  // Get oldest order date for SLA calculation
  const oldestOrderDate = csvOrders.length > 0 
    ? csvOrders.reduce((oldest, o) => {
        if (!o.orderDate) return oldest
        const orderDate = new Date(o.orderDate)
        if (!oldest) return orderDate
        return orderDate < oldest ? orderDate : oldest
      }, null as Date | null)
    : null
  
  // Get batch start time
  const batchStartTime = activeBatch?.startedAt ? new Date(activeBatch.startedAt) : null
  
  return (
    <div className="space-y-6">
      {/* Dispatch Deadline Banner */}
      {hasFiles && (
        <DispatchBanner 
          carrierCloseWeekday={settings?.carrierCloseWeekday ?? '17:00'}
          carrierCloseSaturday={settings?.carrierCloseSaturday ?? '14:00'}
          carrierCloseSunday={settings?.carrierCloseSunday ?? null}
          travelTimeMinutes={settings?.travelTimeMinutes ?? 15}
        />
      )}
      
      {/* Daily Progress */}
      <DailyProgress 
        shipped={todayShipped} 
        pending={todayPending}
        isArchived={committedBatches.length === 0 && todayShipped > 0}
      />
      
      {/* Step 1: Upload Files */}
      <FileUploadStep 
        uploadedFiles={uploadedFiles}
        manifestZones={manifestZones}
        onFilesUploaded={handleFilesUploaded}
        oldestOrderDate={oldestOrderDate}
        batchStartTime={batchStartTime}
      />
      
      {/* Step 2: Print Labels */}
      {labelFiles.length > 0 && (
        <PrintLabelsStep 
          title="Print Labels"
          files={labelFiles}
          onPrintToggle={handlePrintToggle}
        />
      )}
      
      {/* Pick List */}
      {hasCsv && (
        <PickListStep 
          orders={csvOrders}
        />
      )}
      
      {/* Step 3: Scan Packages */}
      <ScanPackagesStep 
        enabled={hasFiles}
        batchId={activeBatch?.id ?? null}
        scans={scans}
        manifestZones={manifestZones}
        csvOrders={csvOrders}
        clerkCount={clerkCount}
        clerkZoneName={settings?.secondaryZoneName ?? 'Clerk Counter'}
        batchStartTime={batchStartTime}
        onScan={handleScan}
      />
      
      {/* Step 4: Print USPS Slips - After scan, before archive */}
      {slipFiles.length > 0 && (
        <PrintLabelsStep 
          title="Print USPS Slips"
          stepNumber={4}
          files={slipFiles}
          onPrintToggle={handlePrintToggle}
        />
      )}
      
      {/* Step 5: Ship & Archive */}
      <ShipArchiveStep 
        hasFiles={hasFiles}
        scans={scans}
        manifestZones={manifestZones}
        csvOrders={csvOrders}
        committedBatches={committedBatches}
        clerkZoneName={settings?.secondaryZoneName ?? 'Clerk Counter'}
        onCommit={handleCommit}
        onArchive={handleArchive}
        onUndoBatch={handleUndoBatch}
      />
    </div>
  )
}
