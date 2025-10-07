import clientPromise from "@/lib/mongodb"
import { NextResponse } from "next/server"
import { ObjectId } from "mongodb"

export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const id = params.id
    const body = await request.json()
    const client = await clientPromise
    const db = client.db("car_repair")

    // accept and store only pricePerPiece / pricePerMeter (no legacy price or pricingMode)
    const pp = Number(body.pricePerPiece ?? 0)
    const pm = Number(body.pricePerMeter ?? 0)

    // validation (optional here, keep safe defaults)
    if (!(pp > 0 || pm > 0)) {
      return NextResponse.json({ error: "Provide at least one price field" }, { status: 400 })
    }

    const update: any = {
      name: body.name ? String(body.name) : (body.nameEn ? String(body.nameEn) : ""),
      nameEn: body.nameEn ? String(body.nameEn) : undefined,
      nameAr: body.nameAr ? String(body.nameAr) : undefined,
      category: body.category ? String(body.category) : undefined,
      pricePerPiece: pp > 0 ? pp : undefined,
      pricePerMeter: pm > 0 ? pm : undefined,
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