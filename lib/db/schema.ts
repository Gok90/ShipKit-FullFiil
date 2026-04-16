import {
  pgTable,
  uuid,
  text,
  integer,
  boolean,
  timestamp,
  time,
  jsonb,
  pgEnum,
  unique,
} from "drizzle-orm/pg-core";

// Enums
export const printerFormatEnum = pgEnum("printer_format", [
  "thermal_4x6",
  "standard_8x11",
]);
export const audioModeEnum = pgEnum("audio_mode", ["tones", "voice"]);
export const batchStatusEnum = pgEnum("batch_status", [
  "active",
  "committed",
  "archived",
]);
// Zone enum removed - now using dynamic manifest zones
export const fileTypeEnum = pgEnum("file_type", [
  "label_pdf",
  "manifest_csv",
  "usps_slip",
]);
export const holdStatusEnum = pgEnum("hold_status", [
  "held",
  "shipped",
  "cancelled",
  "dismissed",
]);
export const transactionReasonEnum = pgEnum("transaction_reason", [
  "ship",
  "restock",
  "adjustment",
  "cancel_reverse",
]);

// Settings table - single row for app configuration
export const settings = pgTable("settings", {
  id: uuid("id").defaultRandom().primaryKey(),
  storeName: text("store_name").default("My Store"),
  primaryZoneName: text("primary_zone_name").default("Manifest"),
  secondaryZoneName: text("secondary_zone_name").default("Clerk Counter"),
  carrierCloseWeekday: time("carrier_close_weekday").default("17:00"),
  carrierCloseSaturday: time("carrier_close_saturday").default("14:00"),
  carrierCloseSunday: time("carrier_close_sunday"),
  travelTimeMinutes: integer("travel_time_minutes").default(15),
  lowStockThreshold: integer("low_stock_threshold").default(5),
  restockTargetDays: integer("restock_target_days").default(14),
  printerFormat: printerFormatEnum("printer_format").default("thermal_4x6"),
  audioMode: audioModeEnum("audio_mode").default("tones"),
  voiceId: text("voice_id"),
  audioVolume: integer("audio_volume").default(80),
  audioMuted: boolean("audio_muted").default(false),
  setupComplete: boolean("setup_complete").default(false),
  surgeThreshold: integer("surge_threshold").default(40),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Colors for inventory
export const colors = pgTable("colors", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Pack types for inventory
export const packTypes = pgTable("pack_types", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name").notNull(),
  displayOrder: integer("display_order").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory items (color + pack type combinations)
export const inventory = pgTable(
  "inventory",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    colorId: uuid("color_id")
      .notNull()
      .references(() => colors.id, { onDelete: "cascade" }),
    packTypeId: uuid("pack_type_id")
      .notNull()
      .references(() => packTypes.id, { onDelete: "cascade" }),
    stockCount: integer("stock_count").default(0),
    updatedAt: timestamp("updated_at").defaultNow(),
  },
  (table) => [unique("inventory_color_pack").on(table.colorId, table.packTypeId)]
);

// Variant aliases - maps TikTok names to internal inventory
export const variantAliases = pgTable("variant_aliases", {
  id: uuid("id").defaultRandom().primaryKey(),
  tiktokName: text("tiktok_name").notNull().unique(),
  colorId: uuid("color_id")
    .notNull()
    .references(() => colors.id, { onDelete: "cascade" }),
  packTypeId: uuid("pack_type_id")
    .notNull()
    .references(() => packTypes.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Manifest zones - dynamic zones created per CSV upload
export const manifestZones = pgTable("manifest_zones", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  zoneIndex: integer("zone_index").notNull(),
  zoneName: text("zone_name").notNull(),
  csvFilename: text("csv_filename"),
  slipFilename: text("slip_filename"),
  slipFileData: text("slip_file_data"),
  totalOrders: integer("total_orders").default(0),
  scannedCount: integer("scanned_count").default(0),
  createdAt: timestamp("created_at").defaultNow(),
});

// Batches - groupings of scans in a work session
export const batches = pgTable("batches", {
  id: uuid("id").defaultRandom().primaryKey(),
  startedAt: timestamp("started_at").defaultNow(),
  committedAt: timestamp("committed_at"),
  archivedAt: timestamp("archived_at"),
  primaryZoneCount: integer("primary_zone_count").default(0),
  secondaryZoneCount: integer("secondary_zone_count").default(0),
  status: batchStatusEnum("status").default("active"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Scans - individual package scans within a batch
export const scans = pgTable("scans", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  trackingNumber: text("tracking_number").notNull(),
  normalizedTracking: text("normalized_tracking").notNull(),
  variantName: text("variant_name"),
  productName: text("product_name"),
  zoneType: text("zone_type").default("manifest"), // 'manifest' or 'clerk'
  manifestZoneIndex: integer("manifest_zone_index"), // null for clerk counter
  scannedAt: timestamp("scanned_at").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Uploaded files - stores files attached to batches
export const uploadedFiles = pgTable("uploaded_files", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  filename: text("filename").notNull(),
  fileType: fileTypeEnum("file_type").notNull(),
  fileData: text("file_data").notNull(), // Base64 encoded
  labelCount: integer("label_count"),
  orderCount: integer("order_count"),
  packageCount: integer("package_count"), // For USPS slips
  manifestZoneId: uuid("manifest_zone_id"),
  oldestOrderDate: timestamp("oldest_order_date"),
  printed: boolean("printed").default(false),
  uploadedAt: timestamp("uploaded_at").defaultNow(),
});

// Hold queue - packages that weren't scanned at commit time
export const holdQueue = pgTable("hold_queue", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id").references(() => batches.id, {
    onDelete: "set null",
  }),
  trackingNumber: text("tracking_number").notNull(),
  variantName: text("variant_name"),
  colorId: uuid("color_id").references(() => colors.id, {
    onDelete: "set null",
  }),
  packTypeId: uuid("pack_type_id").references(() => packTypes.id, {
    onDelete: "set null",
  }),
  deadline: timestamp("deadline").notNull(),
  status: holdStatusEnum("status").default("held"),
  shippedAt: timestamp("shipped_at"),
  cancelledAt: timestamp("cancelled_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// History sessions - archived Ship & Archive sessions
export const historySessions = pgTable("history_sessions", {
  id: uuid("id").defaultRandom().primaryKey(),
  archivedAt: timestamp("archived_at").defaultNow(),
  batchCount: integer("batch_count").notNull(),
  totalPackages: integer("total_packages").notNull(),
  primaryZoneTotal: integer("primary_zone_total").notNull(),
  secondaryZoneTotal: integer("secondary_zone_total").notNull(),
  variantBreakdown: jsonb("variant_breakdown"),
  slipFiles: jsonb("slip_files"),
  droppedOffAt: timestamp("dropped_off_at"),
  carrierAcceptedAt: timestamp("carrier_accepted_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Inventory transactions - audit log for inventory changes
export const inventoryTransactions = pgTable("inventory_transactions", {
  id: uuid("id").defaultRandom().primaryKey(),
  inventoryId: uuid("inventory_id")
    .notNull()
    .references(() => inventory.id, { onDelete: "cascade" }),
  quantityChange: integer("quantity_change").notNull(),
  reason: transactionReasonEnum("reason").notNull(),
  batchId: uuid("batch_id").references(() => batches.id, {
    onDelete: "set null",
  }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Cancellations - tracks cancelled orders
export const cancellations = pgTable("cancellations", {
  id: uuid("id").defaultRandom().primaryKey(),
  trackingNumber: text("tracking_number").notNull().unique(),
  batchId: uuid("batch_id").references(() => batches.id, {
    onDelete: "set null",
  }),
  variantName: text("variant_name"),
  flaggedBeforeScan: boolean("flagged_before_scan").default(false),
  inventoryReversed: boolean("inventory_reversed").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// CSV order data - parsed from manifest CSV for pick list and tracking lookup
export const csvOrders = pgTable("csv_orders", {
  id: uuid("id").defaultRandom().primaryKey(),
  batchId: uuid("batch_id")
    .notNull()
    .references(() => batches.id, { onDelete: "cascade" }),
  trackingNumber: text("tracking_number").notNull(),
  normalizedTracking: text("normalized_tracking").notNull(),
  orderId: text("order_id"),
  variantName: text("variant_name"),
  productName: text("product_name"),
  quantity: integer("quantity").default(1),
  manifestZoneId: uuid("manifest_zone_id"),
  manifestZoneIndex: integer("manifest_zone_index"),
  orderDate: timestamp("order_date"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Type exports for use in application code
export type Settings = typeof settings.$inferSelect;
export type NewSettings = typeof settings.$inferInsert;
export type Color = typeof colors.$inferSelect;
export type PackType = typeof packTypes.$inferSelect;
export type Inventory = typeof inventory.$inferSelect;
export type VariantAlias = typeof variantAliases.$inferSelect;
export type Batch = typeof batches.$inferSelect;
export type Scan = typeof scans.$inferSelect;
export type UploadedFile = typeof uploadedFiles.$inferSelect;
export type HoldQueueItem = typeof holdQueue.$inferSelect;
export type HistorySession = typeof historySessions.$inferSelect;
export type InventoryTransaction = typeof inventoryTransactions.$inferSelect;
export type Cancellation = typeof cancellations.$inferSelect;
export type CsvOrder = typeof csvOrders.$inferSelect;
export type ManifestZone = typeof manifestZones.$inferSelect;
export type NewManifestZone = typeof manifestZones.$inferInsert;
