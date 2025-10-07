import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const page = Number(url.searchParams.get("page") || "1")
    const limit = Number(url.searchParams.get("limit") || "10")
    const skip = (page - 1) * limit

    const client = await clientPromise
    const db = client.db("car_repair")

    const [items, total] = await Promise.all([
      db.collection("products").find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
      db.collection("products").countDocuments(),
    ])

    return NextResponse.json({ items: JSON.parse(JSON.stringify(items)), total })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log("body:", body)

    const client = await clientPromise
    const db = client.db("car_repair")

    // accept explicit pricePerPiece / pricePerMeter only
    const pp = Number(body.pricePerPiece ?? 0)
    const pm = Number(body.pricePerMeter ?? 0)

    // require at least one price
    if (!(pp > 0 || pm > 0)) {
      return NextResponse.json(
        { error: "Provide a price for at least one pricing mode (pricePerPiece or pricePerMeter)" },
        { status: 400 }
      )
    }

    const now = new Date().toISOString()
    const doc: any = {
      // bilingual fields if provided
      nameEn: body.nameEn ? String(body.nameEn) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      category: body.category ? String(body.category) : undefined,
      // only store explicit prices
      pricePerPiece: pp > 0 ? pp : undefined,
      pricePerMeter: pm > 0 ? pm : undefined,
      stock: body.stock ? Number(body.stock) : 0,
      description: body.description ? String(body.description) : "",
      createdAt: now,
      updatedAt: now,
    }

    const res = await db.collection("products").insertOne(doc)
    const created = await db.collection("products").findOne({ _id: res.insertedId })

    return NextResponse.json(JSON.parse(JSON.stringify(created)))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to create product" }, { status: 500 })
  }
}