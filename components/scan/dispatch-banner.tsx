'use client'

import { useState, useEffect } from 'react'
import { Clock, AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/utils'

interface DispatchBannerProps {
  carrierCloseWeekday: string
  carrierCloseSaturday: string
  carrierCloseSunday: string | null
  travelTimeMinutes: number
}

// Federal holidays (simplified - would need proper calculation in production)
const FEDERAL_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-19', '2026-02-16', '2026-05-25',
  '2026-07-03', '2026-09-07', '2026-10-12', '2026-11-11',
  '2026-11-26', '2026-12-25'
]

export function DispatchBanner({
  carrierCloseWeekday,
  carrierCloseSaturday,
  carrierCloseSunday,
  travelTimeMinutes
}: DispatchBannerProps) {
  const [deadline, setDeadline] = useState<Date | null>(null)
  const [remainingMs, setRemainingMs] = useState(0)
  
  useEffect(() => {
    const calculateDeadline = () => {
      const now = new Date()
      const dayOfWeek = now.getDay() // 0 = Sunday, 6 = Saturday
      
      let closeTime: string | null = null
      
      if (dayOfWeek === 0) {
        closeTime = carrierCloseSunday
      } else if (dayOfWeek === 6) {
        closeTime = carrierCloseSaturday
      } else {
        closeTime = carrierCloseWeekday
      }
      
      // If closed today, find next open day
      if (!closeTime) {
        // Find next business day
        const nextDay = new Date(now)
        nextDay.setDate(nextDay.getDate() + 1)
        while (nextDay.getDay() === 0 || FEDERAL_HOLIDAYS_2026.includes(nextDay.toISOString().split('T')[0])) {
          nextDay.setDate(nextDay.getDate() + 1)
        }
        closeTime = nextDay.getDay() === 6 ? carrierCloseSaturday : carrierCloseWeekday
        nextDay.setHours(parseInt(closeTime?.split(':')[0] ?? '17'), parseInt(closeTime?.split(':')[1] ?? '0'), 0, 0)
        setDeadline(new Date(nextDay.getTime() - travelTimeMinutes * 60 * 1000))
        return
      }
      
      // Parse close time
      const [hours, minutes] = closeTime.split(':').map(Number)
      const todayDeadline = new Date(now)
      todayDeadline.setHours(hours, minutes, 0, 0)
      
      // Subtract travel time
      const actualDeadline = new Date(todayDeadline.getTime() - travelTimeMinutes * 60 * 1000)
      
      setDeadline(actualDeadline)
    }
    
    calculateDeadline()
  }, [carrierCloseWeekday, carrierCloseSaturday, carrierCloseSunday, travelTimeMinutes])
  
  // Update countdown every second
  useEffect(() => {
    if (!deadline) return
    
    const update = () => {
      const remaining = deadline.getTime() - Date.now()
      setRemainingMs(remaining)
    }
    
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [deadline])
  
  if (!deadline) return null
  
  const getStatus = () => {
    const hours = remainingMs / (1000 * 60 * 60)
    if (remainingMs < 0) return 'breach'
    if (hours <= 2) return 'red'
    if (hours <= 6) return 'yellow'
    return 'green'
  }
  
  const status = getStatus()
  
  const formatRemaining = () => {
    if (remainingMs < 0) {
      const overdue = Math.abs(remainingMs)
      const hours = Math.floor(overdue / (1000 * 60 * 60))
      const minutes = Math.floor((overdue % (1000 * 60 * 60)) / (1000 * 60))
      return `${hours}h ${minutes}m OVERDUE`
    }
    
    const hours = Math.floor(remainingMs / (1000 * 60 * 60))
    const minutes = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60))
    const seconds = Math.floor((remainingMs % (1000 * 60)) / 1000)
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m ${seconds}s`
  }
  
  return (
    <div className={cn(
      "rounded-lg p-3 flex items-center justify-between",
      status === 'green' && "bg-success/10 text-success border border-success/20",
      status === 'yellow' && "bg-warning/10 text-warning border border-warning/20",
      status === 'red' && "bg-destructive/10 text-destructive border border-destructive/20",
      status === 'breach' && "bg-destructive text-destructive-foreground animate-pulse"
    )}>
      <div className="flex items-center gap-2">
        {status === 'breach' ? (
          <AlertTriangle className="w-5 h-5" />
        ) : (
          <Clock className="w-5 h-5" />
        )}
        <span className="font-medium">
          {status === 'breach' ? 'Dispatch Deadline Passed!' : 'Dispatch Deadline'}
        </span>
      </div>
      
      <div className="flex items-center gap-3">
        <span className="text-sm opacity-80">
          Must leave by {deadline.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
        <span className="text-xl font-bold tabular-nums">
          {formatRemaining()}
        </span>
      </div>
    </div>
  )
}
