import { neon } from "@neondatabase/serverless"
import { NextRequest, NextResponse } from "next/server"

const sql = neon(process.env.DATABASE_URL!)

export async function POST(request: NextRequest) {
  try {
    // Get all committed batches
    const batches = await sql`
      SELECT id, primary_zone_count, secondary_zone_count, committed_at
      FROM batches 
      WHERE status = 'committed'
      ORDER BY committed_at ASC
    `

    if (batches.length === 0) {
      return NextResponse.json({ error: "No committed batches to archive" }, { status: 400 })
    }

    // Calculate totals
    let totalPackages = 0
    let primaryTotal = 0
    let secondaryTotal = 0
    const variantBreakdown: Record<string, number> = {}
    const slipFiles: string[] = []

    for (const batch of batches) {
      totalPackages += (batch.primary_zone_count || 0) + (batch.secondary_zone_count || 0)
      primaryTotal += batch.primary_zone_count || 0
      secondaryTotal += batch.secondary_zone_count || 0

      // Get variant breakdown from scans
      const scans = await sql`
        SELECT variant_name, COUNT(*) as count
        FROM scans
        WHERE batch_id = ${batch.id}::uuid
        AND variant_name IS NOT NULL
        GROUP BY variant_name
      `

      for (const scan of scans) {
        variantBreakdown[scan.variant_name] = 
          (variantBreakdown[scan.variant_name] || 0) + parseInt(scan.count)
      }

      // Get slip files
      const files = await sql`
        SELECT filename FROM uploaded_files
        WHERE batch_id = ${batch.id}::uuid
        AND file_type = 'usps_slip'
      `
      slipFiles.push(...files.map((f: { filename: string }) => f.filename))
    }

    // Create history session
    const history = await sql`
      INSERT INTO history_sessions (
        batch_count, 
        total_packages, 
        primary_zone_total, 
        secondary_zone_total,
        variant_breakdown,
        slip_files
      )
      VALUES (
        ${batches.length},
        ${totalPackages},
        ${primaryTotal},
        ${secondaryTotal},
        ${JSON.stringify(variantBreakdown)}::jsonb,
        ${JSON.stringify(slipFiles)}::jsonb
      )
      RETURNING id, archived_at
    `

    // Update all batches to archived
    const batchIds = batches.map((b: { id: string }) => b.id)
    await sql`
      UPDATE batches 
      SET status = 'archived', archived_at = NOW()
      WHERE id = ANY(${batchIds}::uuid[])
    `

    return NextResponse.json({
      success: true,
      historyId: history[0].id,
      archivedAt: history[0].archived_at,
      batchCount: batches.length,
      totalPackages,
      primaryTotal,
      secondaryTotal,
      variantBreakdown,
    })
  } catch (error) {
    console.error("Archive error:", error)
    return NextResponse.json({ error: "Failed to archive batches" }, { status: 500 })
  }
}
