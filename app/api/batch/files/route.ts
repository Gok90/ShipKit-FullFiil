import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { uploadedFiles, csvOrders, manifestZones } from "@/lib/db/schema"
import { eq } from "drizzle-orm"

// Normalize tracking number - strip USPS ZIP routing prefix (420XXXXX)
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

// Parse TikTok CSV and extract orders
function parseTikTokCSV(csvContent: string) {
  const lines = csvContent.split("\n")
  if (lines.length < 2) return []

  const headers = lines[0].split(",").map((h) => h.trim().replace(/"/g, ""))
  const trackingIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("tracking")
  )
  const variationIdx = headers.findIndex(
    (h) => h.toLowerCase() === "variation" || h.toLowerCase().includes("sku")
  )
  const quantityIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("quantity")
  )
  const orderIdIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("order id")
  )
  const createdIdx = headers.findIndex(
    (h) =>
      h.toLowerCase().includes("created") || h.toLowerCase().includes("date")
  )
  const productIdx = headers.findIndex((h) =>
    h.toLowerCase().includes("product name")
  )

  const orders = []
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim()
    if (!line) continue

    // Parse CSV with quoted fields support
    const values: string[] = []
    let current = ""
    let inQuotes = false
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())

    const tracking = trackingIdx >= 0 ? values[trackingIdx] : null
    if (!tracking) continue

    orders.push({
      trackingNumber: tracking,
      normalizedTracking: normalizeTracking(tracking),
      variantName: variationIdx >= 0 ? values[variationIdx] : null,
      productName: productIdx >= 0 ? values[productIdx] : null,
      quantity: quantityIdx >= 0 ? parseInt(values[quantityIdx]) || 1 : 1,
      orderId: orderIdIdx >= 0 ? values[orderIdIdx] : null,
      orderDate: createdIdx >= 0 && values[createdIdx] ? new Date(values[createdIdx]) : null,
    })
  }

  return orders
}

// Detect file type from filename
function detectFileType(
  filename: string
): "label_pdf" | "manifest_csv" | "usps_slip" {
  const lower = filename.toLowerCase()

  if (lower.endsWith(".csv")) {
    return "manifest_csv"
  }

  if (lower.endsWith(".pdf")) {
    // USPS scan form / manifest slip typically has "wsos" pattern
    if (lower.includes("wsos")) {
      return "usps_slip"
    }
    // Shipping label files typically have these patterns
    return "label_pdf"
  }

  return "label_pdf"
}

// Count packages in USPS slip PDF by looking for piece count
function countPackagesInSlip(base64Data: string): number {
  try {
    const text = atob(base64Data)
    // Look for "X Piece(s)" pattern common in USPS scan forms
    const pieceMatch = text.match(/(\d+)\s*Piece/i)
    if (pieceMatch) return parseInt(pieceMatch[1])
    return 1
  } catch {
    return 1
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const batchId = formData.get("batchId") as string

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID required" }, { status: 400 })
    }

    const files = formData.getAll("files") as File[]
    const results = []

    // Get current zone count to determine next index
    const existingZones = await db
      .select()
      .from(manifestZones)
      .where(eq(manifestZones.batchId, batchId))
    let nextZoneIndex = existingZones.length + 1

    for (const file of files) {
      const buffer = await file.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const fileType = detectFileType(file.name)

      let labelCount = null
      let orderCount = null
      let packageCount = null
      let oldestOrderDate: Date | null = null
      let manifestZoneId: string | null = null

      if (fileType === "manifest_csv") {
        // Parse CSV and create a new manifest zone
        const csvContent = Buffer.from(buffer).toString("utf-8")
        const orders = parseTikTokCSV(csvContent)
        orderCount = orders.length

        if (orders.length > 0) {
          // Create a new manifest zone for this CSV
          const [newZone] = await db
            .insert(manifestZones)
            .values({
              batchId,
              zoneIndex: nextZoneIndex,
              zoneName: `Manifest ${nextZoneIndex}`,
              csvFilename: file.name,
              totalOrders: orders.length,
              scannedCount: 0,
            })
            .returning()

          manifestZoneId = newZone.id

          // Insert orders with zone reference
          for (const order of orders) {
            await db.insert(csvOrders).values({
              batchId,
              trackingNumber: order.trackingNumber,
              normalizedTracking: order.normalizedTracking,
              orderId: order.orderId,
              variantName: order.variantName,
              productName: order.productName,
              quantity: order.quantity,
              manifestZoneId: newZone.id,
              manifestZoneIndex: nextZoneIndex,
              orderDate: order.orderDate,
            })
          }

          // Find oldest order date for SLA
          const dates = orders
            .map((o) => o.orderDate)
            .filter((d): d is Date => d !== null)
          if (dates.length > 0) {
            oldestOrderDate = new Date(Math.min(...dates.map((d) => d.getTime())))
          }

          nextZoneIndex++
        }
      } else if (fileType === "usps_slip") {
        packageCount = countPackagesInSlip(base64)
      }

      // Insert file record
      const [inserted] = await db
        .insert(uploadedFiles)
        .values({
          batchId,
          filename: file.name,
          fileType,
          fileData: base64,
          labelCount,
          orderCount,
          packageCount,
          manifestZoneId,
          oldestOrderDate,
          printed: false,
        })
        .returning()

      results.push({
        id: inserted.id,
        filename: file.name,
        fileType,
        labelCount,
        orderCount,
        packageCount,
        manifestZoneId,
        oldestOrderDate,
      })
    }

    // Get updated zones for response
    const zones = await db
      .select()
      .from(manifestZones)
      .where(eq(manifestZones.batchId, batchId))

    return NextResponse.json({ files: results, zones })
  } catch (error) {
    console.error("File upload error:", error)
    return NextResponse.json({ error: "Failed to upload files" }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const batchId = searchParams.get("batchId")

    if (!batchId) {
      return NextResponse.json({ error: "Batch ID required" }, { status: 400 })
    }

    const files = await db
      .select()
      .from(uploadedFiles)
      .where(eq(uploadedFiles.batchId, batchId))

    const zones = await db
      .select()
      .from(manifestZones)
      .where(eq(manifestZones.batchId, batchId))

    return NextResponse.json({ files, zones })
  } catch (error) {
    console.error("Get files error:", error)
    return NextResponse.json({ error: "Failed to get files" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { fileId, printed } = await request.json()

    await db
      .update(uploadedFiles)
      .set({ printed })
      .where(eq(uploadedFiles.id, fileId))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Update file error:", error)
    return NextResponse.json({ error: "Failed to update file" }, { status: 500 })
  }
}
