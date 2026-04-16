import { db } from '@/lib/db'
import { holdQueue } from '@/lib/db/schema'
import { eq, and, or } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(holdQueue)
      .where(or(eq(holdQueue.status, 'held'), eq(holdQueue.status, 'cancelled')))
    
    return NextResponse.json(rows.map(row => ({
      id: row.id,
      batchId: row.batchId,
      trackingNumber: row.trackingNumber,
      variantName: row.variantName,
      colorId: row.colorId,
      packTypeId: row.packTypeId,
      deadline: row.deadline,
      status: row.status,
      shippedAt: row.shippedAt,
      cancelledAt: row.cancelledAt
    })))
  } catch (error) {
    console.error('Error fetching hold queue:', error)
    return NextResponse.json({ error: 'Failed to fetch hold queue' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const items = await request.json()
    
    if (!Array.isArray(items)) {
      return NextResponse.json({ error: 'Expected array of items' }, { status: 400 })
    }
    
    const results = await db.insert(holdQueue).values(items).returning()
    
    return NextResponse.json(results)
  } catch (error) {
    console.error('Error adding to hold queue:', error)
    return NextResponse.json({ error: 'Failed to add to hold queue' }, { status: 500 })
  }
}

export async function PATCH(request: Request) {
  try {
    const { id, status, inventoryReversed } = await request.json()
    
    const updates: Record<string, unknown> = { status }
    
    if (status === 'shipped') {
      updates.shippedAt = new Date()
    } else if (status === 'cancelled') {
      updates.cancelledAt = new Date()
    }
    
    await db
      .update(holdQueue)
      .set(updates)
      .where(eq(holdQueue.id, id))
    
    return NextResponse.json({ success: true, inventoryReversed })
  } catch (error) {
    console.error('Error updating hold queue item:', error)
    return NextResponse.json({ error: 'Failed to update hold queue item' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    await db.update(holdQueue).set({ status: 'dismissed' }).where(eq(holdQueue.id, id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error dismissing hold queue item:', error)
    return NextResponse.json({ error: 'Failed to dismiss hold queue item' }, { status: 500 })
  }
}
