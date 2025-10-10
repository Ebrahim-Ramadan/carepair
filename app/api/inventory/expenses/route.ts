import { NextResponse } from "next/server";
import clientPromise from "@/lib/mongodb";

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db("car_repair");
    const expenses = await db.collection("expenses").find({}).toArray();
    return NextResponse.json(expenses);
  } catch (error) {
    return NextResponse.json({ error: "Failed to fetch expenses" }, { status: 500 });
  }
}

export async function POST(request: Request) {
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

    const expense = {
      name,
      quantity: Number(quantity),
      cost: Number(cost),
      note: note || "",
      createdAt: new Date(),
    };

    const result = await db.collection("expenses").insertOne(expense);
    return NextResponse.json({ id: result.insertedId });
  } catch (error) {
    return NextResponse.json({ error: "Failed to create expense" }, { status: 500 });
  }
}