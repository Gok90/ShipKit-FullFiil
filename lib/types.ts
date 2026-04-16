// ShipKit Types

export interface Settings {
  id: string
  storeName: string
  primaryZoneName: string
  secondaryZoneName: string
  carrierCloseWeekday: string | null
  carrierCloseSaturday: string | null
  carrierCloseSunday: string | null
  travelTimeMinutes: number
  lowStockThreshold: number
  restockTargetDays: number
  printerFormat: 'thermal_4x6' | 'standard_8x11'
  audioMode: 'tones' | 'voice'
  voiceId: string | null
  audioVolume: number
  audioMuted: boolean
  setupComplete: boolean
  surgeThreshold: number
}

export interface Color {
  id: string
  name: string
  displayOrder: number
}

export interface PackType {
  id: string
  name: string
  displayOrder: number
}

export interface InventoryItem {
  id: string
  colorId: string
  packTypeId: string
  stockCount: number
  color?: Color
  packType?: PackType
  updatedAt: Date
}

export interface VariantAlias {
  id: string
  tiktokName: string
  colorId: string
  packTypeId: string
}

export interface Batch {
  id: string
  startedAt: Date
  committedAt: Date | null
  archivedAt: Date | null
  primaryZoneCount: number
  secondaryZoneCount: number
  status: 'active' | 'committed' | 'archived'
}

export interface ManifestZone {
  id: string
  batchId: string
  zoneIndex: number
  zoneName: string
  csvFilename: string | null
  slipFilename: string | null
  slipFileData: string | null
  totalOrders: number
  scannedCount: number
}

export interface Scan {
  id: string
  batchId: string
  trackingNumber: string
  normalizedTracking: string
  variantName: string | null
  productName: string | null
  zoneType: 'manifest' | 'clerk'
  manifestZoneIndex: number | null
  scannedAt: Date
}

export interface UploadedFile {
  id: string
  batchId: string
  filename: string
  fileType: 'label_pdf' | 'manifest_csv' | 'usps_slip'
  fileData: string
  labelCount: number | null
  orderCount: number | null
  packageCount: number | null
  manifestZoneId: string | null
  oldestOrderDate: Date | null
  printed: boolean
  uploadedAt: Date
}

export interface CsvOrder {
  id: string
  batchId: string
  trackingNumber: string
  normalizedTracking: string
  orderId: string | null
  variantName: string | null
  productName: string | null
  quantity: number
  manifestZoneId: string | null
  manifestZoneIndex: number | null
  orderDate: Date | null
}

export interface HoldQueueItem {
  id: string
  batchId: string | null
  trackingNumber: string
  variantName: string | null
  colorId: string | null
  packTypeId: string | null
  deadline: Date
  status: 'held' | 'shipped' | 'cancelled' | 'dismissed'
  shippedAt: Date | null
  cancelledAt: Date | null
}

export interface HistorySession {
  id: string
  archivedAt: Date
  batchCount: number
  totalPackages: number
  primaryZoneTotal: number
  secondaryZoneTotal: number
  variantBreakdown: Record<string, number> | null
  slipFiles: Array<{ filename: string; data: string }> | null
  droppedOffAt: Date | null
  carrierAcceptedAt: Date | null
}

export interface PickListItem {
  variantName: string
  colorId: string | null
  packTypeId: string | null
  quantity: number
  stockCount: number
  checked: boolean
}

// UI State Types
export type TabType = 'scan' | 'inventory' | 'history' | 'analytics' | 'reorder' | 'finance'

export interface ScanState {
  isArmed: boolean
  scans: Scan[]
  manifestZones: ManifestZone[]
  clerkCount: number
}

export interface BatchSummary {
  id: string
  committedAt: Date
  primaryZoneCount: number
  secondaryZoneCount: number
  variants: Record<string, number>
  slipFiles: Array<{ filename: string; data: string }>
  droppedOffAt: Date | null
  carrierAcceptedAt: Date | null
}

// SLA calculation
export type SlaStatus = 'safe' | 'ship_today' | 'overdue'

export interface DispatchDeadline {
  deadline: Date
  remainingMs: number
  status: 'green' | 'yellow' | 'red' | 'breach'
}
