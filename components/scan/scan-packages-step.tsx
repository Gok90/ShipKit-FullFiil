'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Crosshair, Package, Download } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { cn } from '@/lib/utils'
import { useAudio } from '@/hooks/use-audio'
import type { Scan, ManifestZone, CsvOrder } from '@/lib/types'

interface ScanPackagesStepProps {
  enabled: boolean
  batchId: string | null
  scans: Scan[]
  manifestZones: ManifestZone[]
  csvOrders: CsvOrder[]
  clerkCount: number
  clerkZoneName: string
  batchStartTime: Date | null
  onScan: (tracking: string) => Promise<{ 
    scan: Scan
    zoneType: 'manifest' | 'clerk'
    manifestZoneIndex: number | null 
  } | null>
}

export function ScanPackagesStep({
  enabled,
  batchId,
  scans,
  manifestZones,
  csvOrders,
  clerkCount,
  clerkZoneName,
  batchStartTime,
  onScan
}: ScanPackagesStepProps) {
  const [isArmed, setIsArmed] = useState(false)
  const [scanView, setScanView] = useState<'variant' | 'tracking' | 'product'>('variant')
  const [showMissing, setShowMissing] = useState<number | null>(null)
  const [lastScanZone, setLastScanZone] = useState<{ type: 'manifest' | 'clerk', index: number | null } | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const { playZoneSound, playError } = useAudio()
  
  const scannedTrackings = new Set(scans.map(s => s.normalizedTracking))
  
  // Handle arming
  const handleArm = useCallback(() => {
    setIsArmed(true)
    inputRef.current?.focus()
  }, [])
  
  const handleDisarm = useCallback(() => {
    setIsArmed(false)
  }, [])
  
  // Handle scan input
  const handleScanInput = useCallback(async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const rawTracking = (e.target as HTMLInputElement).value.trim()
      if (!rawTracking) return
      
      ;(e.target as HTMLInputElement).value = ''
      
      // Call parent's onScan to handle API call
      const result = await onScan(rawTracking)
      
      if (result) {
        setLastScanZone({ type: result.zoneType, index: result.manifestZoneIndex })
        // Play audio based on zone
        if (result.zoneType === 'manifest' && result.manifestZoneIndex !== null) {
          playZoneSound('primary', result.manifestZoneIndex - 1)
        } else {
          playZoneSound('secondary', 0)
        }
      } else {
        playError()
      }
    }
  }, [onScan, playZoneSound, playError])
  
  // Keep input focused when armed
  useEffect(() => {
    if (isArmed) {
      const interval = setInterval(() => {
        if (document.activeElement !== inputRef.current) {
          inputRef.current?.focus()
        }
      }, 100)
      return () => clearInterval(interval)
    }
  }, [isArmed])
  
  // Get missing trackings for a zone
  const getMissingTrackings = (zoneIndex: number) => {
    const zoneOrders = csvOrders.filter(o => o.manifestZoneIndex === zoneIndex)
    return zoneOrders
      .filter(o => !scannedTrackings.has(o.normalizedTracking))
      .map(o => o.normalizedTracking)
  }
  
  // Get zone name for display
  const getZoneName = (scan: Scan) => {
    if (scan.zoneType === 'clerk') return clerkZoneName
    const zone = manifestZones.find(z => z.zoneIndex === scan.manifestZoneIndex)
    return zone?.zoneName || `Manifest ${scan.manifestZoneIndex}`
  }
  
  // Export scan log
  const handleExportLog = () => {
    const log = scans.map(s => ({
      timestamp: s.scannedAt,
      tracking: s.trackingNumber,
      variant: s.variantName,
      zone: s.zoneType === 'clerk' ? clerkZoneName : `Manifest ${s.manifestZoneIndex}`
    }))
    
    const blob = new Blob([JSON.stringify(log, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `scan-log-${new Date().toISOString().split('T')[0]}.json`
    a.click()
    URL.revokeObjectURL(url)
  }
  
  return (
    <Card className={cn(!enabled && "opacity-50 pointer-events-none")}>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <span className="flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-foreground text-sm font-bold">
              3
            </span>
            Scan Packages
          </CardTitle>
          {batchStartTime && (
            <BatchTimer startTime={batchStartTime} />
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Scanner Control */}
        <div className="flex items-center gap-3">
          <Button
            onClick={isArmed ? handleDisarm : handleArm}
            variant={isArmed ? "destructive" : "default"}
            size="lg"
            className={cn(
              "gap-2 min-w-[160px]",
              isArmed && "animate-pulse"
            )}
            disabled={!enabled}
          >
            <Crosshair className="w-5 h-5" />
            {isArmed ? 'Scanner Armed' : 'Arm Scanner'}
          </Button>
          
          {isArmed && (
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-destructive opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-destructive" />
              </span>
              <span className="text-sm text-muted-foreground">Ready to scan</span>
            </div>
          )}
          
          {/* Hidden input for scanner */}
          <input
            ref={inputRef}
            type="text"
            className="sr-only"
            onKeyDown={handleScanInput}
            onBlur={() => isArmed && inputRef.current?.focus()}
          />
        </div>
        
        {/* Zone Pile Cards - Dynamic based on manifest zones */}
        {manifestZones.length > 0 ? (
          <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
            {/* Manifest Zones */}
            {manifestZones.map((zone) => {
              const missing = zone.totalOrders - zone.scannedCount
              const isComplete = zone.scannedCount >= zone.totalOrders
              
              return (
                <ZonePileCard
                  key={zone.id}
                  name={zone.zoneName}
                  count={zone.scannedCount}
                  expected={zone.totalOrders}
                  isComplete={isComplete}
                  variant="manifest"
                  zoneIndex={zone.zoneIndex}
                  onShowMissing={() => setShowMissing(showMissing === zone.zoneIndex ? null : zone.zoneIndex)}
                  missingCount={missing}
                  isLastScanned={lastScanZone?.type === 'manifest' && lastScanZone.index === zone.zoneIndex}
                />
              )
            })}
            
            {/* Clerk Counter Zone */}
            <ZonePileCard
              name={clerkZoneName}
              count={clerkCount}
              expected={null}
              isComplete={false}
              variant="clerk"
              zoneIndex={0}
              isLastScanned={lastScanZone?.type === 'clerk'}
            />
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Package className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Upload a manifest CSV to create zones</p>
          </div>
        )}
        
        {/* Missing Trackings Display */}
        {showMissing !== null && (
          <MissingTrackingsPanel
            zoneIndex={showMissing}
            zoneName={manifestZones.find(z => z.zoneIndex === showMissing)?.zoneName || ''}
            trackings={getMissingTrackings(showMissing)}
            onClose={() => setShowMissing(null)}
          />
        )}
        
        {/* Scan Log */}
        {scans.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-sm">Scan Log</h4>
                <Tabs value={scanView} onValueChange={(v) => setScanView(v as typeof scanView)}>
                  <TabsList className="h-7">
                    <TabsTrigger value="variant" className="text-xs px-2 h-5">Variant</TabsTrigger>
                    <TabsTrigger value="tracking" className="text-xs px-2 h-5">Tracking</TabsTrigger>
                    <TabsTrigger value="product" className="text-xs px-2 h-5">Product</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
              <Button variant="ghost" size="sm" onClick={handleExportLog} className="gap-1 h-7">
                <Download className="w-3 h-3" />
                Export
              </Button>
            </div>
            
            <div className="max-h-48 overflow-y-auto space-y-1 text-sm">
              {scans.slice().reverse().map(scan => (
                <div
                  key={scan.id}
                  className={cn(
                    "flex items-center justify-between p-2 rounded",
                    scan.zoneType === 'manifest' ? "bg-primary/10" : "bg-warning/10"
                  )}
                >
                  <span className="font-mono truncate">
                    {scanView === 'variant' && (scan.variantName || 'Unknown')}
                    {scanView === 'tracking' && scan.trackingNumber}
                    {scanView === 'product' && (scan.productName || 'Unknown')}
                  </span>
                  <Badge variant="outline" className="text-xs ml-2 shrink-0">
                    {getZoneName(scan)}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

function ZonePileCard({
  name,
  count,
  expected,
  isComplete,
  variant,
  zoneIndex,
  onShowMissing,
  missingCount,
  isLastScanned
}: {
  name: string
  count: number
  expected: number | null
  isComplete: boolean
  variant: 'manifest' | 'clerk'
  zoneIndex: number
  onShowMissing?: () => void
  missingCount?: number
  isLastScanned?: boolean
}) {
  const hasExpected = expected !== null && expected > 0
  
  return (
    <div className={cn(
      "p-4 rounded-lg border-2 transition-all",
      variant === 'clerk' && "border-warning/50 bg-warning/5",
      variant === 'manifest' && isComplete && "border-success bg-success/5",
      variant === 'manifest' && !isComplete && "border-border bg-secondary/30",
      isLastScanned && "ring-2 ring-primary ring-offset-2 ring-offset-background"
    )}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium flex items-center gap-2">
          <Package className={cn(
            "w-5 h-5",
            variant === 'clerk' && "text-warning",
            variant === 'manifest' && isComplete && "text-success",
            variant === 'manifest' && !isComplete && "text-muted-foreground"
          )} />
          {name}
        </h4>
        {variant === 'manifest' && missingCount && missingCount > 0 && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onShowMissing}
            className="text-xs h-6 px-2 text-destructive hover:text-destructive"
          >
            {missingCount} missing
          </Button>
        )}
      </div>
      
      <div className="flex items-baseline gap-1">
        <span className={cn(
          "text-4xl font-bold tabular-nums",
          variant === 'clerk' && "text-warning",
          variant === 'manifest' && isComplete && "text-success"
        )}>
          {count}
        </span>
        {hasExpected && (
          <span className="text-xl text-muted-foreground">/ {expected}</span>
        )}
      </div>
      
      {hasExpected && (
        <div className="mt-2 h-2 bg-secondary rounded-full overflow-hidden">
          <div
            className={cn(
              "h-full transition-all",
              isComplete ? "bg-success" : "bg-primary"
            )}
            style={{ width: `${Math.min(100, (count / expected) * 100)}%` }}
          />
        </div>
      )}
    </div>
  )
}

function MissingTrackingsPanel({
  zoneIndex,
  zoneName,
  trackings,
  onClose
}: {
  zoneIndex: number
  zoneName: string
  trackings: string[]
  onClose: () => void
}) {
  if (trackings.length === 0) return null
  
  return (
    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-medium text-destructive">
          Missing from {zoneName} ({trackings.length})
        </h4>
        <Button variant="ghost" size="sm" onClick={onClose} className="h-6 px-2">
          Close
        </Button>
      </div>
      <div className="flex flex-wrap gap-2">
        {trackings.slice(0, 20).map(tracking => (
          <Badge key={tracking} variant="outline" className="font-mono text-xs">
            ...{tracking.slice(-8)}
          </Badge>
        ))}
        {trackings.length > 20 && (
          <Badge variant="outline" className="text-xs">
            +{trackings.length - 20} more
          </Badge>
        )}
      </div>
    </div>
  )
}

function BatchTimer({ startTime }: { startTime: Date }) {
  const [hours, setHours] = useState(0)
  
  useEffect(() => {
    const update = () => {
      const diff = Date.now() - new Date(startTime).getTime()
      setHours(Math.floor(diff / (1000 * 60 * 60)))
    }
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [startTime])
  
  return (
    <div className={cn(
      "text-sm",
      hours >= 8 && "text-destructive",
      hours >= 4 && hours < 8 && "text-warning",
      hours < 4 && "text-muted-foreground"
    )}>
      {hours}h since upload
    </div>
  )
}
