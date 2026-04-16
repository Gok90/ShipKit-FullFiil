'use client'

import { useState, useMemo } from 'react'
import { Check, Maximize2, Filter, AlertCircle, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'
import type { CsvOrder, PickListItem } from '@/lib/types'

interface PickListStepProps {
  orders: CsvOrder[]
}

export function PickListStep({ orders }: PickListStepProps) {
  const { inventory, colors, packTypes, aliases } = useShipKit()
  const [isOpen, setIsOpen] = useState(true)
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set())
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [showMultiQtyOnly, setShowMultiQtyOnly] = useState(false)
  
  // Build pick list from orders
  const pickList = useMemo(() => {
    const variantMap = new Map<string, PickListItem>()
    
    orders.forEach(order => {
      if (!order.variantName) return
      
      const existing = variantMap.get(order.variantName)
      if (existing) {
        existing.quantity += order.quantity
      } else {
        // Try to match variant to inventory
        const alias = aliases.find(a => 
          a.tiktokName.toLowerCase() === order.variantName?.toLowerCase()
        )
        
        let stockCount = 0
        if (alias) {
          const inv = inventory.find(i => 
            i.colorId === alias.colorId && i.packTypeId === alias.packTypeId
          )
          stockCount = inv?.stockCount ?? 0
        }
        
        variantMap.set(order.variantName, {
          variantName: order.variantName,
          colorId: alias?.colorId ?? null,
          packTypeId: alias?.packTypeId ?? null,
          quantity: order.quantity,
          stockCount,
          checked: false
        })
      }
    })
    
    // Sort: OUT first, then SHORT, then normal
    return Array.from(variantMap.values()).sort((a, b) => {
      const aOut = a.stockCount === 0
      const bOut = b.stockCount === 0
      const aShort = a.stockCount < a.quantity
      const bShort = b.stockCount < b.quantity
      
      if (aOut && !bOut) return -1
      if (!aOut && bOut) return 1
      if (aShort && !bShort) return -1
      if (!aShort && bShort) return 1
      return 0
    })
  }, [orders, inventory, aliases])
  
  // Filter for multi-qty mode
  const filteredPickList = showMultiQtyOnly 
    ? pickList.filter(item => item.quantity > 1)
    : pickList
  
  // Stats
  const totalUnits = pickList.reduce((acc, item) => acc + item.quantity, 0)
  const totalVariants = pickList.length
  const shortCount = pickList.filter(item => item.stockCount < item.quantity && item.stockCount > 0).length
  const outCount = pickList.filter(item => item.stockCount === 0).length
  const checkedCount = checkedItems.size
  
  const toggleItem = (variantName: string) => {
    setCheckedItems(prev => {
      const next = new Set(prev)
      if (next.has(variantName)) {
        next.delete(variantName)
      } else {
        next.add(variantName)
      }
      return next
    })
  }
  
  const PickListContent = ({ large = false }: { large?: boolean }) => (
    <div className={cn("space-y-1", large && "space-y-2")}>
      {filteredPickList.map(item => {
        const isChecked = checkedItems.has(item.variantName)
        const isOut = item.stockCount === 0
        const isShort = item.stockCount < item.quantity && item.stockCount > 0
        
        return (
          <button
            key={item.variantName}
            onClick={() => toggleItem(item.variantName)}
            className={cn(
              "w-full flex items-center gap-3 p-3 rounded-lg transition-colors text-left",
              "hover:bg-accent",
              isChecked && "bg-success/10",
              isOut && "bg-destructive/10",
              isShort && !isOut && "bg-warning/10",
              large && "p-4"
            )}
          >
            <div className={cn(
              "w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0",
              isChecked 
                ? "bg-success border-success text-success-foreground" 
                : "border-border",
              large && "w-8 h-8"
            )}>
              {isChecked && <Check className={cn("w-4 h-4", large && "w-5 h-5")} />}
            </div>
            
            <div className="flex-1 min-w-0">
              <p className={cn(
                "font-medium truncate",
                large && "text-xl"
              )}>
                {item.variantName}
              </p>
              <p className={cn(
                "text-sm text-muted-foreground",
                large && "text-base"
              )}>
                Stock: {item.stockCount}
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              {isOut && (
                <Badge variant="destructive" className={cn("gap-1", large && "text-base px-3 py-1")}>
                  <AlertCircle className={cn("w-3 h-3", large && "w-4 h-4")} />
                  OUT
                </Badge>
              )}
              {isShort && (
                <Badge className={cn("bg-warning text-warning-foreground gap-1", large && "text-base px-3 py-1")}>
                  <AlertTriangle className={cn("w-3 h-3", large && "w-4 h-4")} />
                  SHORT
                </Badge>
              )}
              <span className={cn(
                "text-lg font-bold tabular-nums",
                large && "text-2xl"
              )}>
                x{item.quantity}
              </span>
            </div>
          </button>
        )
      })}
    </div>
  )
  
  return (
    <>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <Card>
          <CardHeader className="pb-3">
            <CollapsibleTrigger className="flex items-center justify-between w-full">
              <CardTitle className="flex items-center gap-2 text-lg">
                Pick List
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  Picked {checkedCount}/{totalVariants}
                </span>
              </CardTitle>
              <ChevronDown className={cn(
                "w-5 h-5 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )} />
            </CollapsibleTrigger>
          </CardHeader>
          <CollapsibleContent>
            <CardContent className="pt-0 space-y-4">
              {/* Summary Bar */}
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="text-muted-foreground">
                  Total to pull: <span className="font-semibold text-foreground">{totalUnits} units</span>
                </span>
                <span className="text-muted-foreground">·</span>
                <span className="text-muted-foreground">
                  <span className="font-semibold text-foreground">{totalVariants}</span> variants
                </span>
                {shortCount > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <Badge className="bg-warning text-warning-foreground">{shortCount} SHORT</Badge>
                  </>
                )}
                {outCount > 0 && (
                  <>
                    <span className="text-muted-foreground">·</span>
                    <Badge variant="destructive">{outCount} OUT</Badge>
                  </>
                )}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsFullscreen(true)}
                  className="gap-2"
                >
                  <Maximize2 className="w-4 h-4" />
                  Fullscreen Picking Mode
                </Button>
                <Button
                  variant={showMultiQtyOnly ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setShowMultiQtyOnly(!showMultiQtyOnly)}
                  className="gap-2"
                >
                  <Filter className="w-4 h-4" />
                  Multi-Qty Check
                </Button>
              </div>
              
              {/* Pick List */}
              <PickListContent />
            </CardContent>
          </CollapsibleContent>
        </Card>
      </Collapsible>
      
      {/* Fullscreen Dialog */}
      <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
        <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center justify-between">
              <span>Pick List - Fullscreen Mode</span>
              <span className="text-lg font-normal text-muted-foreground">
                Picked {checkedCount}/{totalVariants}
              </span>
            </DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-auto">
            <PickListContent large />
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
