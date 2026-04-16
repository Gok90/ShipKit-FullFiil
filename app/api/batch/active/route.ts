import { db } from '@/lib/db'
import { batches } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const result = await db
      .select()
      .from(batches)
      .where(eq(batches.status, 'active'))
      .limit(1)
    
    if (result.length === 0) {
      return NextResponse.json(null)
    }
    
    const batch = result[0]
    return NextResponse.json({
      id: batch.id,
      startedAt: batch.startedAt,
      committedAt: batch.committedAt,
      archivedAt: batch.archivedAt,
      primaryZoneCount: batch.primaryZoneCount,
      secondaryZoneCount: batch.secondaryZoneCount,
      status: batch.status
    })
  } catch (error) {
    console.error('Error fetching active batch:', error)
    return NextResponse.json({ error: 'Failed to fetch active batch' }, { status: 500 })
  }
}

export async function POST() {
  try {
    // Create a new active batch
    const result = await db.insert(batches).values({
      status: 'active'
    }).returning()
    
    const batch = result[0]
    return NextResponse.json({
      id: batch.id,
      startedAt: batch.startedAt,
      committedAt: batch.committedAt,
      archivedAt: batch.archivedAt,
      primaryZoneCount: batch.primaryZoneCount,
      secondaryZoneCount: batch.secondaryZoneCount,
      status: batch.status
    })
  } catch (error) {
    console.error('Error creating batch:', error)
    return NextResponse.json({ error: 'Failed to create batch' }, { status: 500 })
  }
}
