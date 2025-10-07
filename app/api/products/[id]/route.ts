import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("car_repair")

    const update: any = {
      name: String(body.name || ""),
      sku: body.sku ? String(body.sku) : undefined,
      price: Number(body.price || 0),
      stock: body.stock ? Number(body.stock) : 0,
      description: body.description ? String(body.description) : "",
      updatedAt: new Date().toISOString(),
    }

    await db.collection("products").updateOne({ _id: new ObjectId(id) }, { $set: update })
    const updated = await db.collection("products").findOne({ _id: new ObjectId(id) })

    return NextResponse.json(JSON.parse(JSON.stringify(updated)))
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to update product" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const client = await clientPromise
    const db = client.db("car_repair")
    await db.collection("products").deleteOne({ _id: new ObjectId(id) })
    return NextResponse.json({ success: true })
  } catch (err) {
    console.error(err)
    return NextResponse.json({ error: "Failed to delete product" }, { status: 500 })
  }
}