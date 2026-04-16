import { db } from '@/lib/db'
import { historySessions } from '@/lib/db/schema'
import { desc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

// Free tier limit
const FREE_TIER_LIMIT = 7

export async function GET() {
  try {
    const rows = await db
      .select()
      .from(historySessions)
      .orderBy(desc(historySessions.archivedAt))
      .limit(FREE_TIER_LIMIT)
    
    return NextResponse.json(rows.map(row => ({
      id: row.id,
      archivedAt: row.archivedAt,
      batchCount: row.batchCount,
      totalPackages: row.totalPackages,
      primaryZoneTotal: row.primaryZoneTotal,
      secondaryZoneTotal: row.secondaryZoneTotal,
      variantBreakdown: row.variantBreakdown,
      slipFiles: row.slipFiles,
      droppedOffAt: row.droppedOffAt,
      carrierAcceptedAt: row.carrierAcceptedAt
    })))
  } catch (error) {
    console.error('Error fetching history:', error)
    return NextResponse.json({ error: 'Failed to fetch history' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const data = await request.json()
    
    const result = await db.insert(historySessions).values({
      batchCount: data.batchCount,
      totalPackages: data.totalPackages,
      primaryZoneTotal: data.primaryZoneTotal,
      secondaryZoneTotal: data.secondaryZoneTotal,
      variantBreakdown: data.variantBreakdown,
      slipFiles: data.slipFiles
    }).returning()
    
    return NextResponse.json(result[0])
  } catch (error) {
    console.error('Error creating history session:', error)
    return NextResponse.json({ error: 'Failed to create history session' }, { status: 500 })
  }
}
