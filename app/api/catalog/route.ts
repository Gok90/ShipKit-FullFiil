import { db } from '@/lib/db'
import { colors, packTypes } from '@/lib/db/schema'
import { asc } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const [colorRows, packTypeRows] = await Promise.all([
      db.select().from(colors).orderBy(asc(colors.displayOrder)),
      db.select().from(packTypes).orderBy(asc(packTypes.displayOrder))
    ])
    
    return NextResponse.json({
      colors: colorRows.map(c => ({
        id: c.id,
        name: c.name,
        displayOrder: c.displayOrder
      })),
      packTypes: packTypeRows.map(p => ({
        id: p.id,
        name: p.name,
        displayOrder: p.displayOrder
      }))
    })
  } catch (error) {
    console.error('Error fetching catalog:', error)
    return NextResponse.json({ error: 'Failed to fetch catalog' }, { status: 500 })
  }
}
