import { db } from '@/lib/db'
import { inventory, colors, packTypes, inventoryTransactions } from '@/lib/db/schema'
import { eq, sql } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rows = await db
      .select({
        id: inventory.id,
        colorId: inventory.colorId,
        packTypeId: inventory.packTypeId,
        stockCount: inventory.stockCount,
        updatedAt: inventory.updatedAt,
        colorName: colors.name,
        colorOrder: colors.displayOrder,
        packTypeName: packTypes.name,
        packTypeOrder: packTypes.displayOrder
      })
      .from(inventory)
      .innerJoin(colors, eq(inventory.colorId, colors.id))
      .innerJoin(packTypes, eq(inventory.packTypeId, packTypes.id))
      .orderBy(colors.displayOrder, packTypes.displayOrder)
    
    return NextResponse.json(rows.map(row => ({
      id: row.id,
      colorId: row.colorId,
      packTypeId: row.packTypeId,
      stockCount: row.stockCount,
      updatedAt: row.updatedAt,
      color: {
        id: row.colorId,
        name: row.colorName,
        displayOrder: row.colorOrder
      },
      packType: {
        id: row.packTypeId,
        name: row.packTypeName,
        displayOrder: row.packTypeOrder
      }
    })))
  } catch (error) {
    console.error('Error fetching inventory:', error)
    return NextResponse.json({ error: 'Failed to fetch inventory' }, { status: 500 })
  }
}

// Set stock to specific value
export async function PATCH(request: Request) {
  try {
    const { inventoryId, stockCount } = await request.json()
    
    await db
      .update(inventory)
      .set({ stockCount, updatedAt: new Date() })
      .where(eq(inventory.id, inventoryId))
    
    // Log as adjustment
    await db.insert(inventoryTransactions).values({
      inventoryId,
      quantityChange: 0, // Will be calculated from actual change
      reason: 'adjustment'
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error updating inventory:', error)
    return NextResponse.json({ error: 'Failed to update inventory' }, { status: 500 })
  }
}

// Adjust stock by delta
export async function POST(request: Request) {
  try {
    const { inventoryId, delta, reason = 'adjustment', batchId } = await request.json()
    
    await db
      .update(inventory)
      .set({ 
        stockCount: sql`${inventory.stockCount} + ${delta}`,
        updatedAt: new Date() 
      })
      .where(eq(inventory.id, inventoryId))
    
    await db.insert(inventoryTransactions).values({
      inventoryId,
      quantityChange: delta,
      reason,
      batchId
    })
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error adjusting inventory:', error)
    return NextResponse.json({ error: 'Failed to adjust inventory' }, { status: 500 })
  }
}
