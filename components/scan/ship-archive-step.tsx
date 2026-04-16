'use client'

import { useState } from 'react'
import { Ship, Archive, Undo2, Clock, Check, Pause, Camera } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Scan, ManifestZone, CsvOrder, BatchSummary } from '@/lib/types'
import { HoldQueue } from './hold-queue'

interface ShipArchiveStepProps {
  hasFiles: boolean
  scans: Scan[]
  manifestZones: ManifestZone[]
  csvOrders: CsvOrder[]
  committedBatches: BatchSummary[]
  clerkZoneName: string
  onCommit: (heldTrackings: string[]) => void
  onArchive: () => void
  onUndoBatch: (batchId: string) => void
}

export function ShipArchiveStep({
  hasFiles,
  scans,
  manifestZones,
  csvOrders,
  committedBatches,
  clerkZoneName,
  onCommit,
  onArchive,
  onUndoBatch
}: ShipArchiveStepProps) {
  const [showCommitModal, setShowCommitModal] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)
  const [showHoldModal, setShowHoldModal] = useState(false)
  const [showArchiveSuccess, setShowArchiveSuccess] = useState(false)
  const [archiveStats, setArchiveStats] = useState({ packages: 0, duration: '' })
  
  const scannedCount = scans.length
  const expectedCount = csvOrders.length
  const allScanned = expectedCount > 0 && scannedCount >= expectedCount
  const hasScans = scannedCount > 0
  const hasBatches = committedBatches.length > 0
  
  // Calculate unscanned trackings
  const scannedTrackings = new Set(scans.map(s => s.normalizedTracking))
  const unscannedTrackings = csvOrders
    .map(o => o.normalizedTracking)
    .filter(t => !scannedTrackings.has(t))
  const hasUnscanned = unscannedTrackings.length > 0
  
  // Button state logic
  const getButtonState = () => {
    if (!hasFiles && !hasBatches) {
      return { label: 'Ship & Save', variant: 'secondary' as const, disabled: true }
    }
    if (hasScans) {
      if (allScanned) {
        return { 
          label: `Ship & Save — ${scannedCount}/${expectedCount}`, 
          variant: 'default' as const, 
          disabled: false,
          className: 'bg-success hover:bg-success/90 text-success-foreground'
        }
      }
      return { 
        label: `Ship & Save — ${scannedCount}/${expectedCount || '?'}`, 
        variant: 'default' as const, 
        disabled: false 
      }
    }
    if (hasBatches) {
      return { 
        label: 'Ship & Archive All', 
        variant: 'default' as const, 
        disabled: false,
        className: 'bg-success hover:bg-success/90 text-success-foreground'
      }
    }
    return { label: 'Ship & Save', variant: 'secondary' as const, disabled: true }
  }
  
  const buttonState = getButtonState()
  
  const handleButtonClick = () => {
    if (hasScans) {
      if (hasUnscanned) {
        setShowHoldModal(true)
      } else {
        setShowCommitModal(true)
      }
    } else if (hasBatches) {
      setShowArchiveModal(true)
    }
  }
  
  const handleCommit = () => {
    onCommit([])
    setShowCommitModal(false)
  }
  
  const handleCommitWithHold = () => {
    onCommit(unscannedTrackings)
    setShowHoldModal(false)
  }
  
  const handleArchive = () => {
    const totalPackages = committedBatches.reduce((acc, b) => 
      acc + b.primaryZoneCount + b.secondaryZoneCount, 0
    )
    
    // Calculate batch duration
    const firstBatch = committedBatches[0]
    const lastBatch = committedBatches[committedBatches.length - 1]
    const duration = firstBatch && lastBatch 
      ? formatDuration(new Date(lastBatch.committedAt).getTime() - new Date(firstBatch.committedAt).getTime())
      : ''
    
    setArchiveStats({ packages: totalPackages, duration })
    setShowArchiveModal(false)
    
    onArchive()
    
    // Show success animation
    setShowArchiveSuccess(true)
    setTimeout(() => setShowArchiveSuccess(false), 3000)
  }
  
  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              5
            </span>
            Ship & Archive
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Main Action Button */}
          <Button
            onClick={handleButtonClick}
            disabled={buttonState.disabled}
            size="lg"
            className={cn("w-full gap-2 text-lg py-6", buttonState.className)}
          >
            {hasBatches && !hasScans ? (
              <Archive className="w-5 h-5" />
            ) : (
              <Ship className="w-5 h-5" />
            )}
            {buttonState.label}
          </Button>
          
          {/* Hold Queue */}
          <HoldQueue 
            clerkZoneName={clerkZoneName}
          />
          
          {/* Committed Batches */}
          {committedBatches.length > 0 && (
            <div className="space-y-3">
              <h4 className="font-medium text-sm text-muted-foreground">
                Committed Batches ({committedBatches.length})
              </h4>
              {committedBatches.map(batch => (
                <BatchCard
                  key={batch.id}
                  batch={batch}
                  manifestZones={manifestZones}
                  clerkZoneName={clerkZoneName}
                  onUndo={() => onUndoBatch(batch.id)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Commit Confirmation Modal */}
      <Dialog open={showCommitModal} onOpenChange={setShowCommitModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Shipment</DialogTitle>
            <DialogDescription>
              Review the inventory changes before committing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              The following items will be decremented from inventory:
            </p>
            <div className="max-h-48 overflow-y-auto space-y-1">
              {Object.entries(
                scans.reduce((acc, s) => {
                  if (s.variantName) {
                    acc[s.variantName] = (acc[s.variantName] || 0) + 1
                  }
                  return acc
                }, {} as Record<string, number>)
              ).map(([variant, count]) => (
                <div key={variant} className="flex justify-between text-sm p-2 bg-secondary rounded">
                  <span>{variant}</span>
                  <span className="font-mono">-{count}</span>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommitModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleCommit} className="gap-2">
              <Check className="w-4 h-4" />
              Confirm & Commit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Hold Modal */}
      <Dialog open={showHoldModal} onOpenChange={setShowHoldModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Packages Going On Hold</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="p-4 rounded-lg bg-warning/10 border border-warning/20">
              <div className="flex items-center gap-2 text-warning mb-2">
                <Pause className="w-5 h-5" />
                <span className="font-semibold text-lg">
                  {unscannedTrackings.length} packages going ON HOLD
                </span>
              </div>
              <p className="text-sm text-muted-foreground">
                These packages were not scanned and will be added to the Hold Queue.
                You can ship them later or cancel them.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowHoldModal(false)}>
              Go Back
            </Button>
            <Button onClick={handleCommitWithHold} className="gap-2">
              <Check className="w-4 h-4" />
              Commit & Hold
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Archive Confirmation Modal */}
      <Dialog open={showArchiveModal} onOpenChange={setShowArchiveModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive Day&apos;s Shipments</DialogTitle>
            <DialogDescription>
              This will archive all committed batches to history.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <div className="p-4 rounded-lg bg-secondary">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">Total Batches</p>
                  <p className="text-2xl font-bold">{committedBatches.length}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Total Packages</p>
                  <p className="text-2xl font-bold">
                    {committedBatches.reduce((acc, b) => acc + b.primaryZoneCount + b.secondaryZoneCount, 0)}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex items-start gap-2 p-3 rounded-lg bg-info/10 text-info text-sm">
              <Camera className="w-4 h-4 mt-0.5 shrink-0" />
              <p>Optional: Take a quick photo at carrier drop-off for dispute protection.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleArchive} className="gap-2 bg-success hover:bg-success/90 text-success-foreground">
              <Archive className="w-4 h-4" />
              Archive All
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Archive Success Animation */}
      {showArchiveSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/95">
          <div className="text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="text-6xl font-bold text-success">
              {archiveStats.packages}
            </div>
            <div className="text-2xl font-semibold">packages shipped</div>
            {archiveStats.duration && (
              <div className="text-lg text-muted-foreground">
                Batch time: {archiveStats.duration}
              </div>
            )}
            <div className="text-xl mt-4">Great work. See you tomorrow.</div>
          </div>
        </div>
      )}
    </>
  )
}

function BatchCard({
  batch,
  manifestZones,
  clerkZoneName,
  onUndo
}: {
  batch: BatchSummary
  manifestZones: ManifestZone[]
  clerkZoneName: string
  onUndo: () => void
}) {
  const [isOpen, setIsOpen] = useState(false)
  const [showUndoFlash, setShowUndoFlash] = useState(false)
  
  const handleUndo = () => {
    setShowUndoFlash(true)
    setTimeout(() => {
      onUndo()
    }, 300)
  }
  
  const totalPackages = batch.primaryZoneCount + batch.secondaryZoneCount
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className={cn(
        "rounded-lg border bg-card transition-colors",
        showUndoFlash && "bg-destructive/20"
      )}>
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm font-medium">
              {new Date(batch.committedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            <Badge variant="secondary">
              {totalPackages} packages
            </Badge>
          </div>
          <ChevronDown className={cn(
            "w-4 h-4 text-muted-foreground transition-transform",
            isOpen && "rotate-180"
          )} />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-3">
            {/* Zone Split */}
            <div className="grid grid-cols-2 gap-2 text-sm">
              {manifestZones.length > 0 && (
                <div className="p-2 rounded bg-primary/10">
                  <span className="text-muted-foreground">Manifests:</span>
                  <span className="ml-2 font-bold">{batch.primaryZoneCount}</span>
                </div>
              )}
              <div className="p-2 rounded bg-warning/10">
                <span className="text-muted-foreground">{clerkZoneName}:</span>
                <span className="ml-2 font-bold">{batch.secondaryZoneCount}</span>
              </div>
            </div>
            
            {/* Variant Pills */}
            {Object.keys(batch.variants).length > 0 && (
              <div className="flex flex-wrap gap-1">
                {Object.entries(batch.variants).slice(0, 8).map(([variant, count]) => (
                  <Badge key={variant} variant="outline" className="text-xs">
                    {variant} x{count}
                  </Badge>
                ))}
                {Object.keys(batch.variants).length > 8 && (
                  <Badge variant="outline" className="text-xs">
                    +{Object.keys(batch.variants).length - 8} more
                  </Badge>
                )}
              </div>
            )}
            
            {/* Undo Button */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUndo}
              className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-1"
            >
              <Undo2 className="w-4 h-4" />
              Undo Batch
            </Button>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

function formatDuration(ms: number): string {
  const hours = Math.floor(ms / (1000 * 60 * 60))
  const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}
