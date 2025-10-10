import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";
import { ObjectId } from "mongodb";

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("car_repair");
    const body = await request.json();
    
    const { name, quantity, cost, note } = body;
    
    if (!name || !quantity || !cost) {
      return NextResponse.json(
        { error: "Name, quantity and cost are required" },
        { status: 400 }
      );
    }

    const result = await db.collection("expenses").updateOne(
      { _id: new ObjectId(params.id) },
      {
        $set: {
          name,
          quantity: Number(quantity),
          cost: Number(cost),
          note: note || "",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update expense" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const client = await clientPromise;
    const db = client.db("car_repair");

    const result = await db.collection("expenses").deleteOne({
      _id: new ObjectId(params.id),
    });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Failed to delete expense" }, { status: 500 });
  }
}