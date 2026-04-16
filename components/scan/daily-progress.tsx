'use client'

import { Package, Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DailyProgressProps {
  shipped: number
  pending: number
  isArchived: boolean
}

export function DailyProgress({ shipped, pending, isArchived }: DailyProgressProps) {
  if (shipped === 0 && pending === 0) {
    return null
  }
  
  return (
    <div className={cn(
      "flex items-center gap-2 text-sm px-3 py-2 rounded-lg",
      isArchived 
        ? "bg-success/10 text-success" 
        : "bg-secondary text-muted-foreground"
    )}>
      {isArchived ? (
        <>
          <Check className="w-4 h-4" />
          <span>Today: <span className="font-semibold">{shipped} shipped</span> — done!</span>
        </>
      ) : (
        <>
          <Package className="w-4 h-4" />
          <span>
            Today: <span className="font-semibold">{shipped} shipped</span>
            {pending > 0 && (
              <> · <span className="font-semibold">{pending} pending</span></>
            )}
          </span>
        </>
      )}
    </div>
  )
}
