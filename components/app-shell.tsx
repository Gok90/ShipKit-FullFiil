'use client'

import { useState, useEffect } from 'react'
import { Package, Archive, History, Settings, BarChart3, RefreshCw, ShoppingCart } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { useShipKit } from '@/lib/shipkit-context'
import type { TabType } from '@/lib/types'
import { ScanTab } from '@/components/scan/scan-tab'
import { InventoryTab } from '@/components/inventory/inventory-tab'
import { HistoryTab } from '@/components/history/history-tab'
import { SettingsModal } from '@/components/settings/settings-modal'
import { SetupWizard } from '@/components/setup/setup-wizard'

const PRO_TABS = ['analytics', 'reorder', 'finance'] as const

export function AppShell() {
  const [activeTab, setActiveTab] = useState<TabType>('scan')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [showSetupWizard, setShowSetupWizard] = useState(false)
  const { settings, isLoadingSettings, inventory, lowStockCount, refreshAll } = useShipKit()
  
  // Calculate low stock count
  const lowCount = inventory.filter(item => 
    item.stockCount <= (settings?.lowStockThreshold ?? 5) && item.stockCount > 0
  ).length
  const outCount = inventory.filter(item => item.stockCount === 0).length
  const hasLowStock = lowCount > 0 || outCount > 0
  
  // Show setup wizard on first load if not completed
  useEffect(() => {
    if (!isLoadingSettings && settings && !settings.setupComplete) {
      setShowSetupWizard(true)
    }
  }, [isLoadingSettings, settings])
  
  const tabs = [
    { id: 'scan' as TabType, label: 'Scan', icon: Package },
    { id: 'inventory' as TabType, label: 'Inventory', icon: Archive, badge: hasLowStock },
    { id: 'history' as TabType, label: 'History', icon: History },
    { id: 'analytics' as TabType, label: 'Analytics', icon: BarChart3, pro: true },
    { id: 'reorder' as TabType, label: 'Reorder', icon: ShoppingCart, pro: true },
  ]
  
  const renderTab = () => {
    switch (activeTab) {
      case 'scan':
        return <ScanTab />
      case 'inventory':
        return <InventoryTab />
      case 'history':
        return <HistoryTab />
      case 'analytics':
      case 'reorder':
      case 'finance':
        return (
          <div className="flex flex-col items-center justify-center h-96 gap-4">
            <div className="p-4 rounded-full bg-primary/10">
              <BarChart3 className="w-12 h-12 text-primary" />
            </div>
            <h2 className="text-2xl font-semibold">Coming Soon</h2>
            <p className="text-muted-foreground text-center max-w-md">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} features are available in ShipKit Pro. 
              Upgrade to unlock advanced analytics, reorder suggestions, and financial tools.
            </p>
            <Badge variant="secondary" className="mt-2">Pro Feature</Badge>
          </div>
        )
      default:
        return null
    }
  }
  
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="font-semibold text-lg leading-none">ShipKit</h1>
              <p className="text-xs text-muted-foreground">{settings?.storeName ?? 'Loading...'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={refreshAll}
              className="text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsSettingsOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>
      
      {/* Tab Navigation */}
      <nav className="border-b border-border bg-card/50 sticky top-16 z-40">
        <div className="container mx-auto px-4">
          <div className="flex gap-1 overflow-x-auto scrollbar-hide py-2">
            {tabs.map(tab => {
              const Icon = tab.icon
              const isActive = activeTab === tab.id
              const isPro = tab.pro
              
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap",
                    "min-w-[100px] justify-center",
                    isActive 
                      ? "bg-primary text-primary-foreground" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {tab.label}
                  {tab.badge && (
                    <span className="w-2 h-2 rounded-full bg-warning animate-pulse" />
                  )}
                  {isPro && !isActive && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">PRO</Badge>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </nav>
      
      {/* Main Content */}
      <main className="flex-1 container mx-auto px-4 py-6">
        {renderTab()}
      </main>
      
      {/* Settings Modal */}
      <SettingsModal 
        open={isSettingsOpen} 
        onOpenChange={setIsSettingsOpen} 
      />
      
      {/* Setup Wizard */}
      <SetupWizard 
        open={showSetupWizard} 
        onComplete={() => setShowSetupWizard(false)} 
      />
    </div>
  )
}
