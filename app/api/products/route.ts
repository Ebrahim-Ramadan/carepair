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
    const client = await clientPromise
    const db = client.db("car_repair")

    const now = new Date().toISOString()
    const doc = {
      name: String(body.name || ""),
      sku: body.sku ? String(body.sku) : undefined,
      price: Number(body.price || 0),
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