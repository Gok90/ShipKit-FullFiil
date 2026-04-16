import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { scans, csvOrders, cancellations, manifestZones } from "@/lib/db/schema"
import { eq, and, sql } from "drizzle-orm"

// Normalize tracking number - strip USPS ZIP routing prefix
function normalizeTracking(tracking: string): string {
  const cleaned = tracking.replace(/\s/g, "")
  // If it starts with 420 followed by 5 digits then 22-digit tracking
  const match = cleaned.match(/^420\d{5}(9\d{21})$/)
  if (match) return match[1]
  // Otherwise look for standard 22-digit tracking
  const standard = cleaned.match(/9\d{21}/)
  if (standard) return standard[0]
  return cleaned
}

export async function POST(request: NextRequest) {
  try {
    const { batchId, trackingNumber, variantName, productName } = await request.json()

    if (!batchId || !trackingNumber) {
      return NextResponse.json(
        { error: "batchId and trackingNumber are required" },
        { status: 400 }
      )
    }

    const normalizedTracking = normalizeTracking(trackingNumber)

    // Check if this tracking is in any CSV order (to find which manifest zone)
    const csvMatch = await db
      .select()
      .from(csvOrders)
      .where(
        and(
          eq(csvOrders.batchId, batchId),
          eq(csvOrders.normalizedTracking, normalizedTracking)
        )
      )
      .limit(1)

    // Determine zone: if in CSV, it belongs to that manifest zone; otherwise clerk counter
    const zoneType = csvMatch.length > 0 ? "manifest" : "clerk"
    const manifestZoneIndex = csvMatch[0]?.manifestZoneIndex ?? null
    const manifestZoneId = csvMatch[0]?.manifestZoneId ?? null
    const finalVariantName = variantName || csvMatch[0]?.variantName || null
    const finalProductName = productName || csvMatch[0]?.productName || null

    // Check for duplicate scan in this batch
    const existingScan = await db
      .select()
      .from(scans)
      .where(
        and(
          eq(scans.batchId, batchId),
          eq(scans.normalizedTracking, normalizedTracking)
        )
      )
      .limit(1)

    if (existingScan.length > 0) {
      return NextResponse.json(
        { 
          error: "Already scanned", 
          duplicate: true, 
          zoneType, 
          manifestZoneIndex 
        },
        { status: 409 }
      )
    }

    // Check if this tracking was flagged as cancelled
    const cancelMatch = await db
      .select()
      .from(cancellations)
      .where(eq(cancellations.trackingNumber, normalizedTracking))
      .limit(1)

    if (cancelMatch.length > 0) {
      return NextResponse.json(
        { error: "This package was cancelled", cancelled: true },
        { status: 409 }
      )
    }

    // Insert the scan
    const [newScan] = await db
      .insert(scans)
      .values({
        batchId,
        trackingNumber,
        normalizedTracking,
        variantName: finalVariantName,
        productName: finalProductName,
        zoneType,
        manifestZoneIndex,
      })
      .returning()

    // Update manifest zone scanned count if applicable
    if (zoneType === "manifest" && manifestZoneId) {
      await db
        .update(manifestZones)
        .set({ 
          scannedCount: sql`${manifestZones.scannedCount} + 1` 
        })
        .where(eq(manifestZones.id, manifestZoneId))
    }

    return NextResponse.json({
      scan: newScan,
      zoneType,
      manifestZoneIndex,
      normalizedTracking,
      variantName: finalVariantName,
      productName: finalProductName,
    })
  } catch (error) {
    console.error("Scan error:", error)
    return NextResponse.json(
      { error: "Failed to record scan" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batchId")

    if (!batchId) {
      return NextResponse.json({ error: "batchId is required" }, { status: 400 })
    }

    const scanList = await db
      .select()
      .from(scans)
      .where(eq(scans.batchId, batchId))

    const zones = await db
      .select()
      .from(manifestZones)
      .where(eq(manifestZones.batchId, batchId))

    // Count clerk scans
    const clerkScans = scanList.filter(s => s.zoneType === "clerk").length

    return NextResponse.json({ scans: scanList, zones, clerkCount: clerkScans })
  } catch (error) {
    console.error("Get scans error:", error)
    return NextResponse.json({ error: "Failed to fetch scans" }, { status: 500 })
  }
}
