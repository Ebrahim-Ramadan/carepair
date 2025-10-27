import { NextRequest, NextResponse } from 'next/server';
import clientPromise from '../../../lib/mongodb';
import { ObjectId } from 'mongodb';

// GET: View all categories
export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    const categories = await db.collection('categories').find({}).toArray();
    return NextResponse.json(categories.map(({ _id, name }) => ({ _id: _id.toString(), name: name ?? '' })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

// POST: Add a new category
export async function POST(req: NextRequest) {
  try {
    const { name } = await req.json();
    if (!name) return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('categories').insertOne({ name });
    return NextResponse.json({ _id: result.insertedId.toString(), name });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to add category' }, { status: 500 });
  }
}

// PUT: Edit a category
export async function PUT(req: NextRequest) {
  try {
    const { id, name } = await req.json();
    if (!id || !name) return NextResponse.json({ error: 'ID and name are required' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    const result = await db.collection('categories').findOneAndUpdate(
      { _id: new ObjectId(id) },
      { $set: { name } },
      { returnDocument: 'after' }
    );
    if (!result || !result.value) return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    return NextResponse.json({ _id: result.value._id.toString(), name: result.value.name ?? '' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE: Remove a category
export async function DELETE(req: NextRequest) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: 'ID is required' }, { status: 400 });
    const client = await clientPromise;
    const db = client.db();
    await db.collection('categories').deleteOne({ _id: new ObjectId(id) });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
