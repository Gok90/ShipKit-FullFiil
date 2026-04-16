import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batchId")

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 })
    }

    // Get all orders from CSV
    const orders = await sql`
      SELECT 
        co.id,
        co.tracking_number,
        co.normalized_tracking,
        co.order_id,
        co.variant_name,
        co.product_name,
        co.quantity,
        co.order_date,
        s.id as scan_id,
        s.zone as scanned_zone
      FROM csv_orders co
      LEFT JOIN scans s ON s.batch_id = co.batch_id AND s.normalized_tracking = co.normalized_tracking
      WHERE co.batch_id = ${batchId}::uuid
      ORDER BY co.created_at ASC
    `

    // Get scans not in CSV (secondary zone)
    const extraScans = await sql`
      SELECT 
        s.id,
        s.tracking_number,
        s.normalized_tracking,
        s.variant_name,
        s.product_name,
        s.zone,
        s.scanned_at
      FROM scans s
      LEFT JOIN csv_orders co ON co.batch_id = s.batch_id AND co.normalized_tracking = s.normalized_tracking
      WHERE s.batch_id = ${batchId}::uuid
      AND co.id IS NULL
      ORDER BY s.scanned_at ASC
    `

    // Calculate stats
    const scannedCount = orders.filter((o: { scan_id: string | null }) => o.scan_id).length
    const unscannedCount = orders.filter((o: { scan_id: string | null }) => !o.scan_id).length
    const extraCount = extraScans.length

    return NextResponse.json({
      orders,
      extraScans,
      stats: {
        total: orders.length,
        scanned: scannedCount,
        unscanned: unscannedCount,
        extra: extraCount,
      },
    })
  } catch (error) {
    console.error("Get orders error:", error)
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 })
  }
}
