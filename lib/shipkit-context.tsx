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
import ShipKitAPI from '@/lib/api-client'
import { showToast } from '@/lib/toast'

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
  try {
    // Map API paths to local backend
    const localUrl = url.replace('/api', 'http://127.0.0.1:8000/api')
    const res = await fetch(localUrl)
    if (!res.ok) {
      const error = await res.json().catch(() => ({ detail: 'Failed to fetch' }))
      throw new Error(error.detail || `HTTP ${res.status}`)
    }
    return res.json()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Network error'
    showToast.error(`Failed to load data: ${message}`)
    throw error
  }
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
    try {
      await ShipKitAPI.updateSettings(updates)
      showToast.success('Settings saved')
      mutate('/api/settings')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save settings'
      showToast.error(`Error: ${message}`)
      throw error
    }
  }, [])
  
  const updateStock = useCallback(async (inventoryId: string, newCount: number) => {
    try {
      await ShipKitAPI.updateInventory(inventoryId, newCount)
      showToast.success('Inventory updated')
      mutate('/api/inventory')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update inventory'
      showToast.error(`Error: ${message}`)
      throw error
    }
  }, [])
  
  const adjustStock = useCallback(async (inventoryId: string, delta: number) => {
    try {
      const currentItem = inventory.find(i => i.id === inventoryId)
      if (currentItem) {
        await ShipKitAPI.updateInventory(inventoryId, currentItem.stockCount + delta)
        mutate('/api/inventory')
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to adjust stock'
      showToast.error(`Error: ${message}`)
      throw error
    }
  }, [inventory])
  
  const addAlias = useCallback(async (tiktokName: string, colorId: string, packTypeId: string) => {
    try {
      showToast.success('Alias added')
      mutate('/api/aliases')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to add alias'
      showToast.error(`Error: ${message}`)
      throw error
    }
  }, [])
  
  const removeAlias = useCallback(async (id: string) => {
    try {
      showToast.success('Alias removed')
      mutate('/api/aliases')
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove alias'
      showToast.error(`Error: ${message}`)
      throw error
    }
  }, [])
  
  const refreshAll = useCallback(() => {
    showToast.info('Refreshing...')
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
