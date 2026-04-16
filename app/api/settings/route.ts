import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await db.select().from(settings).limit(1)
    
    if (result.length === 0) {
      // Create default settings if none exist
      const newSettings = await db.insert(settings).values({}).returning()
      return NextResponse.json(formatSettings(newSettings[0]))
    }
    
    return NextResponse.json(formatSettings(result[0]))
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const updates = await request.json()
    
    // Get existing settings first
    const existing = await db.select().from(settings).limit(1)
    
    if (existing.length === 0) {
      return NextResponse.json({ error: 'Settings not found' }, { status: 404 })
    }
    
    // Map camelCase to snake_case
    const dbUpdates: Record<string, unknown> = {}
    if ('storeName' in updates) dbUpdates.storeName = updates.storeName
    if ('primaryZoneName' in updates) dbUpdates.primaryZoneName = updates.primaryZoneName
    if ('secondaryZoneName' in updates) dbUpdates.secondaryZoneName = updates.secondaryZoneName
    if ('carrierCloseWeekday' in updates) dbUpdates.carrierCloseWeekday = updates.carrierCloseWeekday
    if ('carrierCloseSaturday' in updates) dbUpdates.carrierCloseSaturday = updates.carrierCloseSaturday
    if ('carrierCloseSunday' in updates) dbUpdates.carrierCloseSunday = updates.carrierCloseSunday
    if ('travelTimeMinutes' in updates) dbUpdates.travelTimeMinutes = updates.travelTimeMinutes
    if ('lowStockThreshold' in updates) dbUpdates.lowStockThreshold = updates.lowStockThreshold
    if ('restockTargetDays' in updates) dbUpdates.restockTargetDays = updates.restockTargetDays
    if ('printerFormat' in updates) dbUpdates.printerFormat = updates.printerFormat
    if ('audioMode' in updates) dbUpdates.audioMode = updates.audioMode
    if ('voiceId' in updates) dbUpdates.voiceId = updates.voiceId
    if ('audioVolume' in updates) dbUpdates.audioVolume = updates.audioVolume
    if ('audioMuted' in updates) dbUpdates.audioMuted = updates.audioMuted
    if ('setupComplete' in updates) dbUpdates.setupComplete = updates.setupComplete
    if ('surgeThreshold' in updates) dbUpdates.surgeThreshold = updates.surgeThreshold
    
    dbUpdates.updatedAt = new Date()
    
    const updated = await db
      .update(settings)
      .set(dbUpdates)
      .where(eq(settings.id, existing[0].id))
      .returning()
    
    return NextResponse.json(formatSettings(updated[0]))
  } catch (error) {
    console.error('Error updating settings:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}

function formatSettings(row: typeof settings.$inferSelect) {
  return {
    id: row.id,
    storeName: row.storeName,
    primaryZoneName: row.primaryZoneName,
    secondaryZoneName: row.secondaryZoneName,
    carrierCloseWeekday: row.carrierCloseWeekday,
    carrierCloseSaturday: row.carrierCloseSaturday,
    carrierCloseSunday: row.carrierCloseSunday,
    travelTimeMinutes: row.travelTimeMinutes,
    lowStockThreshold: row.lowStockThreshold,
    restockTargetDays: row.restockTargetDays,
    printerFormat: row.printerFormat,
    audioMode: row.audioMode,
    voiceId: row.voiceId,
    audioVolume: row.audioVolume,
    audioMuted: row.audioMuted,
    setupComplete: row.setupComplete,
    surgeThreshold: row.surgeThreshold
  }
}
