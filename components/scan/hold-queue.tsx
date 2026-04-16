'use client'

import { useState, useEffect } from 'react'
import { Pause, Ship, X, Clock, AlertTriangle, ChevronDown, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'
import { mutate } from 'swr'

interface HoldQueueProps {
  clerkZoneName?: string
}

export function HoldQueue({ clerkZoneName }: HoldQueueProps) {
  const { holdQueue, isLoadingHold } = useShipKit()
  const [isOpen, setIsOpen] = useState(true)
  const [showCancelModal, setShowCancelModal] = useState(false)
  const [cancellingItem, setCancellingItem] = useState<string | null>(null)
  const [reverseInventory, setReverseInventory] = useState(false)
  const [showLogCancelModal, setShowLogCancelModal] = useState(false)
  const [cancelTrackingInput, setCancelTrackingInput] = useState('')
  
  const activeItems = holdQueue.filter(item => item.status === 'held')
  const cancelledItems = holdQueue.filter(item => item.status === 'cancelled')
  
  if (activeItems.length === 0 && cancelledItems.length === 0) {
    return null
  }
  
  const handleMarkShipped = async (id: string) => {
    await fetch('/api/hold-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status: 'shipped' })
    })
    mutate('/api/hold-queue')
  }
  
  const handleCancel = async () => {
    if (!cancellingItem) return
    
    await fetch('/api/hold-queue', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        id: cancellingItem, 
        status: 'cancelled',
        inventoryReversed: reverseInventory
      })
    })
    
    mutate('/api/hold-queue')
    setShowCancelModal(false)
    setCancellingItem(null)
    setReverseInventory(false)
  }
  
  const handleDismiss = async (id: string) => {
    await fetch(`/api/hold-queue?id=${id}`, { method: 'DELETE' })
    mutate('/api/hold-queue')
  }
  
  const handleLogCancellation = async () => {
    // Check if tracking is in hold queue
    const inQueue = activeItems.find(item => 
      item.trackingNumber.includes(cancelTrackingInput) ||
      item.trackingNumber.slice(-8) === cancelTrackingInput
    )
    
    if (inQueue) {
      setCancellingItem(inQueue.id)
      setShowLogCancelModal(false)
      setShowCancelModal(true)
      setCancelTrackingInput('')
    } else {
      // TODO: Show form for new cancellation
      setShowLogCancelModal(false)
      setCancelTrackingInput('')
    }
  }
  
  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <div className="rounded-lg border bg-card">
        <CollapsibleTrigger className="w-full p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Pause className="w-4 h-4 text-warning" />
            <span className="font-medium">Hold Queue</span>
            <Badge variant="secondary">{activeItems.length}</Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs h-7 gap-1"
              onClick={(e) => {
                e.stopPropagation()
                setShowLogCancelModal(true)
              }}
            >
              <X className="w-3 h-3" />
              Log Cancellation
            </Button>
            <ChevronDown className={cn(
              "w-4 h-4 text-muted-foreground transition-transform",
              isOpen && "rotate-180"
            )} />
          </div>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <div className="px-3 pb-3 space-y-2">
            {/* Active Items */}
            {activeItems.map(item => (
              <HoldQueueItem
                key={item.id}
                item={item}
                onMarkShipped={() => handleMarkShipped(item.id)}
                onCancel={() => {
                  setCancellingItem(item.id)
                  setShowCancelModal(true)
                }}
              />
            ))}
            
            {/* Cancelled Items */}
            {cancelledItems.map(item => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/10"
              >
                <div className="flex items-center gap-3">
                  <Badge variant="destructive">CANCELLED</Badge>
                  <span className="text-sm truncate">{item.variantName || `...${item.trackingNumber.slice(-8)}`}</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDismiss(item.id)}
                  className="text-xs"
                >
                  Dismiss
                </Button>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </div>
      
      {/* Cancel Modal */}
      <Dialog open={showCancelModal} onOpenChange={setShowCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Order</DialogTitle>
            <DialogDescription>
              This will mark the order as cancelled.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="reverse"
                checked={reverseInventory}
                onCheckedChange={(checked) => setReverseInventory(checked as boolean)}
              />
              <label htmlFor="reverse" className="text-sm">
                Reverse inventory if already counted
              </label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCancelModal(false)}>
              Go Back
            </Button>
            <Button variant="destructive" onClick={handleCancel}>
              Cancel Order
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* Log Cancellation Modal */}
      <Dialog open={showLogCancelModal} onOpenChange={setShowLogCancelModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Log Cancellation</DialogTitle>
            <DialogDescription>
              Enter the tracking number of the cancelled order.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              placeholder="Tracking number (last 8 digits or full)"
              value={cancelTrackingInput}
              onChange={(e) => setCancelTrackingInput(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLogCancelModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleLogCancellation} disabled={!cancelTrackingInput}>
              Continue
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Collapsible>
  )
}

function HoldQueueItem({
  item,
  onMarkShipped,
  onCancel
}: {
  item: {
    id: string
    trackingNumber: string
    variantName: string | null
    deadline: Date
    status: string
  }
  onMarkShipped: () => void
  onCancel: () => void
}) {
  const [timeRemaining, setTimeRemaining] = useState('')
  const [status, setStatus] = useState<'green' | 'yellow' | 'red' | 'overdue'>('green')
  
  useEffect(() => {
    const update = () => {
      const deadline = new Date(item.deadline)
      const remaining = deadline.getTime() - Date.now()
      
      if (remaining < 0) {
        setTimeRemaining('OVERDUE')
        setStatus('overdue')
        return
      }
      
      const hours = Math.floor(remaining / (1000 * 60 * 60))
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))
      
      if (hours >= 24) {
        const days = Math.floor(hours / 24)
        setTimeRemaining(`${days}d ${hours % 24}h`)
        setStatus('green')
      } else if (hours > 0) {
        setTimeRemaining(`${hours}h ${minutes}m`)
        setStatus(hours < 6 ? 'yellow' : 'green')
      } else {
        setTimeRemaining(`${minutes}m`)
        setStatus('red')
      }
    }
    
    update()
    const interval = setInterval(update, 60000)
    return () => clearInterval(interval)
  }, [item.deadline])
  
  return (
    <div className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
      <div className="flex items-center gap-3 min-w-0">
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">
            {item.variantName || 'Unknown variant'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            ...{item.trackingNumber.slice(-8)}
          </span>
        </div>
      </div>
      
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1 text-xs font-medium",
          status === 'green' && "text-success",
          status === 'yellow' && "text-warning",
          status === 'red' && "text-destructive",
          status === 'overdue' && "text-destructive"
        )}>
          {status === 'overdue' ? (
            <AlertTriangle className="w-3 h-3" />
          ) : (
            <Clock className="w-3 h-3" />
          )}
          {timeRemaining}
        </div>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onMarkShipped}
          className="h-8 px-2 text-success hover:text-success hover:bg-success/10"
        >
          <Ship className="w-4 h-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onCancel}
          className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  )
}
