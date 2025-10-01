import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';
import { ObjectId } from 'mongodb';
import clientPromise from '@/lib/mongodb';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const ticketId = searchParams.get('ticketId');
    const photoType = searchParams.get('type') as 'beforePhotos' | 'afterPhotos';
    const publicId = searchParams.get('publicId');
    const photoUrl = searchParams.get('photoUrl');

    if (!ticketId || !photoType || !publicId || !photoUrl) {
      return NextResponse.json(
        { error: 'Missing required parameters: ticketId, type, publicId, or photoUrl' },
        { status: 400 }
      );
    }

    // Delete from Cloudinary
    try {
      await cloudinary.uploader.destroy(publicId);
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError);
      // Continue with MongoDB deletion even if Cloudinary fails
    }

    // Delete from MongoDB using URL as identifier
    const client = await clientPromise;
    const db = client.db('car_repair');
    
    const updateQuery: any = {
      $pull: {},
      $set: {
        updatedAt: new Date()
      }
    };
    updateQuery.$pull[photoType] = { url: decodeURIComponent(photoUrl) };

    const result = await db.collection('tickets').updateOne(
      { _id: new ObjectId(ticketId) },
      updateQuery
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: 'Ticket not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Image deleted successfully from both Cloudinary and database'
    });

  } catch (error) {
    console.error('Error deleting image:', error);
    return NextResponse.json(
      { error: 'Failed to delete image' },
      { status: 500 }
    );
  }
}