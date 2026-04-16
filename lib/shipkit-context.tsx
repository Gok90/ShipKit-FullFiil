'use client'

import { createContext, useContext, useCallback, type ReactNode } from 'react'
import useSWR, { mutate } from 'swr'
import type { 
  Settings, 
  Color, 
  PackType, 
  InventoryItem, 
  VariantAlias, 
  Batch,
  HoldQueueItem,
  HistorySession,
  TabType
} from './types'

interface ShipKitContextType {
  // Settings
  settings: Settings | null
  isLoadingSettings: boolean
  updateSettings: (updates: Partial<Settings>) => Promise<void>
  
  // Catalog
  colors: Color[]
  packTypes: PackType[]
  isLoadingCatalog: boolean
  
  // Inventory
  inventory: InventoryItem[]
  isLoadingInventory: boolean
  updateStock: (inventoryId: string, newCount: number) => Promise<void>
  adjustStock: (inventoryId: string, delta: number) => Promise<void>
  
  // Aliases
  aliases: VariantAlias[]
  isLoadingAliases: boolean
  addAlias: (tiktokName: string, colorId: string, packTypeId: string) => Promise<void>
  removeAlias: (id: string) => Promise<void>
  
  // Active Batch
  activeBatch: Batch | null
  isLoadingBatch: boolean
  
  // Hold Queue
  holdQueue: HoldQueueItem[]
  isLoadingHold: boolean
  
  // History
  historySessions: HistorySession[]
  isLoadingHistory: boolean
  
  // UI State
  activeTab: TabType
  setActiveTab: (tab: TabType) => void
  
  // Settings modal
  isSettingsOpen: boolean
  setIsSettingsOpen: (open: boolean) => void
  
  // Refresh functions
  refreshAll: () => void
}

const ShipKitContext = createContext<ShipKitContextType | null>(null)

const fetcher = async (url: string) => {
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to fetch')
  return res.json()
}

export function ShipKitProvider({ children }: { children: ReactNode }) {
  // SWR hooks for data fetching
  const { data: settings, isLoading: isLoadingSettings } = useSWR<Settings>(
    '/api/settings',
    fetcher
  )
  
  const { data: catalogData, isLoading: isLoadingCatalog } = useSWR<{ colors: Color[], packTypes: PackType[] }>(
    '/api/catalog',
    fetcher
  )
  
  const { data: inventory = [], isLoading: isLoadingInventory } = useSWR<InventoryItem[]>(
    '/api/inventory',
    fetcher
  )
  
  const { data: aliases = [], isLoading: isLoadingAliases } = useSWR<VariantAlias[]>(
    '/api/aliases',
    fetcher
  )
  
  const { data: activeBatch, isLoading: isLoadingBatch } = useSWR<Batch | null>(
    '/api/batch/active',
    fetcher
  )
  
  const { data: holdQueue = [], isLoading: isLoadingHold } = useSWR<HoldQueueItem[]>(
    '/api/hold-queue',
    fetcher
  )
  
  const { data: historySessions = [], isLoading: isLoadingHistory } = useSWR<HistorySession[]>(
    '/api/history',
    fetcher
  )
  
  // Local UI state using useState would be here but we'll use a simpler approach
  // For now, we'll handle tab state in the layout component
  
  const updateSettings = useCallback(async (updates: Partial<Settings>) => {
    await fetch('/api/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })
    mutate('/api/settings')
  }, [])
  
  const updateStock = useCallback(async (inventoryId: string, newCount: number) => {
    await fetch('/api/inventory', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventoryId, stockCount: newCount })
    })
    mutate('/api/inventory')
  }, [])
  
  const adjustStock = useCallback(async (inventoryId: string, delta: number) => {
    await fetch('/api/inventory', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inventoryId, delta })
    })
    mutate('/api/inventory')
  }, [])
  
  const addAlias = useCallback(async (tiktokName: string, colorId: string, packTypeId: string) => {
    await fetch('/api/aliases', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tiktokName, colorId, packTypeId })
    })
    mutate('/api/aliases')
  }, [])
  
  const removeAlias = useCallback(async (id: string) => {
    await fetch(`/api/aliases?id=${id}`, { method: 'DELETE' })
    mutate('/api/aliases')
  }, [])
  
  const refreshAll = useCallback(() => {
    mutate('/api/settings')
    mutate('/api/catalog')
    mutate('/api/inventory')
    mutate('/api/aliases')
    mutate('/api/batch/active')
    mutate('/api/hold-queue')
    mutate('/api/history')
  }, [])
  
  return (
    <ShipKitContext.Provider value={{
      settings: settings ?? null,
      isLoadingSettings,
      updateSettings,
      colors: catalogData?.colors ?? [],
      packTypes: catalogData?.packTypes ?? [],
      isLoadingCatalog,
      inventory,
      isLoadingInventory,
      updateStock,
      adjustStock,
      aliases,
      isLoadingAliases,
      addAlias,
      removeAlias,
      activeBatch: activeBatch ?? null,
      isLoadingBatch,
      holdQueue,
      isLoadingHold,
      historySessions,
      isLoadingHistory,
      // These will be managed by the main layout
      activeTab: 'scan',
      setActiveTab: () => {},
      isSettingsOpen: false,
      setIsSettingsOpen: () => {},
      refreshAll
    }}>
      {children}
    </ShipKitContext.Provider>
  )
}

export function useShipKit() {
  const context = useContext(ShipKitContext)
  if (!context) {
    throw new Error('useShipKit must be used within a ShipKitProvider')
  }
  return context
}
