'use client'

import { useState } from 'react'
import { History, Download, ChevronDown, Clock, Package, Truck, Check, Copy, Lock } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'
import type { HistorySession } from '@/lib/types'

export function HistoryTab() {
  const { historySessions, isLoadingHistory, settings } = useShipKit()
  
  if (isLoadingHistory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }
  
  if (historySessions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 gap-4">
        <div className="p-4 rounded-full bg-muted">
          <History className="w-12 h-12 text-muted-foreground" />
        </div>
        <h2 className="text-xl font-semibold">No History Yet</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Your shipment history will appear here after you complete your first Ship & Archive.
        </p>
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* History Sessions */}
      <div className="space-y-4">
        {historySessions.map(session => (
          <HistorySessionCard
            key={session.id}
            session={session}
            primaryZoneName={settings?.primaryZoneName ?? 'Manifest'}
            secondaryZoneName={settings?.secondaryZoneName ?? 'Clerk Counter'}
          />
        ))}
      </div>
      
      {/* Free Tier Notice */}
      <div className="text-center text-sm text-muted-foreground p-4 border border-dashed rounded-lg">
        <p>Showing last 7 sessions. <span className="text-primary">Upgrade to Pro</span> for unlimited history.</p>
      </div>
      
      {/* Pro Features - Locked */}
      <ProFeaturesSection />
    </div>
  )
}

function HistorySessionCard({
  session,
  primaryZoneName,
  secondaryZoneName
}: {
  session: HistorySession
  primaryZoneName: string
  secondaryZoneName: string
}) {
  const [isOpen, setIsOpen] = useState(false)
  
  const date = new Date(session.archivedAt)
  const dateStr = date.toLocaleDateString(undefined, { 
    weekday: 'long', 
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
  const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  
  const variantBreakdown = session.variantBreakdown as Record<string, number> | null
  const variantEntries = variantBreakdown ? Object.entries(variantBreakdown) : []
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CardHeader className="pb-3">
          <CollapsibleTrigger className="w-full">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <div className="text-left">
                  <h3 className="font-semibold">{dateStr}</h3>
                  <p className="text-sm text-muted-foreground">{timeStr}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="text-right">
                  <p className="text-2xl font-bold">{session.totalPackages}</p>
                  <p className="text-xs text-muted-foreground">packages</p>
                </div>
                <ChevronDown className={cn(
                  "w-5 h-5 text-muted-foreground transition-transform",
                  isOpen && "rotate-180"
                )} />
              </div>
            </div>
          </CollapsibleTrigger>
        </CardHeader>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-3 rounded-lg bg-secondary text-center">
                <p className="text-xs text-muted-foreground">Batches</p>
                <p className="text-xl font-bold">{session.batchCount}</p>
              </div>
              <div className="p-3 rounded-lg bg-primary/10 text-center">
                <p className="text-xs text-muted-foreground">{primaryZoneName}</p>
                <p className="text-xl font-bold">{session.primaryZoneTotal}</p>
              </div>
              <div className="p-3 rounded-lg bg-warning/10 text-center">
                <p className="text-xs text-muted-foreground">{secondaryZoneName}</p>
                <p className="text-xl font-bold">{session.secondaryZoneTotal}</p>
              </div>
            </div>
            
            {/* Variant Breakdown */}
            {variantEntries.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Variants Shipped</h4>
                <div className="flex flex-wrap gap-1">
                  {variantEntries.slice(0, 10).map(([variant, count]) => (
                    <Badge key={variant} variant="outline" className="text-xs">
                      {variant} x{count}
                    </Badge>
                  ))}
                  {variantEntries.length > 10 && (
                    <Badge variant="outline" className="text-xs">
                      +{variantEntries.length - 10} more
                    </Badge>
                  )}
                </div>
              </div>
            )}
            
            {/* Timestamps */}
            <div className="flex gap-4 text-sm">
              <TimestampToggle
                label="Dropped Off"
                value={session.droppedOffAt}
                sessionId={session.id}
                field="droppedOffAt"
              />
              <TimestampToggle
                label="Carrier Accepted"
                value={session.carrierAcceptedAt}
                sessionId={session.id}
                field="carrierAcceptedAt"
              />
            </div>
            
            {/* Slip Downloads - Pro Feature */}
            {session.slipFiles && (session.slipFiles as Array<{filename: string; data: string}>).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {(session.slipFiles as Array<{filename: string; data: string}>).map((slip, i) => (
                  <Button key={i} variant="outline" size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    {slip.filename}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  )
}

function TimestampToggle({
  label,
  value,
  sessionId,
  field
}: {
  label: string
  value: Date | null
  sessionId: string
  field: string
}) {
  const [isSet, setIsSet] = useState(!!value)
  
  const handleToggle = async () => {
    // TODO: Update API to set timestamp
    setIsSet(!isSet)
  }
  
  return (
    <button
      onClick={handleToggle}
      className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors",
        isSet 
          ? "bg-success/10 border-success/20 text-success" 
          : "border-border text-muted-foreground hover:border-primary/50"
      )}
    >
      {isSet ? (
        <Check className="w-4 h-4" />
      ) : (
        <Clock className="w-4 h-4" />
      )}
      <span>{label}</span>
      {isSet && value && (
        <span className="text-xs opacity-80">
          {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      )}
    </button>
  )
}

function ProFeaturesSection() {
  return (
    <div className="space-y-4">
      {/* Dispute Template Generator */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5" />
            <span className="font-medium">Pro Feature</span>
          </div>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Copy className="w-5 h-5" />
            Dispute Template Generator
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Generate pre-filled dispute response templates for INR and INAD claims.
          </p>
        </CardContent>
      </Card>
      
      {/* Returns Analytics Log */}
      <Card className="relative overflow-hidden">
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Lock className="w-5 h-5" />
            <span className="font-medium">Pro Feature</span>
          </div>
        </div>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Truck className="w-5 h-5" />
            Returns Analytics Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Track returns by SKU, identify patterns, and flag potential fraud.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
