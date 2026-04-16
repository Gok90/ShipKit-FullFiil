import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json()

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 })
    }

    // Get batch info
    const batch = await sql`
      SELECT id, status, primary_zone_count, secondary_zone_count
      FROM batches 
      WHERE id = ${batchId}::uuid
    `

    if (batch.length === 0) {
      return NextResponse.json({ error: "Batch not found" }, { status: 404 })
    }

    if (batch[0].status !== "active") {
      return NextResponse.json({ error: "Batch already committed" }, { status: 400 })
    }

    // Get all scans for this batch with their variant info
    const scans = await sql`
      SELECT s.id, s.variant_name, s.normalized_tracking
      FROM scans s
      WHERE s.batch_id = ${batchId}::uuid
    `

    // Get expected orders from CSV
    const csvOrders = await sql`
      SELECT normalized_tracking, variant_name, quantity
      FROM csv_orders
      WHERE batch_id = ${batchId}::uuid
    `

    // Find unscanned packages (in CSV but not scanned)
    const scannedTrackings = new Set(scans.map((s: { normalized_tracking: string }) => s.normalized_tracking))
    const unscannedOrders = csvOrders.filter(
      (o: { normalized_tracking: string }) => !scannedTrackings.has(o.normalized_tracking)
    )

    // Get settings for SLA calculation
    const settings = await sql`SELECT * FROM settings LIMIT 1`
    const slaDays = 2 // TikTok's default SLA

    // Add unscanned packages to hold queue
    for (const order of unscannedOrders) {
      const deadline = new Date()
      deadline.setDate(deadline.getDate() + slaDays)

      // Try to resolve variant to color/pack
      const alias = await sql`
        SELECT va.color_id, va.pack_type_id
        FROM variant_aliases va
        WHERE va.tiktok_name = ${order.variant_name}
        LIMIT 1
      `

      await sql`
        INSERT INTO hold_queue (batch_id, tracking_number, variant_name, color_id, pack_type_id, deadline)
        VALUES (
          ${batchId}::uuid, 
          ${order.normalized_tracking}, 
          ${order.variant_name},
          ${alias[0]?.color_id || null}::uuid,
          ${alias[0]?.pack_type_id || null}::uuid,
          ${deadline.toISOString()}
        )
      `
    }

    // Decrement inventory for scanned packages
    const variantCounts: Record<string, number> = {}
    for (const scan of scans) {
      if (scan.variant_name) {
        variantCounts[scan.variant_name] = (variantCounts[scan.variant_name] || 0) + 1
      }
    }

    // Process inventory decrements
    for (const [variantName, count] of Object.entries(variantCounts)) {
      // Try to find the matching inventory via alias
      const alias = await sql`
        SELECT va.color_id, va.pack_type_id
        FROM variant_aliases va
        WHERE va.tiktok_name = ${variantName}
        LIMIT 1
      `

      if (alias.length > 0) {
        const inventory = await sql`
          SELECT id, stock_count FROM inventory
          WHERE color_id = ${alias[0].color_id}::uuid
          AND pack_type_id = ${alias[0].pack_type_id}::uuid
          LIMIT 1
        `

        if (inventory.length > 0) {
          // Decrement inventory
          await sql`
            UPDATE inventory 
            SET stock_count = GREATEST(0, stock_count - ${count}),
                updated_at = NOW()
            WHERE id = ${inventory[0].id}::uuid
          `

          // Log transaction
          await sql`
            INSERT INTO inventory_transactions (inventory_id, quantity_change, reason, batch_id)
            VALUES (${inventory[0].id}::uuid, ${-count}, 'ship', ${batchId}::uuid)
          `
        }
      }
    }

    // Update batch status to committed
    await sql`
      UPDATE batches 
      SET status = 'committed', committed_at = NOW()
      WHERE id = ${batchId}::uuid
    `

    return NextResponse.json({
      success: true,
      scannedCount: scans.length,
      heldCount: unscannedOrders.length,
      variantCounts,
    })
  } catch (error) {
    console.error("Commit error:", error)
    return NextResponse.json({ error: "Failed to commit batch" }, { status: 500 })
  }
}
