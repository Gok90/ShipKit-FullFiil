import { db } from '@/lib/db'
import { variantAliases } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const rows = await db.select().from(variantAliases)
    
    return NextResponse.json(rows.map(row => ({
      id: row.id,
      tiktokName: row.tiktokName,
      colorId: row.colorId,
      packTypeId: row.packTypeId
    })))
  } catch (error) {
    console.error('Error fetching aliases:', error)
    return NextResponse.json({ error: 'Failed to fetch aliases' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const { tiktokName, colorId, packTypeId } = await request.json()
    
    const result = await db.insert(variantAliases).values({
      tiktokName,
      colorId,
      packTypeId
    }).returning()
    
    return NextResponse.json({
      id: result[0].id,
      tiktokName: result[0].tiktokName,
      colorId: result[0].colorId,
      packTypeId: result[0].packTypeId
    })
  } catch (error) {
    console.error('Error creating alias:', error)
    return NextResponse.json({ error: 'Failed to create alias' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'ID required' }, { status: 400 })
    }
    
    await db.delete(variantAliases).where(eq(variantAliases.id, id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting alias:', error)
    return NextResponse.json({ error: 'Failed to delete alias' }, { status: 500 })
  }
}
