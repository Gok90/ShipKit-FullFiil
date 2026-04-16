'use client'

import { useState, useMemo } from 'react'
import { Package, AlertCircle, AlertTriangle, Check, Settings2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog'
import { Checkbox } from '@/components/ui/checkbox'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'

export function InventoryTab() {
  const { inventory, colors, packTypes, settings, updateStock, adjustStock, isLoadingInventory } = useShipKit()
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [showBulkModal, setShowBulkModal] = useState(false)
  const [bulkMode, setBulkMode] = useState<'all' | 'selected'>('all')
  const [bulkQuantity, setBulkQuantity] = useState('')
  
  // Group inventory by color
  const groupedInventory = useMemo(() => {
    const groups: Record<string, typeof inventory> = {}
    
    colors.forEach(color => {
      groups[color.id] = inventory.filter(item => item.colorId === color.id)
    })
    
    return groups
  }, [inventory, colors])
  
  // Stats
  const totalUnits = inventory.reduce((acc, item) => acc + item.stockCount, 0)
  const skusInStock = inventory.filter(item => item.stockCount > 0).length
  const lowStockCount = inventory.filter(item => 
    item.stockCount > 0 && item.stockCount <= (settings?.lowStockThreshold ?? 5)
  ).length
  const outOfStockCount = inventory.filter(item => item.stockCount === 0).length
  
  const handleToggleSelect = (id: string) => {
    setSelectedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }
  
  const handleSelectAll = () => {
    if (selectedItems.size === inventory.length) {
      setSelectedItems(new Set())
    } else {
      setSelectedItems(new Set(inventory.map(i => i.id)))
    }
  }
  
  const handleBulkApply = async () => {
    const quantity = parseInt(bulkQuantity)
    if (isNaN(quantity) || quantity < 0) return
    
    const itemsToUpdate = bulkMode === 'all' 
      ? inventory 
      : inventory.filter(i => selectedItems.has(i.id))
    
    for (const item of itemsToUpdate) {
      await updateStock(item.id, quantity)
    }
    
    setShowBulkModal(false)
    setBulkQuantity('')
    setSelectedItems(new Set())
  }
  
  if (isLoadingInventory) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary" />
      </div>
    )
  }
  
  return (
    <div className="space-y-6">
      {/* Stats Bar */}
      <div className="flex flex-wrap items-center gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Package className="w-4 h-4 text-muted-foreground" />
          <span>
            Total: <span className="font-semibold">{totalUnits.toLocaleString()} units</span>
          </span>
        </div>
        <div className="text-muted-foreground">·</div>
        <div>
          <span className="font-semibold">{skusInStock}</span> SKUs in stock
        </div>
        {lowStockCount > 0 && (
          <>
            <div className="text-muted-foreground">·</div>
            <Badge className="bg-warning text-warning-foreground gap-1">
              <AlertTriangle className="w-3 h-3" />
              {lowStockCount} LOW
            </Badge>
          </>
        )}
        {outOfStockCount > 0 && (
          <>
            <div className="text-muted-foreground">·</div>
            <Badge variant="destructive" className="gap-1">
              <AlertCircle className="w-3 h-3" />
              {outOfStockCount} OUT
            </Badge>
          </>
        )}
      </div>
      
      {/* Bulk Actions */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setBulkMode('all')
            setShowBulkModal(true)
          }}
        >
          Apply to All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setBulkMode('selected')
            setShowBulkModal(true)
          }}
          disabled={selectedItems.size === 0}
        >
          Apply to Selected ({selectedItems.size})
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleSelectAll}
        >
          {selectedItems.size === inventory.length ? 'Deselect All' : 'Select All'}
        </Button>
      </div>
      
      {/* Inventory Grid by Color */}
      <div className="space-y-6">
        {colors.map(color => (
          <InventoryColorGroup
            key={color.id}
            color={color}
            items={groupedInventory[color.id] || []}
            packTypes={packTypes}
            lowStockThreshold={settings?.lowStockThreshold ?? 5}
            selectedItems={selectedItems}
            onToggleSelect={handleToggleSelect}
            onUpdateStock={updateStock}
            onAdjustStock={adjustStock}
          />
        ))}
      </div>
      
      {/* Bulk Apply Modal */}
      <Dialog open={showBulkModal} onOpenChange={setShowBulkModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Set Stock Quantity
            </DialogTitle>
            <DialogDescription>
              This will set the stock count to the specified value for {bulkMode === 'all' ? 'all items' : `${selectedItems.size} selected items`}.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Input
              type="number"
              min="0"
              placeholder="Enter quantity"
              value={bulkQuantity}
              onChange={(e) => setBulkQuantity(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBulkModal(false)}>
              Cancel
            </Button>
            <Button onClick={handleBulkApply} disabled={!bulkQuantity}>
              Apply
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function InventoryColorGroup({
  color,
  items,
  packTypes,
  lowStockThreshold,
  selectedItems,
  onToggleSelect,
  onUpdateStock,
  onAdjustStock
}: {
  color: { id: string; name: string }
  items: Array<{
    id: string
    colorId: string
    packTypeId: string
    stockCount: number
    packType?: { id: string; name: string }
  }>
  packTypes: Array<{ id: string; name: string }>
  lowStockThreshold: number
  selectedItems: Set<string>
  onToggleSelect: (id: string) => void
  onUpdateStock: (id: string, count: number) => Promise<void>
  onAdjustStock: (id: string, delta: number) => Promise<void>
}) {
  const hasLowStock = items.some(item => item.stockCount > 0 && item.stockCount <= lowStockThreshold)
  const hasOutOfStock = items.some(item => item.stockCount === 0)
  
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-base">
          <span>{color.name}</span>
          <div className="flex items-center gap-2">
            {hasOutOfStock && (
              <Badge variant="destructive" className="text-xs">OUT</Badge>
            )}
            {hasLowStock && !hasOutOfStock && (
              <Badge className="bg-warning text-warning-foreground text-xs">LOW</Badge>
            )}
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2">
          {items.map(item => {
            const packType = packTypes.find(p => p.id === item.packTypeId)
            const isOut = item.stockCount === 0
            const isLow = item.stockCount > 0 && item.stockCount <= lowStockThreshold
            const isSelected = selectedItems.has(item.id)
            
            return (
              <InventoryRow
                key={item.id}
                id={item.id}
                packTypeName={packType?.name ?? 'Unknown'}
                stockCount={item.stockCount}
                isOut={isOut}
                isLow={isLow}
                isSelected={isSelected}
                onToggleSelect={() => onToggleSelect(item.id)}
                onUpdateStock={(count) => onUpdateStock(item.id, count)}
                onAdjust={(delta) => onAdjustStock(item.id, delta)}
              />
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function InventoryRow({
  id,
  packTypeName,
  stockCount,
  isOut,
  isLow,
  isSelected,
  onToggleSelect,
  onUpdateStock,
  onAdjust
}: {
  id: string
  packTypeName: string
  stockCount: number
  isOut: boolean
  isLow: boolean
  isSelected: boolean
  onToggleSelect: () => void
  onUpdateStock: (count: number) => Promise<void>
  onAdjust: (delta: number) => Promise<void>
}) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')
  const [quickAddValue, setQuickAddValue] = useState('')
  
  const handleStartEdit = () => {
    setEditValue(stockCount.toString())
    setIsEditing(true)
  }
  
  const handleSaveEdit = async () => {
    const newCount = parseInt(editValue)
    if (!isNaN(newCount) && newCount >= 0) {
      await onUpdateStock(newCount)
    }
    setIsEditing(false)
  }
  
  const handleQuickAdd = async () => {
    const delta = parseInt(quickAddValue)
    if (!isNaN(delta) && delta !== 0) {
      await onAdjust(delta)
    }
    setQuickAddValue('')
  }
  
  return (
    <div className={cn(
      "flex items-center gap-3 p-3 rounded-lg transition-colors",
      isOut && "bg-destructive/10",
      isLow && !isOut && "bg-warning/10",
      !isOut && !isLow && "bg-secondary/50",
      isSelected && "ring-2 ring-primary"
    )}>
      {/* Checkbox */}
      <Checkbox
        checked={isSelected}
        onCheckedChange={onToggleSelect}
      />
      
      {/* Pack Type Name */}
      <div className="flex-1 min-w-0">
        <span className="font-medium">{packTypeName}</span>
      </div>
      
      {/* Status Badge */}
      {isOut && (
        <Badge variant="destructive" className="text-xs">OUT</Badge>
      )}
      {isLow && (
        <Badge className="bg-warning text-warning-foreground text-xs">LOW</Badge>
      )}
      
      {/* Stock Count (Editable) */}
      <div className="w-20">
        {isEditing ? (
          <Input
            type="number"
            min="0"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleSaveEdit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleSaveEdit()
              if (e.key === 'Escape') setIsEditing(false)
            }}
            className="h-8 text-center"
            autoFocus
          />
        ) : (
          <button
            onClick={handleStartEdit}
            className="w-full h-8 text-center font-bold text-lg hover:bg-accent rounded transition-colors"
          >
            {stockCount}
          </button>
        )}
      </div>
      
      {/* +/- Buttons */}
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onAdjust(-1)}
          disabled={stockCount === 0}
        >
          -
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="h-8 w-8"
          onClick={() => onAdjust(1)}
        >
          +
        </Button>
      </div>
      
      {/* Quick Add */}
      <div className="w-20">
        <Input
          type="number"
          placeholder="+/-"
          value={quickAddValue}
          onChange={(e) => setQuickAddValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleQuickAdd()
          }}
          className="h-8 text-center text-sm"
        />
      </div>
    </div>
  )
}
